import React from 'react';
import { Text, Link, Button, Section, Hr } from '@react-email/components';
import BaseTemplate, { renderEmailTemplate } from './base-template';
import { EmailTemplate, WelcomeEmailData } from './types';

interface WelcomeEmailTemplateProps {
  data: WelcomeEmailData;
}

export const WelcomeEmailTemplate: React.FC<WelcomeEmailTemplateProps> = ({ data }) => {
  const { user, libraryName, loginUrl } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://library-management-system.com';
  
  return (
    <BaseTemplate
      previewText={`Welcome to ${libraryName}! Your library account is ready.`}
      heading={`Welcome to ${libraryName}!`}
      userName={user.name}
    >
      <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
        Thank you for joining our library! Your account has been created successfully, and you can now access all of our resources and services.
      </Text>
      
      <Section style={{ margin: '24px 0', textAlign: 'center' }}>
        <Button href={loginUrl} style={styles.primaryButton}>
          Log In to Your Account
        </Button>
      </Section>
      
      <Section style={styles.accountDetails}>
        <Text style={styles.sectionHeading}>
          Your Account Information
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Name:</span> {user.name}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Email:</span> {user.email}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Account ID:</span> {user.id.substring(0, 8)}
        </Text>
      </Section>
      
      <Hr style={styles.divider} />
      
      <Section style={styles.featureSection}>
        <Text style={styles.sectionHeading}>
          What You Can Do Now
        </Text>
        
        <Section style={styles.feature}>
          <Text style={styles.featureTitle}>
            📚 Browse Our Collection
          </Text>
          <Text style={styles.featureDescription}>
            Explore thousands of books, e-books, audiobooks, and other resources in our catalog.
          </Text>
          <Link href={`${baseUrl}/catalog`} style={styles.featureLink}>
            Browse Catalog →
          </Link>
        </Section>
        
        <Section style={styles.feature}>
          <Text style={styles.featureTitle}>
            🔍 Reserve Books
          </Text>
          <Text style={styles.featureDescription}>
            Place holds on books that are currently checked out and get notified when they're available.
          </Text>
          <Link href={`${baseUrl}/account/reservations`} style={styles.featureLink}>
            Manage Reservations →
          </Link>
        </Section>
        
        <Section style={styles.feature}>
          <Text style={styles.featureTitle}>
            ⚙️ Customize Notifications
          </Text>
          <Text style={styles.featureDescription}>
            Set your notification preferences for due date reminders and other alerts.
          </Text>
          <Link href={`${baseUrl}/account/notification-preferences`} style={styles.featureLink}>
            Set Preferences →
          </Link>
        </Section>
      </Section>
      
      <Section style={styles.libraryHours}>
        <Text style={styles.sectionHeading}>
          Library Hours
        </Text>
        <Text style={styles.hoursRow}>
          <span style={styles.day}>Monday - Thursday:</span> 9:00 AM - 8:00 PM
        </Text>
        <Text style={styles.hoursRow}>
          <span style={styles.day}>Friday - Saturday:</span> 10:00 AM - 6:00 PM
        </Text>
        <Text style={styles.hoursRow}>
          <span style={styles.day}>Sunday:</span> 1:00 PM - 5:00 PM
        </Text>
      </Section>
      
      <Hr style={styles.divider} />
      
      <Text style={styles.helpText}>
        If you have any questions or need assistance, please feel free to reply to this email or visit our help desk at the library.
      </Text>
      
      <Text style={styles.signatureText}>
        Happy reading!<br />
        The {libraryName} Team
      </Text>
    </BaseTemplate>
  );
};

// Template implementation
export const welcomeEmailTemplate: EmailTemplate<WelcomeEmailData> = {
  name: 'welcome-email',
  description: 'Welcome email sent to new library members',
  category: 'account',
  
  render: async (data: WelcomeEmailData) => {
    return renderEmailTemplate(<WelcomeEmailTemplate data={data} />);
  },
  
  getPreview: async () => {
    const sampleData: WelcomeEmailData = {
      user: {
        id: 'user-12345678',
        name: 'Alex Thompson',
        email: 'alex.thompson@example.com',
      },
      libraryName: 'City Public Library',
      loginUrl: 'https://library-management-system.com/login',
    };
    
    const rendered = await renderEmailTemplate(<WelcomeEmailTemplate data={sampleData} />);
    return {
      ...rendered,
      sampleData,
    };
  },
};

// Styles
const styles = {
  primaryButton: {
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    padding: '12px 28px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  accountDetails: {
    backgroundColor: '#F9FAFB',
    padding: '16px',
    borderRadius: '4px',
    margin: '16px 0',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 16px 0',
  },
  detailRow: {
    fontSize: '15px',
    color: '#374151',
    margin: '8px 0',
  },
  detailLabel: {
    fontWeight: 'bold',
    display: 'inline-block',
    width: '100px',
  },
  divider: {
    borderTop: '1px solid #E5E7EB',
    margin: '24px 0',
  },
  featureSection: {
    margin: '16px 0 24px 0',
  },
  feature: {
    margin: '16px 0',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 8px 0',
  },
  featureDescription: {
    fontSize: '15px',
    color: '#4B5563',
    margin: '0 0 8px 0',
    lineHeight: '22px',
  },
  featureLink: {
    fontSize: '14px',
    color: '#4F46E5',
    textDecoration: 'underline',
  },
  libraryHours: {
    margin: '16px 0',
  },
  hoursRow: {
    fontSize: '15px',
    color: '#374151',
    margin: '4px 0',
  },
  day: {
    fontWeight: 'bold',
    display: 'inline-block',
    width: '150px',
  },
  helpText: {
    fontSize: '15px',
    color: '#4B5563',
    margin: '16px 0',
    lineHeight: '22px',
  },
  signatureText: {
    fontSize: '15px',
    color: '#1F2937',
    margin: '20px 0 0 0',
    fontStyle: 'italic',
  },
};

export default welcomeEmailTemplate;
