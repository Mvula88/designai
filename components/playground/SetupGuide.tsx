'use client'

import { useState } from 'react'
import {
  Github,
  Cloud,
  Key,
  Copy,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface SetupGuideProps {
  onClose: () => void
}

export default function SetupGuide({ onClose }: SetupGuideProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'github' | 'vercel' | 'netlify'>(
    'github'
  )

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(item)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Setup Integration Guide
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'github'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Github className="h-4 w-4" />
            GitHub
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'vercel'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cloud className="h-4 w-4" />
            Vercel
          </button>
          <button
            onClick={() => setActiveTab('netlify')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'netlify'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cloud className="h-4 w-4" />
            Netlify
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {activeTab === 'github' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  GitHub integration allows you to push your code to
                  repositories and manage version control.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Setup Steps:</h3>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Go to GitHub Developer Settings
                      </p>
                      <a
                        href="https://github.com/settings/developers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        Open GitHub Settings
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Create New OAuth App
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Click "OAuth Apps" → "New OAuth App"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Fill in Application Details
                      </p>
                      <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Application Name
                          </p>
                          <p className="text-sm text-gray-900">
                            DesignOS Playground
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Homepage URL
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-gray-900">
                              {currentUrl}
                            </code>
                            <button
                              onClick={() =>
                                copyToClipboard(currentUrl, 'homepage')
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedItem === 'homepage' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Authorization Callback URL
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-gray-900">
                              {currentUrl}/api/auth/github/callback
                            </code>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${currentUrl}/api/auth/github/callback`,
                                  'callback'
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedItem === 'callback' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      4
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Save Your Credentials
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Copy the Client ID and generate a Client Secret. Add
                        them to your{' '}
                        <code className="rounded bg-gray-100 px-1">
                          .env.local
                        </code>{' '}
                        file:
                      </p>
                      <div className="mt-2 rounded-lg bg-gray-900 p-3">
                        <pre className="text-xs text-gray-300">
                          {`GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  Vercel integration enables instant deployment of your
                  applications with automatic SSL and global CDN.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Setup Steps:</h3>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Go to Vercel Dashboard
                      </p>
                      <a
                        href="https://vercel.com/account/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        Open Vercel Tokens
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Create Access Token
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Click "Create Token" and name it "DesignOS Playground"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Add to Environment Variables
                      </p>
                      <div className="mt-2 rounded-lg bg-gray-900 p-3">
                        <pre className="text-xs text-gray-300">
                          {`VERCEL_API_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=optional_team_id`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'netlify' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  Netlify integration provides continuous deployment with
                  built-in forms, functions, and more.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Setup Steps:</h3>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Go to Netlify User Settings
                      </p>
                      <a
                        href="https://app.netlify.com/user/applications"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        Open Netlify Applications
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Create Personal Access Token
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Click "New access token" and describe it as "DesignOS
                        Playground"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-600">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Add to Environment Variables
                      </p>
                      <div className="mt-2 rounded-lg bg-gray-900 p-3">
                        <pre className="text-xs text-gray-300">
                          {`NETLIFY_API_TOKEN=your_netlify_token_here`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Need help? Check our{' '}
              <a href="#" className="text-purple-600 hover:text-purple-700">
                documentation
              </a>
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
