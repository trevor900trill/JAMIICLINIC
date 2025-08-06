
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowUpDown, MoreHorizontal, PlusCircle, Loader2, Eye } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { useAuth } from "@/context/auth-context"
import { useApi } from "@/hooks/use-api"
import { useClinic } from "@/context/clinic-context"

export type Patient = {
  id: number;
  clinic_id?: number;
  clinic_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  telephone: string;
};

const patientSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female"], { required_error: "Please select a gender." }),
  telephone: z.string().min(10, "Please enter a valid phone number."),
  clinic_id: z.coerce.number({invalid_type_error: "Please select a clinic"}).int().positive("Please select a clinic"),
})

function AddPatientForm({ onFinished }: { onFinished: () => void }) {
  const { toast } = useToast()
  const { apiFetch } = useApi()
  const { clinics, selectedClinic, isLoading: isClinicLoading } = useClinic();
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      telephone: "",
      clinic_id: selectedClinic?.clinic_id
    }
  })

  React.useEffect(() => {
    if (selectedClinic) {
        form.setValue('clinic_id', selectedClinic.clinic_id);
    }
  }, [selectedClinic, form]);


  async function onSubmit(values: z.infer<typeof patientSchema>) {
    setIsLoading(true)
    try {
      const response = await apiFetch('/api/patients/create/', {
        method: 'POST',
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessages = Object.values(errorData).flat().join(' ');
        throw new Error(errorMessages || "Failed to create patient.");
      }

      toast({ title: "Success", description: `Patient record for ${values.first_name} ${values.last_name} created.` })
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
            <DialogTitle>Create New Patient</DialogTitle>
            <DialogDescription>Add a new patient record to the system. All fields are required.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl><Input placeholder="John" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="last_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="telephone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telephone</FormLabel>
                <FormControl><Input placeholder="e.g., +254 712 345 678" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="clinic_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Clinic</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={isClinicLoading || clinics.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isClinicLoading ? "Loading clinics..." : "Select a clinic"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {!isClinicLoading && clinics.map((clinic) => (
                      <SelectItem key={clinic.clinic_id} value={String(clinic.clinic_id)}>{clinic.clinic_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || isClinicLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Save Patient"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
  )
}

function DeletePatientDialog() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Delete Patient
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this patient's record.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: "full_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.original.full_name || `${row.original.first_name} ${row.original.last_name}`}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "telephone",
    header: "Phone",
    cell: ({ row }) => <div>{row.getValue("telephone")}</div>,
  },
  {
    accessorKey: "clinic_name",
    header: "Clinic",
    cell: ({ row }) => <div>{row.getValue("clinic_name")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const patient = row.original;
      
      return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/medical-cases?patientId=${patient.id}&clinicId=${patient.clinic_id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Cases
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeletePatientDialog />
            </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function PatientsPage() {
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const { selectedClinic } = useClinic();
    
    const [allPatients, setAllPatients] = React.useState<Patient[]>([])
    const [filteredPatients, setFilteredPatients] = React.useState<Patient[]>([])
    
    const [isLoading, setIsLoading] = React.useState(true)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const fetchPatients = React.useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);

        let endpoint = '/api/management/patients/'; 
        if (user.role === 'doctor') {
            endpoint = '/api/clinics/doctor/patients/';
        } else if (user.role === 'staff') {
            endpoint = '/api/clinics/staff/patients/';
        }

        try {
            const response = await apiFetch(endpoint);
             if (!response.ok) {
                throw new Error("Failed to fetch patients.");
            }
            const responseData = await response.json();
            
            if (user.role === 'admin') {
                setAllPatients(responseData.results);
            } else {
                const allPatientsFromClinics = responseData.flatMap((clinic: any) => 
                    clinic.patients.map((p: Patient) => ({
                        ...p,
                        clinic_id: clinic.clinic_id,
                        clinic_name: clinic.clinic_name,
                    }))
                );
                setAllPatients(allPatientsFromClinics);
            }
        } catch (error) {
             if (error instanceof Error && error.message === "Unauthorized") return;
             toast({ variant: "destructive", title: "Error", description: "Could not fetch patient data." });
        } finally {
            setIsLoading(false);
        }
    }, [toast, apiFetch, user]);

    React.useEffect(() => {
        fetchPatients()
    }, [fetchPatients])
    
    React.useEffect(() => {
        if (user?.role === 'admin' && selectedClinic) {
            const filtered = allPatients.filter(p => p.clinic_id === selectedClinic.clinic_id);
            setFilteredPatients(filtered);
        } else if (user?.role !== 'admin' && selectedClinic) {
            const filtered = allPatients.filter(p => p.clinic_id === selectedClinic.clinic_id);
            setFilteredPatients(filtered);
        }
        else {
            setFilteredPatients(allPatients);
        }
    }, [selectedClinic, allPatients, user?.role]);

    const table = useReactTable({
        data: filteredPatients,
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
        fetchPatients();
    }
    
    const canAddPatient = user?.role === 'doctor' || user?.role === 'staff';
    const showNoClinicSelectedMessage = user?.role !== 'admin' && !selectedClinic && !isLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Patients</CardTitle>
                <CardDescription>View and manage patient records.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                    <Input
                        placeholder="Search by patient name..."
                        value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("full_name")?.setFilterValue(event.target.value)
                        }
                        className="w-full sm:max-w-sm"
                    />
                    {canAddPatient && (
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                               <Button className="w-full sm:w-auto" disabled={!selectedClinic}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Patient
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                 <AddPatientForm onFinished={onFormFinished} />
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
                                                <TableHead key={header.id} className={header.id === 'actions' ? 'text-left' : ''}>
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
                                    <TableRow key="loading">
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                           <div className="flex justify-center items-center">
                                              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                                              <span>Loading patients...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.original.id}
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
                                    <TableRow key="no-results">
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            {showNoClinicSelectedMessage ? "Please select a clinic to view patients." : "No patient data available."}
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

export default PatientsPage;
