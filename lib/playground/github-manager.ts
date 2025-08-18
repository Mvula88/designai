interface GitHubConfig {
  accessToken: string
  username: string
}

export class GitHubManager {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
  }

  async createRepository(name: string, description: string, isPrivate = false) {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create repository: ${error.message}`)
    }

    return await response.json()
  }

  async createOrUpdateFile(
    repo: string,
    path: string,
    content: string,
    message: string,
    branch = 'main'
  ) {
    // First, try to get the file to see if it exists
    const getResponse = await fetch(
      `https://api.github.com/repos/${this.config.username}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    let sha: string | undefined
    if (getResponse.ok) {
      const existingFile = await getResponse.json()
      sha = existingFile.sha
    }

    // Create or update the file
    const response = await fetch(
      `https://api.github.com/repos/${this.config.username}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString('base64'),
          branch,
          sha, // Include SHA if updating existing file
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create/update file: ${error.message}`)
    }

    return await response.json()
  }

  async deployToGitHub(
    projectName: string,
    files: Record<string, string>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    commitMessage = 'Deploy from DesignOS Playground'
  ) {
    try {
      // Create repository
      const repo = await this.createRepository(
        projectName,
        'Created with DesignOS AI Playground'
      )

      // Add all files
      for (const [filePath, content] of Object.entries(files)) {
        await this.createOrUpdateFile(
          projectName,
          filePath,
          content,
          `Add ${filePath}`
        )
      }

      return {
        success: true,
        repoUrl: repo.html_url,
        cloneUrl: repo.clone_url,
      }
    } catch (error) {
      console.error('GitHub deployment error:', error)
      throw error
    }
  }
}
