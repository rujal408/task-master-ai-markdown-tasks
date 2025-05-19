import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/email.service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Return success even if user doesn't exist to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: 'If your email is registered, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // Create password reset token
    const tokenData = await createPasswordResetToken(email);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Failed to create password reset token' },
        { status: 500 }
      );
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${tokenData.token}`;
    
    try {
      // Send the password reset email
      await sendPasswordResetEmail({
        to: email,
        name: user.name || undefined,
        resetLink: resetUrl,
        expiryHours: 1,
      });

      return NextResponse.json(
        { message: 'If your email is registered, you will receive a password reset link' },
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      
      // Still return success to prevent email enumeration
      return NextResponse.json(
        { message: 'If your email is registered, you will receive a password reset link' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
