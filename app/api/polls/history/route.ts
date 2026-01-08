/**
 * Poll History API Route
 * 
 * Architecture: REST API Controller
 * - Validates input
 * - Delegates business logic to PollService
 * - Returns responses
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import { type NextRequest, NextResponse } from "next/server"
import { PollService } from "@/lib/services"

/**
 * GET: Fetch poll history for a teacher
 * 
 * Responsible for:
 * 1. Validate input parameters
 * 2. Delegate to PollService.getPollHistory()
 * 3. Transform results for response
 * 4. Return response
 * 
 * Business logic is in PollService, NOT in this route
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 })
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const polls = await PollService.getPollHistory(teacherId)

    // === TRANSFORM FOR RESPONSE (Controller responsibility) ===
    // Note: PollService returns raw polls, we transform them for the API response
    const history = polls.slice(0, limit).map((poll) => {
      const totalVotes = poll.votes?.length || 0
      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        endedAt: poll.endedAt,
        totalVotes,
        options: poll.options?.map((opt) => ({
          id: opt.id,
          text: opt.text,
          correct: opt.correct,
          voteCount: opt.votes?.length || 0,
          percentage: totalVotes > 0 ? ((opt.votes?.length || 0) / totalVotes) * 100 : 0,
        })) || [],
      }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching poll history:", error)
    return NextResponse.json({ error: "Failed to fetch poll history" }, { status: 500 })
  }
}
