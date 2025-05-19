# Library Management System - Email Notifications

## Overview

The notification system allows the library to send automated emails to users for various events:

- **Due Date Reminders**: Sent 1, 3, and 7 days before books are due
- **Overdue Notices**: Sent 1, 7, and 14 days after books become overdue
- **Reservation Notifications**: When books become available or reservations are about to expire
- **Account Updates**: When user account settings change
- **Welcome Emails**: When new users register

## Setting Up Email

1. Configure email settings in your `.env` file:

```
# Email Configuration
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_SECURE=false
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com
EMAIL_FROM_NAME="Library Management System"
```

Replace the values with your actual email provider settings.

## Automated Notifications

Notifications can be triggered in two ways:

### 1. Scheduled via Cron Job

Set up a cron job to run the notifications scheduler at regular intervals:

```bash
# Run every day at 1:00 AM
0 1 * * * cd /path/to/library-management-system && node -r ts-node/register src/lib/email/schedulers/scheduler-runner.ts --job=all
```

Available job types:
- `--job=due-date`: Process due date reminders
- `--job=overdue`: Process overdue notices
- `--job=reservation-availability`: Process reservation availability notifications
- `--job=reservation-expiration`: Process reservation expiration notifications
- `--job=all`: Process all notification types (default)

### 2. Manual Triggering via Admin UI

Administrators and librarians can manually trigger email notifications:

1. Log in as an admin or librarian
2. Navigate to `/admin/notifications`
3. Select the notification type to send
4. Click "Send Notifications"
5. View the results

## Email Templates

All email templates are React components using JSX for maintainable HTML email content:

- Located in `src/lib/email/templates/`
- Centrally registered in `src/lib/email/templates/index.ts`
- Use a common base template in `src/lib/email/templates/base-template.tsx`

## User Preferences

Users can control which notifications they receive through their account preferences:

- Due date reminders
- Overdue notices 
- Reservation notifications
- Account updates

All emails respect user preferences and will not be sent if disabled in the user's settings.

## Email Logging

All sent emails are logged to the database in the `EmailLog` table, which includes:

- Template used
- Recipient
- Send status
- Related entities (transactions, reservations)

This logging helps with troubleshooting and tracking email delivery.

## Development

To add a new email template:

1. Create a new file in `src/lib/email/templates/`
2. Implement the required interface from `types.ts`
3. Add it to the registry in `index.ts`
4. Add any needed scheduler logic in `notification-scheduler.ts`

## Testing Emails

To test email sending:

1. Use the admin notification interface
2. Start with a small subset of recipients
3. Check the email logs for delivery status
4. Use a development SMTP service like Mailtrap in development environments

## Troubleshooting

Common issues:

- **Emails not sending**: Check SMTP credentials and server availability
- **Notification scheduling**: Ensure cron jobs are running correctly
- **Missing recipients**: Verify user permissions and notification preferences
- **Failed deliveries**: Check email logs for specific error messages
