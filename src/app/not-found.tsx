import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Frown } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <div className="p-8">
        <Frown className="mx-auto h-24 w-24 text-primary" />
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight lg:text-5xl">
          404 - Page Not Found
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Oops! The page you are looking for does not exist or you do not have permission to view it.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
