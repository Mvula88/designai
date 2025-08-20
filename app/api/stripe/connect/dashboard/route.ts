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
      .select('stripe_account_id')
      .eq('playground_id', playgroundId)
      .single()

    if (!accountData?.stripe_account_id) {
      return NextResponse.json({ stats: {
        revenue: 0,
        transactions: 0,
        customers: 0,
        avgOrderValue: 0,
        revenueChange: 0,
        transactionsChange: 0
      }})
    }

    // Get balance and transactions from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountData.stripe_account_id
    })

    const charges = await stripe.charges.list({
      limit: 100,
      stripeAccount: accountData.stripe_account_id
    })

    const customers = await stripe.customers.list({
      limit: 100,
      stripeAccount: accountData.stripe_account_id
    })

    // Calculate stats
    const totalRevenue = charges.data.reduce((sum, charge) => sum + charge.amount, 0)
    const avgOrderValue = charges.data.length > 0 ? totalRevenue / charges.data.length : 0

    // Calculate changes (mock data for demo)
    const revenueChange = Math.floor(Math.random() * 40) - 20
    const transactionsChange = Math.floor(Math.random() * 30) - 15

    return NextResponse.json({
      stats: {
        revenue: totalRevenue,
        transactions: charges.data.length,
        customers: customers.data.length,
        avgOrderValue,
        revenueChange,
        transactionsChange
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { stats: {
        revenue: 0,
        transactions: 0,
        customers: 0,
        avgOrderValue: 0,
        revenueChange: 0,
        transactionsChange: 0
      }},
      { status: 200 }
    )
  }
}