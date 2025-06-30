// Email provider configurations and automatic SMTP detection
export interface EmailProvider {
  name: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  authType: 'password' | 'oauth' | 'app-password';
  setupInstructions: string;
}

export const EMAIL_PROVIDERS: Record<string, EmailProvider> = {
  gmail: {
    name: 'Gmail',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    },
    authType: 'app-password',
    setupInstructions: 'Enable 2FA and generate an app password'
  },
  outlook: {
    name: 'Outlook/Hotmail',
    smtp: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false
    },
    authType: 'password',
    setupInstructions: 'Use your regular email password'
  },
  yahoo: {
    name: 'Yahoo Mail',
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false
    },
    authType: 'app-password',
    setupInstructions: 'Generate an app password in Yahoo Account Security'
  },
  icloud: {
    name: 'iCloud Mail',
    smtp: {
      host: 'smtp.mail.me.com',
      port: 587,
      secure: false
    },
    authType: 'app-password',
    setupInstructions: 'Generate an app-specific password in Apple ID settings'
  }
};

export function detectEmailProvider(email: string): EmailProvider | null {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) return null;
  
  // Direct domain matches
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return EMAIL_PROVIDERS.gmail;
  }
  
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') {
    return EMAIL_PROVIDERS.outlook;
  }
  
  if (domain === 'yahoo.com' || domain === 'ymail.com') {
    return EMAIL_PROVIDERS.yahoo;
  }
  
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return EMAIL_PROVIDERS.icloud;
  }
  
  return null;
}

export function getEmailSetupInstructions(email: string): {
  provider: EmailProvider | null;
  instructions: string;
  requiresAppPassword: boolean;
} {
  const provider = detectEmailProvider(email);
  
  if (!provider) {
    return {
      provider: null,
      instructions: 'Please configure SMTP settings manually for your email provider.',
      requiresAppPassword: false
    };
  }
  
  const requiresAppPassword = provider.authType === 'app-password';
  
  let instructions = `Detected ${provider.name}. `;
  
  if (requiresAppPassword) {
    instructions += `For security, ${provider.name} requires an app-specific password. ${provider.setupInstructions}.`;
  } else {
    instructions += `You can use your regular email password. ${provider.setupInstructions}.`;
  }
  
  return {
    provider,
    instructions,
    requiresAppPassword
  };
}