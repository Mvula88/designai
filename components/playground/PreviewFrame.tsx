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
  const [key, setKey] = useState(0)

  useEffect(() => {
    renderPreview()
  }, [code])

  const renderPreview = () => {
    setLoading(true)
    setError(null)
    
    try {
      if (iframeRef.current) {
        const htmlContent = generateHTMLFromCode(code)
        const iframe = iframeRef.current
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(htmlContent)
          iframeDoc.close()
        }
      }
    } catch (err) {
      setError('Failed to generate preview')
      console.error(err)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  const generateHTMLFromCode = (files: Record<string, string>) => {
    // Extract the main app content
    const appContent = files['app/page.tsx'] || files['pages/index.tsx'] || files['app/page.jsx'] || ''
    
    // Clean up the React code
    let cleanedCode = appContent
      // Remove export statements
      .replace(/export\s+default\s+function\s+\w+\s*\(\s*\)\s*{/, 'function App() {')
      .replace(/export\s+default\s+/, '')
      // Remove TypeScript types
      .replace(/:\s*\w+(\[\])?(?=\s*[,\)])/g, '') // Remove parameter types
      .replace(/:\s*{[^}]*}/g, '') // Remove object types
      .replace(/<(\w+)>/g, '') // Remove generic types
      .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type definitions
      // Clean 'use client' directive
      .replace(/['"]use client['"];?\s*/g, '')
      
    // If no valid component found, create a default one
    if (!cleanedCode.includes('function App') && !cleanedCode.includes('const App')) {
      cleanedCode = `
        function App() {
          return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="container mx-auto px-4 py-20">
                <h1 className="text-5xl font-bold text-center mb-4">
                  Welcome to Your App
                </h1>
                <p className="text-xl text-center text-gray-600">
                  Start building with AI assistance
                </p>
              </div>
            </div>
          )
        }
      `
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview - ${playgroundId}</title>
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          #root { min-height: 100vh; }
          .error-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom right, #f3f4f6, #e5e7eb);
          }
          .error-content {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            max-width: 500px;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          try {
            const { useState, useEffect, useRef } = React;
            
            // Inject common icon components
            const ChevronRight = () => '→';
            const Check = () => '✓';
            const Star = () => '⭐';
            const Heart = () => '❤️';
            const ShoppingCart = () => '🛒';
            const Search = () => '🔍';
            const Filter = () => '⚙️';
            const Plus = () => '+';
            const Minus = () => '-';
            const X = () => '✕';
            const ArrowRight = () => '→';
            const ArrowLeft = () => '←';
            const Menu = () => '☰';
            const User = () => '👤';
            const Home = () => '🏠';
            const Settings = () => '⚙️';
            const LogOut = () => '🚪';
            const TrendingUp = () => '📈';
            const TrendingDown = () => '📉';
            const DollarSign = () => '$';
            const Package = () => '📦';
            const Users = () => '👥';
            const BarChart = () => '📊';
            const Activity = () => '📈';
            const Calendar = () => '📅';
            const Mail = () => '✉️';
            const Bell = () => '🔔';
            
            ${cleanedCode}
            
            // Ensure App is defined
            if (typeof App === 'undefined') {
              function App() {
                return React.createElement('div', 
                  { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Preview Loading...'),
                    React.createElement('p', { className: 'mt-2 text-gray-600' }, 'Your app will appear here')
                  )
                );
              }
            }
            
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
          } catch (error) {
            console.error('Preview error:', error);
            document.getElementById('root').innerHTML = \`
              <div class="error-container">
                <div class="error-content">
                  <h2 style="color: #dc2626; margin-bottom: 1rem;">Preview Error</h2>
                  <p style="color: #6b7280; margin-bottom: 0.5rem;">Failed to render preview</p>
                  <p style="color: #9ca3af; font-size: 0.875rem;">\${error.message || 'Unknown error'}</p>
                </div>
              </div>
            \`;
          }
        </script>
      </body>
      </html>
    `
  }

  const refreshPreview = () => {
    setKey(prev => prev + 1)
    renderPreview()
  }

  const openInNewTab = () => {
    const htmlContent = generateHTMLFromCode(code)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
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
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={openInNewTab}
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
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
              <div className="text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Preview Error
                </h3>
                <p className="text-sm text-gray-600">{error}</p>
                <button
                  onClick={refreshPreview}
                  className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-hidden rounded-lg bg-white shadow-lg">
              <iframe
                key={key}
                ref={iframeRef}
                className="h-full w-full border-0"
                title="Preview"
                sandbox="allow-scripts"
                onLoad={() => setLoading(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}