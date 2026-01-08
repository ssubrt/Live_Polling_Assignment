/**
 * Socket.IO Server with Service-Based Architecture
 * 
 * Architecture:
 * - Socket Handlers: Handle connection/disconnection and event routing
 * - Services: Encapsulate all business logic and database operations
 * - Controllers: Call services and emit responses
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

// Static imports for services
import { PollService, VoteService, ChatService, ParticipantService } from './lib/services/index'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  console.log('[Server] Initializing...')

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  /**
   * Socket Connection Handler
   * All socket event handlers use the Service layer for business logic
   */
  io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id)

    /**
     * Helper function to broadcast participant list
     * Delegates to ParticipantService for data retrieval
     */
    const broadcastParticipants = (pollId: string) => {
      const students = ParticipantService.getStudentsByPoll(pollId)
      console.log(`[Socket.io] Broadcasting ${students.length} participants for poll ${pollId}`)
      io.to(pollId).emit('participants:update', students)
    }

    // ========================================
    // PARTICIPANT MANAGEMENT HANDLERS
    // ========================================

    /**
     * Handler: user:join
     * Description: User joins a poll room
     * Service: ParticipantService.addParticipant()
     */
    socket.on('user:join', (data) => {
      try {
        const { studentId, teacherId, name, role, pollId } = data

        // Delegate to service: add participant to online list
        ParticipantService.addParticipant(socket.id, { studentId, teacherId, name, role, pollId })

        // Join Socket.IO room for this poll
        socket.join(pollId)

        console.log(`[Socket.io] User joined: ${name} (${role}) in poll ${pollId}, socket: ${socket.id}`)

        // Broadcast updated participant list
        broadcastParticipants(pollId)
      } catch (error: any) {
        console.error('[Socket.io] Error in user:join:', error.message)
        socket.emit('error', { message: 'Failed to join poll' })
      }
    })

    /**
     * Handler: student:kick
     * Description: Teacher kicks a student from the poll
     * Service: ParticipantService.getStudentSocketId(), removeParticipant()
     */
    socket.on('student:kick', (data) => {
      try {
        const { studentId, pollId } = data
        console.log(`[Socket.io] Kicking student ${studentId} from poll ${pollId}`)

        // Delegate to service: find student's socket ID
        const studentSocketId = ParticipantService.getStudentSocketId(studentId, pollId)

        if (studentSocketId) {
          const participant = ParticipantService.getParticipantBySocketId(studentSocketId)
          console.log(`[Socket.io] Found student ${participant?.name} with socket ${studentSocketId}`)

          // Notify the kicked student
          io.to(studentSocketId).emit('student:kicked', { reason: 'Removed by teacher' })

          // Delegate to service: remove from online participants
          ParticipantService.removeParticipant(studentSocketId)

          // Broadcast updated participant list
          broadcastParticipants(pollId)

          console.log(`[Socket.io] Student ${participant?.name} kicked successfully`)
        }
      } catch (error: any) {
        console.error('[Socket.io] Error in student:kick:', error.message)
      }
    })

    /**
     * Handler: disconnect
     * Description: User disconnects from the poll
     * Service: ParticipantService.removeParticipant()
     */
    socket.on('disconnect', () => {
      try {
        console.log('[Socket.io] Client disconnected:', socket.id)

        // Delegate to service: remove participant
        const participant = ParticipantService.removeParticipant(socket.id)

        if (participant) {
          console.log(`[Socket.io] User left: ${participant.name} (${participant.role})`)
          // Broadcast updated participant list to remaining users
          broadcastParticipants(participant.pollId)
        }
      } catch (error: any) {
        console.error('[Socket.io] Error in disconnect:', error.message)
      }
    })

    // ========================================
    // CHAT HANDLERS
    // ========================================

    /**
     * Handler: message:send
     * Description: User sends a chat message
     * Service: ChatService.sendMessage()
     */
    socket.on('message:send', async (data) => {
      try {
        const { pollId, sender, message } = data

        // Delegate to service: persist message to database
        const savedMessage = await ChatService.sendMessage({
          pollId,
          sender,
          message,
        })

        // Broadcast message to all users in the poll room
        io.to(pollId).emit('message:received', savedMessage)

        console.log(`[Socket.io] Message sent in poll ${pollId} by ${sender}`)
      } catch (error: any) {
        console.error('[Socket.io] Error in message:send:', error.message)
        socket.emit('error', { message: error.message || 'Failed to send message' })
      }
    })

    // ========================================
    // POLL MANAGEMENT HANDLERS
    // ========================================

    /**
     * Handler: poll:create
     * Description: Teacher creates a new poll
     * Service: PollService.createPoll()
     */
    socket.on('poll:create', async (data) => {
      try {
        const { question, options, correctAnswers, timeLimit, teacherId } = data

        // Delegate to service: create poll with validation
        const poll = await PollService.createPoll({
          teacherId,
          question,
          options,
          correctAnswers,
          timeLimit,
        })

        // Broadcast poll creation
        io.emit('poll:updated', poll)
        socket.emit('poll:created', poll)

        console.log(`[Socket.io] Poll created: ${poll.id}`)
      } catch (error: any) {
        console.error('[Socket.io] Error in poll:create:', error.message)
        socket.emit('error', { message: error.message || 'Failed to create poll' })
      }
    })

    /**
     * Handler: poll:start
     * Description: Teacher starts a poll
     * Service: PollService.startPoll()
     */
    socket.on('poll:start', async (data) => {
      try {
        const { pollId } = data

        // Delegate to service: start poll and set startedAt timestamp
        const poll = await PollService.startPoll(pollId)

        // Broadcast poll start event
        io.to(pollId).emit('poll:updated', poll)
        io.to(pollId).emit('poll:started', poll)
        io.emit('poll:updated', poll)
        io.emit('poll:started', poll)

        console.log(`[Socket.io] Poll ${pollId} started`)
      } catch (error: any) {
        console.error('[Socket.io] Error in poll:start:', error.message)
        socket.emit('error', { message: error.message || 'Failed to start poll' })
      }
    })

    /**
     * Handler: poll:end
     * Description: Teacher ends a poll and calculates results
     * Service: PollService.endPoll()
     */
    socket.on('poll:end', async (data) => {
      try {
        const { pollId } = data

        // Delegate to service: end poll and calculate results
        const { poll, results } = await PollService.endPoll(pollId)

        // Broadcast poll end event and final results
        io.to(pollId).emit('poll:updated', poll)
        io.to(pollId).emit('poll:ended', poll)
        io.to(pollId).emit('results:updated', results)
        io.emit('poll:updated', poll)
        io.emit('poll:ended', poll)
        io.emit('results:updated', results)

        console.log(`[Socket.io] Poll ${pollId} ended with results broadcasted`)
      } catch (error: any) {
        console.error('[Socket.io] Error in poll:end:', error.message)
        socket.emit('error', { message: error.message || 'Failed to end poll' })
      }
    })

    // ========================================
    // VOTING HANDLERS
    // ========================================

    /**
     * Handler: vote:cast
     * Description: Student casts a vote
     * Service: VoteService.submitVote(), PollService.getPollResults()
     */
    socket.on('vote:cast', async (data) => {
      try {
        const { pollId, optionId, studentId } = data

        // Delegate to service: submit vote with validation
        const vote = await VoteService.submitVote({
          pollId,
          studentId,
          optionId,
        })

        // Delegate to service: get updated poll results
        const results = await PollService.getPollResults(pollId)

        // Broadcast vote success and updated results
        socket.emit('vote:success', vote)
        io.to(pollId).emit('vote:updated', { pollId })

        if (results) {
          io.to(pollId).emit('results:updated', results)
        }

        console.log(`[Socket.io] Vote cast by student ${studentId} on poll ${pollId}`)
      } catch (error: any) {
        console.error('[Socket.io] Error in vote:cast:', error.message)
        socket.emit('error', { message: error.message || 'Failed to cast vote' })
      }
    })

    /**
     * Handler: vote:submit
     * Description: Broadcast updated results after vote via REST API
     * Service: PollService.getPollResults()
     */
    socket.on('vote:submit', async (data) => {
      try {
        const { pollId } = data
        console.log(`[Socket.io] Broadcasting updated results for poll ${pollId}`)

        // Delegate to service: get updated poll results
        const results = await PollService.getPollResults(pollId)

        if (results) {
          // Broadcast updated results to all users in the poll room
          io.to(pollId).emit('results:updated', results)
          io.to(pollId).emit('vote:updated', { pollId, totalVotes: results.totalVotes })
        }
      } catch (error: any) {
        console.error('[Socket.io] Error in vote:submit:', error.message)
      }
    })
  })

  // Store io instance globally for API routes if needed
  ;(global as any).io = io

  // Start HTTP server
  httpServer
    .once('error', (err) => {
      console.error('[Server] Error:', err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.IO server running`)
    })
})
