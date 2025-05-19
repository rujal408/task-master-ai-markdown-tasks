'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { CheckoutWizard } from '@/components/borrowing/checkout-wizard';
import { ReturnProcess } from '@/components/borrowing/return-process';
import { TransactionHistory } from '@/components/borrowing/transaction-history';

export default function BorrowingsPage() {
  const [activeTab, setActiveTab] = useState('history');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Book Borrowing System</h1>
        <p className="text-muted-foreground mt-2">
          Manage book checkouts, returns, and view transaction history
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="checkout">Check Out Book</TabsTrigger>
          <TabsTrigger value="return">Return Book</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-6">
          <TransactionHistory />
        </TabsContent>
        <TabsContent value="checkout" className="mt-6">
          <Card className="p-6">
            <CheckoutWizard />
          </Card>
        </TabsContent>
        <TabsContent value="return" className="mt-6">
          <Card className="p-6">
            <ReturnProcess />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
