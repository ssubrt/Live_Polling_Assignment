"use client"

import { useEffect, useState } from "react"
import type { IPoll, IPollResults } from "@/lib/types"
import { usePollTimer } from "@/hooks/use-poll-timer"
import { useSocket } from "@/hooks/use-socket"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react"

interface StudentPollViewProps {
  poll: IPoll
  studentId: string
  studentName: string
  questionNumber: number
  onPollEnded: () => void
}

export function StudentPollView({ poll, studentId, studentName, questionNumber, onPollEnded }: StudentPollViewProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [results, setResults] = useState<IPollResults | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { emit, on, off, connected } = useSocket()

  // Calculate the actual start time - handle both Date objects and ISO strings
  const startedAt = poll.startedAt 
    ? (typeof poll.startedAt === 'object' ? (poll.startedAt as Date).getTime() : new Date(poll.startedAt).getTime())
    : Date.now()
  
  const { remainingTime, isFinished, formattedTime } = usePollTimer({
    timeLimit: poll.timeLimit,
    startedAt,
    onTimeEnd: () => {
      if (!hasVoted) {
        toast.error("Time's up! Poll closed.")
      }
      onPollEnded()
    },
  })

  useEffect(() => {
    // Emit user join event when component mounts
    if (connected) {
      emit("user:join", {
        studentId,
        name: studentName,
        role: "STUDENT",
        pollId: poll.id,
      })
      console.log("[Student] Emitted user:join event for poll:", poll.id)
    }

    // Subscribe to real-time updates
    const handleResultsUpdate = (data: IPollResults) => {
      console.log("[Student] Results update received:", data)
      if (data.pollId === poll.id) {
        console.log("[Student] Setting results with", data.totalVotes, "votes")
        setResults(data)
      }
    }

    const handlePollEnd = (data: any) => {
      console.log("[Student] Poll end event received:", data)
      if (data.id === poll.id) {
        fetchResults()
        onPollEnded()
      }
    }

    on("results:updated", handleResultsUpdate)
    on("poll:updated", handlePollEnd)

    // Fetch initial results
    fetchResults()

    return () => {
      off("results:updated", handleResultsUpdate)
      off("poll:updated", handlePollEnd)
    }
  }, [poll.id, on, off, onPollEnded, connected, emit, studentId, studentName])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/polls/${poll.id}/results`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      setError("Failed to fetch results")
    }
  }

  const handleVote = async (optionId: string) => {
    if (!connected) {
      toast.error("Connection lost. Please reconnect.")
      return
    }

    if (hasVoted) {
      toast.error("You have already voted")
      return
    }

    if (isFinished) {
      toast.error("Time's up! You cannot vote anymore.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSelectedOption(optionId)

    try {
      console.log("[Student] Submitting vote via REST API:", { pollId: poll.id, studentId, optionId })
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId: poll.id,
          studentId,
          optionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit vote")
      }

      console.log("[Student] Vote submitted successfully via REST API")
      setHasVoted(true)
      toast.success("Vote submitted!")
      
      console.log("[Student] Emitting vote:submit socket event")
      emit("vote:submit", { pollId: poll.id, studentId, optionId })
      
      console.log("[Student] Fetching updated results")
      await fetchResults()
    } catch (error) {
      console.error("Error submitting vote:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to submit vote"
      setError(errorMsg)
      toast.error(errorMsg)
      setSelectedOption(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 p-4">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        {/* Main Poll Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Question {questionNumber}</h1>
            
            {/* Styled Timer Pill */}
            <div className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full shadow-sm transition-colors ${
              remainingTime <= 10 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
            }`}>
              <Clock className="w-5 h-5" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <Card className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden rounded-2xl bg-white">
            <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-8 px-8">
              <CardTitle className="text-2xl font-medium leading-relaxed text-gray-800">{poll.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-8 px-8 pb-8">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {poll.options.map((option, idx) => {
                const percentage = results ? results.options.find((opt) => opt.id === option.id)?.percentage || 0 : 0
                const isSelected = selectedOption === option.id
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={hasVoted || isFinished || submitting || !connected}
                    className={`w-full relative group transition-all duration-300 rounded-xl border-2 p-4 text-left overflow-hidden
                      ${isSelected 
                        ? "border-[#7765DA] bg-[#7765DA]/5 ring-1 ring-[#7765DA]" 
                        : "border-gray-100 bg-white hover:border-[#7765DA]/30 hover:bg-gray-50 hover:shadow-md"
                      }
                      ${(hasVoted || isFinished) ? "cursor-default" : "cursor-pointer"}
                    `}
                  >
                    {/* Background Progress Bar (only visible if results exist) */}
                    {results && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#7765DA]/10 transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                    
                    <div className="relative flex justify-between items-center z-10">
                      <div className="flex items-center gap-4 w-full">
                        {/* Circular Letter Badge */}
                        <div className={`
                          w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-sm font-bold transition-colors shadow-sm
                          ${isSelected 
                            ? "bg-[#7765DA] text-white" 
                            : "bg-gray-100 text-gray-500 group-hover:bg-[#7765DA] group-hover:text-white"
                          }
                        `}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        
                        <div className="flex-1">
                          <span className={`text-lg font-medium transition-colors ${isSelected ? "text-[#7765DA]" : "text-gray-700"}`}>
                            {option.text}
                          </span>
                        </div>
                      </div>
                      
                      {/* Percentage Display */}
                      {results && (
                        <span className="font-bold text-[#7765DA] ml-4 text-lg tabular-nums">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                      
                      {/* Checkmark for selected */}
                      {isSelected && !results && (
                        <CheckCircle2 className="w-6 h-6 text-[#7765DA] ml-4 animate-in zoom-in spin-in-12" />
                      )}
                    </div>
                  </button>
                )
              })}

              {hasVoted && (
                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Answer submitted. Waiting for next question...
                </div>
              )}

              {isFinished && !hasVoted && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-700 text-sm font-medium text-center">
                  Poll closed. You did not vote on this question.
                </div>
              )}
            </CardContent>
          </Card>

          {isFinished && (
            <div className="text-center py-8 text-gray-500 font-medium">
              Wait for the teacher to ask a new question...
            </div>
          )}
        </div>

        {/* Sidebar - Poll Info */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg shadow-gray-200/50 h-full rounded-2xl bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-gray-900">Your Session</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name</div>
                <div className="text-xl font-bold text-gray-900">{studentName}</div>
              </div>
              
              {results && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Responses</div>
                  <div className="text-3xl font-bold text-[#7765DA]">{results.totalVotes}</div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</div>
                <div className={`flex items-center gap-2 font-medium ${connected ? "text-green-600" : "text-red-600"}`}>
                  <span className="relative flex h-3 w-3">
                    {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? "bg-green-500" : "bg-red-500"}`}></span>
                  </span>
                  {connected ? "Live Connected" : "Disconnected"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
