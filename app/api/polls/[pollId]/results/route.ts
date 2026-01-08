/**
 * Poll Results API Route
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
 * GET: Fetch results for a poll
 * 
 * Responsible for:
 * 1. Validate poll ID
 * 2. Delegate to PollService.getPollResults()
 * 3. Return response
 * 
 * Business logic is in PollService, NOT in this route
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  try {
    const { pollId } = await params

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!pollId) {
      return NextResponse.json({ error: "Poll ID required" }, { status: 400 })
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const results = await PollService.getPollResults(pollId)

    if (!results) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
