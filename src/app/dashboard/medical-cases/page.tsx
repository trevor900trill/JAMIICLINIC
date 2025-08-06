
"use client";

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Eye, ShieldAlert, Trash2, PlusCircle, ArrowLeft } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useClinic } from "@/context/clinic-context";

type MedicalCase = {
    id: number;
    title: string;
    description: string;
    clinic_name: string;
    patient_name: string;
    created_by: string;
    case_date: string;
    created_at: string;
};

const medicalCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  case_date: z.date({ required_error: "Case date is required" }),
  initial_note: z.string().optional(),
});

function CreateCaseForm({ onFinished, patientId, clinicId }: { onFinished: () => void, patientId: string | null, clinicId: number | null }) {
    const { toast } = useToast();
    const { apiFetch } = useApi();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
  
    const form = useForm<z.infer<typeof medicalCaseSchema>>({
      resolver: zodResolver(medicalCaseSchema),
      defaultValues: {
        title: "",
        description: "",
        initial_note: "",
      },
    });
  
    async function onSubmit(values: z.infer<typeof medicalCaseSchema>) {
      if (!patientId) {
        toast({ variant: "destructive", title: "Error", description: "Patient ID is missing." });
        return;
      }
      setIsLoading(true);
      try {
        const payload: any = {
            ...values,
            patient: parseInt(patientId, 10),
            case_date: format(values.case_date, "yyyy-MM-dd"),
            is_active: true,
            records: values.initial_note ? [{ record_type: 'general', note: values.initial_note }] : [],
        };
        
        if (user?.role === 'doctor') {
            if (!clinicId) {
                toast({ variant: "destructive", title: "Error", description: "Clinic ID is missing."});
                setIsLoading(false);
                return;
            }
            payload.clinic_id = clinicId;
        }
  
        const response = await apiFetch('/api/patients/create/medical-case/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to create medical case.");
        }
  
        toast({ title: "Success", description: "Medical case created successfully." });
        form.reset();
        onFinished();
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") return;
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Medical Case</DialogTitle>
            <DialogDescription>Fill in the details for the new case below. An initial note is optional.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Case Title</FormLabel><FormControl><Input placeholder="e.g., Annual Check-up" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Case Description</FormLabel><FormControl><Textarea placeholder="Briefly describe the reason for this case." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="case_date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Case Date</FormLabel><Popover><PopoverTrigger asChild>
                <FormControl>
                    <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </FormControl>
                </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="initial_note" render={({ field }) => (
                <FormItem><FormLabel>Initial Note (Optional)</FormLabel><FormControl><Textarea placeholder="Add an initial note or observation for this case." {...field} /></FormControl><FormMessage /></FormItem>
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
    );
}

function DeleteCaseDialog({ caseId, onFinished }: { caseId: number, onFinished: () => void }) {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = React.useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const response = await apiFetch(`/api/patients/medical-cases/${caseId}/delete/`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error("Failed to delete medical case.");
            }

            toast({ title: "Success", description: "Medical case deleted successfully." });
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
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Case
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this medical case.</AlertDialogDescription>
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


function MedicalCasesPage() {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedClinic } = useClinic();

    const [allCases, setAllCases] = React.useState<MedicalCase[]>([]);
    const [filteredCases, setFilteredCases] = React.useState<MedicalCase[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const patientId = searchParams.get("patientId");
    const patientName = searchParams.get("patientName") ?? "patient";
    const clinicId = searchParams.get("clinicId");

    const fetchCases = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const endpoint = patientId 
                ? `/api/patients/medical-cases/?patient_id=${patientId}` 
                : '/api/patients/medical-cases/';

            const response = await apiFetch(endpoint);
            if (!response.ok) {
                throw new Error("Failed to fetch medical cases.");
            }
            const casesData = await response.json();
            setAllCases(Array.isArray(casesData) ? casesData : []);
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not fetch medical cases." });
            setAllCases([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, toast, patientId]);

    React.useEffect(() => {
        fetchCases();
    }, [fetchCases]);
    
     React.useEffect(() => {
        let casesToFilter = [...allCases];

        if (selectedClinic) {
            casesToFilter = casesToFilter.filter(c => c.clinic_name === selectedClinic.clinic_name);
        }
        
        if (patientName && patientName !== "patient") {
             casesToFilter = casesToFilter.filter(c => c.patient_name.toLowerCase().includes(patientName.toLowerCase()));
        }

        setFilteredCases(casesToFilter);
    }, [allCases, selectedClinic, patientName]);

    const columns: ColumnDef<MedicalCase>[] = [
        {
            accessorKey: "title",
            header: "Case Title",
            cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "clinic_name",
            header: "Clinic",
            cell: ({ row }) => <div>{row.getValue("clinic_name")}</div>,
        },
         {
            accessorKey: "patient_name",
            header: "Patient",
            cell: ({ row }) => <div>{row.getValue("patient_name")}</div>,
        },
        {
            accessorKey: "case_date",
            header: "Date",
            cell: ({ row }) => <div>{new Date(row.getValue("case_date")).toLocaleDateString()}</div>,
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const caseItem = row.original;
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
                                <Link href={`/dashboard/patients/${patientId}/cases/${caseItem.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/medical-cases/${caseItem.id}/complications`}>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Manage Complication
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteCaseDialog caseId={caseItem.id} onFinished={fetchCases} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const onFormFinished = () => {
        setIsFormOpen(false);
        fetchCases();
    }

    const table = useReactTable({
        data: filteredCases,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Medical Cases for {patientName !== 'patient' ? patientName : 'All Patients'}</CardTitle>
                        <CardDescription>View and manage all medical cases.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     <Button variant="link" onClick={() => router.push('/dashboard/patients')} className="p-0 h-auto text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Patients
                    </Button>
                    <div className="flex items-center justify-between gap-4">
                        <Input
                            placeholder="Filter by case title..."
                            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("title")?.setFilterValue(event.target.value)
                            }
                            className="w-full sm:max-w-sm"
                        />
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto" disabled={!patientId}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> New Medical Case
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <CreateCaseForm patientId={patientId} clinicId={clinicId ? parseInt(clinicId) : null} onFinished={onFormFinished} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <div className="rounded-md border mt-4">
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
                                    <TableRow key={row.original.id}>
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
                                        No cases found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <div className="py-4">
                    <DataTablePagination table={table} />
                </div>
            </CardContent>
        </Card>
    );
}

export default MedicalCasesPage;
