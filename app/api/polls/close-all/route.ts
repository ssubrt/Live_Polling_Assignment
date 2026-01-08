/**
 * Close All Polls API Route
 * 
 * Architecture: REST API Controller
 * - Delegates business logic to PollService
 * - Returns responses
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * POST: Close all active polls
 * 
 * Responsible for:
 * 1. Delegate to database to close all active polls
 * 2. Return response with count
 * 
 * Note: This is a special admin operation that closes all polls at once
 * For production, consider adding teacher ID filter if only teachers can close all
 */
export async function POST() {
  try {
    // Close all active polls
    const result = await prisma.poll.updateMany({
      where: {
        status: "ACTIVE",
      },
      data: {
        status: "CLOSED",
        endedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Closed ${result.count} active poll(s)`,
      count: result.count,
    })
  } catch (error) {
    console.error("Error closing polls:", error)
    return NextResponse.json({ error: "Failed to close polls" }, { status: 500 })
  }
}

