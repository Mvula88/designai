'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { 
  Check, 
  Zap, 
  Rocket, 
  Crown,
  Loader2,
  Sparkles,
  Code2,
  Globe,
  GitBranch,
  Database,
  Cloud,
  Shield,
  Infinity
} from 'lucide-react'
import { toast } from 'sonner'

// Only load Stripe if the publishable key is available
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface PricingPlansProps {
  onClose: () => void
  playgroundId?: string
}

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'Forever free',
    priceId: null,
    features: [
      { text: '3 playgrounds', included: true },
      { text: 'Basic AI assistance', included: true },
      { text: 'Export to GitHub', included: true },
      { text: 'Community support', included: true },
      { text: 'Live preview', included: true },
      { text: 'Unlimited deployments', included: false },
      { text: 'Custom domains', included: false },
      { text: 'Priority support', included: false },
      { text: 'Advanced AI models', included: false },
    ],
    color: 'from-gray-600 to-gray-700',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      { text: 'Unlimited playgrounds', included: true },
      { text: 'Advanced AI assistance', included: true },
      { text: 'GitHub & GitLab integration', included: true },
      { text: 'Priority support', included: true },
      { text: 'Live collaboration', included: true },
      { text: '100 deployments/month', included: true },
      { text: 'Custom domains', included: true },
      { text: 'SSL certificates', included: true },
      { text: 'Advanced AI models', included: false },
    ],
    color: 'from-purple-600 to-blue-600',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited deployments', included: true },
      { text: 'Advanced AI models (GPT-4)', included: true },
      { text: 'White-label options', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'Analytics & insights', included: true },
    ],
    color: 'from-amber-600 to-orange-600',
    popular: false,
  },
]

export default function PricingPlans({ onClose, playgroundId }: PricingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!priceId) {
      toast.info('You are already on the free plan!')
      onClose()
      return
    }

    // Check if Stripe is configured
    if (!stripePromise) {
      toast.error('Payment processing is not configured. Please contact support.')
      return
    }

    setLoading(planName)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          playgroundId,
          planType: 'subscription',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      const stripe = await stripePromise

      if (!stripe) throw new Error('Stripe not loaded')

      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) throw error
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Failed to start subscription')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-auto">
        <div className="bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-600/30 mb-4">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-purple-300">Upgrade Your Experience</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Unlock powerful features to build, deploy, and scale your AI-powered applications
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Plans Grid */}
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border ${
                    plan.popular
                      ? 'border-purple-600/50 shadow-lg shadow-purple-600/20'
                      : 'border-gray-800'
                  } bg-gray-900/50 backdrop-blur p-6 transition-all hover:border-gray-700`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-xs font-semibold text-white">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${plan.color} mb-4`}>
                      {plan.name === 'Starter' && <Zap className="h-6 w-6 text-white" />}
                      {plan.name === 'Pro' && <Rocket className="h-6 w-6 text-white" />}
                      {plan.name === 'Enterprise' && <Crown className="h-6 w-6 text-white" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`mt-0.5 ${feature.included ? 'text-green-500' : 'text-gray-600'}`}>
                          <Check className="h-4 w-4" />
                        </div>
                        <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={loading !== null}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-600/25'
                        : plan.name === 'Enterprise'
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === plan.name ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : plan.priceId ? (
                      `Get ${plan.name}`
                    ) : (
                      'Current Plan'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Features Comparison */}
            <div className="mt-12 p-6 rounded-xl bg-gray-900/50 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                All Plans Include
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <Code2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">AI Code Generation</p>
                    <p className="text-xs text-gray-400">Powered by Claude 3.5</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Live Preview</p>
                    <p className="text-xs text-gray-400">Real-time updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Version Control</p>
                    <p className="text-xs text-gray-400">Git integration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Database</p>
                    <p className="text-xs text-gray-400">Supabase included</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}