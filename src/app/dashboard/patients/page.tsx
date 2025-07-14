"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import { Loader2 } from "lucide-react"

const patientSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  telephone: z.string().min(10, "Please enter a valid phone number."),
})

export default function PatientsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      telephone: ""
    }
  })

  async function onSubmit(values: z.infer<typeof patientSchema>) {
    setIsLoading(true)
    console.log(values)
    // Mock API call to create patient
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({ title: "Success", description: `Patient record for ${values.first_name} ${values.last_name} created.` })
    form.reset()
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Patient</CardTitle>
        <CardDescription>Add a new patient record to the system. All fields are required.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4 md:grid-cols-2">
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
              <FormItem>
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
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Save Patient"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
