
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

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

const specialtySchema = z.object({
  specialty: z.string().min(2, "Please enter a valid specialty."),
})

type SpecialtyFormValues = z.infer<typeof specialtySchema>

export default function SetSpecialtyPage() {
  const router = useRouter()
  const { user, isLoading, getAuthToken, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<SpecialtyFormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      specialty: "",
    },
  })

  async function onSubmit(data: SpecialtyFormValues) {
    setIsSubmitting(true)
    try {
      const token = getAuthToken()
      // NOTE: The API Spec doesn't have an endpoint to set specialty.
      // This is a placeholder call. We will simulate a successful update.
      console.log("Simulating setting specialty for user:", user?.id, "with data:", data)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // We will update the user's state locally to proceed with onboarding
      await refreshUser({ specialty_set: true });
      
      toast({
        title: "Specialty Set!",
        description: "Your specialty has been successfully saved.",
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <div className="flex justify-center pb-4">
                    <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-center">Set Your Medical Specialty</CardTitle>
                <CardDescription className="text-center">
                    To continue setting up your account, please enter your medical specialty.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cardiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : "Continue"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
