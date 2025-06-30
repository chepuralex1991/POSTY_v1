import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fromPath } from "pdf2pic";
import { type Category } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIAnalysisResult {
  title: string;
  summary: string;
  category: Category;
  categories: Category[];
  customCategories: string[];
  reminderDate?: string;
  extractedText: string;
}

export async function analyzeDocument(filePath: string, fileName: string): Promise<AIAnalysisResult> {
  try {
    const ext = path.extname(fileName).toLowerCase();
    
    // Handle PDFs by converting to images first, then using OCR
    if (ext === '.pdf') {
      console.log('Processing PDF by converting to image first:', fileName);
      
      try {
        // Convert PDF to image using pdf2pic
        const convertPDF = fromPath(filePath, {
          density: 100,           // Good quality, faster processing
          saveFilename: "page",
          savePath: path.dirname(filePath),
          format: "jpg",          // JPG works better than PNG
          width: 1000,
          height: 1000
        });

        // Convert first page to image
        const pageResult = await convertPDF(1, { responseType: "buffer" });
        
        if (!pageResult.buffer) {
          throw new Error('Failed to convert PDF to image');
        }

        // Convert image buffer to base64
        const base64Image = pageResult.buffer.toString('base64');
        
        if (base64Image.length === 0) {
          throw new Error('PDF conversion produced empty image');
        }
        
        console.log('PDF converted to image successfully, processing with OCR');

        // First, extract text with OCR-focused prompt
        const ocrResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an expert OCR (Optical Character Recognition) system. Extract ALL visible text from the document with 100% accuracy. Maintain original formatting, line breaks, and spacing exactly as shown. Include all text, numbers, dates, addresses, company names, and any other written content. Provide only the extracted text without any analysis or interpretation."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract ALL text from this PDF document (converted to image) with exact precision. Include every word, number, date, and detail visible in the document. Maintain original formatting and spacing.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        });

        const extractedText = ocrResponse.choices[0].message.content || "";
        
        console.log('PDF OCR Extraction Result:', {
          fileName: fileName,
          extractedLength: extractedText.length,
          extractedPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
          hasText: extractedText.length > 0
        });

        // Second, analyze the extracted text for comprehensive metadata
        const analysisResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Analyze the extracted text to provide comprehensive document metadata. Return JSON with:
{
  "title": "Descriptive title based on content",
  "summary": "COMPREHENSIVE analysis including: document type, key details (names, addresses, dates, amounts, reference numbers), purpose, required actions, deadlines, and all important information from the document",
  "category": "bill, appointment, personal, promotional, government, insurance, nhs",
  "reminderDate": "YYYY-MM-DD if action needed, null otherwise"
}

Make the summary very detailed with ALL specific information:
- Company/organization names and contact details
- Personal names, addresses, phone numbers
- All dates, amounts, reference numbers
- Document purpose and key details
- Required actions or deadlines
- Any important terms or conditions

Categories:
- bill: Utilities, invoices, taxes, payments
- appointment: Medical, meetings, bookings
- personal: Letters, tickets, receipts
- government: Official documents, permits
- insurance: Policies, claims, coverage
- nhs: Medical records, prescriptions
- promotional: Marketing, offers`
            },
            {
              role: "user",
              content: `Analyze this extracted text from PDF document "${fileName}":

${extractedText}

Provide comprehensive analysis including:
- Document type and purpose
- ALL names, addresses, phone numbers, emails
- ALL dates, amounts, reference/account numbers
- Key terms, conditions, or requirements
- Required actions and deadlines
- Important details for document management

Create a detailed summary with specific information for easy reference.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000
        });

        const analysisResult = JSON.parse(analysisResponse.choices[0].message.content || '{}');
        
        return {
          title: analysisResult.title || `PDF Document - ${fileName}`,
          summary: analysisResult.summary || "PDF document processed successfully via image conversion and OCR.",
          category: validateCategory(analysisResult.category) || "personal",
          categories: [validateCategory(analysisResult.category) || "personal"],
          customCategories: [],
          reminderDate: analysisResult.reminderDate || null,
          extractedText: extractedText // Use the OCR extracted text
        };
        
      } catch (pdfError) {
        console.log('PDF to image conversion failed, using filename analysis:', pdfError);
        
        // Fallback to filename-based analysis
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a document analysis expert. Analyze PDF filenames to provide intelligent categorization and detailed insights.

Provide JSON response with:
- title: Descriptive document title
- summary: Comprehensive analysis with likely content details 
- category: bill, appointment, personal, promotional, government, insurance, nhs
- reminderDate: Estimated deadline if applicable (YYYY-MM-DD or null)

Include specific details like likely amounts, dates, organizations, and purposes based on filename patterns.

Current date: ${new Date().toISOString().split('T')[0]}`
            },
            {
              role: "user",
              content: `Analyze PDF filename: ${fileName}

Provide intelligent analysis with specific details based on document type patterns. Include likely amounts, dates, contact information, and action items that would typically appear in this type of document.`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
          title: result.title || `PDF - ${fileName}`,
          summary: result.summary || "PDF document analyzed based on filename.",
          category: validateCategory(result.category) || "personal",
          categories: [validateCategory(result.category) || "personal"],
          customCategories: [],
          reminderDate: result.reminderDate || null,
          extractedText: `PDF Processing Failed - ${fileName}\n\nThis PDF could not be converted to image for OCR processing. Possible reasons:\n- PDF format not compatible with conversion library\n- File corrupted or password protected\n- Insufficient system resources\n\nTry converting manually to image format (JPG/PNG) for full OCR processing.\n\nAnalysis based on filename patterns.`
        };
      }
    }
    
    // Handle images with vision API
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    // First, extract text with OCR-focused prompt
    const ocrResponse = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional OCR system. Your ONLY job is to extract ALL visible text from documents exactly as written.

CRITICAL OCR RULES:
- Extract EVERY word, number, symbol visible in the document
- Preserve original spelling, capitalization, and punctuation
- Keep original language (Ukrainian/Russian/English) - DO NOT translate
- Maintain line breaks and spacing where possible
- Include headers, footers, stamps, watermarks, handwritten text
- Transcribe EVERYTHING readable, even if partially obscured

For Ukrainian/Russian: Preserve Cyrillic characters exactly (е, і, ї, є, ґ, etc.)
For numbers: Include ALL digits, decimals, currency symbols
For dates: Extract exactly as shown (28.11.2022, 11/28/2022, etc.)

Output the complete text transcription only - no analysis, no summary, just pure text extraction.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL visible text from this document. Include everything readable:
- Every word and number exactly as written
- All company names, addresses, phone numbers
- Dates, amounts, reference numbers
- Headers, footers, stamps
- Any Cyrillic text in original form
- Handwritten notes or annotations

File: ${fileName}

Provide complete text transcription without any analysis.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 3000
    });

    const extractedText = ocrResponse.choices[0].message.content?.trim() || "";
    
    // Log the OCR extraction for debugging
    console.log('OCR Extraction Result:', {
      fileName: fileName,
      extractedLength: extractedText.length,
      extractedPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
      isEmptyOrShort: extractedText.length < 50
    });
    
    // Check if OCR extraction failed or returned minimal content
    if (extractedText.length < 20 || extractedText.toLowerCase().includes('unable to')) {
      console.log('OCR extraction appears insufficient, may need better image processing');
    }

    // Then, analyze the extracted text for categorization and summary
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the extracted text to provide comprehensive document metadata. Return JSON with:
{
  "title": "Descriptive title based on content",
  "summary": "COMPREHENSIVE analysis including: document type, key details (names, addresses, dates, amounts, reference numbers), purpose, required actions, deadlines, and all important information from the document",
  "category": "bill, appointment, personal, promotional, government, insurance, nhs",
  "reminderDate": "YYYY-MM-DD if action needed, null otherwise"
}

Make the summary very detailed with ALL specific information:
- Company/organization names and contact details
- Personal names, addresses, phone numbers
- All dates, amounts, reference numbers
- Document purpose and key details
- Required actions or deadlines
- Any important terms or conditions

Categories:
- bill: Utilities, invoices, taxes, payments
- appointment: Medical, meetings, bookings
- personal: Letters, tickets, receipts
- government: Official documents, permits
- insurance: Policies, claims, coverage
- nhs: Medical records, prescriptions
- promotional: Marketing, offers`
        },
        {
          role: "user",
          content: `Analyze this extracted text from document "${fileName}":

${extractedText}

Provide comprehensive analysis including:
- Document type and purpose
- ALL names, addresses, phone numbers, emails
- ALL dates, amounts, reference/account numbers
- Key terms, conditions, or requirements
- Required actions and deadlines
- Important details for document management

Create a detailed summary with specific information for easy reference.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const analysisResult = JSON.parse(analysisResponse.choices[0].message.content || '{}');
    
    return {
      title: analysisResult.title || `Document - ${fileName}`,
      summary: analysisResult.summary || "Document processed successfully.",
      category: validateCategory(analysisResult.category) || "personal",
      categories: [validateCategory(analysisResult.category) || "personal"],
      customCategories: [],
      reminderDate: analysisResult.reminderDate || undefined,
      extractedText: extractedText // Use the actual OCR extracted text
    };

  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Log specific error for debugging OCR issues
    if (error instanceof Error) {
      console.error('OCR Error details:', {
        message: error.message,
        fileName: fileName,
        fileExt: path.extname(fileName)
      });
    }
    
    // Enhanced fallback analysis based on filename patterns
    return generateEnhancedFallback(fileName, error);
  }
}

function validateCategory(category: string): Category {
  const validCategories: Category[] = ["bill", "appointment", "personal", "promotional", "government", "insurance", "nhs"];
  return validCategories.includes(category as Category) ? (category as Category) : "personal";
}

function generateEnhancedFallback(fileName: string, error: any): AIAnalysisResult {
  const lowerFileName = fileName.toLowerCase();
  
  let category: Category = "personal";
  let title = fileName.replace(/\.[^/.]+$/, "");
  let summary = "";
  let reminderDate: string | undefined;
  
  // More comprehensive filename analysis
  if (lowerFileName.includes('council') || lowerFileName.includes('tax') || lowerFileName.includes('bill') || lowerFileName.includes('invoice')) {
    category = "bill";
    title = `Bill/Tax Document - ${title}`;
    summary = "Billing or tax document. Review payment details, due dates, and account information. Set reminder for payment if needed.";
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    reminderDate = futureDate.toISOString().split('T')[0];
  } else if (lowerFileName.includes('appointment') || lowerFileName.includes('doctor') || lowerFileName.includes('medical') || lowerFileName.includes('clinic')) {
    category = "appointment";
    title = `Medical Appointment - ${title}`;
    summary = "Medical appointment or healthcare document. Verify appointment details, time, and location. Prepare required documents or follow pre-appointment instructions.";
  } else if (lowerFileName.includes('bank') || lowerFileName.includes('statement') || lowerFileName.includes('finance')) {
    category = "bill";
    title = `Financial Document - ${title}`;
    summary = "Financial statement or banking document. Review transactions, account balance, and any important notices or changes.";
  } else if (lowerFileName.includes('insurance') || lowerFileName.includes('policy') || lowerFileName.includes('claim')) {
    category = "insurance";
    title = `Insurance Document - ${title}`;
    summary = "Insurance policy, claim, or coverage document. Review policy details, coverage limits, renewal dates, and any required actions.";
  } else if (lowerFileName.includes('nhs') || lowerFileName.includes('health')) {
    category = "nhs";
    title = `NHS/Health Document - ${title}`;
    summary = "NHS or health service document. Review appointment details, treatment information, test results, or health records.";
  } else if (lowerFileName.includes('gov') || lowerFileName.includes('hmrc') || lowerFileName.includes('dvla') || lowerFileName.includes('government')) {
    category = "government";
    title = `Government Document - ${title}`;
    summary = "Official government correspondence or document. Review requirements, deadlines, and respond by specified dates if action is required.";
  } else if (lowerFileName.includes('ticket') || lowerFileName.includes('travel') || lowerFileName.includes('train') || lowerFileName.includes('flight')) {
    category = "personal";
    title = `Travel Document - ${title}`;
    summary = "Travel ticket or booking confirmation. Verify travel details, departure times, seat assignments, and any special requirements.";
  } else {
    title = `Document - ${title}`;
    summary = "Document uploaded and categorized based on filename. AI analysis will provide detailed content extraction once service is available.";
  }
  
  if (error instanceof Error && (error.message.includes('quota') || error.message.includes('429'))) {
    summary += " (AI analysis temporarily unavailable due to quota limits)";
  } else {
    summary += " (Detailed AI analysis failed - document processed based on filename)";
  }
  
  return {
    title,
    summary,
    category,
    categories: [category],
    customCategories: [],
    reminderDate,
    extractedText: `Filename-based analysis for: ${fileName}\n\nThis document could not be processed with OCR due to service limitations. The content analysis is based on the filename pattern.\n\nFor complete text extraction, please ensure:\n- Document is a clear image (JPG, PNG)\n- Text is readable and well-lit\n- AI service is available\n\nDocument type: ${category}\nExpected content based on filename patterns.`
  };
}