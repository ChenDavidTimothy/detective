'use client'

import { useState } from 'react'
import { resetPassword } from '@/app/login/actions'
import { useSearchParams } from 'next/navigation'
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
import Link from 'next/link'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [emailInput, setEmailInput] = useState(email)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('email', emailInput)
      const result = await resetPassword(formData)

      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Check your email for a link to reset your password.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/login">Back to login</Link>
            </Button>

            {!success && (
              <Button type="submit" disabled={isLoading || !emailInput}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
