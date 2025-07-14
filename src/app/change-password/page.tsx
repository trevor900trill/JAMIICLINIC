
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2, KeyRound } from "lucide-react"

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

const passwordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters long."),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, isLoading, getAuthToken, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  async function onSubmit(data: PasswordFormValues) {
    if (!user) return;
    setIsSubmitting(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/api/users/change-password/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            new_password: data.new_password,
            confirm_password: data.confirm_password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(' ')
        throw new Error(errorMessage || 'Failed to change password.');
      }

      await refreshUser({ reset_initial_password: false });
      
      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
      })
      
      if (user.role === 'doctor') {
        router.push("/set-specialty");
      } else {
        router.push("/dashboard");
      }

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
                    <KeyRound className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-center">Create a New Password</CardTitle>
                <CardDescription className="text-center">
                    For your security, you must set a new password to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : "Set New Password"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
