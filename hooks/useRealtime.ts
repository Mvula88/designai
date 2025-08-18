import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Cursor {
  userId: string
  x: number
  y: number
  userName?: string
  color?: string
}

interface CollaboratorPresence {
  userId: string
  userName: string
  cursor?: Cursor
  selectedObjects?: string[]
  isActive: boolean
  lastSeen: Date
}

export function useRealtime(designId: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [collaborators, setCollaborators] = useState<Map<string, CollaboratorPresence>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!designId) return

    // Create a channel for this design
    const designChannel = supabase.channel(`design:${designId}`, {
      config: {
        presence: {
          key: 'userId',
        },
      },
    })

    // Track presence
    designChannel
      .on('presence', { event: 'sync' }, () => {
        const state = designChannel.presenceState()
        const collaboratorsMap = new Map<string, CollaboratorPresence>()
        
        Object.keys(state).forEach((key) => {
          const presence = state[key][0] as any
          if (presence) {
            collaboratorsMap.set(key, {
              userId: presence.userId,
              userName: presence.userName || 'Anonymous',
              cursor: presence.cursor,
              selectedObjects: presence.selectedObjects,
              isActive: true,
              lastSeen: new Date(),
            })
          }
        })
        
        setCollaborators(collaboratorsMap)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0] as any
        setCollaborators((prev) => {
          const updated = new Map(prev)
          updated.set(key, {
            userId: presence.userId,
            userName: presence.userName || 'Anonymous',
            cursor: presence.cursor,
            selectedObjects: presence.selectedObjects,
            isActive: true,
            lastSeen: new Date(),
          })
          return updated
        })
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCollaborators((prev) => {
          const updated = new Map(prev)
          updated.delete(key)
          return updated
        })
      })

    // Canvas change events
    designChannel
      .on('broadcast', { event: 'canvas-change' }, ({ payload }) => {
        handleCanvasChange(payload)
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        handleCursorMove(payload)
      })
      .on('broadcast', { event: 'object-select' }, ({ payload }) => {
        handleObjectSelect(payload)
      })

    // Subscribe to the channel
    designChannel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED')
      if (status === 'SUBSCRIBED') {
        // Send initial presence
        const user = supabase.auth.getUser()
        user.then(({ data }) => {
          if (data.user) {
            designChannel.track({
              userId: data.user.id,
              userName: data.user.email?.split('@')[0] || 'User',
              online_at: new Date().toISOString(),
            })
          }
        })
      }
    })

    setChannel(designChannel)

    // Cleanup
    return () => {
      designChannel.unsubscribe()
    }
  }, [designId])

  // Broadcast canvas changes
  const broadcastCanvasChange = useCallback((change: any) => {
    if (!channel) return

    channel.send({
      type: 'broadcast',
      event: 'canvas-change',
      payload: change,
    })
  }, [channel])

  // Broadcast cursor position
  const broadcastCursor = useCallback((cursor: Cursor) => {
    if (!channel) return

    channel.send({
      type: 'broadcast',
      event: 'cursor-move',
      payload: cursor,
    })

    // Update own presence
    channel.track({
      cursor,
    })
  }, [channel])

  // Broadcast object selection
  const broadcastSelection = useCallback((selectedObjects: string[]) => {
    if (!channel) return

    channel.send({
      type: 'broadcast',
      event: 'object-select',
      payload: { selectedObjects },
    })

    // Update own presence
    channel.track({
      selectedObjects,
    })
  }, [channel])

  // Handlers for incoming events
  const handleCanvasChange = (payload: any) => {
    // This will be handled by the canvas component
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('realtime:canvas-change', { detail: payload }))
    }
  }

  const handleCursorMove = (payload: Cursor) => {
    setCollaborators((prev) => {
      const updated = new Map(prev)
      const existing = updated.get(payload.userId)
      if (existing) {
        updated.set(payload.userId, {
          ...existing,
          cursor: payload,
          lastSeen: new Date(),
        })
      }
      return updated
    })
  }

  const handleObjectSelect = (payload: { userId: string; selectedObjects: string[] }) => {
    setCollaborators((prev) => {
      const updated = new Map(prev)
      const existing = updated.get(payload.userId)
      if (existing) {
        updated.set(payload.userId, {
          ...existing,
          selectedObjects: payload.selectedObjects,
          lastSeen: new Date(),
        })
      }
      return updated
    })
  }

  return {
    isConnected,
    collaborators: Array.from(collaborators.values()),
    broadcastCanvasChange,
    broadcastCursor,
    broadcastSelection,
  }
}