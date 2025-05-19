# Email Notification System

This module implements a comprehensive email notification system for the library management system, including email delivery, templates, and automated scheduling.

## Features

- Email service integration using Nodemailer
- Templated emails with React components
- Email tracking and retry logic
- Automated notification scheduling
- Manual notification triggering via admin UI

## Email Templates

The system includes the following email templates:

- **Due Date Reminders**: Sent 1, 3, and 7 days before books are due
- **Overdue Notices**: Sent 1, 7, and 14 days after books are overdue
- **Reservation Availability**: Sent when reserved books become available
- **Reservation Expiration**: Sent before reservations expire
- **Account Updates**: Sent when user account information changes
- **Welcome Emails**: Sent to new users upon registration

## Directory Structure

```
src/lib/email/
├── config.ts                # Email configuration and transport setup
├── service.ts               # Email sending and tracking service
├── templates/               # Email templates
│   ├── index.ts             # Template registry and exports
│   ├── types.ts             # TypeScript interfaces for templates
│   ├── base-template.tsx    # Base template component
│   ├── due-date-reminder.tsx
│   ├── overdue-notice.tsx
│   ├── reservation-availability.tsx
│   ├── account-update.tsx
│   └── welcome-email.tsx
└── schedulers/              # Notification scheduling
    ├── notification-scheduler.ts  # Core scheduler implementation
    └── scheduler-runner.ts        # CLI for running scheduled jobs
```

## Setting Up Scheduled Notifications

To set up automated email notifications, you'll need to configure a cron job to run the scheduler at regular intervals.

### Cron Job Example

Add the following to your crontab (`crontab -e`):

```bash
# Run email notifications daily at 1:00 AM
0 1 * * * cd /path/to/library-management-system && npx ts-node --transpile-only src/lib/email/schedulers/scheduler-runner.ts --job=all
```

### Available Job Types

You can run specific notification types by specifying the job parameter:

- `--job=due-date`: Process due date reminders only
- `--job=overdue`: Process overdue notices only
- `--job=reservation-availability`: Process reservation availability notifications only
- `--job=reservation-expiration`: Process reservation expiration notifications only
- `--job=all`: Process all notifications (default)

## Manual Notification Triggering

Administrators and librarians can manually trigger email notifications through the admin UI:

1. Navigate to `/admin/notifications` in the application
2. Select the notification type to send
3. Click "Send Notifications"

This is useful for testing or sending one-off notification batches.

## Environment Variables

The email system requires the following environment variables to be set:

```
# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=your_password
EMAIL_FROM=Library Management System <noreply@example.com>

# Application URL for email links
NEXT_PUBLIC_APP_URL=https://your-library-app.com
```

## Adding New Email Templates

To create a new email template:

1. Create a new template file in `src/lib/email/templates/`
2. Define the template with appropriate TypeScript types
3. Add the template to the registry in `src/lib/email/templates/index.ts`
4. Implement any needed scheduler logic in `notification-scheduler.ts`

## User Preferences

Users can configure their notification preferences in their account settings. The system respects these preferences when sending emails.

## Email Logging

All sent emails are logged to the database in the `EmailLog` table, which includes:
- Template used
- Recipient information
- Send status
- Retry information
- Related entities (transactions, reservations, etc.)

This logging helps with troubleshooting and tracking email delivery status.
