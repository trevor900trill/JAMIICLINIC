"use client"
import React from "react"
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
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
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
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import withAuth from "@/components/auth/with-auth"
import type { UserRole } from "@/context/auth-context"

const mockClinics = [
    { id: "clinic-1", name: "Good Health Clinic", location: "Nairobi, Kenya", contact: "+254712345678", status: "Active" },
    { id: "clinic-2", name: "Wellness Center", location: "Mombasa, Kenya", contact: "+254787654321", status: "Active" },
    { id: "clinic-3", name: "City Medicals", location: "Kisumu, Kenya", contact: "+254722222222", status: "Inactive" },
    { id: "clinic-4", name: "Coast General", location: "Mombasa, Kenya", contact: "+254733333333", status: "Active" },
    { id: "clinic-5", name: "Rift Valley Clinic", location: "Nakuru, Kenya", contact: "+254744444444", status: "Inactive" },
]

export type Clinic = {
    id: string
    name: string
    location: string
    contact: string
    status: "Active" | "Inactive"
}

function DeleteClinicDialog() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Delete
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this clinic and remove its data from our servers.
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

export const columns: ColumnDef<Clinic>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>
        },
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },
    {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => <div>{row.getValue("contact")}</div>,
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const clinic = row.original
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
                        <DropdownMenuItem>View Staff</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteClinicDialog />
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function AddClinicForm({ onFinished }: { onFinished: () => void }) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Clinic Created");
        setIsLoading(false);
        onFinished();
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Add New Clinic</DialogTitle>
                <DialogDescription>
                    Fill in the details below to add a new clinic location.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" placeholder="Sunshine Clinic" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">Location</Label>
                    <Input id="location" placeholder="Nairobi, Kenya" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact</Label>
                    <Input id="contact" placeholder="+254700000000" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save Clinic"}
                </Button>
            </DialogFooter>
        </form>
    )
}

function ClinicsPage() {
    const [data, setData] = React.useState<Clinic[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [isFormOpen, setIsFormOpen] = React.useState(false);


    React.useEffect(() => {
        setIsLoading(true)
        // Simulate fetching data
        setTimeout(() => {
            setData(mockClinics)
            setIsLoading(false)
        }, 1000)
    }, [])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Clinics</CardTitle>
                <CardDescription>Manage your clinic locations and their details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between pb-4">
                    <Input
                        placeholder="Search clinics..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Clinic
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <AddClinicForm onFinished={() => setIsFormOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
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
                                          <span>Loading clinics...</span>
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
                                        No results.
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
    )
}

const requiredRoles: UserRole[] = ["admin", "doctor"];
export default withAuth(ClinicsPage, requiredRoles);
