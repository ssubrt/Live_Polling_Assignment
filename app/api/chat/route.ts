/**
 * Chat API Route
 * 
 * Architecture: REST API Controller
 * - Validates input
 * - Delegates business logic to ChatService
 * - Returns responses
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import { type NextRequest, NextResponse } from "next/server"
import { ChatService } from "@/lib/services"

/**
 * POST: Send a chat message
 * 
 * Responsible for:
 * 1. Validate input parameters
 * 2. Delegate to ChatService.sendMessage()
 * 3. Return response
 * 
 * Business logic is in ChatService, NOT in this route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pollId, sender, message } = body

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!pollId || !sender || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const savedMessage = await ChatService.sendMessage({
      pollId,
      sender,
      message,
    })

    return NextResponse.json(savedMessage, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create message"
    console.error("Error creating chat message:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET: Fetch messages for a poll
 * 
 * Responsible for:
 * 1. Validate query parameters
 * 2. Delegate to ChatService.getRecentMessages()
 * 3. Return response
 * 
 * Business logic is in ChatService, NOT in this route
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pollId = searchParams.get("pollId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // === INPUT VALIDATION (Controller responsibility) ===
    if (!pollId) {
      return NextResponse.json({ error: "Poll ID required" }, { status: 400 })
    }

    // === DELEGATE TO SERVICE (Service responsibility) ===
    const messages = await ChatService.getRecentMessages(pollId, limit)

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
