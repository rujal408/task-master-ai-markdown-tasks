import React from 'react';
import { Text, Link, Button, Section } from '@react-email/components';
import BaseTemplate, { renderEmailTemplate } from './base-template';
import { EmailTemplate, ReservationAvailabilityData } from './types';

interface ReservationAvailabilityTemplateProps {
  data: ReservationAvailabilityData;
}

export const ReservationAvailabilityTemplate: React.FC<ReservationAvailabilityTemplateProps> = ({ data }) => {
  const { user, reservation, pickupDeadline } = data;
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
  
  const reservationDate = formatDate(reservation.reservationDate);
  const deadlineDate = formatDate(pickupDeadline);
  const bookDetailsUrl = `${baseUrl}/books/${reservation.book.id}`;
  const reservationsUrl = `${baseUrl}/account/reservations`;

  // Calculate days until deadline
  const today = new Date();
  const deadline = new Date(pickupDeadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <BaseTemplate
      previewText={`Your reserved book "${reservation.book.title}" is now available for pickup!`}
      heading="Reserved Book Available for Pickup"
      userName={user.name}
    >
      <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
        Good news! A book you reserved is now available for pickup at the library.
      </Text>
      
      <Section style={{ margin: '20px 0', backgroundColor: '#D1FAE5', padding: '12px', borderRadius: '4px' }}>
        <Text style={{ 
          margin: '0', 
          fontWeight: 'bold', 
          color: '#065F46',
          fontSize: '16px'
        }}>
          Your reservation is ready for pickup!
        </Text>
        <Text style={{ 
          margin: '8px 0 0 0', 
          color: '#065F46',
          fontSize: '16px'
        }}>
          Please pick up your book by <strong>{deadlineDate}</strong> ({daysUntilDeadline} days from now).
        </Text>
      </Section>
      
      <Section style={styles.bookDetails}>
        <Text style={styles.bookTitle}>
          {reservation.book.title}
        </Text>
        <Text style={styles.bookAuthor}>
          by {reservation.book.author}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>ISBN:</span> {reservation.book.isbn}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Reserved On:</span> {reservationDate}
        </Text>
        <Text style={styles.detailRow}>
          <span style={styles.detailLabel}>Pickup Deadline:</span> {deadlineDate}
        </Text>
      </Section>
      
      <Text style={styles.infoText}>
        Your reservation will be held until the pickup deadline. If not picked up by then, the reservation will expire and the book may become available to other members.
      </Text>
      
      <Section style={styles.actionBox}>
        <Text style={styles.actionHeading}>
          What to bring for pickup:
        </Text>
        <Text style={styles.actionItem}>
          • Your library card or photo ID
        </Text>
        <Text style={styles.actionItem}>
          • The reservation confirmation number: <strong>{reservation.id.substring(0, 8)}</strong>
        </Text>
      </Section>
      
      <Section style={styles.buttonContainer}>
        <Button href={reservationsUrl} style={styles.primaryButton}>
          Manage My Reservations
        </Button>
        <Button href={bookDetailsUrl} style={styles.secondaryButton}>
          Book Details
        </Button>
      </Section>
      
      <Text style={styles.noteText}>
        If you no longer need this book, please cancel your reservation so others may borrow it.
      </Text>
      
      <Text style={styles.helpText}>
        Need help? Visit the library circulation desk or contact us at{' '}
        <Link href="mailto:library@example.com" style={styles.link}>
          library@example.com
        </Link>
      </Text>
    </BaseTemplate>
  );
};

// Template implementation
export const reservationAvailabilityTemplate: EmailTemplate<ReservationAvailabilityData> = {
  name: 'reservation-availability',
  description: 'Notification sent when a reserved book becomes available for pickup',
  category: 'reservation',
  
  render: async (data: ReservationAvailabilityData) => {
    return renderEmailTemplate(<ReservationAvailabilityTemplate data={data} />);
  },
  
  getPreview: async () => {
    const sampleData: ReservationAvailabilityData = {
      user: {
        id: '123',
        name: 'Emily Johnson',
        email: 'emily.johnson@example.com',
      },
      reservation: {
        id: 'res-12345678',
        reservationDate: new Date(new Date().setDate(new Date().getDate() - 14)),
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        book: {
          id: 'b-123',
          title: 'Becoming',
          author: 'Michelle Obama',
          isbn: '9781524763138',
        },
      },
      pickupDeadline: new Date(new Date().setDate(new Date().getDate() + 7)),
    };
    
    const rendered = await renderEmailTemplate(<ReservationAvailabilityTemplate data={sampleData} />);
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
    borderLeft: '4px solid #10B981',
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
    backgroundColor: '#10B981',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#10B981',
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    border: '2px solid #10B981',
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
    color: '#10B981',
    textDecoration: 'underline',
  },
};

export default reservationAvailabilityTemplate;
