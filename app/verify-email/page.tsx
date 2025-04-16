// app/verify-email/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function VerifyEmailContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [countdown, setCountdown] = useState(60)

  // Fetch user and check verification status
  useEffect(() => {
    const checkVerification = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
      
      // Redirect if user is already verified
      if (data.user?.email_confirmed_at) {
        router.replace('/dashboard')
      }
    }
    
    checkVerification()
    
    // Set up auth state listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null)
          
          // Redirect on verification
          if (session?.user?.email_confirmed_at) {
            router.replace('/dashboard')
          }
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleResendEmail = async () => {
    // Reset countdown
    setCountdown(60)
    // This could use a server action to resend the verification email
    try {
      // Fetch to a server action or API route for resending verification
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
    } catch (error) {
      console.error('Failed to resend verification email:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>
            Check Your Email
          </CardTitle>
          <CardDescription>
            We sent a verification link to{' '}
            <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Please check your email and click the verification link to continue.</p>
            <p className="mt-4">
              Didn&apos;t receive the email? You can request a new one{' '}
              {countdown > 0 ? (
                <span>in {countdown} seconds</span>
              ) : (
                <Button
                  onClick={handleResendEmail}
                  variant="link"
                  className="p-0 h-auto"
                >
                  now
                </Button>
              )}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="text-primary"
            asChild
          >
            <Link href="/login">← Back to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyEmailContent />
    </Suspense>
  )
}