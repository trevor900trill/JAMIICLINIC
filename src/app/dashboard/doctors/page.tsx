
"use client"
import React from "react"
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
} from "@tanstack/react-table"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import type { UserRole } from "@/context/auth-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"

export type Doctor = {
    id: number;
    full_name: string;
    email: string;
    telephone: string;
    gender: 'male' | 'female' | null;
    specialty?: {
        id: number;
        name: string;
    };
}

const doctorSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  telephone: z.string().min(10),
  role: z.literal('doctor'),
  gender: z.enum(['male', 'female']).optional().nullable(),
})


function DeactivateDoctorDialog() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Deactivate
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to deactivate this doctor?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will temporarily disable the doctor's account.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Deactivate</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export const columns: ColumnDef<Doctor>[] = [
    {
        accessorKey: "full_name",
        header: "Name",
        cell: ({ row }) => {
            const user = row.original
            const name = user.full_name
            const fallback = name.split(' ').map(n => n[0]).join('').toUpperCase()
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person portrait" />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "specialty",
        header: "Specialty",
        cell: ({ row }) => {
            const specialty = row.original.specialty;
            return <div className="capitalize">{specialty?.name || 'N/A'}</div>
        },
    },
    {
        accessorKey: "telephone",
        header: "Phone",
        cell: ({ row }) => <div className="capitalize">{row.getValue("telephone")}</div>,
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
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
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>View Schedule</DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DeactivateDoctorDialog />
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function AddDoctorForm({ onFinished }: { onFinished: () => void }) {
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<z.infer<typeof doctorSchema>>({
        resolver: zodResolver(doctorSchema),
        defaultValues: { 
            role: 'doctor',
            email: "",
            first_name: "",
            last_name: "",
            telephone: "",
            gender: null,
        },
    });

    async function onSubmit(values: z.infer<typeof doctorSchema>) {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/users/create/', {
                method: 'POST',
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = Object.values(errorData).flat().join(' ');
                throw new Error(errorMessages || 'Failed to create doctor.');
            }
            
            toast({ title: 'Success', description: `Doctor account for ${values.first_name} created.` });
            form.reset({ 
                role: 'doctor',
                email: "",
                first_name: "",
                last_name: "",
                telephone: "",
                gender: null,
            });
            onFinished();

        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>Add New Doctor</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new doctor to the system.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                     <FormField control={form.control} name="first_name" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="last_name" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem className="col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="telephone" render={({ field }) => (
                        <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input placeholder="+254..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Saving..." : "Save Doctor"}
                    </Button>
                </DialogFooter>
            </form>
         </Form>
    )
}


function DoctorsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const [data, setData] = React.useState<Doctor[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [isFormOpen, setIsFormOpen] = React.useState(false);


    const fetchDoctors = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/management/doctors');
            if (!response.ok) throw new Error("Failed to fetch doctors");
            const doctorsData = await response.json();
            setData(doctorsData.results);

        } catch (error) {
             if (error instanceof Error && error.message === "Unauthorized") return;
             toast({ variant: "destructive", title: "Warning", description: "Could not fetch doctor list. Displaying empty table." });
             setData([]);
        } finally {
            setIsLoading(false)
        }
    }, [apiFetch, toast]);

    React.useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors])

    const table = useReactTable({
        data,
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
    })
    
    const onFormFinished = () => {
        setIsFormOpen(false);
        fetchDoctors();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Doctors</CardTitle>
                <CardDescription>Manage all doctors in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                    <Input
                        placeholder="Search by doctor's name..."
                        value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("full_name")?.setFilterValue(event.target.value)
                        }
                        className="w-full sm:max-w-sm"
                    />
                     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Doctor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <AddDoctorForm onFinished={onFormFinished} />
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="overflow-x-auto">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                           <div className="flex justify-center items-center">
                                              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                                              <span>Loading doctors...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No doctors found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div className="py-4">
                    <DataTablePagination table={table} />
                </div>
            </CardContent>
        </Card>
    )
}

export default DoctorsPage;

    