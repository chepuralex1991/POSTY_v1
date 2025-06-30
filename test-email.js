// Quick test script to verify email configuration
import nodemailer from 'nodemailer';

async function testEmail() {
  console.log('Testing email configuration...');
  
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  console.log('SMTP Config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    pass: config.auth.pass ? '***masked***' : 'NOT SET'
  });

  if (!config.auth.user || !config.auth.pass) {
    console.error('❌ SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport(config);
    
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    const testEmail = {
      from: `Posty <${config.auth.user}>`,
      to: config.auth.user,
      subject: 'Posty Email Test - ' + new Date().toLocaleString(),
      text: 'This is a test email from Posty to verify email notifications are working.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">✅ Email Test Successful!</h2>
          <p>This test email confirms that Posty can send email notifications.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${config.auth.user}</p>
          <p>Your email notification system is ready for production use.</p>
        </div>
      `
    };
    
    console.log('Sending test email...');
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId || 'unknown');
    console.log('📧 Check your inbox at:', config.auth.user);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your Gmail app password.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('SMTP server not found. Check SMTP_HOST setting.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check SMTP_PORT and firewall settings.');
    }
  }
}

// Run the test
testEmail().catch(console.error);