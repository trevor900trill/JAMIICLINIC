
"use client";

import React from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Eye, ShieldAlert, Trash2 } from "lucide-react";

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
    const { selectedClinic } = useClinic();

    const [allCases, setAllCases] = React.useState<MedicalCase[]>([]);
    const [filteredCases, setFilteredCases] = React.useState<MedicalCase[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

    const fetchCases = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/patients/medical-cases/');
            if (!response.ok) {
                throw new Error("Failed to fetch medical cases.");
            }
            const casesData = await response.json();
            const casesArray = Array.isArray(casesData) 
                ? casesData 
                : (casesData.results || []);

            setAllCases(casesArray);
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not fetch medical cases." });
            setAllCases([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, toast]);

    React.useEffect(() => {
        fetchCases();
    }, [fetchCases]);

    React.useEffect(() => {
        let casesToFilter = allCases;

        if (selectedClinic) {
            casesToFilter = casesToFilter.filter(c => c.clinic_name === selectedClinic.clinic_name);
        }

        const patientNameFilter = table.getColumn("patient_name")?.getFilterValue() as string;
        if (patientNameFilter) {
            casesToFilter = casesToFilter.filter(c => c.patient_name.toLowerCase().includes(patientNameFilter.toLowerCase()));
        }

        setFilteredCases(casesToFilter);
    }, [allCases, selectedClinic, columnFilters]);

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
                                <Link href={`/dashboard/medical-cases/${caseItem.id}`}>
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
                <CardTitle>Medical Cases</CardTitle>
                <CardDescription>View and manage all medical cases.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-4">
                    <Input
                        placeholder="Filter by patient name..."
                        value={(table.getColumn("patient_name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("patient_name")?.setFilterValue(event.target.value)
                        }
                        className="w-full sm:max-w-sm"
                    />
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
