import { createTransport, Transporter } from 'nodemailer';

// Email service configuration types
export type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
};

// Default configuration using environment variables
const defaultConfig: EmailConfig = {
  host: process.env.EMAIL_SERVER_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER || 'user@example.com',
    pass: process.env.EMAIL_SERVER_PASSWORD || 'password',
  },
  from: process.env.EMAIL_FROM_NAME ? 
    `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM || 'library@example.com'}>` : 
    'Library Management System <library@example.com>',
};

// Create and cache email transporter
let transporter: Transporter | null = null;

/**
 * Get a configured nodemailer transporter
 */
export function getEmailTransporter(config: EmailConfig = defaultConfig): Transporter {
  if (!transporter) {
    transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }
  return transporter;
}

/**
 * Reset the email transporter (used for testing or reconfiguration)
 */
export function resetEmailTransporter(): void {
  transporter = null;
}

// Export default configuration
export default defaultConfig;
