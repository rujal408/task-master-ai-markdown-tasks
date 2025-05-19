import { SentMessageInfo, Transporter } from 'nodemailer';
import { getEmailTransporter, EmailConfig } from './config';
import { prisma } from '@/lib/prisma';
import { EmailTemplate } from './templates/types';

// Email sending options
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

// Email status tracking
export enum EmailStatus {
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
}

// Maximum retry attempts for failed emails
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Email service for sending and tracking emails
 */
export class EmailService {
  private transporter: Transporter;

  constructor(config?: EmailConfig) {
    this.transporter = getEmailTransporter(config);
  }

  /**
   * Send an email and track its status
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
      // Create an email tracking record in the database
      const emailRecord = await prisma.emailLog.create({
        data: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          status: EmailStatus.QUEUED,
          attempts: 0,
        },
      });

      // Attempt to send the email
      return await this.attemptSend(emailRecord.id, options);
    } catch (error) {
      console.error('Failed to create email tracking record:', error);
      return { success: false, error };
    }
  }

  /**
   * Attempt to send an email with retry logic
   */
  private async attemptSend(
    emailId: string,
    options: EmailOptions,
    attempt = 1
  ): Promise<{ success: boolean; id: string; error?: any }> {
    try {
      // Update status to sending
      await prisma.emailLog.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.SENDING,
          attempts: attempt,
          lastAttemptAt: new Date(),
        },
      });

      // Send the email
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Library Management System <library@example.com>',
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        attachments: options.attachments,
        replyTo: options.replyTo,
      });

      // Update tracking record with success
      await prisma.emailLog.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.SENT,
          messageId: result.messageId,
          sentAt: new Date(),
        },
      });

      return { success: true, id: emailId };
    } catch (error) {
      console.error(`Email sending attempt ${attempt} failed:`, error);

      // Determine if we should retry
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff: wait longer between retries
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Retry the send
        return this.attemptSend(emailId, options, attempt + 1);
      } else {
        // Max retries reached, update status to failed
        await prisma.emailLog.update({
          where: { id: emailId },
          data: {
            status: EmailStatus.FAILED,
            error: error.message || 'Unknown error',
          },
        });

        return { success: false, id: emailId, error };
      }
    }
  }

  /**
   * Process the email queue to retry failed emails
   */
  async processQueue(): Promise<{ processed: number; successful: number; failed: number }> {
    try {
      // Find emails that are queued or failed with less than max attempts
      const pendingEmails = await prisma.emailLog.findMany({
        where: {
          OR: [
            { status: EmailStatus.QUEUED },
            {
              status: EmailStatus.FAILED,
              attempts: { lt: MAX_RETRY_ATTEMPTS },
            },
          ],
        },
        take: 10, // Process in batches
      });

      if (pendingEmails.length === 0) {
        return { processed: 0, successful: 0, failed: 0 };
      }

      let successful = 0;
      let failed = 0;

      // Process each pending email
      for (const email of pendingEmails) {
        try {
          // We need to retrieve the email content from the templates table
          const emailContent = await prisma.emailTemplate.findFirst({
            where: { emailLogId: email.id },
          });

          if (!emailContent) {
            console.error(`No email content found for email ID: ${email.id}`);
            failed++;
            continue;
          }

          // Attempt to resend
          const result = await this.attemptSend(
            email.id,
            {
              to: email.to,
              subject: email.subject,
              html: emailContent.htmlContent,
              text: emailContent.textContent,
            },
            email.attempts + 1
          );

          if (result.success) {
            successful++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
          failed++;
        }
      }

      return {
        processed: pendingEmails.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Failed to process email queue:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }

  /**
   * Send an email using a template
   */
  async sendTemplatedEmail<T = any>(
    template: EmailTemplate<T>,
    data: T,
    options: Omit<EmailOptions, 'html' | 'text'>
  ): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
      // Render the template
      const { html, text } = await template.render(data);

      // Store the rendered template for tracking and retries
      const emailRecord = await prisma.emailLog.create({
        data: {
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          status: EmailStatus.QUEUED,
          attempts: 0,
          template: template.name,
          templateData: JSON.stringify(data),
        },
      });

      // Store the rendered content
      await prisma.emailTemplate.create({
        data: {
          emailLogId: emailRecord.id,
          htmlContent: html,
          textContent: text || this.stripHtml(html),
        },
      });

      // Send the email
      return await this.attemptSend(emailRecord.id, {
        ...options,
        html,
        text: text || this.stripHtml(html),
      });
    } catch (error) {
      console.error('Failed to send templated email:', error);
      return { success: false, error };
    }
  }

  /**
   * Track delivery status update (for webhook integration)
   */
  async updateDeliveryStatus(
    messageId: string,
    status: EmailStatus,
    details?: string
  ): Promise<boolean> {
    try {
      await prisma.emailLog.updateMany({
        where: { messageId },
        data: {
          status,
          deliveredAt: status === EmailStatus.DELIVERED ? new Date() : undefined,
          deliveryDetails: details,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      return false;
    }
  }

  /**
   * Strip HTML for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim();
  }
}
