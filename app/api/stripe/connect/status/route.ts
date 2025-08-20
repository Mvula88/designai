import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const playgroundId = searchParams.get('playgroundId')

    if (!playgroundId) {
      return NextResponse.json({ error: 'Playground ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get account from database
    const { data: accountData } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, status')
      .eq('playground_id', playgroundId)
      .single()

    if (!accountData?.stripe_account_id) {
      return NextResponse.json({ account: { connected: false } })
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(accountData.stripe_account_id)

    return NextResponse.json({
      account: {
        id: account.id,
        connected: true,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        business_profile: account.business_profile,
        capabilities: account.capabilities,
        requirements: account.requirements,
      }
    })
  } catch (error) {
    console.error('Stripe status error:', error)
    return NextResponse.json(
      { error: 'Failed to get account status' },
      { status: 500 }
    )
  }
}