/**
 * Polls API Route
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
import { validators } from "@/lib/validators"
import { handleApiError, ValidationError } from "@/lib/error-handler"


/**
 * POST: Create a new poll
 * 
 * Responsible for:
 * 1. Validate input parameters
 * 2. Delegate to PollService.createPoll()
 * 3. Return response
 * 
 * Business logic is in PollService, NOT in this route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, question, options, correctAnswers, timeLimit } = body

    // === INPUT VALIDATION (Controller responsibility) ===
    validators.question(question)
    validators.options(options)
    validators.timeLimit(timeLimit)

    if (!teacherId || typeof teacherId !== "string") {
      throw new ValidationError("Valid teacher ID is required")
    }

    if (!Array.isArray(correctAnswers) || correctAnswers.length !== options.length) {
      throw new ValidationError("Correct answers must match options count")
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const poll = await PollService.createPoll({
      teacherId,
      question,
      options,
      correctAnswers,
      timeLimit,
    })

    return NextResponse.json(poll, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET: Fetch current active poll for teacher
 * 
 * Responsible for:
 * 1. Extract and validate query parameters
 * 2. Delegate to PollService.getActivePoll()
 * 3. Return response
 * 
 * Business logic is in PollService, NOT in this route
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 })
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const activePoll = await PollService.getActivePoll(teacherId)

    if (!activePoll) {
      return NextResponse.json({ error: "No active poll" }, { status: 404 })
    }

    return NextResponse.json(activePoll)
  } catch (error) {
    console.error("Error fetching poll:", error)
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 })
  }
}
