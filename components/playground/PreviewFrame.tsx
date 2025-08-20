'use client'

import { useState, useEffect, useRef } from 'react'
import {
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Loader2,
  Globe,
} from 'lucide-react'

interface PreviewFrameProps {
  code: Record<string, string>
  device: 'desktop' | 'tablet' | 'mobile'
  playgroundId: string
}

export default function PreviewFrame({
  code,
  device,
  playgroundId,
}: PreviewFrameProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeReady, setIframeReady] = useState(false)

  useEffect(() => {
    if (iframeReady && iframeRef.current) {
      renderPreview()
    }
  }, [code, iframeReady])

  const handleIframeLoad = () => {
    setIframeReady(true)
    setLoading(false)
  }

  const renderPreview = () => {
    if (!iframeRef.current) return
    
    setError(null)
    
    try {
      const htmlContent = generateHTMLFromCode(code)
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(htmlContent)
        iframeDoc.close()
      }
    } catch (err) {
      console.error('Preview render error:', err)
      setError('Failed to render preview. Please check your code.')
    }
  }

  const generateHTMLFromCode = (files: Record<string, string>) => {
    // Extract the main app content
    const appContent = files['app/page.tsx'] || files['pages/index.tsx'] || files['app/page.jsx'] || files['index.jsx'] || ''
    
    // If empty or no code, show welcome message
    if (!appContent || appContent.trim() === '') {
      return getDefaultHTML()
    }
    
    // Clean up the React code
    let cleanedCode = appContent
      // Remove 'use client' directive
      .replace(/^['"]use client['"];?\s*/gm, '')
      // Remove export statements
      .replace(/export\s+default\s+function\s+\w+\s*\(\s*\)\s*{/, 'function App() {')
      .replace(/export\s+default\s+/, '')
      // Basic TypeScript cleanup (remove simple type annotations)
      .replace(/:\s*(string|number|boolean|any|void|null|undefined)(\[\])?/g, '')
      .replace(/:\s*React\.\w+/g, '')
      // Keep the code as-is for complex types (they'll error but show in console)
      
    // Ensure we have an App component
    if (!cleanedCode.includes('function App') && !cleanedCode.includes('const App')) {
      // Wrap the existing code in an App component
      if (cleanedCode.includes('return')) {
        cleanedCode = `function App() { ${cleanedCode} }`
      } else {
        return getDefaultHTML()
      }
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          #root { min-height: 100vh; }
          .loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div id="root">
          <div class="loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
        <script type="text/babel" data-type="module">
          // Wait for React to be available
          if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center;">Loading React...</div>';
          } else {
            try {
              const { useState, useEffect, useRef, useMemo, useCallback } = React;
              
              // Mock Lucide React icons with Unicode/Emoji
              const ChevronRight = () => '›';
              const ChevronLeft = () => '‹';
              const Check = () => '✓';
              const X = () => '✕';
              const Star = () => '★';
              const Heart = () => '♥';
              const ShoppingCart = () => '🛒';
              const Search = () => '🔍';
              const Filter = () => '☰';
              const Plus = () => '+';
              const Minus = () => '−';
              const ArrowRight = () => '→';
              const ArrowLeft = () => '←';
              const Menu = () => '☰';
              const User = () => '👤';
              const Home = () => '🏠';
              const Settings = () => '⚙';
              const LogOut = () => '↪';
              const TrendingUp = () => '📈';
              const TrendingDown = () => '📉';
              const DollarSign = () => '$';
              const Package = () => '📦';
              const Users = () => '👥';
              const BarChart = () => '📊';
              const Activity = () => '📈';
              const Calendar = () => '📅';
              const Mail = () => '✉';
              const Bell = () => '🔔';
              const Sparkles = () => '✨';
              const Code2 = () => '</>';
              const Zap = () => '⚡';
              const Globe = () => '🌍';
              const Lock = () => '🔒';
              const Unlock = () => '🔓';
              const Eye = () => '👁';
              const EyeOff = () => '👁‍🗨';
              const Download = () => '⬇';
              const Upload = () => '⬆';
              const Trash = () => '🗑';
              const Edit = () => '✏';
              const Copy = () => '📋';
              const ExternalLink = () => '🔗';
              const Info = () => 'ℹ';
              const AlertCircle = () => '⚠';
              const CheckCircle = () => '✅';
              const XCircle = () => '❌';
              const Loader2 = () => '⟳';
              
              ${cleanedCode}
              
              // Render the app
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(App));
              
            } catch (error) {
              console.error('Render error:', error);
              document.getElementById('root').innerHTML = \`
                <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6;">
                  <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px;">
                    <h2 style="color: #ef4444; margin-bottom: 1rem; font-size: 1.5rem;">Preview Error</h2>
                    <p style="color: #6b7280; margin-bottom: 0.5rem;">There was an error rendering your component.</p>
                    <pre style="background: #f9fafb; padding: 1rem; border-radius: 4px; text-align: left; overflow-x: auto; font-size: 0.875rem; color: #374151; margin-top: 1rem;">\${error.message}</pre>
                    <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 1rem;">Check the browser console for more details.</p>
                  </div>
                </div>
              \`;
            }
          }
        </script>
      </body>
      </html>
    `
  }

  const getDefaultHTML = () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
          <div class="text-center px-4">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Playground</h1>
            <p class="text-xl text-gray-600 mb-8">Start coding to see your app come to life!</p>
            <div class="flex gap-4 justify-center">
              <div class="bg-white rounded-lg shadow-md p-4">
                <div class="text-3xl mb-2">⚡</div>
                <div class="text-sm font-semibold text-gray-700">Fast Refresh</div>
              </div>
              <div class="bg-white rounded-lg shadow-md p-4">
                <div class="text-3xl mb-2">🎨</div>
                <div class="text-sm font-semibold text-gray-700">Tailwind CSS</div>
              </div>
              <div class="bg-white rounded-lg shadow-md p-4">
                <div class="text-3xl mb-2">⚛️</div>
                <div class="text-sm font-semibold text-gray-700">React 18</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const refreshPreview = () => {
    setIframeReady(false)
    setLoading(true)
    // Force iframe to reload by changing its key
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank'
      setTimeout(() => {
        setIframeReady(true)
        renderPreview()
      }, 100)
    }
  }

  const openInNewTab = () => {
    const htmlContent = generateHTMLFromCode(code)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-[375px] mx-auto'
      case 'tablet':
        return 'max-w-[768px] mx-auto'
      default:
        return 'w-full'
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Live Preview</span>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPreview}
            className="rounded p-1 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={openInNewTab}
            className="rounded p-1 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-gray-100 p-4">
        <div className={`h-full ${getDeviceStyles()}`}>
          {error ? (
            <div className="flex h-full items-center justify-center rounded-lg bg-white shadow-lg">
              <div className="text-center p-6">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Preview Error
                </h3>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={refreshPreview}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-hidden rounded-lg bg-white shadow-lg">
              <iframe
                ref={iframeRef}
                src="about:blank"
                className="h-full w-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
                onLoad={handleIframeLoad}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}