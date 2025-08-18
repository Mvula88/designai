'use client'

import { useState } from 'react'
import {
  Database,
  Github,
  Cloud,
  Key,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Settings,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Integration {
  id: string
  service_type: string
  status: string
  config: any
}

interface IntegrationsPanelProps {
  playgroundId: string
  integrations: Integration[]
  onIntegrationsChange: () => void
}

const SERVICES = [
  {
    id: 'supabase',
    name: 'Supabase',
    icon: Database,
    description: 'Database, Auth, Storage',
    color: 'green',
    configFields: [
      {
        name: 'project_url',
        label: 'Project URL',
        type: 'text',
        placeholder: 'https://xxx.supabase.co',
      },
      {
        name: 'anon_key',
        label: 'Anon Key',
        type: 'password',
        placeholder: 'eyJhbGci...',
      },
      {
        name: 'service_key',
        label: 'Service Key (optional)',
        type: 'password',
        placeholder: 'eyJhbGci...',
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    description: 'Version control & deployment',
    color: 'gray',
    oauth: true,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: Cloud,
    description: 'Instant deployment',
    color: 'black',
    oauth: true,
  },
  {
    id: 'netlify',
    name: 'Netlify',
    icon: Cloud,
    description: 'Static site hosting',
    color: 'teal',
    configFields: [
      {
        name: 'access_token',
        label: 'Access Token',
        type: 'password',
        placeholder: 'Your Netlify token',
      },
    ],
  },
]

export default function IntegrationsPanel({
  playgroundId,
  integrations,
  onIntegrationsChange,
}: IntegrationsPanelProps) {
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const getIntegration = (serviceType: string) => {
    return integrations.find((i) => i.service_type === serviceType)
  }

  const connectService = async (serviceType: string) => {
    const service = SERVICES.find((s) => s.id === serviceType)
    if (!service) return

    if (service.oauth) {
      // Handle OAuth flow
      setLoading(serviceType)
      try {
        // Initiate OAuth flow
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Open OAuth window
        const authWindow = window.open(
          `/api/auth/${serviceType}?playground_id=${playgroundId}`,
          '_blank',
          'width=600,height=700'
        )

        // Listen for OAuth completion or manual token entry
        const handleMessage = async (event: MessageEvent) => {
          // Handle GitHub OAuth completion
          if (
            event.data.type === 'oauth_complete' &&
            event.data.service === serviceType
          ) {
            window.removeEventListener('message', handleMessage)
            await onIntegrationsChange()
            toast.success(`Connected to ${service.name}`)
            setLoading(null)
          }

          // Handle Vercel manual token entry
          if (
            event.data.type === 'vercel_token' &&
            event.data.playgroundId === playgroundId
          ) {
            window.removeEventListener('message', handleMessage)

            // Save the Vercel token
            const { error } = await supabase
              .from('playground_integrations')
              .upsert({
                playground_id: playgroundId,
                user_id: user.id,
                service_type: 'vercel',
                credentials: btoa(event.data.token), // Simple base64 encoding
                config: {},
                status: 'connected',
              })

            if (!error) {
              await onIntegrationsChange()
              toast.success('Connected to Vercel')
            } else {
              toast.error('Failed to save Vercel token')
            }
            setLoading(null)
          }
        }
        window.addEventListener('message', handleMessage)

        // Clean up if window is closed
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            setLoading(null)
          }
        }, 1000)
      } catch (error) {
        console.error(`Failed to connect ${service.name}:`, error)
        toast.error(`Failed to connect ${service.name}`)
        setLoading(null)
      }
    } else {
      // Show configuration form
      setConfiguring(serviceType)
    }
  }

  const saveConfiguration = async (serviceType: string) => {
    const config = configs[serviceType]
    if (!config) return

    setLoading(serviceType)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('playground_integrations').upsert({
        playground_id: playgroundId,
        user_id: user.id,
        service_type: serviceType,
        config,
        status: 'connected',
      })

      if (error) throw error

      await onIntegrationsChange()
      toast.success(
        `Connected to ${SERVICES.find((s) => s.id === serviceType)?.name}`
      )
      setConfiguring(null)
      setConfigs({ ...configs, [serviceType]: {} })
    } catch (error) {
      console.error('Failed to save configuration:', error)
      toast.error('Failed to save configuration')
    } finally {
      setLoading(null)
    }
  }

  const disconnectService = async (serviceType: string) => {
    if (
      !confirm(
        `Disconnect ${SERVICES.find((s) => s.id === serviceType)?.name}?`
      )
    )
      return

    setLoading(serviceType)
    try {
      const integration = getIntegration(serviceType)
      if (!integration) return

      const { error } = await supabase
        .from('playground_integrations')
        .delete()
        .eq('id', integration.id)

      if (error) throw error

      await onIntegrationsChange()
      toast.success('Service disconnected')
    } catch (error) {
      console.error('Failed to disconnect service:', error)
      toast.error('Failed to disconnect service')
    } finally {
      setLoading(null)
    }
  }

  const autoProvisionSupabase = async () => {
    const integration = getIntegration('supabase')
    if (!integration) {
      toast.error('Please connect Supabase first')
      return
    }

    setLoading('supabase_provision')
    try {
      const response = await fetch('/api/playground/supabase-provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playgroundId,
          integrationId: integration.id,
        }),
      })

      if (!response.ok) throw new Error('Provisioning failed')

      const data = await response.json()
      toast.success('Supabase resources provisioned successfully!')

      // Show what was created
      if (data.resources) {
        console.log('Created resources:', data.resources)
      }
    } catch (error) {
      console.error('Failed to provision Supabase:', error)
      toast.error('Failed to provision Supabase resources')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-500" />
            <h2 className="font-semibold text-white">Integrations</h2>
          </div>
          <button
            onClick={() => setConfiguring(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {SERVICES.map((service) => {
            const integration = getIntegration(service.id)
            const isConnected = integration?.status === 'connected'
            const isLoading = loading === service.id

            return (
              <div
                key={service.id}
                className="rounded-lg border border-gray-800 bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        isConnected
                          ? `bg-${service.color}-900/30`
                          : 'bg-gray-800'
                      }`}
                    >
                      <service.icon
                        className={`h-5 w-5 ${
                          isConnected
                            ? `text-${service.color}-400`
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{service.name}</h3>
                      <p className="text-xs text-gray-400">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  {isConnected ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <button
                        onClick={() => disconnectService(service.id)}
                        disabled={isLoading}
                        className="text-xs text-gray-400 hover:text-red-400"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectService(service.id)}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Connect
                    </button>
                  )}
                </div>

                {/* Supabase Auto-Provision Button */}
                {service.id === 'supabase' && isConnected && (
                  <div className="mt-3 border-t border-gray-800 pt-3">
                    <button
                      onClick={autoProvisionSupabase}
                      disabled={loading === 'supabase_provision'}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600/20 px-3 py-2 text-sm text-green-400 hover:bg-green-600/30 disabled:opacity-50"
                    >
                      {loading === 'supabase_provision' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4" />
                      )}
                      Auto-Provision Database & Auth
                    </button>
                  </div>
                )}

                {/* Configuration Form */}
                {configuring === service.id && service.configFields && (
                  <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
                    {service.configFields.map((field) => (
                      <div key={field.name}>
                        <label className="mb-1 block text-xs text-gray-400">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={configs[service.id]?.[field.name] || ''}
                          onChange={(e) =>
                            setConfigs({
                              ...configs,
                              [service.id]: {
                                ...configs[service.id],
                                [field.name]: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-600 focus:outline-none"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveConfiguration(service.id)}
                        disabled={isLoading}
                        className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setConfiguring(null)
                          setConfigs({ ...configs, [service.id]: {} })
                        }}
                        className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Help Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="rounded-lg bg-gray-900 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-500" />
            <div className="text-xs text-gray-400">
              <p className="mb-1">Connect services to unlock full features:</p>
              <ul className="space-y-1 text-gray-500">
                <li>• Supabase: Database, auth, storage</li>
                <li>• GitHub: Version control, collaboration</li>
                <li>• Vercel/Netlify: Instant deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
