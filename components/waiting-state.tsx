"use client"

import { useEffect, useState } from "react"
import { useSocket } from "@/hooks/use-socket"
import { Card, CardContent } from "@/components/ui/card"

interface WaitingStateProps {
  pollId: string
  onPollReady: (poll: any) => void
}

export function WaitingState({ pollId, onPollReady }: WaitingStateProps) {
  const [waitingMessage, setWaitingMessage] = useState("Wait for the teacher to ask questions...")
  const { on, off } = useSocket()

  // Poll for active polls every 5 seconds
  useEffect(() => {
    const checkForActivePoll = async () => {
      try {
        const response = await fetch("/api/polls/active")
        if (response.ok) {
          const data = await response.json()
          const poll = data.activePoll
          if (poll && poll.status === "ACTIVE") {
            onPollReady(poll)
          }
        }
      } catch (error) {
        console.error("Error checking for active poll:", error)
      }
    }

    // Check immediately
    checkForActivePoll()

    // Then check every 5 seconds (reduced from 2s to minimize 404 logs)
    const interval = setInterval(checkForActivePoll, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [onPollReady])

  // Also listen for WebSocket events for instant updates
  useEffect(() => {
    const handlePollStarted = (data: any) => {
      if (data.status === "ACTIVE") {
        onPollReady(data)
      }
    }

    const handlePollUpdate = (data: any) => {
      if (data.status === "ACTIVE") {
        onPollReady(data)
      }
    }

    on("poll:started", handlePollStarted)
    on("poll:updated", handlePollUpdate)

    return () => {
      off("poll:started", handlePollStarted)
      off("poll:updated", handlePollUpdate)
    }
  }, [on, off, onPollReady])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="inline-flex">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700">{waitingMessage}</p>
        </CardContent>
      </Card>
    </div>
  )
}
