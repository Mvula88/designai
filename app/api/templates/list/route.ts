import { NextRequest, NextResponse } from 'next/server'
import { getTemplates } from '@/lib/templates/get-templates'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')

    const templates = getTemplates()
    let filteredTemplates = [...templates]

    // Filter by category
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredTemplates = filteredTemplates.slice(0, limitNum)
      }
    }

    return NextResponse.json({
      templates: filteredTemplates,
      total: filteredTemplates.length,
      categories: [
        { id: 'all', name: 'All Templates', count: templates.length },
        { id: 'landing', name: 'Landing Pages', count: templates.filter(t => t.category === 'landing').length },
        { id: 'dashboard', name: 'Dashboards', count: templates.filter(t => t.category === 'dashboard').length },
        { id: 'ecommerce', name: 'E-Commerce', count: templates.filter(t => t.category === 'ecommerce').length },
        { id: 'saas', name: 'SaaS', count: templates.filter(t => t.category === 'saas').length },
        { id: 'portfolio', name: 'Portfolio', count: templates.filter(t => t.category === 'portfolio').length },
        { id: 'blog', name: 'Blog', count: templates.filter(t => t.category === 'blog').length },
        { id: 'admin', name: 'Admin', count: templates.filter(t => t.category === 'admin').length },
      ]
    })
  } catch (error) {
    console.error('Template list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}