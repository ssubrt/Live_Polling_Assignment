export enum Role {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
}

export enum PollStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export interface ISession {
  id: string
  role: Role
  name: string
  studentId?: string
  teacherId?: string
  createdAt: string
  updatedAt: string
}

export interface IPollOption {
  id: string
  text: string
  correct: boolean
  voteCount?: number
}

export interface IPoll {
  id: string
  question: string
  teacherId: string
  status: PollStatus
  timeLimit: number
  createdAt: string
  startedAt?: string
  endedAt?: string
  options: IPollOption[]
}

export interface IVote {
  id: string
  pollId: string
  studentId: string
  optionId: string
  createdAt: string
}

export interface IChatMessage {
  id: string
  pollId: string
  sender: string
  message: string
  createdAt: string
}

export interface IPollResults {
  pollId: string
  question: string
  options: Array<{
    id: string
    text: string
    correct: boolean
    voteCount: number
    percentage: number
  }>
  totalVotes: number
  duration: number
}

export interface IParticipant {
  studentId?: string
  name: string
  role: string
  pollId: string
}

// Socket.io Event Types
export interface ISocketEvents {
  // Teacher events
  "poll:create": (data: { question: string; options: string[]; correctAnswers: boolean[]; timeLimit: number }) => void
  "poll:start": (data: { pollId: string }) => void
  "poll:end": (data: { pollId: string }) => void
  "student:kick": (data: { pollId: string; studentId: string }) => void

  // Student events
  "vote:submit": (data: { pollId: string; optionId: string; studentId: string }) => void
  "user:join": (data: { studentId?: string; teacherId?: string; name: string; role: string; pollId: string }) => void

  // Chat events
  "message:send": (data: { pollId: string; sender: string; message: string }) => void

  // Broadcast events
  "poll:updated": (data: IPoll) => void
  "poll:started": (data: IPoll) => void
  "poll:ended": (data: IPoll) => void
  "poll:created": (data: IPoll) => void
  "vote:updated": (data: { pollId: string; poll: IPoll }) => void
  "results:updated": (data: IPollResults) => void
  "student:joined": (data: { pollId: string; studentName: string; studentId: string }) => void
  "student:left": (data: { pollId: string; studentId: string }) => void
  "message:received": (data: IChatMessage) => void
  "student:kicked": (data: { reason: string }) => void
  "timer:sync": (data: { pollId: string; remainingTime: number; startedAt: number }) => void
  "participants:update": (data: IParticipant[]) => void
}
