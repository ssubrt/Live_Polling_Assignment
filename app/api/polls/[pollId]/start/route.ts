/**
 * Start Poll API Route
 * 
 * Architecture: REST API Controller
 * - Validates input
 * - Delegates business logic to PollService
 * - Broadcasts via Socket.IO
 * - Returns responses
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import { type NextRequest, NextResponse } from "next/server"
import { PollService } from "@/lib/services"
import { prisma } from "@/lib/db"
import { PollStatus } from "@/lib/types"

/**
 * POST: Start a poll
 * 
 * Responsible for:
 * 1. Validate poll exists
 * 2. Handle edge case: auto-close expired active polls
 * 3. Delegate to PollService.startPoll()
 * 4. Broadcast via Socket.IO
 * 5. Return response
 * 
 * Business logic is in PollService, NOT in this route
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  try {
    const { pollId } = await params

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!pollId) {
      return NextResponse.json({ error: "Poll ID required" }, { status: 400 })
    }

    // === CHECK POLL EXISTS (Edge case validation) ===
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    }

    // === EDGE CASE: Auto-close any expired active polls before starting a new one ===
    // This is an edge case that could be moved to a service in the future
    const activePolls = await prisma.poll.findMany({
      where: {
        status: PollStatus.ACTIVE,
      },
    })

    const now = new Date()
    for (const activePoll of activePolls) {
      if (activePoll.id !== pollId && activePoll.startedAt) {
        const elapsedSeconds = (now.getTime() - new Date(activePoll.startedAt).getTime()) / 1000

        // If poll has exceeded its time limit, auto-close it
        if (elapsedSeconds > activePoll.timeLimit) {
          console.log(
            `[Auto-close] Closing expired poll ${activePoll.id} (elapsed: ${elapsedSeconds}s, limit: ${activePoll.timeLimit}s)`
          )
          await prisma.poll.update({
            where: { id: activePoll.id },
            data: {
              status: PollStatus.CLOSED,
              endedAt: now,
            },
          })
        } else {
          // There's a genuinely active poll that hasn't expired
          return NextResponse.json(
            { error: "Another poll is already active. End it first." },
            { status: 409 }
          )
        }
      }
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const updatedPoll = await PollService.startPoll(pollId)

    // === BROADCAST VIA SOCKET.IO (Controller responsibility - notification only) ===
    if (typeof global !== "undefined" && (global as any).io) {
      const io = (global as any).io
      io.emit("poll:started", updatedPoll)
      io.emit("poll:updated", updatedPoll)
      console.log(`[API] Poll start broadcasted for poll ${pollId}`)
    }

    return NextResponse.json(updatedPoll)
  } catch (error) {
    console.error("Error starting poll:", error)
    return NextResponse.json({ error: "Failed to start poll" }, { status: 500 })
  }
}
