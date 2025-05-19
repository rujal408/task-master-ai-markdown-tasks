/**
 * Base interface for all email templates
 */
export interface EmailTemplate<T = any> {
  /** Name of the template */
  name: string;
  
  /** Description of the template's purpose */
  description: string;
  
  /** Template category for organization */
  category: 'transaction' | 'reservation' | 'account' | 'system';
  
  /** Render the template with provided data */
  render: (data: T) => Promise<{
    html: string;
    text?: string;
  }>;
  
  /** Get a preview with sample data */
  getPreview: () => Promise<{
    html: string;
    text?: string;
    sampleData: T;
  }>;
}

/**
 * Base interface for user-related email data
 */
export interface UserEmailData {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Interface for due date reminder emails
 */
export interface DueDateReminderData extends UserEmailData {
  transaction: {
    id: string;
    checkoutDate: Date;
    dueDate: Date;
    book: {
      id: string;
      title: string;
      author: string;
      isbn: string;
    };
  };
  daysRemaining: number;
}

/**
 * Interface for overdue notice emails
 */
export interface OverdueNoticeData extends UserEmailData {
  transaction: {
    id: string;
    checkoutDate: Date;
    dueDate: Date;
    book: {
      id: string;
      title: string;
      author: string;
      isbn: string;
    };
  };
  daysOverdue: number;
  fine: number;
}

/**
 * Interface for reservation availability emails
 */
export interface ReservationAvailabilityData extends UserEmailData {
  reservation: {
    id: string;
    reservationDate: Date;
    expiryDate: Date;
    book: {
      id: string;
      title: string;
      author: string;
      isbn: string;
    };
  };
  pickupDeadline: Date;
}

/**
 * Interface for account update emails
 */
export interface AccountUpdateData extends UserEmailData {
  updateType: 'password' | 'profile' | 'status';
  updatedAt: Date;
  ipAddress?: string;
}

/**
 * Interface for welcome emails
 */
export interface WelcomeEmailData extends UserEmailData {
  libraryName: string;
  loginUrl: string;
}
