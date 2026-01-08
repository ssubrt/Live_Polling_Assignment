"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus } from "lucide-react"
import toast from "react-hot-toast"
import Image from "next/image"

interface CreatePollFormProps {
  teacherId: string
  onPollCreated: (pollId: string) => void
  isLoading?: boolean
}

interface PollOption {
  id: string
  text: string
  correct: boolean
}

export function CreatePollForm({ teacherId, onPollCreated, isLoading }: CreatePollFormProps) {
  const [question, setQuestion] = useState("")
  const [timeLimit, setTimeLimit] = useState(60)
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "", correct: false },
    { id: "2", text: "", correct: false },
  ])
  const [submitting, setSubmitting] = useState(false)

  const addOption = () => {
    setOptions([...options, { id: String(Date.now()), text: "", correct: false }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required")
      return
    }
    setOptions(options.filter((opt) => opt.id !== id))
  }

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)))
  }

  const toggleCorrect = (id: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, correct: !opt.correct } : opt)))
  }

  const handleSubmit = async () => {
    // Validation
    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    if(question.length < 5){
      toast.error("Question is too short enter at least 5 characters")
      return
    }

    const validOptions = options.filter((opt) => opt.text.trim())
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options")
      return
    }

    if (timeLimit < 10 || timeLimit > 300) {
      toast.error("Time limit must be between 10 and 300 seconds")
      return
    }

    const hasCorrectAnswer = options.some((opt) => opt.correct)
    if (!hasCorrectAnswer) {
      toast.error("Please mark at least one option as correct")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          question,
          options: validOptions.map((opt) => opt.text),
          correctAnswers: validOptions.map((opt) => opt.correct),
          timeLimit,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create poll")
      }

      const poll = await response.json()
      toast.success("Poll created successfully!")
      onPollCreated(poll.id)
    } catch (error) {
      console.error("Error creating poll:", error)
      toast.error("Failed to create poll")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold mb-4" 
          style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
        >
          <Image src="/Vector.svg" alt="Intervue Poll Icon" height={15} width={15} className="h-[15px] w-[15px]" />
          Intervue Poll
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Let's Get Started</h1>
      </div>

      <Card className="border-0 shadow-lg shadow-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl">Enter your question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Input */}
          <Input 
            placeholder="e.g. What is the capital of France?" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            className="h-[50px] text-lg bg-gray-50 border-gray-200 focus:border-[#8F64E1] focus:ring-[#8F64E1]/20 rounded-xl transition-all"
          />

          {/* Time Limit Selector */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-transparent hover:border-gray-200 transition-colors">
            <label className="text-sm font-medium text-gray-700">Time Limit</label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-hidden focus:border-[#8F64E1] cursor-pointer hover:border-[#8F64E1]"
            >
              {[10, 15, 20, 30, 45, 60, 90, 120, 180, 300].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} seconds
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Options</h3>
            {options.map((option, idx) => (
              <div key={option.id} className="flex items-center gap-3 group">
                {/* Option Input Container */}
                <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-transparent focus-within:border-[#8F64E1]/50 focus-within:bg-white focus-within:shadow-xs transition-all">
                  {/* Circular Letter Badge */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#7765DA] font-bold text-sm shadow-sm group-focus-within:bg-[#7765DA] group-focus-within:text-white transition-colors">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    className="border-0 bg-transparent h-10 p-0 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 text-lg"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                   <Checkbox
                    checked={option.correct}
                    onCheckedChange={() => toggleCorrect(option.id)}
                    className="data-[state=checked]:bg-[#7765DA] data-[state=checked]:border-[#7765DA] w-6 h-6 border-gray-300 rounded-md transition-all"
                    title="Mark as correct"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Dashed Add Button */}
            <Button
              variant="outline"
              onClick={addOption}
              className="w-full h-[50px] border-dashed border-2 border-gray-200 text-gray-500 hover:border-[#7765DA] hover:text-[#7765DA] hover:bg-[#7765DA]/5 rounded-xl transition-all font-medium mt-2"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Option
            </Button>
          </div>

          {/* Gradient Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || isLoading}
            className="w-full text-white text-lg h-[58px] rounded-[34px] shadow-lg shadow-[#8F64E1]/20 hover:opacity-90 hover:shadow-xl transition-all mt-4"
            style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
          >
            {submitting ? "Creating..." : "Ask Question"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

