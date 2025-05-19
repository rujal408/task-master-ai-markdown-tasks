"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type NotificationPreference = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export function NotificationPreferences() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "due-date-reminder",
      label: "Due Date Reminders",
      description: "Receive notifications before books are due",
      enabled: true,
    },
    {
      id: "reservation-notification",
      label: "Reservation Notifications",
      description: "Get notified when reserved books become available",
      enabled: true,
    },
    {
      id: "marketing-emails",
      label: "Library Updates",
      description: "Receive updates about new books and library events",
      enabled: false,
    },
  ]);
  
  // Fetch notification preferences on component mount
  useEffect(() => {
    async function fetchPreferences() {
      try {
        setIsInitialLoading(true);
        const response = await fetch("/api/users/notification-preferences");
        
        if (!response.ok) {
          throw new Error("Failed to fetch notification preferences");
        }
        
        const data = await response.json();
        
        if (data.preferences && Array.isArray(data.preferences)) {
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          type: "error",
        });
      } finally {
        setIsInitialLoading(false);
      }
    }

    fetchPreferences();
  }, [toast]);

  const handleToggle = (id: string) => {
    setPreferences(prevPreferences =>
      prevPreferences.map(pref =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/users/notification-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save notification preferences");
      }
      
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated",
        type: "success",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {preferences.map((preference, index) => (
        <div key={preference.id}>
          <div className="flex items-center justify-between space-x-2 py-2">
            <div className="flex flex-col space-y-1">
              <Label
                htmlFor={preference.id}
                className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {preference.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {preference.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={preference.id}
                checked={preference.enabled}
                onCheckedChange={() => handleToggle(preference.id)}
                disabled={isLoading}
              />
            </div>
          </div>
          {index < preferences.length - 1 && <Separator />}
        </div>
      ))}
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
