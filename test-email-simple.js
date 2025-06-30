// Test email configuration with provided credentials
import nodemailer from 'nodemailer';

async function testEmailConfig() {
  console.log('Testing email configuration...');
  
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  if (!config.auth.user || !config.auth.pass) {
    console.error('❌ SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }
  
  try {
    const transporter = nodemailer.createTransporter(config);
    
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');
    
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: `"Posty Mail Manager" <${config.auth.user}>`,
      to: config.auth.user,
      subject: 'Email Configuration Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify the SMTP configuration is working.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✓ Test email sent successfully:', result.messageId);
    console.log('Email notifications are now configured and working!');
    
  } catch (error) {
    console.error('❌ Email configuration failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('Authentication failed - check Gmail App Password');
    } else if (error.code === 'ECONNECTION') {
      console.log('Connection failed - check network and SMTP settings');
    }
  }
}

testEmailConfig().catch(console.error);