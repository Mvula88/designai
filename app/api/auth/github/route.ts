import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const playgroundId = searchParams.get('playground_id')

  if (!playgroundId) {
    return NextResponse.json(
      { error: 'Missing playground_id' },
      { status: 400 }
    )
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub OAuth not configured' },
      { status: 500 }
    )
  }

  // GitHub OAuth authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize')
  authUrl.searchParams.append('client_id', clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('scope', 'repo user')
  authUrl.searchParams.append('state', playgroundId) // Pass playground ID in state

  return NextResponse.redirect(authUrl.toString())
}
