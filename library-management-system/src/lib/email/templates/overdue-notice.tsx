import React from 'react';
import { Text, Link, Button, Section } from '@react-email/components';
import BaseTemplate, { renderEmailTemplate } from './base-template';
import { EmailTemplate, OverdueNoticeData } from './types';

interface OverdueNoticeTemplateProps {
  data: OverdueNoticeData;
}

export const OverdueNoticeTemplate: React.FC<OverdueNoticeTemplateProps> = ({ data }) => {
  const { user, transaction, daysOverdue, fine } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://library-management-system.com';
  
  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const dueDate = formatDate(transaction.dueDate);
  const bookDetailsUrl = `${baseUrl}/books/${transaction.book.id}`;
  const accountUrl = `${baseUrl}/account/borrowings`;

  return (
    <BaseTemplate
      previewText={`Overdue Notice: ${transaction.book.title} is ${daysOverdue} days overdue`}
      heading="Overdue Book Notice"
      userName={user.name}
    >
      <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
        Our records indicate that you have an overdue book from our library.
      </Text>
      
      <Section style={{ margin: '20px 0', backgroundColor: '#FEE2E2', padding: '12px', borderRadius: '4px' }}>
        <Text style={{ 
          margin: '0', 
          fontWeight: 'bold', 
          color: '#B91C1C',
          fontSize: '16px'
        }}>
          This book is <strong>{daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}</strong> overdue!
        </Text>
        <Text style={{ 
          margin: '8px 0 0 0', 
          color: '#B91C1C',
          fontSize: '16px'
        }}>
          Current fine: <strong>{formatCurrency(fine)}</strong>
        </Text>
      </Section>
      
      <Section style={styles.bookDetails}>
        <Text style={styles.bookTitle}>
          {transaction.book.title}
        </Text>
        <Text style={styles.bookAuthor}>
          by {transaction.book.author}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>ISBN:</span> {transaction.book.isbn}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Due Date:</span> {dueDate}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Days Overdue:</span> {daysOverdue}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Fine Amount:</span> {formatCurrency(fine)}
        </Text>
      </Section>
      
      <Text style={styles.infoText}>
        Please return the book as soon as possible to prevent additional late fees. The overdue fine increases each day the book remains unreturned.
      </Text>
      
      <Section style={styles.actionBox}>
        <Text style={styles.actionHeading}>
          What should you do now?
        </Text>
        <Text style={styles.actionItem}>
          1. Return the book to any library branch as soon as possible
        </Text>
        <Text style={styles.actionItem}>
          2. Pay the fine in person or online through your account
        </Text>
        <Text style={styles.actionItem}>
          3. Contact us if you have already returned the book or need assistance
        </Text>
      </Section>
      
      <Section style={styles.buttonContainer}>
        <Button href={accountUrl} style={styles.primaryButton}>
          View My Account
        </Button>
        <Button href={bookDetailsUrl} style={styles.secondaryButton}>
          Book Details
        </Button>
      </Section>
      
      <Text style={styles.noteText}>
        If you have already returned this book, please disregard this message and contact the library to resolve any discrepancies.
      </Text>
      
      <Text style={styles.helpText}>
        Need help? Reply to this email or contact the library at{' '}
        <Link href="mailto:library@example.com" style={styles.link}>
          library@example.com
        </Link>
      </Text>
    </BaseTemplate>
  );
};

// Template implementation
export const overdueNoticeTemplate: EmailTemplate<OverdueNoticeData> = {
  name: 'overdue-notice',
  description: 'Notification sent to users with overdue books',
  category: 'transaction',
  
  render: async (data: OverdueNoticeData) => {
    return renderEmailTemplate(<OverdueNoticeTemplate data={data} />);
  },
  
  getPreview: async () => {
    const sampleData: OverdueNoticeData = {
      user: {
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      transaction: {
        id: 'tr-123',
        checkoutDate: new Date(new Date().setDate(new Date().getDate() - 21)),
        dueDate: new Date(new Date().setDate(new Date().getDate() - 7)),
        book: {
          id: 'b-123',
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          isbn: '9780060935467',
        },
      },
      daysOverdue: 7,
      fine: 3.50,
    };
    
    const rendered = await renderEmailTemplate(<OverdueNoticeTemplate data={sampleData} />);
    return {
      ...rendered,
      sampleData,
    };
  },
};

// Styles
const styles = {
  bookDetails: {
    backgroundColor: '#F9FAFB',
    padding: '16px',
    borderRadius: '4px',
    margin: '20px 0',
  },
  bookTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
    color: '#1F2937',
  },
  bookAuthor: {
    fontSize: '16px',
    color: '#4B5563',
    margin: '0 0 12px 0',
  },
  detailRow: {
    fontSize: '14px',
    color: '#374151',
    margin: '4px 0',
  },
  detailLabel: {
    fontWeight: 'bold',
    display: 'inline-block',
    width: '120px',
  },
  infoText: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '24px',
    margin: '20px 0',
  },
  actionBox: {
    backgroundColor: '#F3F4F6',
    padding: '16px',
    borderRadius: '4px',
    margin: '20px 0',
    borderLeft: '4px solid #3B82F6',
  },
  actionHeading: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 12px 0',
  },
  actionItem: {
    fontSize: '14px',
    color: '#374151',
    margin: '8px 0',
    lineHeight: '20px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    margin: '24px 0',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#3B82F6',
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    border: '2px solid #3B82F6',
  },
  noteText: {
    fontSize: '14px',
    color: '#6B7280',
    fontStyle: 'italic',
    margin: '20px 0',
  },
  helpText: {
    fontSize: '14px',
    color: '#4B5563',
    margin: '12px 0',
  },
  link: {
    color: '#3B82F6',
    textDecoration: 'underline',
  },
};

export default overdueNoticeTemplate;
