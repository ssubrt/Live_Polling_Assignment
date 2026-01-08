/**
 * End Poll API Route
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

/**
 * POST: End a poll and calculate results
 * 
 * Responsible for:
 * 1. Validate poll exists
 * 2. Delegate to PollService.endPoll()
 * 3. Broadcast via Socket.IO
 * 4. Return response
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

    // === DELEGATE TO SERVICE (Service responsibility) ===
    // PollService handles poll update, status change, and results calculation
    const { poll, results } = await PollService.endPoll(pollId)

    // === BROADCAST VIA SOCKET.IO (Controller responsibility - notification only) ===
    if (typeof global !== "undefined" && (global as any).io) {
      const io = (global as any).io
      io.emit("poll:ended", poll)
      io.emit("poll:updated", poll)
      io.emit("results:updated", results)
      console.log(`[API] Poll end and results broadcasted for poll ${pollId}`)
    }

    return NextResponse.json({ poll, results })
  } catch (error) {
    console.error("Error ending poll:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to end poll" }, { status: 500 })
  }
}
