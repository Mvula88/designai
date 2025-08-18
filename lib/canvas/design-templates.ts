/**
 * Designer-Ready Templates
 * Pre-built canvas layouts that convert to production apps
 */

export interface DesignTemplate {
  id: string
  name: string
  category: 'saas' | 'ecommerce' | 'landing' | 'portfolio' | 'blog'
  description: string
  thumbnail: string
  canvasData: any // Fabric.js JSON
  components: string[]
  features: string[]
  isPremium?: boolean
}

export const designTemplates: DesignTemplate[] = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Dashboard',
    category: 'saas',
    description: 'Complete dashboard with charts, tables, and metrics',
    thumbnail: '/templates/saas-dashboard.png',
    components: ['Navbar', 'Sidebar', 'Charts', 'Tables', 'Cards'],
    features: ['Real-time data', 'User management', 'Analytics'],
    canvasData: {
      version: '5.3.0',
      objects: [
        // Navbar
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 64,
          fill: '#ffffff',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          rx: 0,
          ry: 0,
        },
        {
          type: 'text',
          left: 24,
          top: 20,
          text: 'Dashboard',
          fontSize: 20,
          fontWeight: 'bold',
          fill: '#111827',
        },
        // Sidebar
        {
          type: 'rect',
          left: 0,
          top: 64,
          width: 240,
          height: 736,
          fill: '#f9fafb',
          stroke: '#e5e7eb',
          strokeWidth: 1,
        },
        // Main content area
        {
          type: 'rect',
          left: 240,
          top: 64,
          width: 960,
          height: 736,
          fill: '#ffffff',
        },
        // Metric Cards
        {
          type: 'group',
          left: 280,
          top: 100,
          objects: [
            {
              type: 'rect',
              left: 0,
              top: 0,
              width: 200,
              height: 100,
              fill: '#ffffff',
              stroke: '#e5e7eb',
              strokeWidth: 1,
              rx: 8,
              ry: 8,
              shadow: {
                color: 'rgba(0,0,0,0.1)',
                blur: 10,
                offsetX: 0,
                offsetY: 2,
              },
            },
            {
              type: 'text',
              left: 16,
              top: 16,
              text: 'Total Revenue',
              fontSize: 14,
              fill: '#6b7280',
            },
            {
              type: 'text',
              left: 16,
              top: 40,
              text: '$45,231',
              fontSize: 24,
              fontWeight: 'bold',
              fill: '#111827',
            },
          ],
        },
        // Chart placeholder
        {
          type: 'rect',
          left: 280,
          top: 240,
          width: 640,
          height: 300,
          fill: '#f9fafb',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          rx: 8,
          ry: 8,
        },
        {
          type: 'text',
          left: 300,
          top: 260,
          text: 'Revenue Chart',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#111827',
        },
      ],
      background: '#f3f4f6',
    },
  },
  {
    id: 'ecommerce-store',
    name: 'E-Commerce Store',
    category: 'ecommerce',
    description: 'Product grid, cart, and checkout flow',
    thumbnail: '/templates/ecommerce.png',
    components: ['ProductGrid', 'Cart', 'Filters', 'Search', 'Checkout'],
    features: ['Product catalog', 'Shopping cart', 'Payment integration'],
    canvasData: {
      version: '5.3.0',
      objects: [
        // Header
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 80,
          fill: '#000000',
        },
        {
          type: 'text',
          left: 40,
          top: 28,
          text: 'STORE',
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#ffffff',
        },
        // Search bar
        {
          type: 'rect',
          left: 400,
          top: 20,
          width: 400,
          height: 40,
          fill: '#ffffff',
          rx: 20,
          ry: 20,
        },
        {
          type: 'text',
          left: 420,
          top: 30,
          text: 'Search products...',
          fontSize: 14,
          fill: '#9ca3af',
        },
        // Product Grid
        ...Array.from({ length: 6 }, (_, i) => ({
          type: 'group',
          left: 40 + (i % 3) * 380,
          top: 120 + Math.floor(i / 3) * 400,
          objects: [
            {
              type: 'rect',
              left: 0,
              top: 0,
              width: 360,
              height: 380,
              fill: '#ffffff',
              stroke: '#e5e7eb',
              strokeWidth: 1,
              rx: 8,
              ry: 8,
            },
            {
              type: 'rect',
              left: 0,
              top: 0,
              width: 360,
              height: 240,
              fill: '#f3f4f6',
              rx: 8,
              ry: 8,
            },
            {
              type: 'text',
              left: 20,
              top: 260,
              text: 'Product Name',
              fontSize: 18,
              fontWeight: 'bold',
              fill: '#111827',
            },
            {
              type: 'text',
              left: 20,
              top: 290,
              text: '$99.00',
              fontSize: 20,
              fontWeight: 'bold',
              fill: '#10b981',
            },
            {
              type: 'rect',
              left: 20,
              top: 320,
              width: 320,
              height: 40,
              fill: '#000000',
              rx: 8,
              ry: 8,
            },
            {
              type: 'text',
              left: 150,
              top: 332,
              text: 'Add to Cart',
              fontSize: 14,
              fontWeight: 'bold',
              fill: '#ffffff',
            },
          ],
        })),
      ],
      background: '#ffffff',
    },
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    category: 'landing',
    description: 'Hero section, features, testimonials, CTA',
    thumbnail: '/templates/landing.png',
    components: ['Hero', 'Features', 'Testimonials', 'CTA', 'Footer'],
    features: ['Conversion optimized', 'Mobile responsive', 'SEO ready'],
    canvasData: {
      version: '5.3.0',
      objects: [
        // Hero Section
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 600,
          fill: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          type: 'text',
          left: 100,
          top: 200,
          text: 'Build Amazing Products',
          fontSize: 48,
          fontWeight: 'bold',
          fill: '#ffffff',
        },
        {
          type: 'text',
          left: 100,
          top: 270,
          text: 'Turn your ideas into reality with our powerful platform',
          fontSize: 20,
          fill: '#e5e7eb',
        },
        {
          type: 'rect',
          left: 100,
          top: 330,
          width: 160,
          height: 50,
          fill: '#ffffff',
          rx: 25,
          ry: 25,
        },
        {
          type: 'text',
          left: 140,
          top: 345,
          text: 'Get Started',
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#667eea',
        },
        // Features Section
        {
          type: 'text',
          left: 500,
          top: 650,
          text: 'Features',
          fontSize: 36,
          fontWeight: 'bold',
          fill: '#111827',
        },
        ...Array.from({ length: 3 }, (_, i) => ({
          type: 'group',
          left: 100 + i * 350,
          top: 720,
          objects: [
            {
              type: 'rect',
              left: 0,
              top: 0,
              width: 300,
              height: 200,
              fill: '#f9fafb',
              stroke: '#e5e7eb',
              strokeWidth: 1,
              rx: 8,
              ry: 8,
            },
            {
              type: 'circle',
              left: 130,
              top: 30,
              radius: 30,
              fill: '#667eea',
            },
            {
              type: 'text',
              left: 75,
              top: 100,
              text: `Feature ${i + 1}`,
              fontSize: 18,
              fontWeight: 'bold',
              fill: '#111827',
            },
            {
              type: 'text',
              left: 30,
              top: 130,
              text: 'Amazing feature description',
              fontSize: 14,
              fill: '#6b7280',
            },
          ],
        })),
      ],
      background: '#ffffff',
    },
  },
  {
    id: 'portfolio-site',
    name: 'Portfolio Site',
    category: 'portfolio',
    description: 'Showcase your work with style',
    thumbnail: '/templates/portfolio.png',
    components: ['Gallery', 'About', 'Contact', 'Projects'],
    features: ['Image gallery', 'Contact form', 'Project showcase'],
    canvasData: {
      version: '5.3.0',
      objects: [
        // Header
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 400,
          fill: '#111827',
        },
        {
          type: 'text',
          left: 450,
          top: 150,
          text: 'John Designer',
          fontSize: 48,
          fontWeight: 'bold',
          fill: '#ffffff',
        },
        {
          type: 'text',
          left: 430,
          top: 220,
          text: 'Creative Digital Designer',
          fontSize: 20,
          fill: '#9ca3af',
        },
        // Portfolio Grid
        ...Array.from({ length: 6 }, (_, i) => ({
          type: 'rect',
          left: 50 + (i % 3) * 380,
          top: 450 + Math.floor(i / 3) * 280,
          width: 360,
          height: 260,
          fill: '#f3f4f6',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          rx: 8,
          ry: 8,
        })),
      ],
      background: '#ffffff',
    },
  },
  {
    id: 'blog-platform',
    name: 'Blog Platform',
    category: 'blog',
    description: 'Content-focused blog with sidebar',
    thumbnail: '/templates/blog.png',
    components: ['PostList', 'Sidebar', 'Categories', 'Search'],
    features: ['Article layout', 'Category filters', 'Search'],
    canvasData: {
      version: '5.3.0',
      objects: [
        // Header
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 80,
          fill: '#ffffff',
          stroke: '#e5e7eb',
          strokeWidth: 1,
        },
        {
          type: 'text',
          left: 100,
          top: 28,
          text: 'My Blog',
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#111827',
        },
        // Main content area
        {
          type: 'rect',
          left: 100,
          top: 120,
          width: 700,
          height: 600,
          fill: '#ffffff',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          rx: 8,
          ry: 8,
        },
        // Sidebar
        {
          type: 'rect',
          left: 850,
          top: 120,
          width: 300,
          height: 600,
          fill: '#f9fafb',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          rx: 8,
          ry: 8,
        },
        // Blog post cards
        ...Array.from({ length: 3 }, (_, i) => ({
          type: 'group',
          left: 120,
          top: 140 + i * 180,
          objects: [
            {
              type: 'text',
              left: 0,
              top: 0,
              text: 'Blog Post Title',
              fontSize: 20,
              fontWeight: 'bold',
              fill: '#111827',
            },
            {
              type: 'text',
              left: 0,
              top: 30,
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
              fontSize: 14,
              fill: '#6b7280',
            },
            {
              type: 'text',
              left: 0,
              top: 80,
              text: 'Read more →',
              fontSize: 14,
              fill: '#667eea',
            },
          ],
        })),
      ],
      background: '#ffffff',
    },
  },
]

export function getTemplateById(id: string): DesignTemplate | undefined {
  return designTemplates.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): DesignTemplate[] {
  return designTemplates.filter(t => t.category === category)
}