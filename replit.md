# Posty - Smart Mail Management Application

## Overview

Posty is a sophisticated AI-powered document management web application specializing in multilingual optical character recognition (OCR) and intelligent document processing. The application helps users digitize, organize, and manage their physical mail through automated analysis, categorization, and notification systems.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing with URL state management
- **State Management**: TanStack Query (React Query) for server state with optimistic updates
- **UI Components**: Radix UI primitives with shadcn/ui design system and Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Context-based auth provider with cookie-based sessions

### Backend Architecture
- **Runtime**: Node.js with Express.js server using TypeScript ES modules
- **Authentication**: Multi-provider OAuth (Google, Apple) and email/password with JWT tokens
- **File Processing**: Multer middleware for uploads with AI-powered document analysis
- **Database**: Drizzle ORM with PostgreSQL via Neon serverless driver
- **Security**: Helmet, CORS, rate limiting, and bcrypt password hashing

### Database Schema
- **Users**: Multi-provider authentication with profile data and settings
- **Mail Items**: User-scoped documents with AI analysis results and file references
- **User Settings**: Customizable preferences for notifications and UI
- **Sessions**: Secure session storage for authentication state

## Key Components

### Document Processing Pipeline
1. **File Upload**: Drag-and-drop interface supporting PDF, JPEG, PNG formats
2. **OCR Processing**: Two-step extraction using OpenAI GPT-4o for multilingual text recognition
3. **AI Analysis**: Automatic categorization, title generation, and summary creation
4. **Metadata Extraction**: Smart detection of dates, categories, and reminder requirements
5. **File Storage**: Local filesystem storage with organized directory structure

### Authentication System
- **OAuth Integration**: Google and Apple OAuth with proper callback handling
- **Email Authentication**: Traditional email/password with secure password hashing
- **Session Management**: HttpOnly cookies with JWT tokens for security
- **User Isolation**: All data operations scoped to authenticated user

### Email Notification Service
- **SMTP Configuration**: Support for Gmail, Outlook, Yahoo with auto-detection
- **Rich Templates**: HTML email notifications with document attachments
- **Event Triggers**: Automatic notifications on document upload and processing
- **Provider Setup**: Guided setup wizard for email configuration

### Document Management
- **Smart Categorization**: Pre-defined categories (bills, appointments, government, etc.)
- **Custom Categories**: User-defined category creation and management
- **Advanced Search**: Full-text search across titles, summaries, and extracted content
- **Filter System**: Category-based filtering with URL state persistence
- **Calendar Integration**: Reminder generation for Google Calendar and iCal formats

## Data Flow

1. **User uploads document** → Multer processes file → Stores in uploads directory
2. **AI Service analyzes** → OpenAI OCR extraction → Text analysis → Metadata generation
3. **Database storage** → User-scoped mail item creation → Response to client
4. **Email notification** → Background email service → SMTP delivery with attachment
5. **Frontend updates** → React Query invalidation → UI refresh with new document

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Document OCR and content analysis
- **pdf2pic**: PDF to image conversion for OCR processing

### Authentication Providers
- **Google OAuth**: Google Cloud Console integration with proper redirect URIs
- **Apple OAuth**: Apple Developer Console setup with team ID and certificates

### Email Services
- **SMTP Providers**: Gmail (app passwords), Outlook, Yahoo Mail
- **Nodemailer**: Email delivery with HTML templates and attachments

### Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL with connection pooling
- **Local File System**: Document storage with organized directory structure

## Deployment Strategy

### Production Configuration
- **Environment Variables**: Comprehensive configuration for all services
- **Database Migrations**: Drizzle Kit for schema management and updates
- **Build Process**: Vite production build with Express server bundling
- **Security Headers**: Helmet configuration with CORS and rate limiting

### Development Setup
- **Hot Reload**: Vite development server with Express middleware
- **Database Seeding**: Development data population scripts
- **Environment Management**: Separate dev/prod configurations

## Changelog

Changelog:
- June 30, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.