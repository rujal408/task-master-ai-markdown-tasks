'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Library Management System</h1>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Books</CardTitle>
              <CardDescription>Manage your book collection</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View, add, edit, and remove books from the library.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage library members</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Register new members and manage existing ones.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Manage book checkouts and returns</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Process book checkouts, returns, and track due dates.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}