/**
 * Vote Service
 * Handles all business logic related to voting
 * Manages vote submission, tracking, and validation
 */

import { prisma } from "@/lib/db"

interface SubmitVoteInput {
  pollId: string
  studentId: string
  optionId: string
}

export class VoteService {
  /**
   * Submit a vote for a student
   * Validates poll is active, student hasn't voted, and option exists
   */
  static async submitVote(input: SubmitVoteInput): Promise<any> {
    const { pollId, studentId, optionId } = input

    // Check if poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      throw new Error("Poll not found")
    }

    if (poll.status !== "ACTIVE") {
      throw new Error("Poll is not active")
    }

    // Check if student has already voted
    const existingVote = await prisma.vote.findFirst({
      where: {
        pollId,
        studentId,
      },
    })

    if (existingVote) {
      throw new Error("You have already voted on this poll")
    }

    // Verify option exists and belongs to this poll
    const option = await prisma.pollOption.findUnique({
      where: { id: optionId },
    })

    if (!option || option.pollId !== pollId) {
      throw new Error("Invalid option for this poll")
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      throw new Error("Student not found")
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        pollId,
        studentId,
        optionId,
      },
    })

    return vote
  }

  /**
   * Check if a student has already voted on a poll
   */
  static async hasStudentVoted(pollId: string, studentId: string): Promise<boolean> {
    const vote = await prisma.vote.findFirst({
      where: {
        pollId,
        studentId,
      },
    })

    return !!vote
  }

  /**
   * Get student's vote for a specific poll
   */
  static async getStudentVote(pollId: string, studentId: string): Promise<any> {
    const vote = await prisma.vote.findFirst({
      where: {
        pollId,
        studentId,
      },
    })

    return vote
  }

  /**
   * Get all votes for a poll
   */
  static async getPollVotes(pollId: string): Promise<any[]> {
    const votes = await prisma.vote.findMany({
      where: { pollId },
      include: {
        student: true,
        option: true,
      },
    })

    return votes
  }

  /**
   * Get vote count by option for a poll
   */
  static async getVoteCountByOption(pollId: string): Promise<Record<string, number>> {
    const options = await prisma.pollOption.findMany({
      where: { pollId },
      include: {
        votes: true,
      },
    })

    const counts: Record<string, number> = {}
    options.forEach((option) => {
      counts[option.id] = option.votes.length
    })

    return counts
  }

  /**
   * Get total votes for a poll
   */
  static async getTotalVotes(pollId: string): Promise<number> {
    const count = await prisma.vote.count({
      where: { pollId },
    })

    return count
  }

  /**
   * Delete a vote (for admin/teacher purposes)
   */
  static async deleteVote(voteId: string): Promise<void> {
    await prisma.vote.delete({
      where: { id: voteId },
    })
  }

  /**
   * Reset all votes for a poll
   */
  static async resetPollVotes(pollId: string): Promise<number> {
    const result = await prisma.vote.deleteMany({
      where: { pollId },
    })

    return result.count
  }
}
