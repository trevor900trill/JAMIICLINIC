
"use client";

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const complicationSchema = z.object({
    complication_occurred: z.boolean().default(false),
    description: z.string().optional(),
    revision_needed: z.boolean().default(false),
    revision_description: z.string().optional(),
});

type ComplicationFormValues = z.infer<typeof complicationSchema>;

function ComplicationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const form = useForm<ComplicationFormValues>({
        resolver: zodResolver(complicationSchema),
        defaultValues: {
            complication_occurred: false,
            description: "",
            revision_needed: false,
            revision_description: "",
        },
    });

    const caseId = Array.isArray(id) ? id[0] : id;

    React.useEffect(() => {
        if (!caseId) return;

        async function fetchComplication() {
            setIsLoading(true);
            try {
                const response = await apiFetch(`/api/patients/medical-cases/${caseId}/complication/`);
                if (response.ok) {
                    const data = await response.json();
                    form.reset(data);
                } else if (response.status !== 404) {
                    throw new Error("Failed to fetch complication details.");
                }
            } catch (error) {
                if (error instanceof Error && error.message === "Unauthorized") return;
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: "destructive", title: "Error", description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        }

        fetchComplication();
    }, [caseId, apiFetch, toast, form]);

    async function onSubmit(values: ComplicationFormValues) {
        setIsSubmitting(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/complication/`, {
                method: "POST",
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error("Failed to save complication details.");
            }

            toast({ title: "Success", description: "Complication details saved successfully." });
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/complication/delete/`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                if (response.status === 404) {
                     toast({ variant: "destructive", title: "Not Found", description: "No complication record to delete." });
                } else {
                    throw new Error("Failed to delete complication record.");
                }
            } else {
                 toast({ title: "Success", description: "Complication record deleted." });
                 form.reset({
                    complication_occurred: false,
                    description: "",
                    revision_needed: false,
                    revision_description: "",
                });
            }

        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsDeleting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><ShieldAlert /> Manage Complication</CardTitle>
                                <CardDescription>Create or update the complication record for this case.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="complication_occurred"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Complication Occurred</FormLabel>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Complication Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the complication in detail..." {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="revision_needed"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Revision Needed</FormLabel>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="revision_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Revision Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the required revision..." {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" type="button" disabled={isDeleting}>
                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete Record
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this complication record.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Details
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

export default ComplicationPage;
