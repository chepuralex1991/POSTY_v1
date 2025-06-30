// Automatic email configuration service
import { detectEmailProvider, getEmailSetupInstructions } from './email-providers.js';
import type { User } from '@shared/schema';

interface AutoEmailConfig {
  canAutoSetup: boolean;
  provider: string | null;
  instructions: string;
  config?: {
    host: string;
    port: number;
    secure: boolean;
    service?: string;
  };
}

export function getAutoEmailConfig(user: User): AutoEmailConfig {
  if (!user.email) {
    return {
      canAutoSetup: false,
      provider: null,
      instructions: 'No email address found for user.'
    };
  }
  
  const { provider, instructions, requiresAppPassword } = getEmailSetupInstructions(user.email);
  
  if (!provider) {
    return {
      canAutoSetup: false,
      provider: null,
      instructions
    };
  }
  
  // For providers that support regular passwords, we can auto-setup
  const canAutoSetup = !requiresAppPassword;
  
  return {
    canAutoSetup,
    provider: provider.name,
    instructions,
    config: {
      host: provider.smtp.host,
      port: provider.smtp.port,
      secure: provider.smtp.secure,
      service: provider.name.toLowerCase()
    }
  };
}

// Try to send email with user's regular password (for supported providers)
export async function attemptAutoEmailSetup(user: User, password?: string): Promise<{
  success: boolean;
  message: string;
  config?: any;
}> {
  const autoConfig = getAutoEmailConfig(user);
  
  if (!autoConfig.canAutoSetup || !autoConfig.config) {
    return {
      success: false,
      message: autoConfig.instructions
    };
  }
  
  if (!password) {
    return {
      success: false,
      message: 'Password required for automatic email setup.'
    };
  }
  
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      ...autoConfig.config,
      auth: {
        user: user.email,
        pass: password
      }
    });
    
    // Test the connection
    await transporter.verify();
    
    return {
      success: true,
      message: `Email configured automatically for ${autoConfig.provider}`,
      config: {
        host: autoConfig.config.host,
        port: autoConfig.config.port,
        secure: autoConfig.config.secure,
        user: user.email
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Automatic setup failed: ${error instanceof Error ? error.message : 'Unknown error'}. ${autoConfig.instructions}`
    };
  }
}