
"use client";

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Home, FileText, Calendar, PlusCircle, ArrowLeft, Stethoscope, Paperclip, Clock, Trash2, MoreVertical, Ban } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type MedicalRecord = {
    id: number;
    record_type: string;
    note: string;
    file: string | null;
    created_by: string;
    created_at: string;
};

type TreatmentSchedule = {
    id: number;
    treatment_name: string;
    description: string;
    scheduled_date: string;
    status: string;
}

type CaseDetails = {
    id: number;
    title: string;
    description:string;
    clinic_name: string;
    patient_name: string;
    created_by: string;
    case_date: string;
    created_at: string;
    records?: MedicalRecord[];
    treatment_schedules?: TreatmentSchedule[];
};

const recordSchema = z.object({
  record_type: z.string().min(1, "Record type is required."),
  note: z.string().min(1, "Note is required."),
  file: z.instanceof(FileList).optional(),
});

const scheduleSchema = z.object({
  description: z.string().min(1, "Description is required."),
  scheduled_date: z.date({ required_error: "A date is required." }),
  hospital: z.string().min(1, "Hospital is required."),
});


function AddRecordForm({ caseId, onFinished }: { caseId: string, onFinished: () => void }) {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<z.infer<typeof recordSchema>>({
        resolver: zodResolver(recordSchema),
        defaultValues: { record_type: "", note: "" },
    });
    const fileRef = form.register('file');

    async function onSubmit(values: z.infer<typeof recordSchema>) {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('record_type', values.record_type);
            formData.append('note', values.note);
            if (values.file && values.file.length > 0) {
                formData.append('file', values.file[0]);
            }

            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/records/`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error("Failed to add record.");
            toast({ title: "Success", description: "Medical record added." });
            form.reset();
            onFinished();
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not add record." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>Add Medical Record</DialogTitle>
                    <DialogDescription>Add a new record for this medical case.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <FormField control={form.control} name="record_type" render={({ field }) => (
                        <FormItem><FormLabel>Record Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="NOTE">Note</SelectItem>
                                    <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                                    <SelectItem value="SCAN">Scan</SelectItem>
                                    <SelectItem value="LAB_RESULT">Lab Result</SelectItem>
                                </SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="note" render={({ field }) => (
                        <FormItem><FormLabel>Note</FormLabel><FormControl><Textarea placeholder="Detailed notes..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="file" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Attachment (Optional)</FormLabel>
                            <FormControl>
                                <Input type="file" {...fileRef} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Record
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function ScheduleTreatmentForm({ caseId, onFinished }: { caseId: string, onFinished: () => void }) {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<z.infer<typeof scheduleSchema>>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: { description: "", hospital: "" },
    });

    async function onSubmit(values: z.infer<typeof scheduleSchema>) {
        setIsLoading(true);
        const payload = {
            description: values.description,
            hospital: values.hospital,
            scheduled_datetime: format(values.scheduled_date, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        }
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/treatment-schedules/create/`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Failed to schedule treatment.");
            toast({ title: "Success", description: "Treatment scheduled." });
            form.reset();
            onFinished();
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not schedule treatment." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>Schedule Treatment</DialogTitle>
                    <DialogDescription>Schedule a new treatment for this medical case.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <FormField control={form.control} name="hospital" render={({ field }) => (
                        <FormItem><FormLabel>Hospital</FormLabel><FormControl><Input placeholder="e.g., General Hospital" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the treatment..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="scheduled_date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Scheduled Date</FormLabel><Popover><PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Schedule
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function DeleteRecordDialog({ caseId, recordId, onFinished }: { caseId: string, recordId: number, onFinished: () => void }) {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/records/${recordId}/delete/`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error("Failed to delete medical record.");
            }

            toast({ title: "Success", description: "Medical record deleted successfully." });
            onFinished();
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this medical record.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function TreatmentScheduleActions({ caseId, schedule, onFinished }: { caseId: string, schedule: TreatmentSchedule, onFinished: () => void }) {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    async function handleCancel() {
        setIsCancelling(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/treatment-schedules/${schedule.id}/cancel/`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error("Failed to cancel treatment schedule.");
            toast({ title: "Success", description: "Treatment schedule cancelled." });
            onFinished();
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not cancel schedule." });
        } finally {
            setIsCancelling(false);
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/treatment-schedules/${schedule.id}/delete/`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error("Failed to delete treatment schedule.");
            toast({ title: "Success", description: "Treatment schedule deleted." });
            onFinished();
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not delete schedule." });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={schedule.status === 'CANCELLED'}>
                             <Ban className="mr-2 h-4 w-4" /> Cancel
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Treatment?</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to cancel this treatment schedule?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
                                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Treatment?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. This will permanently delete this treatment schedule.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function CaseDetailPage() {
    const { id, caseId } = useParams();
    const router = useRouter();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [caseDetails, setCaseDetails] = React.useState<CaseDetails | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRecordFormOpen, setIsRecordFormOpen] = React.useState(false);
    const [isScheduleFormOpen, setIsScheduleFormOpen] = React.useState(false);
    
    const patientId = Array.isArray(id) ? id[0] : id;
    const caseIdStr = Array.isArray(caseId) ? caseId[0] : caseId;

    const fetchData = React.useCallback(async () => {
        if (!caseIdStr) return;
        setIsLoading(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseIdStr}/`);
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
    }, [caseIdStr, apiFetch, toast]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                            {caseDetails.records && caseDetails.records.length > 0 ? (
                                <div className="space-y-4">
                                    {caseDetails.records.map(record => (
                                        <div key={record.id} className="border p-4 rounded-lg bg-background/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Badge className="mb-2">{record.record_type}</Badge>
                                                    <p className="text-sm">{record.note}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {record.file && (
                                                        <Button asChild variant="outline" size="sm">
                                                            <a href={record.file} target="_blank" rel="noopener noreferrer">
                                                                <Paperclip className="mr-2 h-4 w-4" />
                                                                View Attachment
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <DeleteRecordDialog caseId={caseIdStr} recordId={record.id} onFinished={fetchData} />
                                                </div>
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
                            <Dialog open={isRecordFormOpen} onOpenChange={setIsRecordFormOpen}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <AddRecordForm caseId={caseIdStr} onFinished={() => { setIsRecordFormOpen(false); fetchData(); }} />
                                </DialogContent>
                            </Dialog>
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
                             {caseDetails.treatment_schedules && caseDetails.treatment_schedules.length > 0 ? (
                                <div className="space-y-4">
                                    {caseDetails.treatment_schedules.map(schedule => (
                                        <div key={schedule.id} className="border p-4 rounded-lg bg-background/50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{schedule.treatment_name}</p>
                                                    <p className="text-sm text-muted-foreground">{schedule.description}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Badge>{schedule.status}</Badge>
                                                    <TreatmentScheduleActions caseId={caseIdStr} schedule={schedule} onFinished={fetchData} />
                                                </div>
                                            </div>
                                             <Separator className="my-3"/>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                <span>{new Date(schedule.scheduled_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold">No Schedules</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">No treatments have been scheduled for this case.</p>
                                </div>
                             )}
                        </CardContent>
                         <CardFooter>
                             <Dialog open={isScheduleFormOpen} onOpenChange={setIsScheduleFormOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full" size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Schedule Treatment
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <ScheduleTreatmentForm caseId={caseIdStr} onFinished={() => { setIsScheduleFormOpen(false); fetchData(); }} />
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default CaseDetailPage;
