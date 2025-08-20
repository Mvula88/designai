import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Only initialize Stripe if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null

export async function POST(req: NextRequest) {
  // Check if Stripe is configured
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('Stripe webhook is not configured. Please add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to your environment variables.')
    return NextResponse.json(
      { error: 'Webhook processing is not configured' },
      { status: 503 }
    )
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const playgroundId = session.metadata?.playgroundId

      if (userId) {
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })

        if (playgroundId) {
          await supabase
            .from('playgrounds')
            .update({ is_premium: true })
            .eq('id', playgroundId)
        }
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}