"use client"

import { useEffect, useCallback, useState, useSyncExternalStore } from "react"
import io, { type Socket } from "socket.io-client"
import type { ISocketEvents } from "@/lib/types"

// Singleton socket instance - shared across all components
let sharedSocket: Socket | null = null
let connectionListeners: Set<(connected: boolean) => void> = new Set()
let isConnected = false

function getOrCreateSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    })

    sharedSocket.on("connect", () => {
      isConnected = true
      console.log("[Socket.io] Connected:", sharedSocket?.id)
      connectionListeners.forEach(listener => listener(true))
    })

    sharedSocket.on("disconnect", () => {
      isConnected = false
      console.log("[Socket.io] Disconnected")
      connectionListeners.forEach(listener => listener(false))
    })

    sharedSocket.on("connect_error", (error: Error) => {
      console.error("[Socket.io] Connection error:", error.message)
    })

    sharedSocket.on("error", (data: any) => {
      console.error("[Socket.io] Error:", data.message)
    })
  }
  return sharedSocket
}

function subscribeToConnection(callback: (connected: boolean) => void) {
  connectionListeners.add(callback)
  return () => {
    connectionListeners.delete(callback)
  }
}

function getConnectionSnapshot() {
  return isConnected
}

interface UseSocketOptions {
  autoConnect?: boolean
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true } = options
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Initialize socket on mount
  useEffect(() => {
    if (!autoConnect) return
    
    const socket = getOrCreateSocket()
    
    // Set initial connected state
    setConnected(socket.connected)
    
    // Subscribe to connection changes
    const unsubscribe = subscribeToConnection((isConnected) => {
      setConnected(isConnected)
    })

    return unsubscribe
  }, [autoConnect])

  const emit = useCallback((event: keyof ISocketEvents, data: any) => {
    const socket = getOrCreateSocket()
    if (socket.connected) {
      socket.emit(event, data)
    } else {
      console.warn(`[Socket.io] Not connected. Cannot emit: ${String(event)}`)
    }
  }, [])

  const on = useCallback((event: keyof ISocketEvents, callback: (data: any) => void) => {
    const socket = getOrCreateSocket()
    socket.on(event, callback)
  }, [])

  const off = useCallback((event: keyof ISocketEvents, callback?: (data: any) => void) => {
    const socket = getOrCreateSocket()
    socket.off(event, callback)
  }, [])

  const once = useCallback((event: keyof ISocketEvents, callback: (data: any) => void) => {
    const socket = getOrCreateSocket()
    socket.once(event, callback)
  }, [])

  return {
    socket: sharedSocket,
    connected,
    error,
    emit,
    on,
    off,
    once,
  }
}
