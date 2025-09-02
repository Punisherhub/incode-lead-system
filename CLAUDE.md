# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Incode Academy Lead System - A sophisticated 3D lead capture system with Three.js frontend and Node.js/Express backend. The system captures leads for a Python programming academy and integrates with n8n for marketing automation.

## Commands

### Development
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm install         # Install dependencies
node setup.js       # Run automated setup (checks deps, creates .env, initializes DB)
```

### Build & Deploy
```bash
npm run build       # Echo build complete (static frontend)
npm run deploy      # Echo deploy message (configured in CI/CD)
```

### Database Management
```bash
node backend/database/migrate.js  # Run database migrations
```

### Development & Debug
```bash
DEBUG=* npm run dev               # Start with full debug logging
NODE_ENV=development npm start    # Force development mode
```

**Note**: No testing framework is currently configured in this project.

## Architecture

### Backend Structure (`backend/`)
- **Entry Point**: `server.js` - Express server with security middleware
- **Database**: Dual database support:
  - Development: SQLite via `database/init.js`
  - Production: PostgreSQL via `database/postgres.js` (if DATABASE_URL exists)
  - Migration scripts: `database/migrate.js`
- **Models**: `models/Lead.js` - Lead data model with validation
- **Routes**: `routes/leads.js` - API endpoints for lead management
- **Default Port**: 3002 (configurable via .env PORT)

### Frontend Structure (`frontend/`)
- **Entry Point**: `index.html` - SPA with Three.js 3D scene
- **Admin Panel**: `admin.html` - Basic admin interface for viewing leads
- **Main App**: `js/app.js` - Application orchestrator
- **Core Components**:
  - `js/three-scene.js` - 3D scene with animated Python code snippets
  - `js/animations.js` - GSAP-powered animations
  - `js/form-handler.js` - Form validation and API integration
- **Styling**: `css/style.css` - Custom styles with dark theme
- **External Libraries**: Three.js, GSAP, Typed.js (loaded via CDN)

### Key Features
- Interactive 3D background with floating Python code animations
- Responsive lead capture form with client-side validation
- Dual database support (SQLite dev, PostgreSQL prod)
- n8n webhook integration for automated marketing sequences
- Rate limiting and comprehensive security headers
- Admin panel for lead management
- Mobile-responsive design with dark theme

### API Endpoints
- `POST /api/leads` - Create new lead (with n8n webhook trigger)
- `GET /api/health` - Health check endpoint
- `POST /api/webhook/n8n` - n8n webhook receiver
- Lead management endpoints (check `routes/leads.js` for complete list)

### Environment Configuration
Required environment variables (copy `.env.example` to `.env`):

```bash
# Server Configuration
PORT=3002                    # Server port
NODE_ENV=development         # Environment mode

# Database Configuration  
DATABASE_PATH=backend/database/leads.db  # SQLite path (dev)
DATABASE_URL=                           # PostgreSQL URL (production)

# Security
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
API_RATE_LIMIT=100          # Requests per 15 minutes

# Integration
N8N_WEBHOOK_URL=            # n8n automation webhook URL
```

### Deployment Architecture
- **Frontend**: Netlify static hosting with advanced config:
  - `netlify.toml`: SPA redirects, security headers, asset caching, API proxying
  - Auto-minification and compression enabled
  - API proxy: `/api/*` → Railway backend
- **Backend**: Railway app hosting with robust configuration:
  - `railway.json`: Health checks, restart policies, persistent volumes
  - `nixpacks.toml`: Node.js 18, production dependencies
  - Persistent volume: `/app/data` for SQLite storage
  - Healthcheck endpoint: `/api/health` (300s timeout)
- **Database**: 
  - Development: Local SQLite (`backend/database/leads.db`)
  - Production: PostgreSQL on Railway (via DATABASE_URL) or SQLite with persistent volume
- **Automation**: n8n Cloud or self-hosted for lead nurturing
- **Setup**: Automated via `setup.js` with dependency checks and environment setup

### Database Schema
Lead table structure:
- `nome` (VARCHAR) - Full name
- `email` (VARCHAR, UNIQUE) - Email address
- `telefone` (VARCHAR) - Phone number
- `idade` (INTEGER) - Age
- `curso_pretendido` (VARCHAR) - Desired course
- `ip_address` (VARCHAR) - Client IP for analytics
- `user_agent` (TEXT) - Browser info for analytics
- `created_at` (DATETIME) - Timestamp

### Security Implementation
- Helmet.js for security headers (CSP disabled for external CDN resources)
- CORS with configurable origins
- Express rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization in Lead model
- SQL injection protection via prepared statements
- Environment variable validation

### Performance & Optimization
- **Netlify**: Asset minification, compression, CDN caching (1 year for static assets)
- **Railway**: Auto-restart on failure (max 3 retries), health monitoring
- **Frontend**: Three.js optimized for mobile, GSAP animations with reduced motion support
- **Database**: SQLite with WAL mode for better concurrency

### Documentation
- **Setup Guide**: `README.md` (Portuguese) - Quick installation and features
- **n8n Integration**: `docs/N8N_INTEGRATION.md` - Complete automation workflows with templates
- **Deployment Guide**: `docs/DEPLOY_GUIDE.md` - Free hosting setup (Netlify + Railway)

### Troubleshooting
Common issues and solutions:

**CORS Errors**: Check `CORS_ORIGIN` environment variable includes frontend URL
**Database Connection**: Verify `DATABASE_PATH` or `DATABASE_URL` configuration
**n8n Webhook**: Test webhook URL with `curl -X POST {webhook_url} -H "Content-Type: application/json" -d "{}"`
**Deployment Issues**: Check Railway logs with `railway logs --follow`
**3D Scene Performance**: Reduce particle count in `three-scene.js` for low-end devices

### File Structure Reference
```
incode-lead-system/
├── backend/
│   ├── server.js              # Main Express server
│   ├── database/
│   │   ├── init.js           # SQLite initialization
│   │   ├── postgres.js       # PostgreSQL setup
│   │   └── migrate.js        # Database migrations
│   ├── models/Lead.js        # Lead data model
│   └── routes/leads.js       # API routes
├── frontend/
│   ├── index.html            # Main landing page
│   ├── admin.html            # Admin dashboard
│   ├── css/style.css         # Styling
│   └── js/                   # JavaScript modules
├── docs/                     # Comprehensive documentation
├── netlify.toml             # Netlify deployment config
├── railway.json             # Railway deployment config
├── nixpacks.toml           # Build configuration
└── setup.js                # Automated setup script
```