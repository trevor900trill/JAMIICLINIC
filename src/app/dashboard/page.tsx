
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building, DollarSign, Calendar, Clock, BarChart2, User, Stethoscope } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

const getDashboardStats = (role: 'admin' | 'doctor' | 'staff') => {
  const baseStats = [
    { title: "Total Patients", value: "1,254", icon: Users, change: "+15.2% from last month" },
    { title: "Revenue", value: "$45,231.89", icon: DollarSign, change: "+20.1% from last month" },
    { title: "Clinics", value: "3", icon: Building, change: "+1 this year" },
  ];

  if (role === 'admin') {
    return [{ title: "Total Doctors", value: "2", icon: Stethoscope, change: "+1 this month" }, ...baseStats];
  }
  if (role === 'doctor') {
    return [{ title: "Total Staff", value: "2", icon: User, change: "+2 this month" }, ...baseStats];
  }
  return baseStats;
};


const chartData = [
  { month: "January", patients: 186 },
  { month: "February", patients: 305 },
  { month: "March", patients: 237 },
  { month: "April", patients: 273 },
  { month: "May", patients: 209 },
  { month: "June", patients: 214 },
]

const chartConfig = {
  patients: {
    label: "Patients",
    color: "hsl(var(--primary))",
  },
}

const recentAppointments = [
  { name: "Alice Johnson", time: "10:00 AM", doctor: "Dr. Smith" },
  { name: "Bob Williams", time: "11:30 AM", doctor: "Dr. Wayne" },
  { name: "Charlie Brown", time: "12:00 PM", doctor: "Dr. Stacy" },
  { name: "Diana Miller", time: "2:00 PM", doctor: "Dr. Smith" },
  { name: "Ethan Davis", time: "3:30 PM", doctor: "Dr. Wayne" },
]

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = getDashboardStats(user?.role || 'staff');
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Good morning, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's a summary of your clinic's activity.</p>
      </div>
      <div className={cn(
        "grid gap-4 sm:grid-cols-2",
        stats.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
      )}>
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Patient Volume</CardTitle>
            <CardDescription>Monthly patient visits for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="patients" fill="var(--color-patients)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        {/*
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Recent Appointments</CardTitle>
            <CardDescription>What your day looks like today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {recentAppointments.map((appt, index) => (
              <div key={index} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src={`https://placehold.co/36x36.png`} alt="Avatar" data-ai-hint="person portrait" />
                  <AvatarFallback>{appt.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">{appt.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {appt.time}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">View</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  )
}
