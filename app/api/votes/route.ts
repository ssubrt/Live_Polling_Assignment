/**
 * Votes API Route
 * 
 * Architecture: REST API Controller
 * - Validates input
 * - Delegates business logic to VoteService and PollService
 * - Returns responses
 * - Triggers Socket.IO broadcast for real-time updates
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import { type NextRequest, NextResponse } from "next/server"
import { VoteService, PollService } from "@/lib/services"
import { handleApiError, ValidationError } from "@/lib/error-handler"

/**
 * POST: Submit a vote for a student
 * 
 * Responsible for:
 * 1. Validate input parameters
 * 2. Delegate to VoteService.submitVote()
 * 3. Fetch updated results via PollService.getPollResults()
 * 4. Broadcast results via Socket.IO
 * 5. Return response
 * 
 * Business logic is in VoteService and PollService, NOT in this route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pollId, studentId, optionId } = body

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!pollId || typeof pollId !== "string") {
      throw new ValidationError("Valid poll ID is required")
    }
    if (!studentId || typeof studentId !== "string") {
      throw new ValidationError("Valid student ID is required")
    }
    if (!optionId || typeof optionId !== "string") {
      throw new ValidationError("Valid option ID is required")
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    // VoteService handles all validation and vote creation
    const vote = await VoteService.submitVote({
      pollId,
      studentId,
      optionId,
    })

    // === FETCH UPDATED RESULTS (Service responsibility) ===
    // Get the current poll results to broadcast
    const results = await PollService.getPollResults(pollId)

    // === BROADCAST VIA SOCKET.IO (Controller responsibility - notification only) ===
    // Emit real-time updates via Socket.IO if server is available
    if (typeof global !== "undefined" && (global as any).io) {
      const io = (global as any).io

      if (results) {
        // Broadcast to poll-specific room and globally
        io.to(pollId).emit("results:updated", results)
        io.to(pollId).emit("vote:updated", { pollId, totalVotes: results.totalVotes })
        console.log(`[API] Broadcasted vote results: ${results.totalVotes} total votes for poll ${pollId}`)
      }
    }

    return NextResponse.json(vote, { status: 201 })
  } catch (error) {
    const { status, message, code } = handleApiError(error)
    return NextResponse.json({ error: message, code }, { status })
  }
}
