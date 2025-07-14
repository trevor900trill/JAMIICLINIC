
"use client"
import React from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Building, Loader2, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { API_BASE_URL } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"

const clinicSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  location: z.string().min(1, "Location is required"),
  contact_number: z.string().min(10, "A valid contact number is required"),
})

function OnboardingCreateClinicPage() {
    const { getAuthToken, refreshUser } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
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
            
            const newClinic = await response.json();

            toast({ title: "Success", description: "Clinic created successfully." })
            await refreshUser({ clinic_created: true, new_clinic_id: newClinic.id });
            router.push(`/onboarding/create-staff`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage })
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSkip = async () => {
        await refreshUser({ clinic_created: true, new_clinic_id: null }); // Mark as skipped
        router.push('/dashboard');
    }

    return (
        <Card className="w-full max-w-lg">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                            <div className="flex justify-center pb-4">
                            <Building className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-center">Create Your First Clinic</CardTitle>
                        <CardDescription className="text-center">
                            Set up your clinic to start managing patients and staff. You can skip this and do it later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Clinic Name</FormLabel>
                                <FormControl><Input placeholder="Sunshine Wellness Clinic" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location / Address</FormLabel>
                                <FormControl><Input placeholder="123 Health St, Nairobi" {...field} /></FormControl>
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
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={handleSkip}>Skip For Now</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Saving..." : "Create Clinic & Continue"}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}

export default OnboardingCreateClinicPage;
