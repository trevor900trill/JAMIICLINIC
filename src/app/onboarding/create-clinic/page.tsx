
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
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building } from "lucide-react"
import { API_BASE_URL } from '@/lib/config'

const clinicSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  location: z.string().min(1, "Location is required"),
  contact_number: z.string().min(10, "A valid contact number is required"),
});

type ClinicFormValues = z.infer<typeof clinicSchema>

export default function CreateClinicPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getAuthToken, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { name: "", location: "", contact_number: "" },
  })

  const handleSkip = async () => {
    await refreshUser({ clinic_created: true }); // Mark as skipped/done
    router.push('/onboarding/create-staff');
  }

  async function onSubmit(values: ClinicFormValues) {
    setIsLoading(true)
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/clinics/create/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(values),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || "Failed to create clinic.")
        }
        
        await refreshUser({ clinic_created: true });

        toast({ title: "Success", description: "Your clinic has been created." })

        router.push('/onboarding/create-staff');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({ variant: "destructive", title: "Error", description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.role !== 'doctor') {
    if(typeof window !== "undefined") router.replace('/dashboard');
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                    <Building className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-center">Create Your First Clinic</CardTitle>
              <CardDescription className="text-center">
                Optionally, you can create your first clinic now. You can also do this later from the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Sunshine Clinic" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder="Nairobi, Kenya" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="contact_number" render={({ field }) => (
                <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl><Input placeholder="+254700000000" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleSkip} className="w-full sm:w-auto">Skip for now</Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Saving..." : "Save and Continue"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
