/**
 * Poll Service
 * Handles all business logic related to polls
 * Separates database operations from controllers (routes and socket handlers)
 */

import { prisma } from "@/lib/db"

interface CreatePollInput {
  teacherId: string
  question: string
  options: string[]
  correctAnswers: boolean[]
  timeLimit: number
}

interface PollResults {
  pollId: string
  question: string
  totalVotes: number
  options: Array<{
    id: string
    text: string
    correct: boolean
    voteCount: number
    percentage: number
  }>
}

export class PollService {
  /**
   * Create a new poll
   * Validates teacher exists before creating poll
   */
  static async createPoll(input: CreatePollInput): Promise<any> {
    const { teacherId, question, options, correctAnswers, timeLimit } = input

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher) {
      throw new Error("Teacher not found")
    }

    // Create poll with options
    const poll = await prisma.poll.create({
      data: {
        question,
        teacherId,
        timeLimit,
        status: "PENDING",
        options: {
          create: options.map((text: string, index: number) => ({
            text,
            correct: correctAnswers[index] || false,
          })),
        },
      },
      include: {
        options: true,
      },
    })

    return poll
  }

  /**
   * Get active poll for a teacher
   */
  static async getActivePoll(teacherId: string): Promise<any> {
    const activePoll = await prisma.poll.findFirst({
      where: {
        teacherId,
        status: "ACTIVE",
      },
      include: {
        options: true,
        votes: {
          include: {
            option: true,
            student: true,
          },
        },
      },
    })

    return activePoll
  }

  /**
   * Get poll by ID
   */
  static async getPollById(pollId: string): Promise<any> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
        votes: true,
      },
    })

    return poll
  }

  /**
   * Start a poll (change status to ACTIVE and set startedAt)
   */
  static async startPoll(pollId: string): Promise<any> {
    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        status: "ACTIVE",
        startedAt: new Date(),
      },
      include: {
        options: true,
        votes: true,
      },
    })

    return poll
  }

  /**
   * End a poll and calculate final results
   */
  static async endPoll(pollId: string): Promise<{ poll: any; results: PollResults }> {
    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        status: "CLOSED",
        endedAt: new Date(),
      },
      include: {
        options: {
          include: { votes: true },
        },
        votes: true,
      },
    })

    // Calculate results
    const totalVotes = poll.votes.length
    const results: PollResults = {
      pollId: poll.id,
      question: poll.question,
      totalVotes,
      options: poll.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        correct: opt.correct,
        voteCount: opt.votes.length,
        percentage: totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0,
      })),
    }

    return { poll, results }
  }

  /**
   * Get poll results (used when poll is active or closed)
   */
  static async getPollResults(pollId: string): Promise<PollResults | null> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: { votes: true },
        },
        votes: true,
      },
    })

    if (!poll) return null

    const totalVotes = poll.votes.length
    const results: PollResults = {
      pollId: poll.id,
      question: poll.question,
      totalVotes,
      options: poll.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        correct: opt.correct,
        voteCount: opt.votes.length,
        percentage: totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0,
      })),
    }

    return results
  }

  /**
   * Get poll history for a teacher
   */
  static async getPollHistory(teacherId: string): Promise<any[]> {
    const polls = await prisma.poll.findMany({
      where: {
        teacherId,
        status: "CLOSED",
      },
      include: {
        options: {
          include: { votes: true },
        },
        votes: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return polls
  }

  /**
   * Close all polls for a teacher (set status to CLOSED)
   */
  static async closeAllPolls(teacherId: string): Promise<void> {
    await prisma.poll.updateMany({
      where: {
        teacherId,
        status: "ACTIVE",
      },
      data: {
        status: "CLOSED",
        endedAt: new Date(),
      },
    })
  }

  /**
   * Validate poll status
   */
  static async validatePollStatus(pollId: string, expectedStatus: string): Promise<boolean> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    return poll?.status === expectedStatus
  }

  /**
   * Check if poll exists and is active
   */
  static async isPollActive(pollId: string): Promise<boolean> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    return poll?.status === "ACTIVE"
  }
}
