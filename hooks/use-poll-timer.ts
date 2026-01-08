"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface IUsePollTimerProps {
  timeLimit: number
  startedAt: number
  onTimeEnd?: () => void
  onTick?: (remaining: number) => void
}

export const usePollTimer = ({ timeLimit, startedAt, onTimeEnd, onTick }: IUsePollTimerProps) => {
  const [remainingTime, setRemainingTime] = useState<number>(timeLimit)
  const [isFinished, setIsFinished] = useState(false)
  const [isWarning, setIsWarning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(0, timeLimit - elapsedSeconds)

      setRemainingTime(remaining)
      onTick?.(remaining)

      // Warn when 10 seconds or less
      if (remaining <= 10 && remaining > 0) {
        setIsWarning(true)
      } else {
        setIsWarning(false)
      }

      if (remaining === 0) {
        setIsFinished(true)
        onTimeEnd?.()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timeLimit, startedAt, onTimeEnd, onTick])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }, [])

  const resetTimer = useCallback(
    (newStartTime: number) => {
      const elapsedSeconds = Math.floor((Date.now() - newStartTime) / 1000)
      const remaining = Math.max(0, timeLimit - elapsedSeconds)
      setRemainingTime(remaining)
      setIsFinished(false)
      setIsWarning(false)
    },
    [timeLimit],
  )

  return {
    remainingTime,
    isFinished,
    isWarning,
    formattedTime: formatTime(remainingTime),
    resetTimer,
    percentage: Math.round((remainingTime / timeLimit) * 100),
  }
}
