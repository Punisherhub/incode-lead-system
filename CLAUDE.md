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
node setup.js       # Run setup script (checks dependencies, creates .env, initializes DB)
```

### Database
- SQLite database automatically initialized on server start
- Located at `backend/database/leads.db`
- Schema managed in `backend/database/init.js`

## Architecture

### Backend Structure
- **Entry Point**: `backend/server.js` - Express server with security middleware (helmet, CORS, rate limiting)
- **Database**: SQLite with initialization in `backend/database/init.js`
- **Models**: `backend/models/Lead.js` - Lead data model with validation
- **Routes**: `backend/routes/leads.js` - API endpoints for lead management
- **Port**: 3001 (configurable via .env PORT)

### Frontend Structure
- **Entry Point**: `frontend/index.html` - SPA with Three.js 3D scene
- **Main App**: `frontend/js/app.js` - Application orchestrator
- **Components**:
  - `frontend/js/three-scene.js` - 3D scene with animated Python code
  - `frontend/js/animations.js` - GSAP animations
  - `frontend/js/form-handler.js` - Form validation and API calls
- **External Libraries**: Three.js, GSAP, Typed.js (loaded via CDN)

### Key Features
- 3D animated background with floating Python code snippets
- Lead capture form with validation
- SQLite database for lead storage
- n8n webhook integration for marketing automation
- Rate limiting and security headers
- Responsive design

### API Endpoints
- `POST /api/leads` - Create new lead
- `GET /api/health` - Health check
- `POST /api/webhook/n8n` - n8n webhook receiver

### Environment Configuration
- Copy `.env.example` to `.env` for local development
- Key variables:
  - `PORT` - Server port (default: 3001)
  - `NODE_ENV` - Environment (development/production)
  - `DATABASE_PATH` - SQLite database path
  - `CORS_ORIGIN` - Allowed CORS origins
  - `N8N_WEBHOOK_URL` - n8n integration URL

### Deployment
- **Frontend**: Netlify (configured via `netlify.toml`)
- **Backend**: Railway (configured via `railway.json`)
- **Database**: SQLite (persisted on Railway)
- Setup automated in `setup.js` script

### Database Schema
Lead table includes: nome, email, telefone, idade, curso_pretendido, ip_address, user_agent, created_at

### Security Features
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation and sanitization
- SQL injection protection via prepared statements