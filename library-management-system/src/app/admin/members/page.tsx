import { Suspense } from 'react';
import { Metadata } from 'next';
import { UserStatus } from '@prisma/client';
import MemberList from '@/components/members/member-list';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { Permission } from '@/lib/auth/rbac/types';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Member Management | Library Management System',
  description: 'Manage library members - view, add, edit, and search for members.',
};

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: UserStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function getMembers(searchParams: SearchParams) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const skip = (page - 1) * limit;
  const search = searchParams.search;
  const status = searchParams.status;
  const sortBy = searchParams.sortBy || 'createdAt';
  const sortOrder = searchParams.sortOrder || 'desc';

  // Build the filter object for prisma query
  const where: any = {
    // Only return members (exclude admins, librarians)
    role: 'MEMBER'
  };

  // Add search filter if provided
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Add status filter if provided
  if (status) {
    where.status = status;
  }

  // Get total count of members matching the filter
  const totalCount = await prisma.user.count({ where });

  // Get members with pagination, filtering, and sorting
  const members = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // Include borrowing activity statistics
      transactions: {
        select: {
          id: true,
        },
        where: {
          status: {
            in: ['CHECKED_OUT', 'OVERDUE']
          }
        }
      },
      // Include reservation statistics
      reservations: {
        select: {
          id: true,
        },
        where: {
          status: {
            in: ['PENDING', 'READY_FOR_PICKUP']
          }
        }
      }
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
  });

  // Transform the results to include activity counts
  const transformedMembers = members.map(member => ({
    ...member,
    activeBorrowingsCount: member.transactions.length,
    activeReservationsCount: member.reservations.length,
    // Remove the raw relationship data
    transactions: undefined,
    reservations: undefined
  }));

  return {
    members: transformedMembers,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    }
  };
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has permission to view members
  if (!session?.user?.permissions?.includes(Permission.USER_READ)) {
    redirect('/unauthorized');
  }

  const { members, pagination } = await getMembers(searchParams);

  return (
    <main className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<MemberList />}>
        <MemberList 
          initialMembers={members} 
          initialPagination={pagination}
        />
      </Suspense>
    </main>
  );
}
