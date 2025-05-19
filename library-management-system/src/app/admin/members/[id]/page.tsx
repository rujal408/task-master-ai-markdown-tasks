import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { Permission } from '@/lib/auth/rbac/types';
import MemberDetail from '@/components/members/member-detail';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Member Details | Library Management System',
  description: 'View detailed information about a library member.',
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
      createdAt: true,
      updatedAt: true,
      profileImage: true,
      // Include borrowing history
      transactions: {
        select: {
          id: true,
          bookId: true,
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            }
          },
          status: true,
          dueDate: true,
          checkoutDate: true,
          returnDate: true,
        },
        orderBy: {
          checkoutDate: 'desc',
        }
      },
      // Include reservation history
      reservations: {
        select: {
          id: true,
          bookId: true,
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            }
          },
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        }
      },
      // Include fine history
      fines: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          transactionId: true,
          transaction: {
            select: {
              book: {
                select: {
                  title: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        }
      }
    }
  });
  
  if (!member || member.role !== 'MEMBER') {
    return null;
  }
  
  return member;
}

export default async function MemberDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has permission to view members
  if (!session?.user?.permissions?.includes(Permission.USER_READ)) {
    redirect('/unauthorized');
  }
  
  const member = await getMember(params.id);
  
  if (!member) {
    notFound();
  }

  return (
    <main className="container mx-auto py-6">
      <Suspense fallback={<MemberDetailSkeleton />}>
        <MemberDetail member={member} />
      </Suspense>
    </main>
  );
}

function MemberDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Skeleton className="h-[500px] md:col-span-1" />
        <Skeleton className="h-[600px] md:col-span-3" />
      </div>
    </div>
  );
}
