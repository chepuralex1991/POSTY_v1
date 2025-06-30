// Test email integration within the Posty application context
import { sendLetterNotification, testEmailConfiguration } from './server/email-service.js';

// Mock user and letter data for testing
const mockUser = {
  id: 'test_user',
  email: process.env.SMTP_USER || 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

const mockLetter = {
  id: 999,
  title: 'Test Council Tax Document',
  fileName: 'council-tax-test.pdf',
  imageUrl: '/uploads/test-file.pdf',
  uploadDate: new Date()
};

async function testEmailIntegration() {
  console.log('🧪 Testing Posty Email Integration');
  console.log('================================');
  
  // Check environment variables for testing
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Email credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }
  
  try {
    // Test 1: Email configuration
    console.log('\n1️⃣ Testing email configuration...');
    const configResult = await testEmailConfiguration();
    console.log('Config test result:', configResult);
    
    if (!configResult.success) {
      console.error('❌ Email configuration failed');
      return;
    }
    
    // Test 2: Letter notification (without actual file)
    console.log('\n2️⃣ Testing letter notification email...');
    
    // Create a mock file for attachment test
    import fs from 'fs';
    const mockFilePath = './test-document.txt';
    fs.writeFileSync(mockFilePath, 'This is a test document for email attachment testing.');
    
    const testLetter = {
      ...mockLetter,
      imageUrl: mockFilePath
    };
    
    await sendLetterNotification(mockUser, testLetter);
    console.log('✅ Letter notification sent successfully');
    
    // Clean up
    fs.unlinkSync(mockFilePath);
    
    console.log('\n🎉 All email integration tests passed!');
    console.log('📧 Check your email at', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('❌ Email integration test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmailIntegration().catch(console.error);