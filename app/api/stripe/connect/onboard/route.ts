import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playgroundId } = await req.json()

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id')
      .eq('playground_id', playgroundId)
      .single()

    let accountId = existingAccount?.stripe_account_id

    if (!accountId) {
      // Create a new connected account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      })

      accountId = account.id

      // Save to database
      await supabase
        .from('stripe_accounts')
        .insert({
          playground_id: playgroundId,
          user_id: user.id,
          stripe_account_id: accountId,
          status: 'pending',
        })
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/playground/${playgroundId}?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/playground/${playgroundId}?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}