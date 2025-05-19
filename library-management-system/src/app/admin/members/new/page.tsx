import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Permission } from '@/lib/auth/rbac/types';
import MemberForm from '@/components/members/member-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Add New Member | Library Management System',
  description: 'Register a new library member account.',
};

export default async function NewMemberPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has permission to create members
  if (!session?.user?.permissions?.includes(Permission.USER_CREATE)) {
    redirect('/unauthorized');
  }

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<FormSkeleton />}>
        <MemberForm isEdit={false} />
      </Suspense>
    </main>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="h-[600px] w-full rounded-md" />
    </div>
  );
}
