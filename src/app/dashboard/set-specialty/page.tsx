
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2, Stethoscope } from "lucide-react"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { API_BASE_URL } from "@/lib/config"

const specialtySchema = z.object({
  specialty: z.string().min(2, "Specialty must be at least 2 characters long."),
})

type SpecialtyFormValues = z.infer<typeof specialtySchema>

export default function SetSpecialtyPage() {
  const router = useRouter()
  const { user, getAuthToken, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<SpecialtyFormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      specialty: "",
    },
  })

  async function onSubmit(data: SpecialtyFormValues) {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/doctor/set-specialty/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            specialty: data.specialty,
            email: user?.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(' ')
        throw new Error(errorMessage || 'Failed to set specialty.');
      }
      
      toast({
        title: "Specialty Set Successfully",
        description: "Let's set up your first clinic.",
      })
      
      await refreshUser({ specialty_set: true });
      router.push("/dashboard/onboarding/create-clinic")

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-muted/40">
      <Card className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <div className="flex justify-center pb-4">
                    <Stethoscope className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-center">Set Your Specialty</CardTitle>
                <CardDescription className="text-center">
                    To get started, please specify your medical specialty to complete your profile.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cardiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
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
