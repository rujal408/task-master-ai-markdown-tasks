import React from 'react';
import { Text, Link, Button, Section } from '@react-email/components';
import BaseTemplate, { renderEmailTemplate } from './base-template';
import { EmailTemplate, AccountUpdateData } from './types';

interface AccountUpdateTemplateProps {
  data: AccountUpdateData;
}

export const AccountUpdateTemplate: React.FC<AccountUpdateTemplateProps> = ({ data }) => {
  const { user, updateType, updatedAt, ipAddress } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://library-management-system.com';
  
  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const updateTypeMap = {
    password: {
      title: 'Password Changed',
      description: 'Your account password has been updated successfully.',
      icon: '🔐',
      color: '#4F46E5',
    },
    profile: {
      title: 'Profile Updated',
      description: 'Your account profile information has been updated.',
      icon: '✏️',
      color: '#10B981',
    },
    status: {
      title: 'Account Status Changed',
      description: 'Your library account status has been updated.',
      icon: '⚠️',
      color: '#F59E0B',
    },
  };
  
  const update = updateTypeMap[updateType];
  const formattedDate = formatDate(updatedAt);
  const accountUrl = `${baseUrl}/account`;
  const securityUrl = `${baseUrl}/account/security`;

  return (
    <BaseTemplate
      previewText={`Account Update: ${update.title}`}
      heading={update.title}
      userName={user.name}
    >
      <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
        This is a confirmation that a recent change has been made to your library account.
      </Text>
      
      <Section style={{ 
        margin: '20px 0', 
        backgroundColor: '#F9FAFB', 
        padding: '20px', 
        borderRadius: '8px',
        borderLeft: `4px solid ${update.color}`
      }}>
        <Text style={{ 
          fontSize: '28px',
          textAlign: 'center',
          margin: '0 0 16px 0',
        }}>
          {update.icon}
        </Text>
        <Text style={{ 
          fontSize: '16px',
          color: '#374151',
          margin: '0 0 8px 0',
          textAlign: 'center',
        }}>
          {update.description}
        </Text>
        <Text style={{ 
          fontSize: '14px',
          color: '#6B7280',
          margin: '0',
          textAlign: 'center',
        }}>
          {formattedDate}
        </Text>
      </Section>
      
      <Section style={styles.detailsContainer}>
        <Text style={styles.detailsHeading}>Account Information</Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Account:</span> {user.email}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Name:</span> {user.name}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Update Type:</span> {update.title}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Date & Time:</span> {formattedDate}
        </Text>
        {ipAddress && (
          <Text style={styles.detailRow}>
            <span style={styles.detailLabel}>IP Address:</span> {ipAddress}
          </Text>
        )}
      </Section>
      
      <Text style={styles.securityNote}>
        If you made this change, no further action is required. If you did not make this change or believe your account may have been compromised, please contact us immediately.
      </Text>
      
      <Section style={styles.buttonContainer}>
        <Button href={accountUrl} style={styles.primaryButton}>
          View My Account
        </Button>
        <Button href={securityUrl} style={styles.secondaryButton}>
          Security Settings
        </Button>
      </Section>
      
      <Text style={styles.helpText}>
        Need help? Contact our support team at{' '}
        <Link href="mailto:support@example.com" style={styles.link}>
          support@example.com
        </Link>
      </Text>
    </BaseTemplate>
  );
};

// Template implementation
export const accountUpdateTemplate: EmailTemplate<AccountUpdateData> = {
  name: 'account-update',
  description: 'Notification sent when account settings or status are updated',
  category: 'account',
  
  render: async (data: AccountUpdateData) => {
    return renderEmailTemplate(<AccountUpdateTemplate data={data} />);
  },
  
  getPreview: async () => {
    const sampleData: AccountUpdateData = {
      user: {
        id: 'user-12345',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
      },
      updateType: 'password',
      updatedAt: new Date(),
      ipAddress: '192.168.1.1',
    };
    
    const rendered = await renderEmailTemplate(<AccountUpdateTemplate data={sampleData} />);
    return {
      ...rendered,
      sampleData,
    };
  },
};

// Styles
const styles = {
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    padding: '16px',
    borderRadius: '4px',
    margin: '20px 0',
  },
  detailsHeading: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 12px 0',
  },
  detailRow: {
    fontSize: '14px',
    color: '#374151',
    margin: '8px 0',
  },
  detailLabel: {
    fontWeight: 'bold',
    display: 'inline-block',
    width: '110px',
  },
  securityNote: {
    fontSize: '14px',
    color: '#4B5563',
    margin: '20px 0',
    padding: '12px',
    backgroundColor: '#FEF3C7',
    borderRadius: '4px',
    borderLeft: '4px solid #F59E0B',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    margin: '24px 0',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#4F46E5',
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    border: '2px solid #4F46E5',
  },
  helpText: {
    fontSize: '14px',
    color: '#4B5563',
    margin: '12px 0',
  },
  link: {
    color: '#4F46E5',
    textDecoration: 'underline',
  },
};

export default accountUpdateTemplate;
