
"use client";

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Home, FileText, Calendar, PlusCircle, ArrowLeft, Stethoscope, Paperclip, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type MedicalRecord = {
    id: number;
    record_type: string;
    note: string;
    file: string | null;
    created_by: string;
    created_at: string;
};

type CaseDetails = {
    id: number;
    title: string;
    description: string;
    clinic_name: string;
    patient_name: string;
    created_by: string;
    case_date: string;
    created_at: string;
    records: MedicalRecord[];
};


function CaseDetailPage() {
    const { id, caseId } = useParams();
    const router = useRouter();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [caseDetails, setCaseDetails] = React.useState<CaseDetails | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const patientId = Array.isArray(id) ? id[0] : id;

    React.useEffect(() => {
        async function fetchData() {
            if (!caseId) return;
            setIsLoading(true);
            try {
                const response = await apiFetch(`/api/patients/medical-cases/${caseId}/`);

                if (!response.ok) {
                    if (response.status === 404) {
                        toast({ variant: "destructive", title: "Error", description: "Medical case not found." });
                    } else {
                        throw new Error("Failed to fetch case details.");
                    }
                } else {
                    const data = await response.json();
                    setCaseDetails(data);
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
    }, [caseId, apiFetch, toast]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!caseDetails) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Case Not Found</CardTitle>
                    <CardDescription>The medical case you are looking for could not be found.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{caseDetails.title}</CardTitle>
                            <CardDescription>{caseDetails.description}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => router.push(`/dashboard/patients/${patientId}/cases`)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cases
                        </Button>
                    </div>
                     <Separator className="my-4" />
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{caseDetails.patient_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>{caseDetails.clinic_name}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            <span>Created by: {caseDetails.created_by}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Opened: {new Date(caseDetails.case_date).toLocaleDateString()}</span>
                        </div>
                     </div>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Medical Records</CardTitle>
                            <CardDescription>All records and attachments for this case.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {caseDetails.records.length > 0 ? (
                                <div className="space-y-4">
                                    {caseDetails.records.map(record => (
                                        <div key={record.id} className="border p-4 rounded-lg bg-background/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge className="mb-2">{record.record_type}</Badge>
                                                    <p className="text-sm">{record.note}</p>
                                                </div>
                                                {record.file && (
                                                    <Button asChild variant="outline" size="sm">
                                                        <a href={record.file} target="_blank" rel="noopener noreferrer">
                                                            <Paperclip className="mr-2 h-4 w-4" />
                                                            View Attachment
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                            <Separator className="my-3"/>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Stethoscope className="h-3 w-3" />
                                                    <span>{record.created_by}</span>
                                                </div>
                                                 <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(record.created_at).toLocaleString()}</span>
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold">No Records</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">No records have been added to this case yet.</p>
                                </div>
                            )}
                        </CardContent>
                         <CardFooter>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Record
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                 <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Treatment Schedules</CardTitle>
                            <CardDescription>Upcoming treatments and appointments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold">No Schedules</h3>
                                <p className="mt-1 text-sm text-muted-foreground">No treatments have been scheduled for this case.</p>
                                <Button className="mt-4" size="sm">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Schedule Treatment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default CaseDetailPage;

    