import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { PasswordResetEmail as PasswordResetEmailComponent } from '@/emails/PasswordResetEmail';
import React from 'react';

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface SendPasswordResetEmailParams {
  to: string;
  name?: string;
  resetLink: string;
  expiryHours?: number;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
  expiryHours = 1,
}: SendPasswordResetEmailParams) {
  // In development, log the email instead of sending it
  if (process.env.NODE_ENV === 'development') {
    console.log('Sending password reset email to:', to);
    console.log('Reset Link:', resetLink);
    return;
  }

  try {
    // Render the email component to HTML
    const emailHtml = await render(
      React.createElement(PasswordResetEmailComponent, {
        name,
        resetLink,
        expiryHours,
      })
    );

    // Send the email
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Library Management System'}" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      to,
      subject: 'Reset Your Password',
      html: emailHtml,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}
