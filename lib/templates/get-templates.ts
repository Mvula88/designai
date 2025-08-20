// This file provides templates dynamically to avoid build-time evaluation
import { Template } from './template-types'

export function getTemplates(): Template[] {
  return [
    {
      id: 'saas-landing-dark',
      name: 'SaaS Landing Page',
      description: 'Modern SaaS landing page with pricing, features, and testimonials',
      category: 'saas',
      tags: ['landing', 'pricing', 'hero', 'dark-mode', 'animated'],
      thumbnail: '/templates/saas-landing.png',
      framework: 'nextjs',
      language: 'typescript',
      styling: 'tailwind',
      features: ['Responsive Design', 'Dark Mode', 'Pricing Cards', 'Testimonials', 'FAQ Section'],
      difficulty: 'intermediate',
      isPremium: false,
      code: {
        'app/page.tsx': 'export default function Home() { return <div>SaaS Landing Page Template</div> }',
        'package.json': JSON.stringify({
          name: 'saas-landing',
          version: '1.0.0',
          dependencies: {
            react: '^18.2.0',
            next: '^14.0.0',
            'lucide-react': '^0.263.1'
          }
        }, null, 2)
      }
    },
    {
      id: 'ecommerce-store',
      name: 'E-Commerce Store',
      description: 'Complete e-commerce store with product listings, cart, and checkout',
      category: 'ecommerce',
      tags: ['shop', 'products', 'cart', 'checkout', 'payments'],
      thumbnail: '/templates/ecommerce.png',
      framework: 'nextjs',
      language: 'typescript',
      styling: 'tailwind',
      features: ['Product Grid', 'Shopping Cart', 'Search & Filter', 'Product Details', 'Checkout Flow'],
      difficulty: 'advanced',
      isPremium: false,
      code: {
        'app/page.tsx': 'export default function Home() { return <div>E-Commerce Store Template</div> }',
        'package.json': JSON.stringify({
          name: 'ecommerce-store',
          version: '1.0.0',
          dependencies: {
            react: '^18.2.0',
            next: '^14.0.0',
            'lucide-react': '^0.263.1'
          }
        }, null, 2)
      }
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      description: 'Professional admin dashboard with charts, tables, and data management',
      category: 'dashboard',
      tags: ['admin', 'analytics', 'charts', 'data', 'management'],
      thumbnail: '/templates/admin-dashboard.png',
      framework: 'nextjs',
      language: 'typescript',
      styling: 'tailwind',
      features: ['Data Tables', 'Charts & Analytics', 'User Management', 'Real-time Updates', 'Responsive Sidebar'],
      difficulty: 'advanced',
      isPremium: true,
      code: {
        'app/page.tsx': 'export default function Home() { return <div>Admin Dashboard Template</div> }',
        'package.json': JSON.stringify({
          name: 'admin-dashboard',
          version: '1.0.0',
          dependencies: {
            react: '^18.2.0',
            next: '^14.0.0',
            'lucide-react': '^0.263.1'
          }
        }, null, 2)
      }
    }
  ]
}