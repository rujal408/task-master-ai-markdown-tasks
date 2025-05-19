import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@prisma/client';
import { format } from 'date-fns';
import { UserPlusIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Member {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  phoneNumber: string | null;
  createdAt: string;
  activeBorrowingsCount: number;
  activeReservationsCount: number;
}

interface MemberListProps {
  initialMembers?: Member[];
  initialPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const MemberStatusBadge = ({ status }: { status: UserStatus }) => {
  const statusStyles = {
    ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100',
    INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-100',
    PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  };

  return (
    <Badge className={statusStyles[status]} variant="outline">
      {status}
    </Badge>
  );
};

const MemberList: React.FC<MemberListProps> = ({ 
  initialMembers = [], 
  initialPagination = { total: 0, page: 1, limit: 10, totalPages: 0 }
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [pagination, setPagination] = useState(initialPagination);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>(
    (searchParams.get('status') as UserStatus) || ''
  );

  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const fetchMembers = async (page: number = 1) => {
    setIsLoading(true);
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pagination.limit.toString());
    
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter) params.set('status', statusFilter);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    
    try {
      const response = await fetch(`/api/members?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data.members);
      setPagination(data.pagination);
      
      // Update URL without refreshing the page
      const url = new URL(window.location.href);
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers(1); // Reset to page 1 when searching
  };

  const handleChangePage = (newPage: number) => {
    fetchMembers(newPage);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus as UserStatus | '');
    fetchMembers(1); // Reset to page 1 when filter changes
  };

  const handleSortChange = (column: string) => {
    const newSortOrder = column === sortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    fetchMembers(1); // Reset to page 1 when sort changes
  };

  const viewMemberDetails = (memberId: string) => {
    router.push(`/admin/members/${memberId}`);
  };

  const editMember = (memberId: string) => {
    router.push(`/admin/members/${memberId}/edit`);
  };

  const createNewMember = () => {
    router.push('/admin/members/new');
  };

  // Generate array for pagination links
  const getPaginationLinks = () => {
    const { page, totalPages } = pagination;
    const links = [];
    
    // Always show first page
    links.push(1);
    
    // Calculate range around current page
    let rangeStart = Math.max(2, page - 1);
    let rangeEnd = Math.min(totalPages - 1, page + 1);
    
    // Ensure we show at least 3 pages if available
    if (rangeEnd - rangeStart < 2) {
      if (rangeStart === 2) {
        rangeEnd = Math.min(totalPages - 1, rangeStart + 2);
      } else if (rangeEnd === totalPages - 1) {
        rangeStart = Math.max(2, rangeEnd - 2);
      }
    }
    
    // Add ellipsis before range if needed
    if (rangeStart > 2) {
      links.push('...');
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      links.push(i);
    }
    
    // Add ellipsis after range if needed
    if (rangeEnd < totalPages - 1) {
      links.push('...');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      links.push(totalPages);
    }
    
    return links;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Members</CardTitle>
        <Button 
          onClick={createNewMember} 
          className="ml-auto"
          size="sm"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <div className="flex flex-row gap-2 sm:justify-end sm:ml-auto">
            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSortChange('name')}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSortChange('email')}
                >
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSortChange('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Borrowings</TableHead>
                <TableHead>Reservations</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSortChange('createdAt')}
                >
                  Joined {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loader when loading
                Array.from({length: 5}).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell> 
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <MemberStatusBadge status={member.status} />
                    </TableCell>
                    <TableCell>{member.activeBorrowingsCount}</TableCell>
                    <TableCell>{member.activeReservationsCount}</TableCell>
                    <TableCell>
                      {format(new Date(member.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => viewMemberDetails(member.id)}
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => editMember(member.id)}
                        title="Edit member"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => pagination.page > 1 && handleChangePage(pagination.page - 1)}
                  className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {getPaginationLinks().map((link, i) => (
                <PaginationItem key={i}>
                  {link === '...' ? (
                    <span className="px-4 py-2">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => typeof link === 'number' && handleChangePage(link)}
                      isActive={pagination.page === link}
                      className="cursor-pointer"
                    >
                      {link}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => 
                    pagination.page < pagination.totalPages && 
                    handleChangePage(pagination.page + 1)
                  }
                  className={
                    pagination.page >= pagination.totalPages 
                      ? 'pointer-events-none opacity-50' 
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberList;
