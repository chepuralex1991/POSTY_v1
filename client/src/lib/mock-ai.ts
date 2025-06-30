import { type Category } from "@shared/schema";

interface AIResponse {
  title: string;
  summary: string;
  category: Category;
  reminderDate?: string;
}

const mockResponses: Record<string, AIResponse> = {
  bill: {
    title: "Utility Bill",
    summary: "Monthly utility bill with payment due date and account information.",
    category: "bill",
    reminderDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
  },
  electric: {
    title: "Electric Bill",
    summary: "Monthly electricity bill from utility company. Contains usage details and payment due date.",
    category: "bill",
    reminderDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  appointment: {
    title: "Medical Appointment",
    summary: "Appointment reminder from healthcare provider with date, time, and preparation instructions.",
    category: "appointment",
    reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  },
  doctor: {
    title: "Doctor Visit Confirmation",
    summary: "Confirmation letter for upcoming medical appointment with arrival instructions.",
    category: "appointment",
    reminderDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  insurance: {
    title: "Insurance Document",
    summary: "Insurance policy document or premium notice with coverage details and payment information.",
    category: "bill",
    reminderDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  tax: {
    title: "Tax Document",
    summary: "Tax-related correspondence from government agency with important filing information.",
    category: "government",
    reminderDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  promo: {
    title: "Promotional Offer",
    summary: "Marketing material with special offers, discounts, or promotional codes.",
    category: "promotional",
    reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  personal: {
    title: "Personal Correspondence",
    summary: "Personal letter or card from family, friends, or personal contacts.",
    category: "personal",
  },
};

export function generateAIResponse(fileName: string): AIResponse {
  const lowercaseFileName = fileName.toLowerCase();
  
  // Check for keywords in filename to determine type
  for (const [keyword, response] of Object.entries(mockResponses)) {
    if (lowercaseFileName.includes(keyword)) {
      return response;
    }
  }
  
  // Default response for unknown files
  return {
    title: `Document - ${fileName}`,
    summary: "Scanned document that has been processed and categorized. Please review the content and adjust the category if needed.",
    category: "personal",
  };
}
