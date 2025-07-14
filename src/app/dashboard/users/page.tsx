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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const mockUsers = [
    { name: "Dr. Wayne Musungu", email: "waynemuyera17@gmail.com", role: "doctor", status: "Active" },
    { name: "Admin User", email: "admin@gmail.com", role: "admin", status: "Active" },
    { name: "Stacy Wanjiru", email: "stacy@gmail.com", role: "doctor", status: "Active" },
    { name: "John Lugogo", email: "lugogo@example.com", role: "staff", status: "Inactive" },
    { name: "Exolt Staff", email: "exolt@example.com", role: "staff", status: "Active" },
]

export default function UsersPage() {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="flex items-center">
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add User
                        </span>
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage all user accounts in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Role</TableHead>
                                <TableHead className="hidden md:table-cell">Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockUsers.map((user) => (
                                <TableRow key={user.email}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="hidden h-9 w-9 sm:flex">
                                                <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person portrait" />
                                                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground md:hidden">{user.role}</p>
                                                <p className="text-sm text-muted-foreground hidden md:block">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className="bg-green-500 hover:bg-green-600 text-white">
                                            {user.status}
                                        </Badge>
                                    </TableCell>
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
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
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
