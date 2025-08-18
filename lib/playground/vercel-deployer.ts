interface VercelConfig {
  apiToken: string
  teamId?: string
}

export class VercelDeployer {
  private config: VercelConfig
  private baseUrl = 'https://api.vercel.com'

  constructor(config: VercelConfig) {
    this.config = config
  }

  async createProject(name: string, framework = 'nextjs') {
    const response = await fetch(`${this.baseUrl}/v9/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        framework,
        publicSource: true,
        ...(this.config.teamId && { teamId: this.config.teamId }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `Failed to create Vercel project: ${error.error?.message}`
      )
    }

    return await response.json()
  }

  async createDeployment(
    projectName: string,
    files: Record<string, string>,
    environment = 'production'
  ) {
    // Prepare files for deployment
    const deploymentFiles = Object.entries(files).map(([path, content]) => ({
      file: path,
      data: content,
    }))

    const response = await fetch(`${this.baseUrl}/v13/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        files: deploymentFiles,
        projectSettings: {
          framework: 'nextjs',
          buildCommand: 'npm run build',
          outputDirectory: '.next',
          installCommand: 'npm install',
        },
        target: environment,
        ...(this.config.teamId && { teamId: this.config.teamId }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create deployment: ${error.error?.message}`)
    }

    return await response.json()
  }

  async deployToVercel(projectName: string, files: Record<string, string>) {
    try {
      // Ensure package.json exists
      if (!files['package.json']) {
        files['package.json'] = JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
            },
            dependencies: {
              next: 'latest',
              react: 'latest',
              'react-dom': 'latest',
            },
          },
          null,
          2
        )
      }

      // Create deployment
      const deployment = await this.createDeployment(projectName, files)

      return {
        success: true,
        deploymentUrl: `https://${deployment.url}`,
        inspectorUrl: `https://vercel.com/${deployment.name}`,
        deploymentId: deployment.id,
      }
    } catch (error) {
      console.error('Vercel deployment error:', error)
      throw error
    }
  }

  async getDeploymentStatus(deploymentId: string) {
    const response = await fetch(
      `${this.baseUrl}/v13/deployments/${deploymentId}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get deployment status')
    }

    const deployment = await response.json()
    return {
      state: deployment.readyState, // BUILDING, READY, ERROR, QUEUED, CANCELED
      url: deployment.url,
    }
  }
}

