# Propel — Applicant Tracking System for Candidates

Propel is a candidate-centric Applicant Tracking System (ATS) designed to give job seekers the same organizational, analytical, and automation tools traditionally reserved for employers. Instead of managing hiring pipelines, Propel empowers candidates to manage their own job search with AI-powered automation, application tracking, and data-driven insights.

This project was developed as a CS 490 Capstone and is fully deployed as a production-ready, full-stack web application.

## 🌐 Live Application

**Frontend (Vercel):**  
https://cs-490-project.vercel.app/

**Backend API (Render):**  
https://cs490-backend.onrender.com

The application is publicly accessible. Users can create an account and immediately begin using all features.

## 🎯 Project Overview

Traditional Applicant Tracking Systems are built for employers, leaving candidates to manage job searches with spreadsheets, notes, and generic resumes. Propel flips this model by providing job seekers with a centralized, intelligent platform to:

- Organize applications
- Generate tailored resumes and cover letters
- Track progress through the hiring pipeline
- Prepare for interviews
- Analyze job search performance

The goal is to transform job searching from a chaotic process into a strategic, data-driven workflow.

## ✨ Key Features

### Candidate Profile Management
- Centralized professional profile
- Resume, portfolio, and document uploads
- Career timeline tracking

### AI-Powered Content Generation
- Custom resume generation per role
- Personalized cover letters
- ATS keyword optimization
- Professional communication templates

### Job Application Tracking
- Visual pipeline for application stages
- Status tracking and reminders
- Outcome analytics and insights

### Interview Preparation
- AI-generated company research
- Role-specific interview questions
- Mock interview preparation workflows

### Authentication & Security
- Email/password authentication
- Google, LinkedIn, and GitHub OAuth
- Secure JWT-based sessions

### Analytics & Monitoring
- Application success metrics
- Profile completeness scoring
- Usage analytics and error tracking

## 🏗️ Architecture Overview

Propel is a full-stack TypeScript monorepo with a clear separation between frontend and backend.

**Frontend**
- React 18 with TypeScript
- Vite build system
- Tailwind CSS for styling
- Deployed on Vercel

**Backend**
- NestJS v11 (Node.js)
- RESTful API architecture
- Supabase (PostgreSQL)
- Redis for caching
- AI integration via OpenAI
- Deployed on Render

### Repository Structure
```
/
├── frontend/          # React + Vite frontend
├── backend/           # NestJS backend API
├── documentation/     # Project documentation
├── load-tests/        # Performance testing scripts
└── .github/           # CI/CD workflows
```

## 🧰 Technology Stack

### Backend

- **Framework**: NestJS (v11)
- **Language**: TypeScript (ES2023)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Passport.js (JWT, Google OAuth, LinkedIn OAuth, GitHub OAuth), bcrypt
- **AI Services**: OpenAI (GPT-4o-mini)
- **Caching**: Redis (v5.10.0)
- **Email**: Nodemailer
- **File Processing**: 
  - PDF: pdfkit, pdf-parse, jspdf
  - Word: mammoth, docx
  - File uploads: multer
- **Web Scraping**: Cheerio
- **Security**: Helmet, csurf, xss protection, isomorphic-dompurify
- **Monitoring**: Sentry, PostHog
- **Testing**: Jest
- **Other**: Axios, jsonrepair, uuid, validator

### Frontend

- **Framework**: React (v18.3.1)
- **Build Tool**: Vite (v7.1.7)
- **Language**: TypeScript
- **Routing**: React Router DOM (v7.9.4)
- **State Management**: Redux + Redux Thunk
- **Styling**: Tailwind CSS (v3.4.18)
- **UI Components**: 
  - Icons: Heroicons, Lucide React, React Icons
  - Rich Text: React Quill
  - Charts: Recharts
  - Maps: Leaflet + React Leaflet
  - Drag & Drop: @dnd-kit
- **Utilities**: 
  - HTTP: Axios
  - Database: Supabase client
  - Date handling: date-fns
  - PDF generation: html2canvas, jspdf
  - Excel: xlsx
  - Notifications: React Toastify
  - Analytics: PostHog
- **Testing**: Vitest, React Testing Library

## 🚀 Local Development Setup

### Prerequisites

- Node.js 24+ and npm 11+
- Redis (optional, for caching)
- Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Khalid-Itani/CS490-Project.git
   cd ATS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and fill in your actual values
   npm run start:dev
   ```
   
   Backend will run at: `http://localhost:3000`

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env and fill in your actual values
   npm run dev
   ```
   
   Frontend will run at: `http://localhost:5173`

### Environment Variables

#### Backend (`backend/.env`)

Required environment variables for:
- Supabase configuration (URL, keys)
- JWT authentication (secret, expiration)
- OAuth providers (Google, LinkedIn, GitHub)
- Email (SMTP configuration)
- AI services (OpenAI API Key)
- Optional monitoring services (Sentry, PostHog)

See `backend/.env.example` for the complete list and descriptions.

#### Frontend (`frontend/.env`)

Required environment variables for:
- Backend API URL
- Supabase public credentials
- Optional analytics configuration (PostHog)

See `frontend/.env.example` for details.

**Important Security Note**: Frontend environment variables must be prefixed with `VITE_` to be exposed to the browser. Never include backend secrets in the frontend.

## 🧪 Testing

### Backend
```bash
cd backend
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage
```

### Frontend
```bash
cd frontend
npm run test           # Run tests with Vitest
npm run test:ui        # Run tests with UI
npm run test:coverage  # Test coverage
```

## ☁️ Deployment

- **Frontend**: Deployed via Vercel (auto-deploy on main branch)
- **Backend**: Deployed via Render (auto-deploy on main branch)
- **CI/CD**: GitHub Actions workflows for security scanning, backup management, and deployment validation

## 📚 Documentation

Additional documentation can be found in the [`documentation/`](documentation/) folder:
- Feature implementation guides
- Testing guides
- Security documentation
- Deployment guides
- Use case documentation

## 📌 Project Status

The project is feature-complete and deployed. Ongoing work focuses on:
- Performance optimization (Lighthouse scores)
- AI output accuracy
- Profile completeness and prediction quality
- General polish and stability improvements

## 🤝 Contributors

Khalid Itani, Luis Duarte, Michelle Zambrano, Nikoleta Sino, Maryam Mughal, Domenic Toscano

Developed as a CS 490 Capstone project.
