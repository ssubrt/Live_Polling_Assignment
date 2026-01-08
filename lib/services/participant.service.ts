/**
 * Participant Service
 * Handles business logic for tracking online participants
 * Manages participant state and session tracking
 */

import { prisma } from "@/lib/db"

export interface IParticipantData {
  studentId?: string
  teacherId?: string
  name: string
  role: "STUDENT" | "TEACHER"
  pollId: string
}

/**
 * In-memory store for online participants
 * Maps socket ID to participant data
 * Note: This is not persisted in the database, so it will be reset on server restart
 * For production, consider using Redis for cross-server resilience
 */
const onlineParticipants = new Map<string, IParticipantData>()

export class ParticipantService {
  /**
   * Add a participant to the online list
   */
  static addParticipant(socketId: string, data: IParticipantData): void {
    onlineParticipants.set(socketId, data)
  }

  /**
   * Remove a participant from the online list
   */
  static removeParticipant(socketId: string): IParticipantData | undefined {
    const participant = onlineParticipants.get(socketId)
    onlineParticipants.delete(socketId)
    return participant
  }

  /**
   * Get all online participants
   */
  static getAllParticipants(): Array<{ socketId: string; data: IParticipantData }> {
    return Array.from(onlineParticipants.entries()).map(([socketId, data]) => ({
      socketId,
      data,
    }))
  }

  /**
   * Get participants for a specific poll
   */
  static getParticipantsByPoll(pollId: string): IParticipantData[] {
    return Array.from(onlineParticipants.values()).filter((p) => p.pollId === pollId)
  }

  /**
   * Get student participants for a specific poll
   */
  static getStudentsByPoll(pollId: string): IParticipantData[] {
    return Array.from(onlineParticipants.values()).filter(
      (p) => p.pollId === pollId && p.role === "STUDENT"
    )
  }

  /**
   * Get a participant by socket ID
   */
  static getParticipantBySocketId(socketId: string): IParticipantData | undefined {
    return onlineParticipants.get(socketId)
  }

  /**
   * Get socket ID of a student in a specific poll
   */
  static getStudentSocketId(studentId: string, pollId: string): string | undefined {
    for (const [socketId, participant] of onlineParticipants.entries()) {
      if (participant.studentId === studentId && participant.pollId === pollId) {
        return socketId
      }
    }
    return undefined
  }

  /**
   * Check if a student is online in a specific poll
   */
  static isStudentOnline(studentId: string, pollId: string): boolean {
    return this.getStudentSocketId(studentId, pollId) !== undefined
  }

  /**
   * Get count of online participants for a poll
   */
  static getParticipantCount(pollId: string): number {
    return this.getParticipantsByPoll(pollId).length
  }

  /**
   * Get count of online students for a poll
   */
  static getStudentCount(pollId: string): number {
    return this.getStudentsByPoll(pollId).length
  }

  /**
   * Clear all participants for a poll (when poll ends)
   */
  static clearPollParticipants(pollId: string): void {
    const toDelete: string[] = []
    for (const [socketId, participant] of onlineParticipants.entries()) {
      if (participant.pollId === pollId) {
        toDelete.push(socketId)
      }
    }
    toDelete.forEach((socketId) => onlineParticipants.delete(socketId))
  }

  /**
   * Clear all participants (on server shutdown)
   */
  static clearAllParticipants(): void {
    onlineParticipants.clear()
  }
}
