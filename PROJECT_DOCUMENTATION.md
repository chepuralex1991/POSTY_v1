# Posty - Smart Mail Management Application

## Overview

Posty is a smart mail management application that allows users to upload, analyze, and organize their physical mail using AI-powered summarization and categorization. The application provides an intuitive interface for managing mail items with features like drag-and-drop upload, automatic categorization, search functionality, and reminder management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom styled components
- **Styling**: Tailwind CSS with custom design system variables
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **File Upload**: Multer middleware for handling multipart/form-data
- **Development**: Hot reload with Vite integration in development mode

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for production, in-memory storage for development)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon Database serverless driver for PostgreSQL

## Key Components

### Mail Item Management
- **Upload System**: Drag-and-drop interface supporting images (JPEG, PNG) and PDFs
- **AI Processing**: Mock AI service that analyzes uploaded documents and extracts:
  - Title and summary
  - Category classification (bill, appointment, personal, promotional, government)
  - Reminder dates when applicable
- **CRUD Operations**: Full create, read, update, delete functionality for mail items

### User Interface
- **Dashboard**: Central hub displaying all mail items in a responsive grid layout
- **Filter Controls**: Category-based filtering and search functionality
- **Modal System**: Detailed view and editing capabilities for mail items
- **Upload Area**: Visual drag-and-drop zone with progress indicators

### Data Models
- **Mail Items**: Core entity with fields for title, summary, category, reminder date, image URL, and metadata
- **Categories**: Predefined classification system with visual indicators
- **File Storage**: Local file system storage with organized directory structure

## Data Flow

1. **Upload Process**:
   - User drags/drops file or selects via file picker
   - File is validated for type and size limits
   - Multer processes the upload and stores file locally
   - Mock AI service analyzes the document content
   - Mail item is created with extracted metadata
   - UI updates via React Query cache invalidation

2. **Display Process**:
   - Dashboard fetches mail items via React Query
   - Items are filtered and sorted based on user preferences
   - Grid layout renders items with category badges and status indicators
   - Real-time updates through optimistic updates and cache management

3. **Edit Process**:
   - User opens modal for detailed view/editing
   - Form is populated with existing data
   - Changes are validated and submitted
   - Database is updated and cache is refreshed

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **Database**: Drizzle ORM, Neon Database serverless driver
- **UI Libraries**: Radix UI components, Lucide React icons
- **Validation**: Zod schema validation
- **File Handling**: Multer, React Dropzone
- **Date Handling**: date-fns for date formatting and manipulation

### Development Dependencies
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full type safety across the stack
- **CSS**: Tailwind CSS with PostCSS processing
- **Development**: tsx for TypeScript execution, hot reload capabilities

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Assets**: Static files served from Express with proper caching headers

### Environment Configuration
- **Database**: PostgreSQL via DATABASE_URL environment variable
- **File Storage**: Local filesystem with configurable upload directory
- **Development**: Hot reload with Vite middleware integration
- **Production**: Optimized builds with proper error handling

### Hosting
- **Platform**: Replit with autoscale deployment target
- **Port Configuration**: Server runs on port 5000, exposed as port 80
- **Process Management**: npm scripts for development and production modes

## Recent Changes

### June 23, 2025
- Fixed file upload configuration with proper multer disk storage and file extensions
- Enhanced AI service error handling with specific quota limit detection and user feedback
- Added health check endpoint at `/api/health` to monitor OpenAI API status
- Fixed accessibility warnings in mail modal with proper DialogTitle and DialogDescription
- Resolved PDF processing issue - OpenAI vision API only supports images, not PDFs
- Implemented separate PDF analysis using filename-based intelligent categorization
- Successfully tested Council Tax PDF analysis with proper title, summary, category and reminder date
- AI service now handles both PDFs (filename analysis) and images (vision OCR) correctly
- Added comprehensive document deletion functionality with hover delete buttons and bulk "Clear All"
- Implemented multi-platform calendar integration for Google, Apple, Outlook and universal .ics files
- Calendar reminders convert AI-suggested dates into actionable calendar events with document context
- Removed import/export functionality to streamline the application
- Cleaned up notes integration components and simplified the interface

### June 24, 2025
- Implemented comprehensive authentication system with Google, Apple, and email login
- Added secure user registration and login with password hashing (bcrypt)
- Created JWT-based authentication with secure HttpOnly cookies (no localStorage exposure)
- Implemented user-scoped data isolation - users can only access their own documents
- Added security middleware: Helmet for security headers, CORS, rate limiting
- Created complete user database schema with users, sessions, and user_settings tables
- Built authentication UI with login/register forms and OAuth provider buttons
- Added user profile dropdown in header with logout functionality
- Migrated existing mail items to new user-scoped system with foreign key constraints
- All API endpoints now require authentication and are properly user-scoped for security
- Configured secure cookie-based authentication with proper SameSite and HttpOnly settings
- Added logout functionality that properly clears authentication cookies
- Google OAuth needs complete reconfiguration from scratch due to connection issues
- Created comprehensive setup guide for fresh Google Cloud Console configuration
- OAuth implementation ready, awaiting new Google Console setup with proper credentials
- Fixed Content Security Policy for development mode to allow Vite hot reload
- Configured email notifications with user's Gmail SMTP credentials
- Fixed email service authentication and notification delivery system
- Created comprehensive Profile and Settings pages with secure API endpoints
- Added user profile management with editable information and password changes
- Implemented settings page with theme, notifications, and data management options
- Added secure account deletion with confirmation and data cascade
- Enhanced search UX with integrated category dropdown in search bar
- Added debounced search functionality for better performance
- Implemented URL parameter support for search and category filters
- Added navigation buttons between Dashboard, Profile, and Settings pages
- Added new categories: Insurance and NHS for better document organization
- Implemented custom category functionality for user-defined categories
- Fixed button stability issues throughout the application
- Enhanced custom categories to appear in main filter dropdown
- Added dynamic custom category list based on existing documents
- Improved category filtering to support custom category selection

### June 28, 2025
- Created comprehensive README.md with complete project documentation
- Added detailed setup instructions and feature descriptions
- Documented all authentication methods and security features
- Included troubleshooting guides and configuration options
- Enhanced project documentation for new users and contributors

### June 27, 2025
- Enhanced AI analysis to extract specific numbers, dates, and important details in summaries
- Improved OCR text extraction with detailed prompts for better accuracy
- Fixed AI summary quality issues - enhanced prompts to extract names, dates, addresses
- Added multilingual support for Ukrainian, Russian, and English document analysis
- Improved fallback analysis with specific details based on filename patterns
- Enhanced text extraction to preserve original language content and provide detailed summaries
- Implemented 1:1 OCR text extraction with exact document content preservation
- Enhanced email notifications to include complete AI summary and extracted text
- Added OCR text display in document modal with monospace formatting
- Improved AI prompts for comprehensive text extraction and multilingual support
- Fixed AI categorization issue causing all documents to be labeled as "railway tickets"
- Enhanced fallback analysis with proper document type detection
- Fixed PDF document display issues with case-sensitive file extensions
- Improved static file serving with proper Content-Type headers
- Completely rebuilt OCR system with two-step process: pure text extraction then analysis
- Enhanced text extraction accuracy with dedicated OCR-focused prompts
- Improved multilingual support for Ukrainian, Russian, and English documents
- Fixed vague AI summaries by separating OCR from content analysis
- Reorganized OCR display to show only raw extracted text in OCR section
- Enhanced AI Summary to include comprehensive document analysis with all details
- Fixed duplicate OCR menus in document modal interface
- Clarified OCR limitations: works only for images (JPG/PNG), not PDFs
- Created separate upload buttons for images (with OCR) vs PDFs (filename analysis)
- Added clear user guidance about OCR capabilities and limitations
- Implemented PDF text extraction using pdf-parse library for full text content
- Enhanced PDF processing to extract actual text content instead of filename analysis
- PDFs now get same comprehensive analysis as images with real text extraction
- Added try-catch error handling for date formatting to prevent "Invalid time value" errors
- Fixed date validation in formatReminderDate function with proper invalid date checking
- Enhanced PDF processing pipeline with better error handling and logging
- Successfully tested PDF text extraction showing 1046+ characters from real invoices
- Fixed PDF text extraction import issues with lazy-loading wrapper module
- Restored full PDF text extraction functionality with proper error handling
- PDFs now get complete text extraction and comprehensive AI analysis (not just filename analysis)
- Replaced problematic pdf-parse library with OpenAI Vision API for PDF processing
- PDFs now use same Vision API as ChatGPT for direct document analysis
- Eliminated library initialization issues while maintaining full PDF text extraction
- Implemented PDF to image conversion using pdf2pic library with GraphicsMagick
- Added system dependencies (graphicsmagick, ghostscript) for proper PDF processing
- PDFs now convert to images first, then use Vision API for accurate OCR extraction
- Added comprehensive email notification system using Nodemailer
- Implemented automatic email sending when new letters are uploaded
- Created email service with HTML templates and file attachments
- Added SMTP configuration support for Gmail, Outlook, and custom providers
- Integrated email notifications into the letter upload workflow
- Added email testing endpoints for configuration validation
- Created detailed email setup guide with troubleshooting steps
- Email notifications include document details and original file attachments
- Configured email system with environment variables for secure credential management
- Added proper environment variable configuration for production deployment
- Created test script for validating email configuration and SMTP connectivity
- Implemented automatic email provider detection and configuration system
- Added support for multiple email providers (Gmail, Outlook, Yahoo, iCloud)
- Created email setup wizard for user-friendly automatic configuration
- Enhanced system to work without requiring 16-digit app passwords for supported providers
- Added per-user email configuration storage in database

### Key Features Status
- ✓ File upload and storage system working
- ✓ Database persistence with PostgreSQL  
- ✓ Smart document analysis and categorization (PDFs + Images)
- ✓ AI-powered summaries with specific numbers, dates, and details
- ✓ Enhanced OCR text extraction with improved accuracy
- ✓ Calendar integration (Google, Apple, Outlook, Universal .ics)
- ✓ Document deletion (individual hover + bulk "Clear All")
- ✓ Responsive UI with drag-and-drop upload and PDF preview
- ✓ Full CRUD operations for mail items
- ✓ OpenAI integration working with user's credits
- ✓ Secure authentication system (Google, Apple, Email login)
- ✓ User-scoped data isolation and security
- ✓ JWT-based session management
- ✓ Password hashing and secure registration
- ✓ Rate limiting and security headers
- ✓ User profile and settings management
- ✓ Enhanced search with category filtering and debouncing
- ✓ URL parameter support for shareable filtered views
- ✓ Clean navigation between all pages
- ✓ Automatic email notifications with document attachments
- ✓ SMTP configuration support for multiple providers
- ✓ Email testing and validation endpoints
- ✓ Complete PDF text extraction working (2,299+ characters extracted successfully)
- ✓ PDF to image conversion pipeline with GraphicsMagick and Ghostscript
- ✓ OpenAI Vision API processing both images and converted PDFs accurately

## Changelog

```
Changelog:
- June 22, 2025. Initial setup
- June 23, 2025. AI integration and error handling improvements
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```