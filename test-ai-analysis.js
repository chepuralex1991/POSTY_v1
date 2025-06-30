// Test AI analysis improvements
import fs from 'fs';
import { analyzeDocument } from './server/ai-service.js';

async function testAIAnalysis() {
  console.log('Testing improved AI analysis...');
  
  // Test with Ukrainian filename
  const testFiles = [
    'Комунальні_платежі_грудень_2024.pdf',
    'council_tax_statement_2024.pdf', 
    'medical_appointment_Dr_Smith.pdf',
    'bank_statement_december.jpg'
  ];
  
  for (const fileName of testFiles) {
    console.log(`\n--- Testing: ${fileName} ---`);
    
    try {
      // Create a mock file for testing (since we're testing filename analysis)
      const mockPath = `./${fileName}`;
      fs.writeFileSync(mockPath, 'Mock document content for testing');
      
      const result = await analyzeDocument(mockPath, fileName);
      
      console.log('Title:', result.title);
      console.log('Summary:', result.summary);
      console.log('Category:', result.category);
      console.log('Reminder Date:', result.reminderDate || 'None');
      console.log('Extracted Text Length:', result.extractedText.length);
      
      // Clean up
      fs.unlinkSync(mockPath);
      
    } catch (error) {
      console.error('Analysis failed:', error.message);
    }
  }
}

testAIAnalysis().catch(console.error);