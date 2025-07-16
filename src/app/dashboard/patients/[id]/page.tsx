
"use client"

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Phone, Home, FileText, Calendar, PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type PatientDetails = {
    id: number;
    clinic_id: number;
    clinic_name: string;
    first_name: string;
    last_name: string;
    email: string;
    telephone: string;
    gender: 'male' | 'female';
};

type MedicalCase = {
    id: number;
    title: string;
    description: string;
    case_date: string;
    is_active: boolean;
};

function PatientDetailPage() {
    const { id } = useParams();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [patient, setPatient] = React.useState<PatientDetails | null>(null);
    const [cases, setCases] = React.useState<MedicalCase[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            if (!id) return;
            setIsLoading(true);
            try {
                // In a real app, you would have separate endpoints.
                // For now, we fetch all and find the one we need.
                // This is inefficient but works for this demo.
                const [patientResponse, casesResponse] = await Promise.all([
                    apiFetch(`/api/management/patients/`), 
                    apiFetch(`/api/patients/${id}/cases/`)
                ]);

                if (!patientResponse.ok) throw new Error("Failed to fetch patient details.");
                const allPatients = await patientResponse.json();
                const currentPatient = allPatients.find((p: any) => p.id.toString() === id);
                if (currentPatient) {
                    setPatient(currentPatient);
                } else {
                    throw new Error("Patient not found.");
                }

                if (casesResponse.ok) {
                    const casesData = await casesResponse.json();
                    setCases(casesData);
                } else {
                    // It's okay if there are no cases, so we don't throw an error
                    // but we can log it.
                    console.log("Could not fetch medical cases for this patient.");
                }

            } catch (error) {
                if (error instanceof Error && error.message === "Unauthorized") return;
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: "destructive", title: "Error", description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id, apiFetch, toast]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!patient) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Patient Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The patient record could not be found.</p>
                </CardContent>
            </Card>
        );
    }
    
    const nameFallback = `${patient.first_name[0]}${patient.last_name[0]}`;

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={`https://placehold.co/96x96.png`} alt={patient.first_name} data-ai-hint="person portrait" />
                            <AvatarFallback>{nameFallback}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{`${patient.first_name} ${patient.last_name}`}</CardTitle>
                        <CardDescription className="capitalize">{patient.gender}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="h-4 w-4" />
                            <a href={`mailto:${patient.email}`} className="text-primary hover:underline">{patient.email}</a>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <Phone className="h-4 w-4" />
                            <span>{patient.telephone}</span>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-3">
                            <Home className="h-4 w-4 text-accent-foreground" />
                            <span className="font-medium text-accent-foreground">{patient.clinic_name}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Medical Cases</CardTitle>
                            <CardDescription>All recorded medical cases for this patient.</CardDescription>
                        </div>
                        <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Case
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {cases.length > 0 ? (
                            <div className="space-y-4">
                                {cases.map(c => (
                                    <div key={c.id} className="border p-4 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{c.title}</h3>
                                                <p className="text-sm text-muted-foreground">{c.description}</p>
                                            </div>
                                            <Badge variant={c.is_active ? "default" : "secondary"}>
                                                {c.is_active ? "Active" : "Closed"}
                                            </Badge>
                                        </div>
                                        <Separator className="my-3"/>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                             <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(c.case_date).toLocaleDateString()}</span>
                                             </div>
                                             <Button variant="outline" size="sm">View Details</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold">No Medical Cases</h3>
                                <p className="mt-1 text-sm text-muted-foreground">This patient does not have any recorded medical cases yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default PatientDetailPage;

    