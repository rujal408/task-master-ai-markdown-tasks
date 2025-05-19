import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating notification preferences
const notificationPreferenceSchema = z.object({
  preferences: z.array(
    z.object({
      id: z.string(),
      enabled: z.boolean(),
    })
  ),
});

// GET endpoint to retrieve user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // In a real implementation, you would fetch the user's notification preferences
    // from the database. For now, we'll return default values.
    const preferences = [
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
    ];

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to fetch notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// POST endpoint to update user's notification preferences
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const data = await request.json();
    
    // Validate the request data
    const validationResult = notificationPreferenceSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid data", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { preferences } = validationResult.data;
    
    // In a real implementation, you would save the user's notification preferences
    // to the database. For now, we'll just acknowledge the request.
    // 
    // Example database code:
    // await prisma.userNotificationPreference.deleteMany({
    //   where: { userId },
    // });
    // 
    // await prisma.userNotificationPreference.createMany({
    //   data: preferences.map((pref) => ({
    //     userId,
    //     preferenceId: pref.id,
    //     enabled: pref.enabled,
    //   })),
    // });
    
    return NextResponse.json(
      { message: "Notification preferences updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
