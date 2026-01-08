/**
 * Chat Service
 * Handles all business logic related to messaging
 * Manages message creation and retrieval
 */

import { prisma } from "@/lib/db"

interface SendMessageInput {
  pollId: string
  sender: string
  message: string
}

export class ChatService {
  /**
   * Send a chat message
   * Creates message in database for persistence
   */
  static async sendMessage(input: SendMessageInput): Promise<any> {
    const { pollId, sender, message } = input

    // Validate poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      throw new Error("Poll not found")
    }

    // Validate message is not empty
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty")
    }

    // Validate sender name
    if (!sender || sender.trim().length === 0) {
      throw new Error("Sender name is required")
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        pollId,
        sender,
        message: message.trim(),
      },
    })

    return chatMessage
  }

  /**
   * Get all messages for a poll
   */
  static async getPollMessages(pollId: string): Promise<any[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { pollId },
      orderBy: { createdAt: "asc" },
    })

    return messages
  }

  /**
   * Get recent messages for a poll (pagination)
   */
  static async getRecentMessages(pollId: string, limit: number = 50): Promise<any[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { pollId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return messages.reverse()
  }

  /**
   * Delete a specific message (for moderation)
   */
  static async deleteMessage(messageId: string): Promise<void> {
    await prisma.chatMessage.delete({
      where: { id: messageId },
    })
  }

  /**
   * Delete all messages for a poll
   */
  static async deleteAllPollMessages(pollId: string): Promise<number> {
    const result = await prisma.chatMessage.deleteMany({
      where: { pollId },
    })

    return result.count
  }

  /**
   * Get message count for a poll
   */
  static async getMessageCount(pollId: string): Promise<number> {
    const count = await prisma.chatMessage.count({
      where: { pollId },
    })

    return count
  }
}
