"use client"

import { Button } from "@/components/ui/button"

import Image from "next/image"

interface KickedOutProps {
  onRetry: () => void
}

export function KickedOut({ onRetry }: KickedOutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Gradient Badge */}
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-semibold shadow-sm" 
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
        
        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            You've been Kicked out!
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Looks like the teacher has removed you from the poll system. Please try again later.
          </p>
        </div>
        
        {/* Gradient Try Again Button */}
        <Button 
          onClick={onRetry} 
          className="w-full max-w-xs text-white text-lg h-[58px] rounded-[34px] shadow-lg shadow-[#8F64E1]/20 hover:opacity-90 hover:shadow-xl transition-all"
          style={{ background: 'linear-gradient(to right, #8F64E1, #1D68BD)' }}
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
