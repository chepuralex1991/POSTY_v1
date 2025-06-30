# Posty - Smart Mail Management Application

A sophisticated AI-powered document management web application specializing in multilingual optical character recognition (OCR) and intelligent document processing. Posty helps you digitize, organize, and manage your physical mail with advanced AI analysis and automated categorization.

## 🌟 Features

### 📄 Document Processing
- **Smart Upload**: Drag-and-drop interface supporting images (JPEG, PNG) and PDF documents
- **AI-Powered Analysis**: Automatic document categorization using OpenAI GPT-4o
- **Multilingual OCR**: Advanced text extraction supporting Ukrainian, Russian, and English
- **1:1 Text Extraction**: Preserves original document content with character-by-character accuracy
- **Intelligent Categorization**: Automatically sorts documents into bills, appointments, personal, government, insurance, NHS, and promotional categories

### 🔐 Security & Authentication
- **Multiple Login Options**: Email/password, Google OAuth, and Apple OAuth support
- **Secure Sessions**: JWT-based authentication with HttpOnly cookies
- **User Data Isolation**: Each user can only access their own documents
- **Password Security**: Bcrypt hashing for secure password storage
- **Rate Limiting**: Protection against brute force attacks

### 📧 Email Notifications
- **Automatic Alerts**: Get notified when new documents are uploaded
- **Rich HTML Templates**: Beautiful email notifications with document details
- **Document Attachments**: Original files included in notification emails
- **AI Summary Delivery**: Complete analysis results sent via email
- **SMTP Integration**: Configurable email providers (Gmail, Outlook, etc.)

### 📱 User Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live document processing and status updates
- **Advanced Search**: Filter documents by category, date, or content
- **Custom Categories**: Create your own document categories
- **Document Preview**: View documents directly in the browser
- **Calendar Integration**: Generate calendar reminders for important documents

### 🗂️ Organization & Management
- **Smart Filtering**: Category-based filtering and search functionality
- **Reminder System**: Set and track document-related deadlines
- **Bulk Operations**: Delete multiple documents at once
- **Export Options**: Download documents and data
- **Profile Management**: Customize settings and preferences

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd posty
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   
   # OpenAI API
   OPENAI_API_KEY="your_openai_api_key_here"
   
   # Authentication
   JWT_SECRET="your_jwt_secret_here"
   
   # Email Configuration (Gmail)
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-gmail-app-password"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   FROM_NAME="Posty Mail Manager"
   FROM_EMAIL="your-email@gmail.com"
   
   # OAuth (Optional)
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

### Email Setup (Gmail)

To receive email notifications:

1. Enable 2-Step Verification in your Google Account
2. Go to Security → App passwords
3. Generate a new app password for "Mail"
4. Use the 16-character password as `SMTP_PASS` in your environment variables

## 📖 How to Use

### 1. **Create an Account**
- Sign up with email/password or use Google/Apple OAuth
- Verify your email address if using email registration

### 2. **Upload Documents**
- Drag and drop documents onto the upload area
- Supported formats: JPG, PNG, PDF
- Wait for AI analysis to complete (usually 5-10 seconds)

### 3. **Review Analysis**
- Click on any document to view detailed analysis
- Review AI-generated title, summary, and category
- Check extracted text for accuracy
- Edit details if needed

### 4. **Organize Documents**
- Use category filters to find specific document types
- Create custom categories for your needs
- Set reminders for important deadlines
- Search documents by content or title

### 5. **Manage Notifications**
- Configure email notification preferences in Settings
- Receive automatic alerts for new document uploads
- Get AI analysis results delivered to your inbox

## 🛠️ Configuration

### Document Categories
- **Bills**: Utility bills, invoices, tax documents
- **Appointments**: Medical appointments, meetings, bookings
- **Personal**: Personal correspondence, tickets, receipts
- **Government**: Official documents, tax forms, permits
- **Insurance**: Policies, claims, coverage documents
- **NHS**: Medical documents, prescriptions, health records
- **Promotional**: Marketing materials, offers, advertisements

### Supported Languages
- **English**: Full OCR and analysis support
- **Ukrainian**: Native Cyrillic text recognition
- **Russian**: Complete text extraction and processing

### File Formats
- **Images**: JPEG, JPG, PNG (up to 10MB)
- **Documents**: PDF files (analyzed by filename and content patterns)

## 🔧 Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side navigation
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with secure HttpOnly cookies
- **File Upload**: Multer for multipart form handling
- **Email**: Nodemailer with SMTP support

### AI & Processing
- **OCR**: OpenAI GPT-4o Vision API
- **Analysis**: Custom prompts for multilingual document processing
- **Text Extraction**: 1:1 character accuracy preservation
- **Categorization**: Intelligent document type detection

## 🔒 Security Features

- **Secure Authentication**: JWT tokens with HttpOnly cookies
- **Password Hashing**: Bcrypt for secure password storage
- **Rate Limiting**: Protection against abuse and attacks
- **CORS Protection**: Configured for production security
- **Content Security Policy**: Prevents XSS attacks
- **User Isolation**: Complete data separation between users

## 📊 Performance

- **Fast Upload Processing**: Optimized file handling and analysis
- **Efficient Database**: Indexed queries and optimized schema
- **Caching**: Static file caching and query optimization
- **Background Processing**: Non-blocking email notifications
- **Responsive Design**: Optimized for all device sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation wiki

## 🗓️ Changelog

### Recent Updates (June 2025)
- ✅ Enhanced AI analysis for Ukrainian/Russian document support
- ✅ Fixed document categorization and OCR accuracy
- ✅ Improved email notification system with Gmail integration
- ✅ Added comprehensive user authentication and security
- ✅ Implemented real-time document processing and preview
- ✅ Enhanced search and filtering capabilities
- ✅ Added custom category management
- ✅ Improved responsive design and user experience

---

**Posty** - Transforming physical mail management with AI-powered intelligence.