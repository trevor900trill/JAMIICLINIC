
"use client"

import React from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users } from "lucide-react"
import { useApi } from '@/hooks/use-api'
import { API_BASE_URL } from '@/lib/config'

const staffSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  telephone: z.string().min(10),
  position: z.string().min(1, "Position is required"),
  clinic_id: z.coerce.number().int().positive("Please select a valid clinic"),
});

type StaffFormValues = z.infer<typeof staffSchema>

export default function CreateStaffPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const { apiFetch } = useApi()
  const [isLoading, setIsLoading] = React.useState(false)
  const [clinics, setClinics] = React.useState<{id: number, name: string}[]>([])

  React.useEffect(() => {
    async function fetchClinics() {
        if (user?.role !== 'doctor') return;
        try {
            const response = await apiFetch('/api/clinics/');
            if (!response.ok) {
                throw new Error("Could not fetch clinics.");
            }
            const clinicData = await response.json();
            setClinics(clinicData);
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not load your clinics." });
        }
    }
    fetchClinics();
  }, [user, apiFetch, toast]);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { 
      email: "", 
      first_name: "", 
      last_name: "", 
      telephone: "",
      position: "",
      clinic_id: undefined,
      gender: undefined,
    }
  })

  const handleSkip = async () => {
    setIsLoading(true);
    await refreshUser({ staff_created: true }); // Mark as skipped/done
    router.push('/dashboard');
  }

  async function onSubmit(values: StaffFormValues) {
    setIsLoading(true)
    try {
        const response = await apiFetch('/api/doctor/create-staff/', {
            method: 'POST',
            body: JSON.stringify(values),
        })

        if (!response.ok) {
            const errorData = await response.json()
            const errorMessages = Object.values(errorData).flat().join(' ');
            throw new Error(errorMessages || "Failed to create staff member.")
        }
        
        await refreshUser({ staff_created: true });

        toast({ title: "Success", description: "Staff member created." })

        router.push('/dashboard');

    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") return;
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({ variant: "destructive", title: "Error", description: errorMessage })
      setIsLoading(false);
    }
  }

  if (!user || user.role !== 'doctor') {
    if(typeof window !== "undefined") router.replace('/dashboard');
    return null;
  }
  
  if (clinics.length === 0) {
      return (
           <div className="flex min-h-screen items-center justify-center bg-background p-4">
              <Card className="w-full max-w-md">
                   <CardHeader>
                      <div className="flex justify-center mb-4">
                        <div className="bg-primary p-3 rounded-full">
                            <Users className="h-8 w-8 text-primary-foreground" />
                        </div>
                      </div>
                      <CardTitle className="text-center">Create Your First Staff Member</CardTitle>
                      <CardDescription className="text-center">
                        You need to create a clinic before you can add staff. You can skip this step for now and add staff later from the dashboard.
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                         <Button onClick={handleSkip} className="w-full" disabled={isLoading}>Go to Dashboard</Button>
                    </CardFooter>
              </Card>
           </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                    <Users className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-center">Create Your First Staff Member</CardTitle>
              <CardDescription className="text-center">
                Optionally, you can add a staff member now. You can do this later from the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telephone" render={({ field }) => (
                    <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input placeholder="+254..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="position" render={({ field }) => (
                    <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g. Nurse" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="clinic_id" render={({ field }) => (
                    <FormItem><FormLabel>Assign to Clinic</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select a clinic" /></SelectTrigger></FormControl><SelectContent>{clinics.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleSkip} className="w-full sm:w-auto" disabled={isLoading}>Skip for now</Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Saving..." : "Save and Finish"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
