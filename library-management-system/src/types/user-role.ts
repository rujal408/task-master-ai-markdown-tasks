// Custom UserRole type that includes all possible roles
export type UserRole = 
  | 'SUPER_ADMIN'  // Full system access
  | 'ADMIN'        // Full access except system settings
  | 'LIBRARIAN'    // Book and member management
  | 'ASSISTANT'    // Basic librarian tasks
  | 'MEMBER'       // Regular library member
  | 'USER'         // Alias for MEMBER (for backward compatibility)
  | 'GUEST';       // Limited access

// Type guard to check if a string is a valid UserRole
export function isUserRole(role: string): role is UserRole {
  return [
    'SUPER_ADMIN',
    'ADMIN',
    'LIBRARIAN',
    'ASSISTANT',
    'MEMBER',
    'USER',
    'GUEST'
  ].includes(role);
}
