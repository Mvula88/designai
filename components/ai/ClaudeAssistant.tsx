'use client'

import { useState } from 'react'
import { interpretDesignCommand } from '@/lib/anthropic/commands'
import { Loader2, Sparkles, Send, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

export function ClaudeAssistant({ 
  canvas, 
  onCommand 
}: { 
  canvas: fabric.Canvas | null
  onCommand: (command: any) => void 
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Array<{role: string, content: string}>>([])

  const handleCommand = async () => {
    if (!input.trim() || !canvas) return

    setLoading(true)
    const userMessage = input
    setInput('')
    
    setHistory(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const canvasState = canvas.toJSON()
      const command = await interpretDesignCommand(
        userMessage,
        canvasState,
        null
      )

      onCommand(command)

      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Applied: ${command.action}` 
      }])

    } catch (error) {
      console.error('Command failed:', error)
      toast.error('Failed to execute command')
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I couldn\'t understand that command. Try being more specific.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'Make it pop', command: 'Increase contrast and make colors more vibrant' },
    { label: 'More professional', command: 'Use corporate colors and clean typography' },
    { label: 'Add whitespace', command: 'Increase spacing between elements' },
    { label: 'Improve hierarchy', command: 'Make headings larger and body text smaller' }
  ]

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Claude AI Assistant</h3>
        </div>

        {/* Chat History */}
        {history.length > 0 && (
          <div className="mb-4 space-y-2 max-h-64 overflow-y-auto">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-50 ml-8' 
                    : 'bg-gray-50 mr-8'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}

        {/* Command Input */}
        <div className="space-y-2">
          <textarea
            placeholder="Describe what you want to change... (e.g., 'make the headline bigger')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleCommand()
              }
            }}
            className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button 
            onClick={handleCommand}
            disabled={loading || !input.trim() || !canvas}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claude is thinking...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Apply Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => setInput(action.command)}
              className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}