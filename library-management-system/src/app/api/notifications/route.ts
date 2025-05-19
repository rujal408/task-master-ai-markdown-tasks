import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import NotificationScheduler from '@/lib/email/schedulers/notification-scheduler';
import { UserRole } from '@prisma/client';

/**
 * POST /api/notifications
 * Triggers email notifications manually
 * Requires admin or librarian role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check authorization (admin or librarian only)
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.LIBRARIAN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type } = body;

    // Validate notification type
    const validTypes = [
      'due-date',
      'overdue',
      'reservation-availability',
      'reservation-expiration',
      'all',
    ];
    
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Valid types are: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize scheduler
    const scheduler = new NotificationScheduler();
    let result;

    // Process notifications based on type
    switch (type) {
      case 'due-date':
        result = await scheduler.processDueDateReminders();
        break;
      case 'overdue':
        result = await scheduler.processOverdueNotices();
        break;
      case 'reservation-availability':
        result = await scheduler.processReservationAvailability();
        break;
      case 'reservation-expiration':
        result = await scheduler.processReservationExpirations();
        break;
      case 'all':
      default:
        result = await scheduler.processAllNotifications();
        break;
    }

    // Return success response with results
    return NextResponse.json({
      success: true,
      type: type || 'all',
      result,
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications
 * Gets notification types and status
 * Requires admin or librarian role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check authorization (admin or librarian only)
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.LIBRARIAN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Return notification types
    return NextResponse.json({
      notificationTypes: [
        {
          id: 'due-date',
          name: 'Due Date Reminders',
          description: 'Sends reminders for books due in 1, 3, and 7 days',
        },
        {
          id: 'overdue',
          name: 'Overdue Notices',
          description: 'Sends notices for books that are 1, 7, and 14 days overdue',
        },
        {
          id: 'reservation-availability',
          name: 'Reservation Availability',
          description: 'Sends notifications when reserved books become available',
        },
        {
          id: 'reservation-expiration',
          name: 'Reservation Expiration',
          description: 'Sends notifications when reservations are about to expire',
        },
        {
          id: 'all',
          name: 'All Notifications',
          description: 'Processes all notification types at once',
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching notification types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification types', details: String(error) },
      { status: 500 }
    );
  }
}
