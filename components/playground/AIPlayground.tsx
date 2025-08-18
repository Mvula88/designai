'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  Code2,
  Database,
  Cloud,
  Github,
  Zap,
  AlertCircle,
  CheckCircle,
  Copy,
  RotateCw,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  files?: string[]
}

interface AIPlaygroundProps {
  onPromptSubmit: (prompt: string) => Promise<void>
  isGenerating: boolean
  promptHistory: any[]
  integrations: any[]
}

const EXAMPLE_PROMPTS = [
  {
    icon: Zap,
    title: 'Task Manager',
    prompt: 'Create a task management app with user authentication, teams, and real-time updates',
  },
  {
    icon: Database,
    title: 'E-commerce Store',
    prompt: 'Build an e-commerce platform with products, cart, checkout, and payment integration',
  },
  {
    icon: Cloud,
    title: 'SaaS Dashboard',
    prompt: 'Create a SaaS dashboard with analytics, user management, and subscription billing',
  },
  {
    icon: Github,
    title: 'Blog Platform',
    prompt: 'Build a blog platform with markdown support, comments, and social sharing',
  },
]

export default function AIPlayground({
  onPromptSubmit,
  isGenerating,
  promptHistory,
  integrations,
}: AIPlaygroundProps) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [showExamples, setShowExamples] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Convert prompt history to messages
    const historyMessages: Message[] = []
    promptHistory.forEach((item) => {
      historyMessages.push({
        role: 'user',
        content: item.prompt,
        timestamp: item.timestamp,
      })
      if (item.response) {
        historyMessages.push({
          role: 'assistant',
          content: item.response,
          timestamp: item.timestamp,
          files: item.files,
        })
      }
    })
    setMessages(historyMessages)
    setShowExamples(historyMessages.length === 0)
  }, [promptHistory])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, userMessage])
    setPrompt('')
    setShowExamples(false)

    await onPromptSubmit(prompt)
  }

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt)
    textareaRef.current?.focus()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const getIntegrationStatus = (service: string) => {
    const integration = integrations.find((i) => i.service_type === service)
    return integration?.status === 'connected'
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold text-white">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            {getIntegrationStatus('supabase') && (
              <div className="flex items-center gap-1 rounded-full bg-green-900/30 px-2 py-1">
                <Database className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">Supabase</span>
              </div>
            )}
            {getIntegrationStatus('github') && (
              <div className="flex items-center gap-1 rounded-full bg-gray-800 px-2 py-1">
                <Github className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">GitHub</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showExamples && messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center">
              <Wand2 className="mx-auto mb-4 h-12 w-12 text-purple-500" />
              <h3 className="mb-2 text-lg font-semibold text-white">
                Start with an example
              </h3>
              <p className="text-sm text-gray-400">
                Choose a template or describe your app idea
              </p>
            </div>
            <div className="grid gap-3">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.prompt)}
                  className="group flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3 text-left transition-all hover:border-purple-600 hover:bg-gray-800"
                >
                  <div className="rounded-lg bg-purple-600/10 p-2 group-hover:bg-purple-600/20">
                    <example.icon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-white">
                      {example.title}
                    </h4>
                    <p className="text-xs text-gray-400">{example.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    message.role === 'assistant'
                      ? 'bg-purple-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-lg px-4 py-3 ${
                    message.role === 'assistant'
                      ? 'bg-gray-900 text-gray-100'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <div className="prose prose-invert max-w-none">
                    {message.content}
                  </div>
                  {message.files && message.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-500">Generated files:</div>
                      {message.files.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between rounded bg-gray-800 px-2 py-1"
                        >
                          <span className="flex items-center gap-2 text-xs text-gray-300">
                            <Code2 className="h-3 w-3" />
                            {file}
                          </span>
                          <button
                            onClick={() => copyCode(file)}
                            className="text-gray-500 hover:text-gray-300"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 rounded-lg bg-gray-900 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-400">
                      Generating code...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Describe your app or ask for changes..."
            className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
            rows={3}
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center justify-center rounded-lg bg-purple-600 px-4 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-700"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
          {!getIntegrationStatus('supabase') && (
            <p className="flex items-center gap-1 text-xs text-yellow-500">
              <AlertCircle className="h-3 w-3" />
              Connect Supabase for database features
            </p>
          )}
        </div>
      </form>
    </div>
  )
}