import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // This is the playground_id

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/playground?error=missing_params`
    )
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/playground?error=oauth_not_configured`
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(
        tokenData.error_description || 'Failed to get access token'
      )
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    const userData = await userResponse.json()

    // Store the integration in Supabase
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
    }

    // Encrypt the access token before storing
    const encryptedToken = await encryptToken(tokenData.access_token)

    // Save or update the integration
    await supabase.from('playground_integrations').upsert({
      playground_id: state,
      user_id: user.id,
      service_type: 'github',
      credentials: encryptedToken,
      config: {
        username: userData.login,
        email: userData.email,
        avatar_url: userData.avatar_url,
      },
      status: 'connected',
      last_sync: new Date().toISOString(),
    })

    // Close the OAuth window and notify the parent
    return new NextResponse(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { type: 'oauth_complete', service: 'github' },
              '${process.env.NEXT_PUBLIC_APP_URL}'
            );
            window.close();
          </script>
          <p>GitHub connected successfully! This window will close automatically.</p>
        </body>
      </html>
    `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/playground?error=oauth_failed`
    )
  }
}

// Simple encryption function (in production, use a proper encryption library)
async function encryptToken(token: string): Promise<string> {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('Encryption key not configured')

  // In production, use proper encryption like crypto.subtle or a library
  // This is a simple example
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  return Buffer.from(data).toString('base64')
}

