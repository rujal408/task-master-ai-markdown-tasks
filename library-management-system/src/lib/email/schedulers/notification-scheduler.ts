import { prisma } from '@/lib/prisma';
import { EmailService } from '../service';
import { 
  dueDateReminderTemplate, 
  overdueNoticeTemplate,
  reservationAvailabilityTemplate
} from '../templates';
import { TransactionStatus, ReservationStatus, BookStatus } from '@prisma/client';

/**
 * Notification scheduler service
 * Handles scheduling and sending automated email notifications
 */
export class NotificationScheduler {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Process due date reminders
   * Sends reminders for books due in 1, 3, and 7 days
   */
  async processDueDateReminders(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    try {
      const today = new Date();
      const results = { processed: 0, sent: 0, failed: 0 };

      // Get dates for 1, 3, and 7 days in the future
      const reminderDays = [1, 3, 7];
      const reminderResults = await Promise.all(
        reminderDays.map(async (days) => {
          // Calculate target date
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + days);
          
          // Set time to end of day for comparison
          targetDate.setHours(23, 59, 59, 999);
          
          // Find transactions due on the target date
          const transactions = await prisma.transaction.findMany({
            where: {
              status: TransactionStatus.CHECKED_OUT,
              dueDate: {
                // Match transactions due on the target date (within 24 hours)
                gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                lte: new Date(targetDate.setHours(23, 59, 59, 999)),
              },
              // Don't send reminders for transactions that already have one for this interval
              NOT: {
                emailLogs: {
                  some: {
                    template: 'due-date-reminder',
                    createdAt: {
                      gte: new Date(new Date().setDate(today.getDate() - 1)), // Within the last day
                    },
                    templateData: {
                      contains: `"daysRemaining":${days}`,
                    },
                  },
                },
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  userPreferences: true,
                },
              },
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  isbn: true,
                },
              },
            },
          });

          results.processed += transactions.length;
          
          // Process each transaction
          const sentResults = await Promise.all(
            transactions.map(async (transaction) => {
              try {
                // Skip if user has disabled due date reminders
                const preferences = transaction.user.userPreferences?.[0];
                if (preferences && preferences.dueDateReminders === false) {
                  return false;
                }

                // Send due date reminder
                const result = await this.emailService.sendTemplatedEmail(
                  dueDateReminderTemplate,
                  {
                    user: {
                      id: transaction.user.id,
                      name: transaction.user.name,
                      email: transaction.user.email,
                    },
                    transaction: {
                      id: transaction.id,
                      checkoutDate: transaction.checkoutDate,
                      dueDate: transaction.dueDate,
                      book: transaction.book,
                    },
                    daysRemaining: days,
                  },
                  {
                    to: transaction.user.email,
                    subject: `Due Soon: "${transaction.book.title}" is due in ${days} ${days === 1 ? 'day' : 'days'}`,
                  }
                );

                // Log that this reminder was sent
                if (result.success) {
                  await prisma.emailLog.update({
                    where: { id: result.id },
                    data: {
                      transactionId: transaction.id,
                    },
                  });
                  return true;
                }
                return false;
              } catch (error) {
                console.error(`Failed to send due date reminder for transaction ${transaction.id}:`, error);
                return false;
              }
            })
          );

          const sentCount = sentResults.filter(Boolean).length;
          results.sent += sentCount;
          results.failed += transactions.length - sentCount;
          
          return { days, sent: sentCount, total: transactions.length };
        })
      );

      console.log('Due date reminder results:', reminderResults);
      return results;
    } catch (error) {
      console.error('Failed to process due date reminders:', error);
      return { processed: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * Process overdue notices
   * Sends overdue notices for books that are 1, 7, and 14 days overdue
   */
  async processOverdueNotices(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    try {
      const today = new Date();
      const results = { processed: 0, sent: 0, failed: 0 };

      // Get dates for 1, 7, and 14 days in the past
      const overdueDays = [1, 7, 14];
      const overdueResults = await Promise.all(
        overdueDays.map(async (days) => {
          // Calculate target date
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() - days);
          
          // Set time to end of day for comparison
          targetDate.setHours(23, 59, 59, 999);
          
          // Find overdue transactions
          const transactions = await prisma.transaction.findMany({
            where: {
              status: { in: [TransactionStatus.CHECKED_OUT, TransactionStatus.OVERDUE] },
              dueDate: {
                // Match transactions due on the target date (within 24 hours)
                gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                lte: new Date(targetDate.setHours(23, 59, 59, 999)),
              },
              // Don't send notices for transactions that already have one for this interval
              NOT: {
                emailLogs: {
                  some: {
                    template: 'overdue-notice',
                    createdAt: {
                      gte: new Date(new Date().setDate(today.getDate() - 1)), // Within the last day
                    },
                    templateData: {
                      contains: `"daysOverdue":${days}`,
                    },
                  },
                },
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  userPreferences: true,
                },
              },
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  isbn: true,
                },
              },
            },
          });

          results.processed += transactions.length;
          
          // Update transaction status to OVERDUE if needed
          await prisma.transaction.updateMany({
            where: {
              id: { in: transactions.map(t => t.id) },
              status: TransactionStatus.CHECKED_OUT,
            },
            data: {
              status: TransactionStatus.OVERDUE,
            },
          });
          
          // Process each transaction
          const sentResults = await Promise.all(
            transactions.map(async (transaction) => {
              try {
                // Skip if user has disabled overdue notices
                const preferences = transaction.user.userPreferences?.[0];
                if (preferences && preferences.overdueNotices === false) {
                  return false;
                }

                // Calculate fine
                const dueDate = new Date(transaction.dueDate);
                const fineRate = 0.5; // $0.50 per day
                const fine = parseFloat((days * fineRate).toFixed(2));

                // Send overdue notice
                const result = await this.emailService.sendTemplatedEmail(
                  overdueNoticeTemplate,
                  {
                    user: {
                      id: transaction.user.id,
                      name: transaction.user.name,
                      email: transaction.user.email,
                    },
                    transaction: {
                      id: transaction.id,
                      checkoutDate: transaction.checkoutDate,
                      dueDate: transaction.dueDate,
                      book: transaction.book,
                    },
                    daysOverdue: days,
                    fine,
                  },
                  {
                    to: transaction.user.email,
                    subject: `Overdue Notice: "${transaction.book.title}" is ${days} ${days === 1 ? 'day' : 'days'} overdue`,
                  }
                );

                // Log that this notice was sent
                if (result.success) {
                  await prisma.emailLog.update({
                    where: { id: result.id },
                    data: {
                      transactionId: transaction.id,
                    },
                  });
                  
                  // Update fine in transaction if needed
                  if (transaction.fine < fine) {
                    await prisma.transaction.update({
                      where: { id: transaction.id },
                      data: { fine },
                    });
                  }
                  
                  return true;
                }
                return false;
              } catch (error) {
                console.error(`Failed to send overdue notice for transaction ${transaction.id}:`, error);
                return false;
              }
            })
          );

          const sentCount = sentResults.filter(Boolean).length;
          results.sent += sentCount;
          results.failed += transactions.length - sentCount;
          
          return { days, sent: sentCount, total: transactions.length };
        })
      );

      console.log('Overdue notice results:', overdueResults);
      return results;
    } catch (error) {
      console.error('Failed to process overdue notices:', error);
      return { processed: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * Process reservation availability notifications
   * Sends notifications when reserved books become available
   */
  async processReservationAvailability(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    try {
      const results = { processed: 0, sent: 0, failed: 0 };

      // Find reservations that are ready for pickup but haven't been notified
      const reservations = await prisma.reservation.findMany({
        where: {
          status: ReservationStatus.READY_FOR_PICKUP,
          // Don't send notifications for reservations that already have one
          NOT: {
            emailLogs: {
              some: {
                template: 'reservation-availability',
              },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userPreferences: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
              status: true,
            },
          },
        },
      });

      results.processed = reservations.length;
      
      // Process each reservation
      const sentResults = await Promise.all(
        reservations.map(async (reservation) => {
          try {
            // Ensure book is actually reserved
            if (reservation.book.status !== BookStatus.RESERVED) {
              console.warn(`Book ${reservation.book.id} is not in RESERVED status for ready reservation ${reservation.id}`);
              // Update book status if needed
              await prisma.book.update({
                where: { id: reservation.book.id },
                data: { status: BookStatus.RESERVED },
              });
            }
            
            // Skip if user has disabled reservation notifications
            const preferences = reservation.user.userPreferences?.[0];
            if (preferences && preferences.reservationNotifications === false) {
              return false;
            }

            // Calculate pickup deadline (typically 7 days from now)
            const pickupDeadline = new Date(reservation.expiryDate);
            
            // Send reservation availability notification
            const result = await this.emailService.sendTemplatedEmail(
              reservationAvailabilityTemplate,
              {
                user: {
                  id: reservation.user.id,
                  name: reservation.user.name,
                  email: reservation.user.email,
                },
                reservation: {
                  id: reservation.id,
                  reservationDate: reservation.reservationDate,
                  expiryDate: reservation.expiryDate,
                  book: reservation.book,
                },
                pickupDeadline,
              },
              {
                to: reservation.user.email,
                subject: `Your Reserved Book "${reservation.book.title}" is Ready for Pickup`,
              }
            );

            // Log that this notification was sent
            if (result.success) {
              await prisma.emailLog.update({
                where: { id: result.id },
                data: {
                  reservationId: reservation.id,
                },
              });
              return true;
            }
            return false;
          } catch (error) {
            console.error(`Failed to send reservation availability notification for reservation ${reservation.id}:`, error);
            return false;
          }
        })
      );

      const sentCount = sentResults.filter(Boolean).length;
      results.sent = sentCount;
      results.failed = reservations.length - sentCount;
      
      console.log('Reservation availability results:', {
        processed: results.processed,
        sent: results.sent,
        failed: results.failed,
      });
      
      return results;
    } catch (error) {
      console.error('Failed to process reservation availability notifications:', error);
      return { processed: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * Process reservation expiration notifications
   * Sends notifications when reservations are about to expire
   */
  async processReservationExpirations(): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    try {
      const today = new Date();
      const results = { processed: 0, sent: 0, failed: 0 };

      // Calculate date for tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Find reservations that expire tomorrow
      const expiringReservations = await prisma.reservation.findMany({
        where: {
          status: ReservationStatus.READY_FOR_PICKUP,
          expiryDate: {
            gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
            lte: new Date(tomorrow.setHours(23, 59, 59, 999)),
          },
          // Don't send notifications for reservations that already have received an expiration reminder
          NOT: {
            emailLogs: {
              some: {
                subject: { contains: "expires tomorrow" },
                createdAt: {
                  gte: new Date(new Date().setDate(today.getDate() - 1)), // Within the last day
                },
              },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userPreferences: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
            },
          },
        },
      });

      results.processed = expiringReservations.length;
      
      // Process each expiring reservation
      const sentResults = await Promise.all(
        expiringReservations.map(async (reservation) => {
          try {
            // Skip if user has disabled reservation notifications
            const preferences = reservation.user.userPreferences?.[0];
            if (preferences && preferences.reservationNotifications === false) {
              return false;
            }

            // Send reservation expiration notification
            const result = await this.emailService.sendTemplatedEmail(
              reservationAvailabilityTemplate, // Reuse the availability template with modified content
              {
                user: {
                  id: reservation.user.id,
                  name: reservation.user.name,
                  email: reservation.user.email,
                },
                reservation: {
                  id: reservation.id,
                  reservationDate: reservation.reservationDate,
                  expiryDate: reservation.expiryDate,
                  book: reservation.book,
                },
                pickupDeadline: reservation.expiryDate,
              },
              {
                to: reservation.user.email,
                subject: `Reminder: Your reservation for "${reservation.book.title}" expires tomorrow`,
              }
            );

            // Log that this notification was sent
            if (result.success) {
              await prisma.emailLog.update({
                where: { id: result.id },
                data: {
                  reservationId: reservation.id,
                },
              });
              return true;
            }
            return false;
          } catch (error) {
            console.error(`Failed to send reservation expiration notification for reservation ${reservation.id}:`, error);
            return false;
          }
        })
      );

      const sentCount = sentResults.filter(Boolean).length;
      results.sent = sentCount;
      results.failed = expiringReservations.length - sentCount;
      
      console.log('Reservation expiration results:', {
        processed: results.processed,
        sent: results.sent,
        failed: results.failed,
      });
      
      return results;
    } catch (error) {
      console.error('Failed to process reservation expirations:', error);
      return { processed: 0, sent: 0, failed: 0 };
    }
  }

  /**
   * Run all notification processes at once
   */
  async processAllNotifications(): Promise<{
    dueDate: { processed: number; sent: number; failed: number };
    overdue: { processed: number; sent: number; failed: number };
    reservationAvailability: { processed: number; sent: number; failed: number };
    reservationExpiration: { processed: number; sent: number; failed: number };
    total: { processed: number; sent: number; failed: number };
  }> {
    const dueDate = await this.processDueDateReminders();
    const overdue = await this.processOverdueNotices();
    const reservationAvailability = await this.processReservationAvailability();
    const reservationExpiration = await this.processReservationExpirations();
    
    const total = {
      processed: dueDate.processed + overdue.processed + reservationAvailability.processed + reservationExpiration.processed,
      sent: dueDate.sent + overdue.sent + reservationAvailability.sent + reservationExpiration.sent,
      failed: dueDate.failed + overdue.failed + reservationAvailability.failed + reservationExpiration.failed,
    };
    
    return {
      dueDate,
      overdue,
      reservationAvailability,
      reservationExpiration,
      total,
    };
  }
}

export default NotificationScheduler;
