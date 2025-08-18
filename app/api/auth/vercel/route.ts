import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const playgroundId = searchParams.get('playground_id')
  
  if (!playgroundId) {
    return NextResponse.json({ error: 'Missing playground_id' }, { status: 400 })
  }

  // For Vercel, users need to:
  // 1. Create a personal access token in their Vercel dashboard
  // 2. Enter it manually in the integrations panel
  
  // Since Vercel doesn't have a traditional OAuth flow for personal tokens,
  // we'll redirect to the Vercel token creation page
  const vercelTokenUrl = 'https://vercel.com/account/tokens'
  
  // Return instructions page
  return new NextResponse(`
    <html>
      <head>
        <title>Connect Vercel</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 {
            color: #000;
            margin-bottom: 20px;
          }
          .steps {
            list-style: none;
            padding: 0;
          }
          .steps li {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            border-left: 4px solid #000;
          }
          .steps strong {
            display: block;
            margin-bottom: 5px;
            color: #000;
          }
          .button {
            display: inline-block;
            background: #000;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin: 10px 0;
          }
          .button:hover {
            background: #333;
          }
          input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            margin: 10px 0;
            font-family: monospace;
          }
          .close-button {
            display: inline-block;
            background: #666;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Connect Your Vercel Account</h1>
          
          <ol class="steps">
            <li>
              <strong>Step 1: Create a Vercel Token</strong>
              Click the button below to open your Vercel dashboard and create a new access token.
              <br>
              <a href="${vercelTokenUrl}" target="_blank" class="button">
                Open Vercel Dashboard →
              </a>
            </li>
            
            <li>
              <strong>Step 2: Create Your Token</strong>
              In the Vercel dashboard:
              <ul style="margin-top: 10px; color: #666;">
                <li>Click "Create Token"</li>
                <li>Name it "DesignOS Playground"</li>
                <li>Select appropriate scope (Full Account recommended)</li>
                <li>Copy the generated token</li>
              </ul>
            </li>
            
            <li>
              <strong>Step 3: Enter Your Token</strong>
              Paste your Vercel token here:
              <input 
                type="password" 
                id="vercelToken" 
                placeholder="vc_xxxxxxxxxxxx"
              />
              <button onclick="saveToken()" class="button" style="display: block; width: 100%;">
                Save Token
              </button>
            </li>
          </ol>
          
          <a href="#" onclick="window.close()" class="close-button">Close Window</a>
        </div>
        
        <script>
          async function saveToken() {
            const token = document.getElementById('vercelToken').value;
            if (!token) {
              alert('Please enter your Vercel token');
              return;
            }
            
            // Send token to parent window
            window.opener.postMessage(
              { 
                type: 'vercel_token',
                token: token,
                playgroundId: '${playgroundId}'
              },
              '${process.env.NEXT_PUBLIC_APP_URL}'
            );
            
            alert('Token saved! You can close this window.');
            window.close();
          }
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  })
}