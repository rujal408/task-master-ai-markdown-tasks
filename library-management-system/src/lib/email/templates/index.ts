import dueDateReminderTemplate from './due-date-reminder';
import overdueNoticeTemplate from './overdue-notice';
import reservationAvailabilityTemplate from './reservation-availability';
import accountUpdateTemplate from './account-update';
import welcomeEmailTemplate from './welcome-email';
import { EmailTemplate } from './types';

// Registry of all email templates
const templates: Record<string, EmailTemplate<any>> = {
  'due-date-reminder': dueDateReminderTemplate,
  'overdue-notice': overdueNoticeTemplate,
  'reservation-availability': reservationAvailabilityTemplate,
  'account-update': accountUpdateTemplate,
  'welcome-email': welcomeEmailTemplate,
};

// Get a specific template by name
export function getTemplate<T = any>(name: string): EmailTemplate<T> | null {
  return templates[name] || null;
}

// Get all templates
export function getAllTemplates(): EmailTemplate<any>[] {
  return Object.values(templates);
}

// Get templates by category
export function getTemplatesByCategory(category: string): EmailTemplate<any>[] {
  return Object.values(templates).filter((template) => template.category === category);
}

// Export all templates individually
export {
  dueDateReminderTemplate,
  overdueNoticeTemplate,
  reservationAvailabilityTemplate,
  accountUpdateTemplate,
  welcomeEmailTemplate,
};

// Export template registry
export default templates;
