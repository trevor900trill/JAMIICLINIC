import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const mockClinics = [
    { id: 1, name: "Good Health Clinic", location: "Nairobi, Kenya", contact: "+254712345678", status: "Active" },
    { id: 2, name: "Wellness Center", location: "Mombasa, Kenya", contact: "+254787654321", status: "Active" },
    { id: 3, name: "City Medicals", location: "Kisumu, Kenya", contact: "+254722222222", status: "Inactive" },
]

export default function ClinicsPage() {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="flex items-center">
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Clinic
                        </span>
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Clinics</CardTitle>
                    <CardDescription>Manage your clinic locations and their details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Location</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockClinics.map((clinic) => (
                                <TableRow key={clinic.id}>
                                    <TableCell className="font-medium">{clinic.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant={clinic.status === 'Active' ? 'default' : 'secondary'} className={clinic.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
                                            {clinic.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{clinic.location}</TableCell>
                                    <TableCell>{clinic.contact}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>View Staff</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
