import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { UserStatus } from '@prisma/client';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Textarea  from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

// Base validation schema
const memberBaseSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, {
      message: "Please enter a valid phone number.",
    })
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
});

// Schema for creating a new member (includes password)
const memberCreateSchema = memberBaseSchema.extend({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for editing an existing member (no password required)
const memberEditSchema = memberBaseSchema.extend({
  status: z.nativeEnum(UserStatus, {
    required_error: "Please select a status.",
  }),
});

interface Member {
  id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  status?: UserStatus;
}

interface MemberFormProps {
  initialData?: Member;
  isEdit?: boolean;
}

const MemberForm: React.FC<MemberFormProps> = ({ 
  initialData,
  isEdit = false
}) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<UserStatus | undefined>(
    initialData?.status
  );
  const totalSteps = isEdit ? 2 : 3;

  // Use the appropriate schema based on whether this is a create or edit form
  const formSchema = isEdit ? memberEditSchema : memberCreateSchema;
  
  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phoneNumber: initialData?.phoneNumber || '',
      address: initialData?.address || '',
      ...(isEdit && { status: initialData?.status || UserStatus.ACTIVE }),
      ...(!isEdit && { 
        password: '',
        confirmPassword: ''
      }),
    },
  });

  // Check form validity for current step
  const isStepValid = () => {
    const { name, email, phoneNumber, address, password, confirmPassword, status } = form.getValues();
    
    switch (step) {
      case 1: // Personal Information
        return (
          form.formState.dirtyFields.name && 
          !form.getFieldState('name').invalid &&
          form.formState.dirtyFields.email && 
          !form.getFieldState('email').invalid
        );
      case 2: // Contact Information (optional)
        return (
          !form.getFieldState('phoneNumber').invalid &&
          !form.getFieldState('address').invalid
        );
      case 3: // Password (only for new members)
        return (
          form.formState.dirtyFields.password &&
          !form.getFieldState('password').invalid &&
          form.formState.dirtyFields.confirmPassword &&
          !form.getFieldState('confirmPassword').invalid
        );
      default:
        return false;
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const endpoint = isEdit 
        ? `/api/members/${initialData?.id}` 
        : '/api/members';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      // Transform data for API (remove confirmPassword for new members)
      const apiData = isEdit 
        ? values 
        : {
            name: values.name,
            email: values.email,
            phoneNumber: values.phoneNumber,
            address: values.address,
            password: values.password,
          };
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save member');
      }
      
      // Redirect to the members list or detail page
      if (isEdit) {
        router.push(`/admin/members/${initialData?.id}`);
      } else {
        router.push('/admin/members');
      }
      
      // Add a success toast/notification here if you have a toast system
      
    } catch (error: any) {
      console.error('Error saving member:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Handle status change with confirmation
  const handleStatusChange = (newStatus: UserStatus) => {
    const currentStatus = form.getValues('status');
    
    // If changing from active to suspended or inactive, show confirmation
    if (
      currentStatus === UserStatus.ACTIVE && 
      (newStatus === UserStatus.SUSPENDED || newStatus === UserStatus.INACTIVE)
    ) {
      setPreviousStatus(currentStatus);
      setShowStatusChangeDialog(true);
    }
    
    form.setValue('status', newStatus);
  };

  const cancelStatusChange = () => {
    if (previousStatus) {
      form.setValue('status', previousStatus);
    }
    setShowStatusChangeDialog(false);
  };

  const confirmStatusChange = () => {
    setShowStatusChangeDialog(false);
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Member' : 'Add New Member'}</CardTitle>
          <CardDescription>
            {isEdit 
              ? 'Update member information' 
              : 'Create a new library member account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Progress indicator */}
              <div className="flex justify-between mb-8">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                        ${idx + 1 === step 
                          ? 'border-primary bg-primary text-primary-foreground' 
                          : idx + 1 < step 
                            ? 'border-primary bg-primary-foreground text-primary' 
                            : 'border-muted bg-background text-muted-foreground'
                        }`}
                    >
                      {idx + 1 < step ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span 
                      className={`text-xs mt-1 
                        ${idx + 1 === step 
                          ? 'text-primary font-medium' 
                          : 'text-muted-foreground'
                        }`}
                    >
                      {idx + 1 === 1 ? 'Personal' : 
                       idx + 1 === 2 ? 'Contact' : 
                       'Security'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used as the login username
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {isEdit && (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={(value) => handleStatusChange(value as UserStatus)} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                              <SelectItem value={UserStatus.INACTIVE}>Inactive</SelectItem>
                              <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                              <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Controls whether the member can log in and borrow books
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Step 2: Contact Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter phone number (optional)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter address (optional)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Password (Only for new members) */}
              {!isEdit && step === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step === 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrevious}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button 
              type="button" 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || !isStepValid()}
            >
              {isSubmitting ? 'Saving...' : 'Save Member'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Status change confirmation dialog */}
      <AlertDialog 
        open={showStatusChangeDialog} 
        onOpenChange={setShowStatusChangeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {form.getValues('status') === UserStatus.SUSPENDED ? (
                'Suspending this member will prevent them from borrowing books or accessing their account. They may have outstanding items or reservations that need to be addressed.'
              ) : (
                'Deactivating this member will prevent them from borrowing books or accessing their account. Are you sure you want to continue?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStatusChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemberForm;
