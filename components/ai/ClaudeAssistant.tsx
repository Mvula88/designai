'use client'

import { useState } from 'react'
import { interpretDesignCommand } from '@/lib/anthropic/commands'
import { Loader2, Sparkles, Send, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

export function ClaudeAssistant({
  canvas,
  onCommand,
}: {
  canvas: any
  onCommand: (command: any) => void
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<
    Array<{ role: string; content: string }>
  >([])

  const handleCommand = async () => {
    if (!input.trim() || !canvas) return

    setLoading(true)
    const userMessage = input
    setInput('')

    setHistory((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      const canvasState = canvas.toJSON()
      const command = await interpretDesignCommand(
        userMessage,
        canvasState,
        null
      )

      onCommand(command)

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Applied: ${command.action}`,
        },
      ])
    } catch (error) {
      console.error('Command failed:', error)
      toast.error('Failed to execute command')
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Sorry, I couldn't understand that command. Try being more specific.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      label: 'Make it pop',
      command: 'Increase contrast and make colors more vibrant',
    },
    {
      label: 'More professional',
      command: 'Use corporate colors and clean typography',
    },
    { label: 'Add whitespace', command: 'Increase spacing between elements' },
    {
      label: 'Improve hierarchy',
      command: 'Make headings larger and body text smaller',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">Claude AI Assistant</h3>
        </div>

        {/* Chat History */}
        {history.length > 0 && (
          <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-2 text-sm ${
                  msg.role === 'user' ? 'ml-8 bg-blue-50' : 'mr-8 bg-gray-50'
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
            className="min-h-[100px] w-full resize-none rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={handleCommand}
            disabled={loading || !input.trim() || !canvas}
            className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claude is thinking...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Apply Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h4 className="mb-3 flex items-center gap-2 font-medium">
          <Wand2 className="h-4 w-4" />
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => setInput(action.command)}
              className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
