import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building, HeartPulse, DollarSign } from 'lucide-react'

const stats = [
  { title: "Total Patients", value: "1,254", icon: Users, change: "+15.2% from last month" },
  { title: "Active Staff", value: "32", icon: Users, change: "+5 from last month" },
  { title: "Clinics", value: "3", icon: Building, change: "+1 this year" },
  { title: "Revenue", value: "$45,231.89", icon: DollarSign, change: "+20.1% from last month" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Good morning, Doctor!</h1>
        <p className="text-muted-foreground">Here's a summary of your clinic's activity.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    </div>
  )
}
