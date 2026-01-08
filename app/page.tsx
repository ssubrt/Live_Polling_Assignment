"use client"

import { useState, useEffect } from "react"
import { RoleSelector } from "@/components/role-selector"
import { StudentOnboarding } from "@/components/student-onboarding"
import { TeacherOnboarding } from "@/components/teacher-onboarding"
import { CreatePollForm } from "@/components/create-poll-form"
import { StudentPollView } from "@/components/student-poll-view"
import { TeacherPollView } from "@/components/teacher-poll-view"
import { WaitingState } from "@/components/waiting-state"
import { KickedOut } from "@/components/kicked-out"
import { PollHistory } from "@/components/poll-history"
import { ConnectionStatus } from "@/components/connection-status"
import { useSocket } from "@/hooks/use-socket"
import { Role, PollStatus } from "@/lib/types"
import toast from "react-hot-toast"
import type { IPoll } from "@/lib/types"

type AppStep =
  | "role-select"
  | "student-onboarding"
  | "teacher-onboarding"
  | "create-poll"
  | "student-live-poll"
  | "teacher-live-poll"
  | "waiting"
  | "kicked-out"
  | "poll-history"

export default function Home() {
  const [step, setStep] = useState<AppStep>("role-select")
  const [role, setRole] = useState<Role | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [studentName, setStudentName] = useState<string>("")
  const [activePoll, setActivePoll] = useState<IPoll | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { on, off } = useSocket()

  // Listen for student:kicked event
  useEffect(() => {
    const handleKicked = (data: { reason: string }) => {
      console.log("[Student] Kicked out:", data.reason)
      toast.error("You have been removed from the poll by the teacher")
      setStep("kicked-out")
    }

    on("student:kicked", handleKicked)

    return () => {
      off("student:kicked", handleKicked)
    }
  }, [on, off])

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("sessionId")
    const savedRole = localStorage.getItem("role")

    if (savedSessionId && savedRole) {
      restoreSession(savedSessionId, savedRole as Role)
    }
  }, [])

  const restoreSession = async (sessionId: string, savedRole: Role) => {
    try {
      const response = await fetch(`/api/session?id=${sessionId}`)
      if (response.ok) {
        const session = await response.json()
        setSessionId(sessionId)
        setRole(savedRole)

        if (savedRole === Role.STUDENT) {
          setStudentId(session.studentId)
          setStudentName(session.name)
          setStep("waiting")
          fetchActivePoll()
        } else {
          setTeacherId(session.teacherId)
          setStep("create-poll")
          fetchTeacherActivePoll(session.teacherId)
        }
      } else {
        localStorage.removeItem("sessionId")
        localStorage.removeItem("role")
      }
    } catch (error) {
      console.error("Error restoring session:", error)
      localStorage.removeItem("sessionId")
      localStorage.removeItem("role")
      toast.error("Failed to restore session. Please login again.")
    }
  }

  const fetchActivePoll = async () => {
    try {
      const response = await fetch("/api/polls/active")
      if (response.ok) {
        const data = await response.json()
        const poll = data.activePoll
        setActivePoll(poll)
        if (poll && poll.status === PollStatus.ACTIVE) {
          setStep("student-live-poll")
        }
      } else {
        // No active poll found, stay in waiting state
        setActivePoll(null)
      }
    } catch (error) {
      console.error("Error fetching active poll:", error)
      setActivePoll(null)
    }
  }

  const fetchTeacherActivePoll = async (tId: string) => {
    try {
      const response = await fetch(`/api/polls?teacherId=${tId}`)
      if (response.ok) {
        const poll = await response.json()
        setActivePoll(poll)
        if (poll.status === PollStatus.ACTIVE) {
          setStep("teacher-live-poll")
        }
      }
    } catch (error) {
      console.error("Error fetching active poll:", error)
    }
  }

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole)
    setError(null)
    if (selectedRole === Role.STUDENT) {
      setStep("student-onboarding")
    } else {
      setStep("teacher-onboarding")
    }
  }

  const handleStudentOnboarding = async (name: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: Role.STUDENT,
          name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create session")
      }

      const session = await response.json()
      setSessionId(session.id)
      setStudentId(session.studentId)
      setStudentName(name)
      localStorage.setItem("sessionId", session.id)
      localStorage.setItem("role", Role.STUDENT)
      setStep("waiting")
      await fetchActivePoll()
      toast.success("Welcome to Live Polling!")
    } catch (error) {
      console.error("Error creating session:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to create session"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherOnboarding = async (name: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: Role.TEACHER,
          name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create session")
      }

      const session = await response.json()
      setSessionId(session.id)
      setTeacherId(session.teacherId)
      localStorage.setItem("sessionId", session.id)
      localStorage.setItem("role", Role.TEACHER)
      setStep("create-poll")
      toast.success("Welcome back, Teacher!")
    } catch (error) {
      console.error("Error creating session:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to create session"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handlePollCreated = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/start`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to start poll")
      }

      const poll = await response.json()
      setActivePoll(poll)
      setPollCount((prev) => prev + 1)
      setStep("teacher-live-poll")
      toast.success("Poll started!")
    } catch (error) {
      console.error("Error starting poll:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to start poll"
      toast.error(errorMsg)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("sessionId")
    localStorage.removeItem("role")
    setSessionId(null)
    setRole(null)
    setStudentId(null)
    setTeacherId(null)
    setStudentName("")
    setActivePoll(null)
    setPollCount(0)
    setStep("role-select")
    toast.success("Logged out successfully")
  }

  // Render based on current step
  if (step === "role-select") {
    return <RoleSelector onRoleSelect={handleRoleSelect} />
  }

  if (step === "student-onboarding") {
    return <StudentOnboarding onComplete={handleStudentOnboarding} />
  }

  if (step === "teacher-onboarding") {
    return <TeacherOnboarding onComplete={handleTeacherOnboarding} />
  }

  if (step === "create-poll" && teacherId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted/20 p-4">
        <ConnectionStatus />
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 flex justify-end">
            <button onClick={handleLogout} className="text-red-600 hover:underline font-medium text-sm">
              Logout
            </button>
          </div>
          <CreatePollForm teacherId={teacherId} onPollCreated={handlePollCreated} isLoading={loading} />
          <div className="mt-8 text-center">
            <button onClick={() => setStep("poll-history")} className="text-purple-600 hover:underline font-medium">
              View Poll History
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === "teacher-live-poll" && activePoll && teacherId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted/20 p-4">
        <ConnectionStatus />
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Live Poll Results</h1>
            <button onClick={handleLogout} className="text-red-600 hover:underline font-medium text-sm">
              Logout
            </button>
          </div>
          <TeacherPollView
            poll={activePoll}
            teacherId={teacherId}
            onPollEnd={() => {
              setActivePoll(null)
              setStep("create-poll")
              toast.success("Poll ended. Create a new one.")
            }}
          />
        </div>
      </div>
    )
  }

  if (step === "student-live-poll" && activePoll && studentId && studentName) {
    return (
      <>
        <ConnectionStatus />
        <StudentPollView
          poll={activePoll}
          studentId={studentId}
          studentName={studentName}
          questionNumber={pollCount + 1}
          onPollEnded={() => {
            setActivePoll(null)
            setStep("waiting")
          }}
        />
      </>
    )
  }

  if (step === "waiting" && studentId && studentName) {
    return (
      <>
        <ConnectionStatus />
        <WaitingState
          pollId={activePoll?.id || "pending"}
          onPollReady={(poll) => {
            setActivePoll(poll)
            setStep("student-live-poll")
          }}
        />
      </>
    )
  }

  if (step === "kicked-out") {
    return (
      <KickedOut
        onRetry={() => {
          localStorage.removeItem("sessionId")
          localStorage.removeItem("role")
          setStep("role-select")
        }}
      />
    )
  }

  if (step === "poll-history" && teacherId) {
    return <PollHistory teacherId={teacherId} onBack={() => setStep("create-poll")} />
  }

  return null
}
