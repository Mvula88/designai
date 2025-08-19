# DesignShip - Ship Apps Without Code 🚀

Turn your designs into production-ready React apps in minutes. No developers needed. Just design it, ship it.

![DesignShip Banner](https://img.shields.io/badge/Design-Ship-gradient?style=for-the-badge&logo=react&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

## 🎯 What is DesignShip?

DesignShip is a revolutionary platform where designers can create and deploy real, production-ready applications without writing a single line of code. Using AI-powered design-to-code conversion, visual database design, and one-click deployment, DesignShip empowers designers to become builders.

### ✨ Key Features

- **🎨 Visual Canvas Editor** - Professional design tools with drag-and-drop interface
- **🤖 AI Assistant (Claude)** - Natural language commands to modify designs instantly
- **📸 Design Import** - Convert Figma screenshots or any design to editable components
- **⚡ Instant Code Generation** - Real-time React/Next.js/TypeScript code generation
- **🚀 One-Click Deploy** - Deploy to Vercel, Netlify, or custom hosting instantly
- **🗄️ Visual Database Designer** - Design your backend without SQL
- **🛍️ Component Marketplace** - Buy/sell components, earn 70% commission
- **📱 Auto-Responsive** - Designs automatically adapt to all screen sizes

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Canvas**: Fabric.js 6.7
- **AI**: Anthropic Claude API (Opus 4.1)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 3.4
- **Deployment**: Vercel/Netlify
- **State Management**: Zustand
- **UI Components**: Custom components with Framer Motion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Mvula88/designai.git
cd designai
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: For deployment
VERCEL_TOKEN=your_vercel_token
```

4. **Setup Supabase Database**

Run the migration script in your Supabase SQL editor:
```sql
-- Located in supabase/migrations/001_initial_schema.sql
```

5. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see DesignShip in action!

## 📁 Project Structure

```
designai/
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   │   ├── editor/        # Visual canvas editor
│   │   ├── playground/    # Code playground
│   │   ├── marketplace/   # Component marketplace
│   │   └── templates/     # Design templates
│   └── api/               # API routes
├── components/            # React components
│   ├── canvas/           # Canvas editor components
│   │   ├── AdvancedFabricEditor.tsx
│   │   ├── DesignToCodeBridge.tsx
│   │   └── TemplateGallery.tsx
│   ├── ai/              # AI components
│   │   ├── ClaudeAssistant.tsx
│   │   └── VisionAnalyzer.tsx
│   └── marketplace/      # Marketplace components
├── lib/                  # Utility libraries
│   ├── anthropic/       # Claude API integration
│   ├── supabase/        # Database client
│   └── utils/           # Helper functions
├── types/               # TypeScript definitions
└── public/              # Static assets
```

## 🎨 Usage Guide

### Creating Your First Design

1. **Start Designing**
   - Click "Start Designing" on the homepage
   - Use the visual canvas to drag and drop components
   - Style elements with the properties panel

2. **Use AI Assistant**
   - Open the AI panel on the right
   - Type commands like "Make the header sticky with glassmorphism"
   - Watch your design transform instantly

3. **Import Existing Designs**
   - Click the Import tab
   - Upload a Figma screenshot or any design image
   - AI converts it to editable components

4. **Generate Code**
   - Click "View Code" to see real-time React code
   - Every change updates the code instantly
   - Export to GitHub or download source

5. **Deploy to Production**
   - Click "Deploy" button
   - Choose Vercel or Netlify
   - Your app is live in seconds!

## 🔥 Advanced Features

### Visual Database Designer
- Drag and drop to create tables
- Draw relationships between tables
- Auto-generates PostgreSQL schema
- Integrates with Supabase

### Component Marketplace
- Browse pre-built components
- One-click install to your project
- Sell your own components
- Earn 70% commission on sales

### Team Collaboration
- Real-time collaborative editing
- Comments and feedback
- Version history
- Role-based permissions

## 📊 API Reference

### AI Endpoints

```typescript
POST /api/anthropic/analyze
// Analyze design images with Claude Vision

POST /api/anthropic/command  
// Process natural language design commands

POST /api/anthropic/generate
// Generate code from canvas data
```

### Design Endpoints

```typescript
GET /api/designs
// List user's designs

POST /api/designs
// Create new design

PUT /api/designs/:id
// Update design

DELETE /api/designs/:id
// Delete design
```

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Mvula88/designai)

1. Click the button above
2. Add environment variables
3. Deploy!

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎬 Demo

Watch our 3-minute demo to see DesignShip in action:

- **Script**: [demo-video-script.md](./demo-video-script.md)
- **Storyboard**: [demo-storyboard-timing.md](./demo-storyboard-timing.md)
- **Live Demo**: [designai-ashy.vercel.app](https://designai-ashy.vercel.app)

## 📈 Performance

- **10 minutes** from design to deployment
- **0 lines** of code required
- **100%** visual design
- **70%** commission for component sellers

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [Vercel](https://vercel.com) for hosting
- [Supabase](https://supabase.com) for database
- [Fabric.js](http://fabricjs.com) for canvas

## 📞 Support

- **Documentation**: [docs.designship.io](https://docs.designship.io)
- **Discord**: [Join our community](https://discord.gg/designship)
- **Email**: support@designship.io
- **Issues**: [GitHub Issues](https://github.com/Mvula88/designai/issues)

## 🚀 Roadmap

- [ ] Figma plugin for direct import
- [ ] WordPress/Shopify export
- [ ] Mobile app builder
- [ ] Advanced animations
- [ ] 3D design support
- [ ] Plugin ecosystem
- [ ] Enterprise features

---

<div align="center">

**Built with ❤️ by designers, for designers**

[Website](https://designship.io) • [Documentation](https://docs.designship.io) • [Twitter](https://twitter.com/designship)

</div>