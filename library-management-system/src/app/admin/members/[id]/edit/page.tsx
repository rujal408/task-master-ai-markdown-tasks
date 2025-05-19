import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { Permission } from '@/lib/auth/rbac/types';
import MemberForm from '@/components/members/member-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Edit Member | Library Management System',
  description: 'Update member information and status.',
};

async function getMember(id: string) {
  const member = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      address: true,
      status: true,
      role: true,
    }
  });
  
  if (!member || member.role !== 'MEMBER') {
    return null;
  }
  
  return member;
}

export default async function EditMemberPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has permission to edit members
  if (!session?.user?.permissions?.includes(Permission.USER_UPDATE)) {
    redirect('/unauthorized');
  }
  
  const member = await getMember(params.id);
  
  if (!member) {
    notFound();
  }

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<FormSkeleton />}>
        <MemberForm 
          initialData={member}
          isEdit={true}
        />
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
