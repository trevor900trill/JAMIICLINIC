
"use client"
import React from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import withAuth from "@/components/auth/with-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const staffSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  telephone: z.string().min(10),
  position: z.string().min(1, "Position is required"),
  clinic_id: z.coerce.number().int().positive("Please enter a valid Clinic ID"),
});

function CreateStaffPage() {
    const { getAuthToken, skipOnboardingStep } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    
    const form = useForm<z.infer<typeof staffSchema>>({
        resolver: zodResolver(staffSchema),
        defaultValues: { email: "", first_name: "", last_name: "" }
    })

    async function onSubmit(values: z.infer<typeof staffSchema>) {
        setIsLoading(true);
         try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/doctor/create-staff/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values)
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = Object.values(errorData).flat().join(' ');
                throw new Error(errorMessages || "Failed to create staff member.");
            }

            toast({ title: "Success", description: "Staff member created successfully." });
            skipOnboardingStep('staff_created'); // Proceed to dashboard

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
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
                                <Users className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-center">Add Your First Staff Member</CardTitle>
                            <CardDescription className="text-center">
                                You can start by adding a key member of your team, like a nurse or receptionist.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 py-4">
                            <FormField control={form.control} name="first_name" render={({ field }) => (
                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="last_name" render={({ field }) => (
                                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem className="col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="telephone" render={({ field }) => (
                                <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input placeholder="+254..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="position" render={({ field }) => (
                                <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g. Nurse" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="clinic_id" render={({ field }) => (
                                <FormItem><FormLabel>Clinic ID</FormLabel><FormControl><Input type="number" placeholder="Assign to clinic" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                             <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Saving..." : "Add Staff & Finish"}
                            </Button>
                             <Button type="button" variant="ghost" className="w-full" onClick={() => skipOnboardingStep('staff_created')}>
                                Skip and Go to Dashboard
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}

export default withAuth(CreateStaffPage);
