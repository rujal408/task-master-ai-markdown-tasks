import React from 'react';
import { Text, Link, Button, Section } from '@react-email/components';
import BaseTemplate, { renderEmailTemplate } from './base-template';
import { EmailTemplate, DueDateReminderData } from './types';

interface DueDateReminderTemplateProps {
  data: DueDateReminderData;
}

export const DueDateReminderTemplate: React.FC<DueDateReminderTemplateProps> = ({ data }) => {
  const { user, transaction, daysRemaining } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://library-management-system.com';
  const urgencyLevel = daysRemaining <= 1 ? 'high' : daysRemaining <= 3 ? 'medium' : 'low';
  
  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Determine urgency message
  let urgencyMessage = '';
  if (urgencyLevel === 'high') {
    urgencyMessage = `Your book is due ${daysRemaining === 0 ? 'today' : 'tomorrow'}!`;
  } else if (urgencyLevel === 'medium') {
    urgencyMessage = `Your book is due in ${daysRemaining} days.`;
  } else {
    urgencyMessage = `You have ${daysRemaining} days remaining to return your book.`;
  }
  
  const dueDate = formatDate(transaction.dueDate);
  const checkoutDate = formatDate(transaction.checkoutDate);
  const bookDetailsUrl = `${baseUrl}/books/${transaction.book.id}`;
  const accountUrl = `${baseUrl}/account/borrowings`;

  return (
    <BaseTemplate
      previewText={`Due Date Reminder: ${transaction.book.title} is due in ${daysRemaining} days`}
      heading="Book Due Date Reminder"
      userName={user.name}
    >
      <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
        This is a friendly reminder about your borrowed book.
      </Text>
      
      <Section style={{ margin: '20px 0', backgroundColor: urgencyColorMap[urgencyLevel], padding: '12px', borderRadius: '4px' }}>
        <Text style={{ 
          margin: '0', 
          fontWeight: 'bold', 
          color: urgencyLevel === 'low' ? '#1F2937' : '#FFFFFF',
          fontSize: '16px'
        }}>
          {urgencyMessage}
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
          <span style={styles.detailLabel}>Checkout Date:</span> {checkoutDate}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Due Date:</span> {dueDate}
        </Text>
      </Section>
      
      <Text style={styles.infoText}>
        Please return the book to the library before the due date to avoid late fees. If you need more time, you can renew the book through your account (if no one else has reserved it).
      </Text>
      
      <Section style={styles.buttonContainer}>
        <Button href={accountUrl} style={styles.primaryButton}>
          View My Borrowings
        </Button>
        <Button href={bookDetailsUrl} style={styles.secondaryButton}>
          Book Details
        </Button>
      </Section>
      
      <Text style={styles.noteText}>
        If you have already returned this book, please disregard this message.
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
export const dueDateReminderTemplate: EmailTemplate<DueDateReminderData> = {
  name: 'due-date-reminder',
  description: 'Notification sent to remind users of upcoming book due dates',
  category: 'transaction',
  
  render: async (data: DueDateReminderData) => {
    return renderEmailTemplate(<DueDateReminderTemplate data={data} />);
  },
  
  getPreview: async () => {
    const sampleData: DueDateReminderData = {
      user: {
        id: '123',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      transaction: {
        id: 'tr-123',
        checkoutDate: new Date(new Date().setDate(new Date().getDate() - 7)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        book: {
          id: 'b-123',
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '9780743273565',
        },
      },
      daysRemaining: 3,
    };
    
    const rendered = await renderEmailTemplate(<DueDateReminderTemplate data={sampleData} />);
    return {
      ...rendered,
      sampleData,
    };
  },
};

// Urgency color mappings
const urgencyColorMap = {
  high: '#EF4444', // Red for urgent
  medium: '#F59E0B', // Amber for medium urgency
  low: '#D1FAE5', // Light green for low urgency
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

export default dueDateReminderTemplate;
