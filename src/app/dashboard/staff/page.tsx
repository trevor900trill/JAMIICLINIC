
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
import { useAuth, UserRole } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"

export type Staff = {
    staff_id: number;
    first_name: string;
    last_name: string;
    email: string;
    telephone: string;
    clinic_id: number;
    clinic_name: string;
    position_name: string;
}

type Clinic = {
  id: number;
  name: string;
}

const staffSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  telephone: z.string().min(10),
  position: z.string().min(1, "Position is required"),
  clinic_id: z.coerce.number().int().positive("Please select a clinic"),
});

function DeactivateUserDialog({ staff }: { staff: Staff }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Deactivate
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to deactivate {staff.first_name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will temporarily disable the user's account and they will not be able to log in. You can reactivate their account later.
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

export const columns: ColumnDef<Staff>[] = [
    {
        accessorKey: "first_name",
        header: "Name",
        cell: ({ row }) => {
            const staff = row.original
            const name = `${staff.first_name} ${staff.last_name}`
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person portrait" />
                        <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">{staff.email}</p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "position_name",
        header: "Role",
        cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.getValue("position_name")}</Badge>,
    },
    {
        accessorKey: "clinic_name",
        header: "Clinic",
        cell: ({ row }) => <div className="capitalize">{row.getValue("clinic_name")}</div>,
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DeactivateUserDialog staff={row.original} />
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function AddUserForm({ onFinished }: { onFinished: () => void }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [clinics, setClinics] = React.useState<Clinic[]>([])
    const [isFetchingClinics, setIsFetchingClinics] = React.useState(true)

    React.useEffect(() => {
        async function fetchClinics() {
            setIsFetchingClinics(true);
            try {
                const response = await apiFetch('/api/clinics/');
                if (!response.ok) {
                    throw new Error("Could not fetch clinics.");
                }
                const clinicData = await response.json();
                setClinics(clinicData);
            } catch (error) {
                if (error instanceof Error && error.message === "Unauthorized") return;
                toast({ variant: "destructive", title: "Error", description: "Could not load your clinics." });
            } finally {
                setIsFetchingClinics(false);
            }
        }
        fetchClinics();
    }, [apiFetch, toast]);
    
    const form = useForm<z.infer<typeof staffSchema>>({
        resolver: zodResolver(staffSchema),
        defaultValues: { 
            email: "", 
            first_name: "", 
            last_name: "",
            telephone: "",
            position: "",
            gender: undefined,
            clinic_id: undefined,
        },
    })

    async function onSubmit(values: z.infer<typeof staffSchema>) {
        setIsLoading(true);
         try {
            const response = await apiFetch('/api/doctor/create-staff/', {
                method: 'POST',
                body: JSON.stringify(values)
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessages = Object.values(errorData).flat().join(' ');
                throw new Error(errorMessages || "Failed to create staff member.");
            }

            toast({ title: "Success", description: "Staff member created successfully." });
            form.reset();
            onFinished();

        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new user to the system.
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
                        <FormItem className="col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="telephone" render={({ field }) => (
                        <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input placeholder="+254..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="position" render={({ field }) => (
                        <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g. Nurse" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="clinic_id" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Clinic</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value?.toString()} disabled={isFetchingClinics || clinics.length === 0}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={isFetchingClinics ? "Loading clinics..." : "Select a clinic"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {!isFetchingClinics && clinics.map((clinic) => (
                                    <SelectItem key={clinic.id} value={String(clinic.id)}>{clinic.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isLoading || isFetchingClinics}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Saving..." : "Save User"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}


function UsersPage() {
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const [data, setData] = React.useState<Staff[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    
    const fetchStaff = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/clinics/staff/');
            if (!response.ok) throw new Error("Failed to fetch staff");
            const staffData = await response.json();
            setData(staffData);
        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not fetch staff data." });
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, toast]);

    React.useEffect(() => {
        fetchStaff();
    }, [fetchStaff])

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
        fetchStaff();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Staff</CardTitle>
                <CardDescription>Manage all staff accounts in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                    <Input
                        placeholder="Search staff by name..."
                        value={(table.getColumn("first_name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("first_name")?.setFilterValue(event.target.value)
                        }
                        className="w-full sm:max-w-sm"
                    />
                    {user?.role === 'doctor' && (
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <AddUserForm onFinished={onFormFinished} />
                            </DialogContent>
                        </Dialog>
                    )}
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
                                              <span>Loading staff...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.original.staff_id}
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
                                            No results.
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

export default UsersPage;
