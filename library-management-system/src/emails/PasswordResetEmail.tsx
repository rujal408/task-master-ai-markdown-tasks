import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface PasswordResetEmailProps {
  resetLink: string;
  name?: string;
  expiryHours?: number;
}

export function PasswordResetEmail({
  resetLink,
  name = 'there',
  expiryHours = 1,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto p-6 max-w-2xl">
            <Section className="bg-white border border-gray-200 rounded-lg p-8">
              <Heading as="h1" className="text-2xl font-bold text-gray-900 mb-6">
                Reset Your Password
              </Heading>
              
              <Text className="text-gray-700 mb-4">
                Hello {name},
              </Text>
              
              <Text className="text-gray-700 mb-6">
                We received a request to reset the password for your account. Click the button below to set a new password:
              </Text>
              
              <Section className="text-center my-8">
                <Button
                  href={resetLink}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md text-base font-medium hover:bg-blue-700"
                >
                  Reset Password
                </Button>
              </Section>
              
              <Text className="text-gray-600 text-sm mb-6">
                This link will expire in {expiryHours} hour{expiryHours !== 1 ? 's' : ''}. If you didn't request a password reset, you can safely ignore this email.
              </Text>
              
              <Text className="text-gray-500 text-xs">
                If the button above doesn't work, copy and paste this link into your browser:
                <br />
                <a href={resetLink} className="text-blue-600 break-all">
                  {resetLink}
                </a>
              </Text>
            </Section>
            
            <Section className="mt-8 text-center text-gray-500 text-xs">
              <Text className="m-0">
                © {new Date().getFullYear()} Library Management System. All rights reserved.
              </Text>
              <Text className="m-0 mt-2">
                This email was sent to you as part of your account management.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PasswordResetEmail;
