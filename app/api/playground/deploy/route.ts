import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playgroundId, deploymentType, code } = await request.json()

    // Get playground details
    const { data: playground, error: playgroundError } = await supabase
      .from('playgrounds')
      .select('*')
      .eq('id', playgroundId)
      .single()

    if (playgroundError || !playground) {
      return NextResponse.json(
        { error: 'Playground not found' },
        { status: 404 }
      )
    }

    // Get integration for deployment
    const { data: integration, error: integrationError } = await supabase
      .from('playground_integrations')
      .select('*')
      .eq('playground_id', playgroundId)
      .eq('service_type', deploymentType)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: `Please connect ${deploymentType} first` },
        { status: 400 }
      )
    }

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('playground_deployments')
      .insert({
        playground_id: playgroundId,
        user_id: user.id,
        deployment_type: deploymentType,
        status: 'pending',
      })
      .select()
      .single()

    if (deploymentError) {
      return NextResponse.json(
        { error: 'Failed to create deployment' },
        { status: 500 }
      )
    }

    // Handle different deployment types
    let deploymentResult

    switch (deploymentType) {
      case 'github':
        deploymentResult = await deployToGitHub(
          playground,
          integration,
          code,
          deployment.id
        )
        break

      case 'vercel':
        deploymentResult = await deployToVercel(
          playground,
          integration,
          code,
          deployment.id
        )
        break

      case 'netlify':
        deploymentResult = await deployToNetlify(
          playground,
          integration,
          code,
          deployment.id
        )
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported deployment type' },
          { status: 400 }
        )
    }

    // Update deployment record with results
    await supabase
      .from('playground_deployments')
      .update({
        deployment_url: deploymentResult.deploymentUrl,
        preview_url: deploymentResult.previewUrl,
        commit_hash: deploymentResult.commitHash,
        status: deploymentResult.status,
        metadata: deploymentResult.metadata,
        completed_at: new Date().toISOString(),
      })
      .eq('id', deployment.id)

    return NextResponse.json(deploymentResult)
  } catch (error) {
    console.error('Deployment error:', error)
    return NextResponse.json({ error: 'Failed to deploy' }, { status: 500 })
  }
}

async function deployToGitHub(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playground: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  integration: any,
  code: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deploymentId: string
) {
  // Decrypt the user's GitHub token
  const decryptedToken = await decryptToken(integration.credentials)

  // Use the user's personal GitHub account
  const { GitHubManager } = await import('@/lib/playground/github-manager')
  const github = new GitHubManager({
    accessToken: decryptedToken,
    username: integration.config.username,
  })

  // Deploy to the user's GitHub account
  const projectName = playground.name.toLowerCase().replace(/\s+/g, '-')
  const result = await github.deployToGitHub(projectName, code)

  return {
    deploymentUrl: result.repoUrl,
    previewUrl: null,
    commitHash: result.commitHash || Math.random().toString(36).substring(7),
    status: 'ready',
    metadata: {
      branch: 'main',
      files: Object.keys(code).length,
      username: integration.config.username,
    },
  }
}

// Decrypt function (matches the encrypt in callback route)
async function decryptToken(encryptedToken: string): Promise<string> {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('Encryption key not configured')

  // Simple base64 decode (in production, use proper decryption)
  const decoded = Buffer.from(encryptedToken, 'base64').toString()
  return decoded
}

async function deployToVercel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playground: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  integration: any,
  code: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deploymentId: string
) {
  // Check if user connected their own Vercel account
  if (integration && integration.credentials) {
    // Use user's personal Vercel account
    const decryptedToken = await decryptToken(integration.credentials)

    const { VercelDeployer } = await import('@/lib/playground/vercel-deployer')
    const vercel = new VercelDeployer({
      apiToken: decryptedToken,
      teamId: integration.config?.teamId,
    })

    const projectName = playground.name.toLowerCase().replace(/\s+/g, '-')
    const result = await vercel.deployToVercel(projectName, code)

    return {
      deploymentUrl: result.inspectorUrl,
      previewUrl: result.deploymentUrl,
      commitHash: null,
      status: 'building',
      metadata: {
        provider: 'vercel',
        deploymentId: result.deploymentId,
        userAccount: true,
      },
    }
  } else {
    // Fallback: Use platform's Vercel account (if configured)
    // This allows you to offer managed deployments
    if (process.env.VERCEL_API_TOKEN) {
      const { VercelDeployer } = await import(
        '@/lib/playground/vercel-deployer'
      )
      const vercel = new VercelDeployer({
        apiToken: process.env.VERCEL_API_TOKEN,
        teamId: process.env.VERCEL_TEAM_ID,
      })

      const projectName = `${playground.user_id.slice(0, 8)}-${playground.name.toLowerCase().replace(/\s+/g, '-')}`
      const result = await vercel.deployToVercel(projectName, code)

      return {
        deploymentUrl: result.inspectorUrl,
        previewUrl: result.deploymentUrl,
        commitHash: null,
        status: 'building',
        metadata: {
          provider: 'vercel',
          deploymentId: result.deploymentId,
          managedDeployment: true,
        },
      }
    }

    throw new Error('Please connect your Vercel account to deploy')
  }
}

async function deployToNetlify(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playground: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  integration: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  code: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deploymentId: string
) {
  // In production, this would:
  // 1. Create a site using Netlify API
  // 2. Deploy the code
  // 3. Return the deployment URL

  // For now, return a mock response
  const projectName = playground.name.toLowerCase().replace(/\s+/g, '-')
  return {
    deploymentUrl: `https://app.netlify.com/sites/${projectName}`,
    previewUrl: `https://${projectName}.netlify.app`,
    commitHash: null,
    status: 'building',
    metadata: {
      provider: 'netlify',
    },
  }
}
