import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import type { User } from '@shared/schema';

// Email configuration interface
interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    address: string;
  };
}

// Get email configuration from environment variables or user settings
function getEmailConfig(user?: any): EmailConfig {
  // If user has custom email config, use it
  if (user?.emailConfig) {
    return {
      smtp: {
        host: user.emailConfig.host,
        port: user.emailConfig.port,
        secure: user.emailConfig.secure,
        auth: {
          user: user.emailConfig.user,
          pass: user.emailConfig.pass,
        },
      },
      from: {
        name: user.emailConfig.fromName || 'Posty',
        address: user.emailConfig.fromEmail || user.emailConfig.user,
      },
    };
  }
  
  // Fall back to global environment variables
  return {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    from: {
      name: process.env.FROM_NAME || 'Posty',
      address: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
    },
  };
}

// Create nodemailer transporter
function createTransporter(user?: any) {
  const config = getEmailConfig(user);
  
  if (!config.smtp.auth.user || !config.smtp.auth.pass) {
    throw new Error('SMTP credentials not configured. Please configure email settings in your profile.');
  }
  
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.auth.user,
      pass: config.smtp.auth.pass,
    },
  });
}

// Interface for letter data
interface LetterData {
  id: number;
  title: string;
  fileName: string;
  imageUrl: string;
  uploadDate: Date;
  summary?: string;
  extractedText?: string;
}

// Send email notification for new letter
export async function sendLetterNotification(user: User, letter: LetterData): Promise<void> {
  try {
    // Early return if user has no email
    if (!user.email) {
      console.error('Cannot send email notification: user has no email address');
      return;
    }

    const config = getEmailConfig(user);
    const transporter = createTransporter(user);
    
    // Construct file path
    const filePath = path.join(process.cwd(), letter.imageUrl.replace(/^\//, ''));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found for email attachment: ${filePath}`);
      throw new Error(`File not found: ${letter.fileName}`);
    }
    
    // Determine file extension and MIME type
    const fileExt = path.extname(letter.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (['.jpg', '.jpeg'].includes(fileExt)) {
      contentType = 'image/jpeg';
    } else if (fileExt === '.png') {
      contentType = 'image/png';
    } else if (fileExt === '.pdf') {
      contentType = 'application/pdf';
    }
    
    // Create email content
    const userName = user.firstName || user.email?.split('@')[0] || 'User';
    const subject = 'Your scanned letter from Posty';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Letter is Ready!</h2>
        <p>Hi ${userName},</p>
        <p>Your letter "<strong>${letter.title}</strong>" has been successfully processed and is ready for review.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">Document Details:</h3>
          <ul style="color: #666;">
            <li><strong>Title:</strong> ${letter.title}</li>
            <li><strong>File:</strong> ${letter.fileName}</li>
            <li><strong>Processed:</strong> ${letter.uploadDate.toLocaleDateString()}</li>
          </ul>
        </div>
        
        ${letter.summary ? `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">AI Summary:</h4>
          <p style="color: #424242; margin-bottom: 0;">${letter.summary}</p>
        </div>
        ` : ''}
        
        ${letter.extractedText ? `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h4 style="margin-top: 0; color: #388e3c;">Extracted Text (OCR):</h4>
          <div style="font-family: monospace; font-size: 12px; color: #424242; white-space: pre-wrap; max-height: 300px; overflow-y: auto; background: white; padding: 10px; border-radius: 4px;">${letter.extractedText}</div>
        </div>
        ` : ''}
        
        <p>You can find the scanned document attached to this email or view it in your Posty dashboard.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.APP_URL || 'https://mail-smart-chepuralex1991.replit.app'}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Posty Dashboard
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">
          This email was sent automatically by Posty. If you have any questions, please contact support.
        </p>
      </div>
    `;
    
    const textBody = `
Hi ${userName},

Your letter "${letter.title}" has been successfully processed and is ready for review.

Document Details:
- Title: ${letter.title}
- File: ${letter.fileName}
- Processed: ${letter.uploadDate.toLocaleDateString()}

${letter.summary ? `
AI Summary:
${letter.summary}
` : ''}

${letter.extractedText ? `
Extracted Text (OCR):
${letter.extractedText}
` : ''}

You can find the scanned document attached to this email or view it in your Posty dashboard at ${process.env.APP_URL || 'https://mail-smart-chepuralex1991.replit.app'}.

This email was sent automatically by Posty.
    `;
    
    // Email options
    const mailOptions = {
      from: `${config.from.name} <${config.from.address}>`,
      to: user.email,
      subject: subject,
      text: textBody,
      html: htmlBody,
      attachments: [
        {
          filename: letter.fileName,
          path: filePath,
          contentType: contentType,
        },
      ],
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${user.email}:`, {
      messageId: info.messageId || 'unknown',
      letterTitle: letter.title,
      fileName: letter.fileName,
    });
    
  } catch (error) {
    console.error('Failed to send letter notification email:', {
      userEmail: user.email,
      letterTitle: letter.title,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Don't throw the error to prevent breaking the letter creation process
    // Log it for monitoring and debugging purposes
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid and SMTP server is reachable.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred.',
    };
  }
}

// Send test email
export async function sendTestEmail(toEmail: string): Promise<void> {
  const config = getEmailConfig();
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `${config.from.name} <${config.from.address}>`,
    to: toEmail,
    subject: 'Posty Email Test',
    text: 'This is a test email from Posty to verify email configuration.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Configuration Test</h2>
        <p>This is a test email from Posty to verify that email notifications are working correctly.</p>
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`Test email sent successfully to ${toEmail}`);
}