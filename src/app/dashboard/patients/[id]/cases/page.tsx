
"use client"

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Calendar, PlusCircle, ArrowLeft, Eye, MoreHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useClinic } from "@/context/clinic-context";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type MedicalCase = {
    id: number;
    title: string;
    description: string;
    case_date: string;
    is_active: boolean;
};

const medicalCaseSchema = z.object({
    title: z.string().min(1, "Case title is required."),
    description: z.string().min(1, "Description is required."),
    case_date: z.date({ required_error: "A case date is required."}),
});

function CreateCaseForm({ onFinished, patientId }: { onFinished: () => void, patientId: string }) {
    const { toast } = useToast()
    const { apiFetch } = useApi()
    const { user } = useAuth()
    const { selectedClinic } = useClinic();
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<z.infer<typeof medicalCaseSchema>>({
        resolver: zodResolver(medicalCaseSchema),
        defaultValues: {
            title: "",
            description: "",
            case_date: new Date(),
        }
    })

    async function onSubmit(values: z.infer<typeof medicalCaseSchema>) {
        setIsLoading(true)
        try {
            const payload: any = {
                ...values,
                patient: parseInt(patientId),
                case_date: format(values.case_date, "yyyy-MM-dd"),
                is_active: true,
            };

            if (user?.role === 'doctor') {
                 if (!selectedClinic) {
                    toast({ variant: "destructive", title: "Error", description: "Clinic ID is missing. Cannot create case." });
                    setIsLoading(false);
                    return;
                }
                payload.clinic_id = selectedClinic.clinic_id;
            }

            const response = await apiFetch('/api/patients/create/medical-case/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create medical case.");
            }

            toast({ title: "Success", description: "New medical case has been created." })
            form.reset()
            onFinished()
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>New Medical Case</DialogTitle>
                    <DialogDescription>Fill in the details for the new medical case.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Case Title</FormLabel><FormControl><Input placeholder="e.g., Annual Checkup" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the reason for the visit or the main complaint." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="case_date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Case Date</FormLabel><Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarPicker mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Case
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const columns: ColumnDef<MedicalCase>[] = [
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("description")}</div>,
    },
    {
        accessorKey: "case_date",
        header: "Date",
        cell: ({ row }) => <div>{new Date(row.getValue("case_date")).toLocaleDateString()}</div>,
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.getValue("is_active") ? "default" : "secondary"}>
                {row.getValue("is_active") ? "Active" : "Closed"}
            </Badge>
        ),
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const caseItem = row.original;
            const params = useParams();
            return (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/patients/${params.id}/cases/${caseItem.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];


function PatientCasesPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    
    const [cases, setCases] = React.useState<MedicalCase[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    
    const patientId = Array.isArray(id) ? id[0] : id;

    const fetchCases = React.useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        try {
            // This endpoint is not in the spec, but is implied by the flow.
            // A better API might be /api/patients/medical-cases/?patient_id=${id}
            const casesResponse = await apiFetch(`/api/patients/${patientId}/cases/`);

            if (casesResponse.ok) {
                const casesData = await casesResponse.json();
                setCases(casesData);
            } else {
                console.log("Could not fetch medical cases for this patient.");
                setCases([]);
            }
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [patientId, apiFetch, toast]);
    
    React.useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    const table = useReactTable({
        data: cases,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });
    
    const onFormFinished = () => {
        setIsFormOpen(false);
        fetchCases();
    }

    if (isLoading && cases.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Medical Cases</CardTitle>
                    <CardDescription>All recorded medical cases for this patient.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/patients')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Patients
                    </Button>
                    {(user?.role === 'doctor' || user?.role === 'staff') && (
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    New Case
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <CreateCaseForm 
                                    patientId={patientId} 
                                    onFinished={onFormFinished} 
                                />
                             </DialogContent>
                        </Dialog>
                    )}
                 </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                                            <span>Loading cases...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-2 text-sm font-semibold">No Medical Cases</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">This patient does not have any recorded medical cases yet.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default PatientCasesPage;

    