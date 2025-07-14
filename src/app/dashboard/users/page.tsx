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
import { ArrowUpDown, ChevronDown, MoreHorizontal, PlusCircle, Loader2 } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import withAuth from "@/components/auth/with-auth"
import type { UserRole } from "@/context/auth-context"


const mockUsers = [
    { id: "user-1", name: "Dr. Wayne Musungu", email: "waynemuyera17@gmail.com", role: "doctor", status: "Active" },
    { id: "user-2", name: "Admin User", email: "admin@gmail.com", role: "admin", status: "Active" },
    { id: "user-3", name: "Stacy Wanjiru", email: "stacy@gmail.com", role: "doctor", status: "Active" },
    { id: "user-4", name: "John Lugogo", email: "lugogo@example.com", role: "staff", status: "Inactive" },
    { id: "user-5", name: "Exolt Staff", email: "exolt@example.com", role: "staff", status: "Active" },
]

export type User = {
    id: string
    name: string
    email: string
    role: "doctor" | "admin" | "staff"
    status: "Active" | "Inactive"
}


function DeactivateUserDialog() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    Deactivate
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to deactivate this user?</AlertDialogTitle>
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

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person portrait" />
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.getValue("role")}</Badge>,
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
                        <DeactivateUserDialog />
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

function AddUserForm({ onFinished }: { onFinished: () => void }) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("User Created");
        setIsLoading(false);
        onFinished();
    };

    return (
         <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                    Fill in the details below to add a new user to the system.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" placeholder="John Doe" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save User"}
                </Button>
            </DialogFooter>
        </form>
    )
}


function StaffPage() {
    const [data, setData] = React.useState<User[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [isFormOpen, setIsFormOpen] = React.useState(false);


    React.useEffect(() => {
        setIsLoading(true);
        // Simulate fetching data
        setTimeout(() => {
            setData(mockUsers)
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
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Staff</CardTitle>
                <CardDescription>Manage all staff accounts in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between pb-4">
                    <Input
                        placeholder="Search staff by name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <AddUserForm onFinished={() => setIsFormOpen(false)} />
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
                                          <span>Loading staff...</span>
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
export default withAuth(StaffPage, requiredRoles);
