'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Mail, Download, Check } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ReceiptProps {
  borrowingId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  memberName: string;
  membershipNumber: string;
  checkoutDate: string;
  dueDate: string;
  notes?: string;
  onClose?: () => void;
}

export function CheckoutReceipt({ 
  borrowingId,
  bookTitle,
  bookAuthor,
  bookIsbn,
  memberName,
  membershipNumber,
  checkoutDate,
  dueDate,
  notes,
  onClose
}: ReceiptProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      // In a real implementation, this would call an API endpoint to send an email
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Error sending email', error);
    } finally {
      setSendingEmail(false);
    }
  };
  
  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF and trigger download
    alert('PDF generation would be implemented here');
  };
  
  const formattedCheckoutDate = new Date(checkoutDate).toLocaleDateString();
  const formattedDueDate = new Date(dueDate).toLocaleDateString();
  
  return (
    <div className="print:m-0">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-lg font-semibold">Checkout Receipt</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendEmail}
            disabled={sendingEmail || emailSent}
          >
            {emailSent ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Sent!
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                {sendingEmail ? 'Sending...' : 'Email'}
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Library Checkout Receipt</h1>
            <p className="text-gray-500">Transaction ID: {borrowingId}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Book Details</h3>
              <p className="font-medium">{bookTitle}</p>
              <p className="text-sm">by {bookAuthor}</p>
              <p className="text-sm text-gray-500">ISBN: {bookIsbn}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Member</h3>
              <p className="font-medium">{memberName}</p>
              <p className="text-sm text-gray-500">ID: {membershipNumber}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Checkout Date</h3>
              <p>{formattedCheckoutDate}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
              <p className="font-medium">{formattedDueDate}</p>
            </div>
          </div>
          
          {notes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{notes}</p>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm">Please return this item by <span className="font-bold">{formattedDueDate}</span></p>
                <p className="text-xs text-gray-500 mt-1">Late returns are subject to a fee of $0.50 per day</p>
              </div>
              <div className="flex-shrink-0">
                <QRCode
                  value={`borrow:${borrowingId}`}
                  size={80}
                  style={{ height: "auto", maxWidth: "80px", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-8">
            <p>Library Management System</p>
            <p>123 Book Street, Reading City</p>
            <p>Phone: (555) 123-4567 | Email: library@example.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CheckoutReceiptDialog({
  borrowingId,
  bookTitle,
  bookAuthor,
  bookIsbn,
  memberName,
  membershipNumber,
  checkoutDate,
  dueDate,
  notes,
  trigger
}: ReceiptProps & { 
  trigger: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout Receipt</DialogTitle>
        </DialogHeader>
        <CheckoutReceipt
          borrowingId={borrowingId}
          bookTitle={bookTitle}
          bookAuthor={bookAuthor}
          bookIsbn={bookIsbn}
          memberName={memberName}
          membershipNumber={membershipNumber}
          checkoutDate={checkoutDate}
          dueDate={dueDate}
          notes={notes}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
