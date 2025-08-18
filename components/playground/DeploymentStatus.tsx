'use client'

import { useState, useEffect } from 'react'
import {
  Cloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  X,
  Github,
  Globe,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Deployment {
  id: string
  deployment_type: string
  deployment_url: string | null
  preview_url: string | null
  status: string
  created_at: string
}

interface DeploymentStatusProps {
  playgroundId: string
}

export default function DeploymentStatus({ playgroundId }: DeploymentStatusProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDeployments()
    
    // Subscribe to deployment updates
    const subscription = supabase
      .channel(`deployments-${playgroundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playground_deployments',
          filter: `playground_id=eq.${playgroundId}`,
        },
        () => {
          loadDeployments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [playgroundId])

  const loadDeployments = async () => {
    try {
      const { data, error } = await supabase
        .from('playground_deployments')
        .select('*')
        .eq('playground_id', playgroundId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setDeployments(data || [])
    } catch (error) {
      console.error('Failed to load deployments:', error)
    } finally {
      setLoading(false)
    }
  }

  const latestDeployment = deployments[0]
  
  if (!latestDeployment) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-400 bg-green-900/30'
      case 'building':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'error':
        return 'text-red-400 bg-red-900/30'
      default:
        return 'text-gray-400 bg-gray-900/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4" />
      case 'building':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Cloud className="h-4 w-4" />
    }
  }

  const getDeploymentIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  return (
    <>
      {/* Compact Status */}
      <div
        className={`rounded-lg border border-gray-800 bg-gray-950 p-3 shadow-lg cursor-pointer ${
          showDetails ? 'w-96' : 'w-64'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${getStatusColor(latestDeployment.status)}`}>
              {getStatusIcon(latestDeployment.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {latestDeployment.status === 'ready'
                  ? 'Deployed'
                  : latestDeployment.status === 'building'
                  ? 'Deploying...'
                  : latestDeployment.status === 'error'
                  ? 'Deploy failed'
                  : 'Pending'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(latestDeployment.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          {latestDeployment.preview_url && (
            <a
              href={latestDeployment.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg bg-purple-600 p-2 text-white hover:bg-purple-700"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
            <h4 className="text-sm font-medium text-white">Recent Deployments</h4>
            <div className="space-y-2">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between rounded-lg bg-gray-900 p-2"
                >
                  <div className="flex items-center gap-2">
                    {getDeploymentIcon(deployment.deployment_type)}
                    <div>
                      <p className="text-xs text-gray-300">
                        {deployment.deployment_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(deployment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        getStatusColor(deployment.status)
                      }`}
                    >
                      {deployment.status}
                    </span>
                    {deployment.preview_url && (
                      <a
                        href={deployment.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}