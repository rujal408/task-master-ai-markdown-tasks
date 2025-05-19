import React from 'react';
import { 
  Body, 
  Container, 
  Head, 
  Heading, 
  Html, 
  Preview, 
  Section, 
  Text, 
  Img,
  Link,
  Hr,
  Footer
} from '@react-email/components';
import { render } from '@react-email/render';

export interface BaseTemplateProps {
  previewText: string;
  heading: string;
  userName?: string;
  children: React.ReactNode;
  footerText?: string;
  unsubscribeLink?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  previewText,
  heading,
  userName,
  children,
  footerText = '© 2025 Library Management System. All rights reserved.',
  unsubscribeLink
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://library-management-system.com';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Img 
              src={`${baseUrl}/logo.png`} 
              alt="Library Management System" 
              width="150" 
              height="40" 
              style={styles.logo} 
            />
          </Section>

          {/* Greeting */}
          {userName && (
            <Section style={styles.greeting}>
              <Text style={styles.greetingText}>Hello {userName},</Text>
            </Section>
          )}
          
          {/* Main Heading */}
          <Heading style={styles.heading}>{heading}</Heading>
          
          {/* Main Content */}
          <Section style={styles.content}>
            {children}
          </Section>
          
          {/* Footer */}
          <Hr style={styles.divider} />
          <Footer style={styles.footer}>
            <Text style={styles.footerText}>{footerText}</Text>
            {unsubscribeLink && (
              <Text style={styles.unsubscribe}>
                <Link href={unsubscribeLink} style={styles.link}>
                  Manage email preferences
                </Link>
              </Text>
            )}
          </Footer>
        </Container>
      </Body>
    </Html>
  );
};

// Utility to render a React email component to HTML string
export async function renderEmailTemplate(component: React.ReactElement): Promise<{ html: string; text?: string }> {
  const html = render(component);
  // The text version is generated in the email service
  return { html };
}

// Common styles
const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0',
    width: '100%',
    maxWidth: '600px',
  },
  header: {
    padding: '20px',
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto',
  },
  greeting: {
    padding: '0 20px',
  },
  greetingText: {
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
    color: '#484848',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
    padding: '0 20px',
    color: '#1f2937',
  },
  content: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 24px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '20px 0',
  },
  footer: {
    padding: '20px',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0',
    textAlign: 'center' as const,
  },
  unsubscribe: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center' as const,
    margin: '12px 0',
  },
};

export default BaseTemplate;
