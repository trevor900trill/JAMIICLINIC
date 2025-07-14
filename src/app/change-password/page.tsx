
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
import { Loader2, KeyRound } from "lucide-react"
import { API_BASE_URL } from '@/lib/config'

const changePasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters long.").regex(/[~!@#$%^&*]/, "Password must contain at least one special character eg.\"~!@#$%^&*\""),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getAuthToken, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  })

  async function onSubmit(data: ChangePasswordFormValues) {
    setIsLoading(true)
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/users/change-password/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              new_password: data.new_password,
              confirm_password: data.confirm_password,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || "Failed to change password.")
        }
        
        await refreshUser({ reset_initial_password: false });

        toast({ title: "Success", description: "Your password has been changed successfully." })

        if (user?.role === 'doctor') {
            router.push('/set-specialty');
        } else {
            router.push('/dashboard');
        }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      toast({ variant: "destructive", title: "Error", description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                    <KeyRound className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-center">Set Your New Password</CardTitle>
              <CardDescription className="text-center">
                For security, please create a new password for your account: <span className="font-medium text-foreground">{user.email}</span>.
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Saving..." : "Set New Password"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
