"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { ArrowLeft, BarChart3, Calendar, Users } from "lucide-react"

interface PollHistoryItem {
  id: string
  question: string
  createdAt: string
  totalVotes: number
  options: Array<{
    id: string
    text: string
    correct: boolean
    voteCount: number
    percentage: number
  }>
}

interface PollHistoryProps {
  teacherId: string
  onBack: () => void
}

export function PollHistory({ teacherId, onBack }: PollHistoryProps) {
  const [polls, setPolls] = useState<PollHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [teacherId])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/polls/history?teacherId=${teacherId}`)
      if (response.ok) {
        const data = await response.json()
        setPolls(data)
      } else {
        toast.error("Failed to fetch history")
      }
    } catch (error) {
      console.error("Error fetching history:", error)
      toast.error("Error fetching poll history")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-6 pl-0 hover:bg-transparent text-gray-500 hover:text-[#7765DA] transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold mb-3" 
                style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
              >
                <BarChart3 className="w-4 h-4" />
                Poll Archive
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Previous Polls</h1>
              <p className="text-gray-500 mt-1">Review results from your past sessions</p>
            </div>
            
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
               <div className="bg-purple-50 p-2 rounded-full text-[#7765DA]">
                 <BarChart3 className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs text-gray-500 font-semibold uppercase">Total Polls</p>
                 <p className="text-xl font-bold text-gray-900">{polls.length}</p>
               </div>
            </div>
          </div>
        </div>

        {polls.length === 0 ? (
          <Card className="border-0 shadow-lg shadow-gray-200/50 py-16">
            <CardContent className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No polls yet</h3>
              <p className="text-gray-500">Your completed polls will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <Card key={poll.id} className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-white border-b border-gray-50 pb-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <CardTitle className="text-xl font-medium text-gray-800 leading-relaxed">
                      {poll.question}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                        <Calendar className="w-4 h-4 text-[#7765DA]" />
                        {new Date(poll.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                        <Users className="w-4 h-4 text-[#7765DA]" />
                        {poll.totalVotes} votes
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4">
                    {poll.options.map((option, idx) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-400 w-4">{String.fromCharCode(65 + idx)}</span>
                            <span className="font-medium text-gray-700">{option.text}</span>
                          </div>
                          <span className="font-bold text-[#7765DA]">
                            {option.percentage.toFixed(0)}% <span className="text-gray-400 font-normal text-xs ml-1">({option.voteCount})</span>
                          </span>
                        </div>
                        
                        {/* Gradient Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.max(option.percentage, 2)}%`,
                              background: 'linear-gradient(to right, #8F64E1, #1D68BD)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}