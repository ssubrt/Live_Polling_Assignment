"use client"

import { useEffect, useState } from "react"
import type { IPoll } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { AlertCircle, MessageCircle, StopCircle, Users, X } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface TeacherPollViewProps {
  poll: IPoll
  teacherId: string
  onPollEnd: () => void
}

export function TeacherPollView({ poll, teacherId, onPollEnd }: TeacherPollViewProps) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [students, setStudents] = useState<any[]>([]);
  const { on, off, emit, connected } = useSocket()

useEffect(() => {
    fetchResults()
    
    // Handle participant list updates
    const handleParticipantsUpdate = (updatedStudents: any[]) => {
        // Filter only students (not teachers)
        const studentList = updatedStudents.filter((s: any) => s.role === "STUDENT")
        setStudents(studentList)
        console.log("[Teacher] Participants updated:", studentList.length)
    }

    const handleVoteUpdate = (data: any) => {
      console.log("[Teacher] Vote update received:", data)
      if (data.pollId === poll.id) {
        console.log("[Teacher] Vote updated for current poll, refreshing results")
        fetchResults()
      }
    }

    const handleResultsUpdate = (data: any) => {
      console.log("[Teacher] Results update received:", data)
      if (data.pollId === poll.id) {
        console.log("[Teacher] Results updated:", data.totalVotes, "votes")
        setResults(data)
      }
    }

    // Set up event listeners first
    on("vote:updated", handleVoteUpdate)
    on("results:updated", handleResultsUpdate)
    on("participants:update", handleParticipantsUpdate)

    // Join the poll room as teacher to receive updates
    if (connected) {
      console.log("[Teacher] Socket connected, joining poll room:", poll.id)
      emit("user:join", { 
          teacherId: teacherId,
          name: "Teacher", 
          role: "TEACHER", 
          pollId: poll.id 
      })
    } else {
      console.log("[Teacher] Socket not connected yet, waiting...")
    }

    return () => {
      off("vote:updated", handleVoteUpdate)
      off("results:updated", handleResultsUpdate)
      off("participants:update", handleParticipantsUpdate)
    }
  }, [poll.id, emit, teacherId, on, off, connected])
  

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/polls/${poll.id}/results`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setLoading(false)
      } else {
        throw new Error("Failed to fetch results")
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      setError("Failed to fetch live results")
    }
  }

  const handleKickStudent = async (studentId: string) => {
    try {
      emit("student:kick", { pollId: poll.id, studentId })
      toast.success("Student kicked out")
      // Participants list will update automatically via socket event
    } catch (error) {
      console.error("Error kicking student:", error)
      toast.error("Failed to kick student")
    }
  }

  const handleEndPoll = async () => {
    setEnding(true)
    try {
      const response = await fetch(`/api/polls/${poll.id}/end`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to end poll")
      }

      toast.success("Poll ended successfully")
      onPollEnd()
    } catch (error) {
      console.error("Error ending poll:", error)
      toast.error("Failed to end poll")
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header with Stats Badge */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-gray-900">Live Poll</h2>
         <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-gray-600 border border-gray-100 flex items-center gap-2">
            Total Responses: <span className="text-[#7765DA] font-bold text-lg">{results?.totalVotes || 0}</span>
         </div>
      </div>

      <Card className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50 pb-6 pt-8 px-8">
          <CardTitle className="text-2xl font-medium leading-relaxed text-gray-800">{poll.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-8 px-8 pb-8">
          <div className="space-y-5">
            {results?.options.map((option: any, idx: number) => (
              <div key={option.id} className="relative group">
                <div className="flex justify-between items-end mb-2 z-10 relative">
                  <div className="flex items-center gap-4">
                    {/* Circular Letter Badge */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#7765DA]/10 text-[#7765DA] font-bold text-sm shadow-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium text-lg text-gray-700">{option.text}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    <span className="text-xl">{option.percentage.toFixed(0)}%</span>
                    <span className="text-gray-400 font-normal ml-2 text-sm">({option.voteCount} votes)</span>
                  </span>
                </div>
                
                {/* Gradient Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                     className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                     style={{ 
                       width: `${Math.max(option.percentage, 2)}%`, // Always show at least a tiny sliver
                       background: 'linear-gradient(to right, #8F64E1, #1D68BD)'
                     }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 mt-4 border-t border-gray-50">
            <Button
              onClick={handleEndPoll}
              disabled={ending}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 h-[58px] rounded-[34px] font-semibold text-lg transition-all shadow-sm hover:shadow-md"
            >
              {ending ? "Ending Poll..." : "End Poll"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Button (Participants) */}
      <button
        onClick={() => setShowParticipants(!showParticipants)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 text-white hover:scale-105 hover:shadow-purple-500/20"
        style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
      >
        {showParticipants ? <X className="w-8 h-8" /> : <Users className="w-8 h-8" />}
      </button>

      {/* Participants Panel */}
      {showParticipants && (
        <div className="fixed bottom-28 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="p-5 bg-gray-50/80 border-b border-gray-100 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 text-lg">Active Participants</h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {students.length} student{students.length !== 1 ? 's' : ''} online
            </p>
          </div>
          <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
                  <Users className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Waiting for students to join...</p>
                </div>
            ) : (
                <div className="space-y-1">
                  {students.map((student) => (
                  <div key={student.studentId || student.id} className="flex items-center justify-between p-3 hover:bg-purple-50 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-50 text-[#7765DA] flex items-center justify-center font-bold text-sm shadow-inner">
                              {(student.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{student.name || "Anonymous"}</div>
                            <div className="text-xs text-gray-500">Student</div>
                          </div>
                      </div>
                      <Button
                        onClick={() => handleKickStudent(student.studentId)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                        title="Remove student"
                      >
                        <StopCircle className="w-4 h-4 mr-1" />
                        Kick
                      </Button>
                  </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
