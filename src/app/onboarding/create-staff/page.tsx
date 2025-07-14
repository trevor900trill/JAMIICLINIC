
"use client"
import React from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/config"
import withAuth from "@/components/auth/with-auth"

const staffSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  telephone: z.string().min(10),
  position: z.string().min(1, "Position is required"),
});

function OnboardingCreateStaffPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const { user, getAuthToken, refreshUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const form = useForm<z.infer<typeof staffSchema>>({
        resolver: zodResolver(staffSchema),
        defaultValues: { email: "", first_name: "", last_name: "", position: "" }
    })

    async function onSubmit(values: z.infer<typeof staffSchema>) {
        if (!user?.new_clinic_id) {
            toast({ variant: "destructive", title: "Error", description: "No clinic ID found to assign staff to." });
            return;
        }

        setIsLoading(true);
         try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/doctor/create-staff/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({...values, clinic_id: user.new_clinic_id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = Object.values(errorData).flat().join(' ');
                throw new Error(errorMessages || "Failed to create staff member.");
            }

            toast({ title: "Success", description: "Staff member created successfully. Onboarding complete!" });
            await refreshUser({}); // No state change needed, just go to dashboard
            router.push('/dashboard');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSkip = () => {
        toast({ title: "Onboarding Complete!", description: "Welcome to your dashboard."})
        router.push('/dashboard');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-lg">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <div className="flex justify-center pb-4">
                                <UserPlus className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-center">Add Your First Staff Member</CardTitle>
                            <CardDescription className="text-center">
                                Invite a nurse, receptionist, or other staff to your new clinic. You can skip this step for now.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 py-4">
                            <FormField control={form.control} name="first_name" render={({ field }) => (
                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Jane" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="last_name" render={({ field }) => (
                                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Miller" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem className="col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="jane.miller@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="telephone" render={({ field }) => (
                                <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input placeholder="+254..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="position" render={({ field }) => (
                                <FormItem><FormLabel>Position / Role</FormLabel><FormControl><Input placeholder="e.g. Nurse, Receptionist" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" type="button" onClick={handleSkip}>Skip & Go to Dashboard</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Saving..." : "Add Staff & Finish"}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    )
}

export default withAuth(OnboardingCreateStaffPage);
