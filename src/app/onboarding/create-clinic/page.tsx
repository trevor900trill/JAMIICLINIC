
"use client"
import React from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Building } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import withAuth from "@/components/auth/with-auth"

const clinicSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  location: z.string().min(1, "Location is required"),
  contact_number: z.string().min(10, "A valid contact number is required"),
})

function CreateClinicPage() {
    const { getAuthToken, skipOnboardingStep } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = React.useState(false);
    
    const form = useForm<z.infer<typeof clinicSchema>>({
        resolver: zodResolver(clinicSchema),
        defaultValues: { name: "", location: "", contact_number: "" },
    })

    async function onSubmit(values: z.infer<typeof clinicSchema>) {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/clinics/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(values)
            })

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create clinic.")
            }
            
            toast({ title: "Success", description: "Clinic created successfully." })
            skipOnboardingStep('clinic_created'); // Proceed to next step

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage })
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <div className="flex justify-center pb-4">
                                <Building className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-center">Create Your First Clinic</CardTitle>
                            <CardDescription className="text-center">
                               You need to create a clinic to start managing your operations. You can add more later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clinic Name</FormLabel>
                                    <FormControl><Input placeholder="Sunshine Wellness Center" {...field} /></FormControl>
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
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Saving..." : "Create Clinic & Continue"}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full" onClick={() => skipOnboardingStep('clinic_created')}>
                                Skip For Now
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}

export default withAuth(CreateClinicPage);
