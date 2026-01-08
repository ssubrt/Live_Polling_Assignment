/**
 * Active Polls API Route
 * 
 * Architecture: REST API Controller
 * - Delegates business logic to PollService
 * - Returns responses
 * 
 * This follows the Controller-Service pattern for clean separation of concerns
 */

import { type NextRequest, NextResponse } from "next/server"
import { PollService } from "@/lib/services"
import { prisma } from "@/lib/db"
import { PollStatus } from "@/lib/types"

/**
 * GET: Fetch currently active poll for students
 * 
 * Responsible for:
 * 1. Get active poll from PollService
 * 2. Check if poll time limit has been exceeded
 * 3. Return response
 * 
 * Note: Time limit enforcement is a business logic edge case
 * For now, we handle it here, but could be moved to service if reused
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recent active poll
    const activePoll = await prisma.poll.findFirst({
      where: {
        status: PollStatus.ACTIVE,
      },
      include: {
        options: {
          select: {
            id: true,
            text: true,
            // Don't include correct answer for students
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    })

    if (!activePoll) {
      // Return 200 with null instead of 404 - "no active poll" isn't an error
      return NextResponse.json(
        { activePoll: null, message: "No active poll" },
        { status: 200 }
      )
    }

    // === EDGE CASE: Check if poll has exceeded time limit ===
    if (activePoll.startedAt) {
      const now = new Date()
      const elapsedTime = (now.getTime() - new Date(activePoll.startedAt).getTime()) / 1000

      if (elapsedTime > activePoll.timeLimit) {
        // Close this expired poll (edge case handling)
        // In production, this should be done by a scheduled task or service
        await prisma.poll.update({
          where: { id: activePoll.id },
          data: {
            status: PollStatus.CLOSED,
            endedAt: now,
          },
        })

        return NextResponse.json(
          { activePoll: null, message: "Poll has expired" },
          { status: 200 }
        )
      }
    }

    return NextResponse.json({ activePoll, message: "Active poll found" })
  } catch (error) {
    console.error("Error fetching active poll:", error)
    return NextResponse.json({ error: "Failed to fetch active poll" }, { status: 500 })
  }
}
