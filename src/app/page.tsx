import { LoginForm } from '@/components/auth/login-form'
import { Stethoscope } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-full mb-4">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">Jamii Clinic</h1>
          <p className="text-muted-foreground text-center">Welcome back! Please sign in to your account.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
