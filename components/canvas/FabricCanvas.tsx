'use client'

import { useEffect, useRef } from 'react'

interface FabricCanvasProps {
  onCanvasReady?: (canvas: any) => void
}

export default function FabricCanvas({ onCanvasReady }: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      // Canvas initialization is handled by parent
      onCanvasReady(canvasRef.current)
    }
  }, [onCanvasReady])

  return <canvas ref={canvasRef} />
}