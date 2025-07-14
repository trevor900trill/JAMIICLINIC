
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
import { Loader2, Stethoscope } from "lucide-react"
import { API_BASE_URL } from '@/lib/config'

const specialtySchema = z.object({
  specialty: z.string().min(2, "Specialty is required."),
});

type SpecialtyFormValues = z.infer<typeof specialtySchema>

export default function SetSpecialtyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getAuthToken, refreshUser, logout } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<SpecialtyFormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: { specialty: "" },
  })

  React.useEffect(() => {
    // This page is only for doctors, redirect if not a doctor or if user is not loaded
    if (user && user.role !== 'doctor') {
      router.replace('/dashboard');
    }
  }, [user, router]);


  async function onSubmit(data: SpecialtyFormValues) {
    setIsLoading(true)
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        setIsLoading(false);
        return;
    }
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/doctor/set-specialty/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              specialty: data.specialty,
              email: user.email
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || "Failed to set specialty.")
        }
        
        await refreshUser({ specialty_set: true });

        toast({ title: "Success", description: "Your specialty has been set." })

        router.push('/onboarding/create-clinic');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({ variant: "destructive", title: "Error", description: errorMessage })
      setIsLoading(false)
    }
  }
  
  const handleReturnToLogin = () => {
    logout();
  }

  // Render a loading state or nothing while the user object is being determined.
  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                    <Stethoscope className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-center">Set Your Medical Specialty</CardTitle>
              <CardDescription className="text-center">
                Your account <span className="font-medium text-foreground">{user.email}</span> requires a primary medical specialty (e.g., Cardiology, Pediatrics).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="Cardiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleReturnToLogin} className="w-full sm:w-auto">Return to Login</Button>
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
