# DesignOS - AI-Powered Design Platform

A comprehensive design platform built with Next.js, Fabric.js, Anthropic Claude AI, and Supabase.

## Features

- **Full Canvas Editor**: Professional design tools with Fabric.js
- **AI Assistant**: Natural language commands powered by Claude
- **Design Archaeology**: Convert any image to editable elements using Claude Vision
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Smart Export**: Export as PNG, JPG, SVG, or JSON

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Canvas**: Fabric.js
- **AI**: Anthropic Claude API
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: Tailwind CSS + shadcn/ui

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Anthropic API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env.local` with your actual keys:

```env
# Supabase - Get from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic - Get from https://console.anthropic.com
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Setup Supabase Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the migration script from `supabase/migrations/001_initial_schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   │   └── editor/        # Canvas editor
│   └── api/               # API routes
├── components/            # React components
│   ├── canvas/           # Canvas editor components
│   └── ai/              # AI assistant components
├── lib/                  # Utility libraries
│   ├── anthropic/       # Claude API integration
│   ├── supabase/        # Supabase client
│   └── fabric/          # Canvas utilities
├── types/               # TypeScript types
└── supabase/           # Database migrations
```

## Key Features Implementation

### Canvas Editor
- Drawing tools (rectangle, circle, line, text, pen)
- Layer management
- Undo/redo with history
- Export to multiple formats
- Real-time collaboration

### AI Integration
- Natural language commands ("make it bigger", "change to blue")
- Image analysis and conversion to editable elements
- Design suggestions based on user patterns
- Performance predictions

### Database Schema
- Designs storage with version history
- User preferences and AI learning
- Canvas actions tracking
- Asset management

## Usage

1. **Create a Design**: Click "Start Designing" from the homepage
2. **Use Drawing Tools**: Select tools from the left toolbar
3. **AI Assistant**: Use the right panel to enter natural language commands
4. **Import Design**: Upload an image to convert it to editable elements
5. **Export**: Save your design as PNG, JPG, SVG, or JSON

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Supabase Setup

1. Create new project
2. Run migrations
3. Enable Row Level Security
4. Configure authentication

## API Routes

- `POST /api/anthropic/analyze` - Analyze images with Claude Vision
- `POST /api/anthropic/command` - Interpret natural language commands

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT