export interface Template {
  id: string
  name: string
  description: string
  category: 'landing' | 'dashboard' | 'ecommerce' | 'saas' | 'portfolio' | 'blog' | 'social' | 'admin'
  tags: string[]
  thumbnail: string
  framework: 'nextjs' | 'react' | 'vue'
  language: 'typescript' | 'javascript'
  styling: 'tailwind' | 'css'
  features: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isPremium: boolean
  code: {
    [filename: string]: string
  }
}