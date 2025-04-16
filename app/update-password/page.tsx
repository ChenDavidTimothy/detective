'use client'

import { useState, useEffect } from 'react'
import { updatePassword } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const router = useRouter()

  // Check authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        router.push('/login?error=password_reset_expired')
      } else {
        setIsAuthChecking(false)
      }
    }
    checkAuth()
  }, [router])

  // Handle redirection after successful password update
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('password', password)
      const result = await updatePassword(formData)
      if (result?.error) {
        setError(result.error.message)
      } else if (result?.success) {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 mx-auto"></div>
          <p>Verifying your session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Update Your Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Password updated successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}
            {!success && (
              <>
                <Input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6} // Minimum password length
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </>
            )}
          </CardContent>
          <CardFooter>
            {!success && (
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
