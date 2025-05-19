import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { addHours } from 'date-fns';
import { prisma } from '../prisma';

const randomBytesAsync = promisify(randomBytes);

/**
 * Generate a secure random token for password reset
 * @returns A promise that resolves to a base64url-encoded token
 */
export async function generatePasswordResetToken(): Promise<string> {
  const buffer = await randomBytesAsync(32);
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Create a password reset token for a user
 * @param email User's email address
 * @returns The generated token or null if user not found
 */
export async function createPasswordResetToken(email: string): Promise<{ token: string; expiresAt: Date } | null> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  // Generate token
  const token = await generatePasswordResetToken();
  const expiresAt = addHours(new Date(), 1); // Token expires in 1 hour

  // Create the token in the database
  await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
    },
  });

  return { token, expiresAt };
}

/**
 * Validate a password reset token
 * @param token The token to validate
 * @returns The user ID if token is valid, null otherwise
 */
export async function validatePasswordResetToken(token: string): Promise<{ userId: string } | null> {
  // Find the token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: {
      id: true,
      expiresAt: true,
      used: true,
      userId: true,
    },
  });

  // Check if token exists, is not expired, and not used
  if (!resetToken || resetToken.expiresAt < new Date() || resetToken.used) {
    return null;
  }

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { used: true },
  });

  return { userId: resetToken.userId };
}
