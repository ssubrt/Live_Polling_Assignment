"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import Image from "next/image"

interface TeacherOnboardingProps {
  onComplete: (name: string) => void
}

export function TeacherOnboarding({ onComplete }: TeacherOnboardingProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (name.length > 50) {
      toast.error("Name is too long")
      return
    }

    setLoading(true)
    onComplete(name)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* Gradient Badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold mb-4" 
            style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
          >
            <Image 
              src="/Vector.svg" 
              alt="Intervue Poll Icon" 
              height={15} 
              width={15} 
              className="h-[15px] w-[15px]" 
            />
            Intervue Poll
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Let's Get Started</h1>
          <p className="text-gray-500">
            You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in
            real-time.
          </p>
        </div>

        <Card className="border-0 shadow-lg shadow-gray-200/50">
          <CardHeader>
            <CardTitle className="text-xl">Enter your Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Styled Input */}
            <Input
              placeholder="e.g. Rahul Bajaj"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              maxLength={50}
              className="h-[50px] text-lg bg-gray-50 border-gray-200 focus:border-[#8F64E1] focus:ring-[#8F64E1]/20 rounded-xl transition-all"
            />
            
            {/* Gradient Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="w-full text-white text-lg h-[58px] rounded-[34px] shadow-lg shadow-[#8F64E1]/20 hover:opacity-90 hover:shadow-xl cursor-pointer transition-all"
              style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
