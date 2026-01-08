"use client"

import { useSocket } from "@/hooks/use-socket"
import { WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

export function ConnectionStatus() {
  const { connected } = useSocket()
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (!connected) {
      setShowAlert(true)
    } else {
      setShowAlert(false)
    }
  }, [connected])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Reconnecting...</span>
    </div>
  )
}
