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
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Generate preview URL
    const generatePreview = async () => {
      setLoading(true)
      setError(null)

      try {
        // In production, this would compile and serve the code
        // For now, we'll use a sandboxed iframe with srcdoc
        const htmlContent = generateHTMLFromCode(code)
        setPreviewUrl(
          `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
        )
      } catch (err) {
        setError('Failed to generate preview')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    generatePreview()
  }, [code, playgroundId])

  const generateHTMLFromCode = (files: Record<string, string>) => {
    // Extract the main app content
    const appContent =
      files['app/page.tsx'] || files['pages/index.tsx'] || files['index.html']

    // If it's React/Next.js code, create a basic HTML wrapper
    if (
      appContent &&
      (appContent.includes('export default') || appContent.includes('return ('))
    ) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
            #root { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            const { useState, useEffect } = React;
            
            ${transformReactCode(appContent)}
            
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
          </script>
        </body>
        </html>
      `
    }

    // If it's plain HTML, return as is
    if (files['index.html']) {
      return files['index.html']
    }

    // Default fallback
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Preview</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">No preview available</h1>
          <p class="mt-2 text-gray-600">Start building your app to see it here</p>
        </div>
      </body>
      </html>
    `
  }

  const transformReactCode = (code: string) => {
    // Transform the export default function to a usable component
    let transformed = code
      .replace(/export\s+default\s+function\s+\w+\s*\(\s*\)/, 'function App()')
      .replace(/export\s+default\s+/, '')

    // Handle TypeScript types (remove them for preview)
    transformed = transformed
      .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
      .replace(/<(\w+)>/g, '') // Remove generic types

    return transformed
  }

  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl
    }
  }

  const openInNewTab = () => {
    // In production, this would open the actual preview URL
    window.open(previewUrl, '_blank')
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
                ref={iframeRef}
                src={previewUrl}
                className="h-full w-full"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={() => setLoading(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
