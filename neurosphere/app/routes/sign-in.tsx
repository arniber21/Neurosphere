import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSignIn } from '@clerk/clerk-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export default function SignIn() {
  const navigate = useNavigate()
  const { signIn, isLoaded, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    
    try {
      setIsLoading(true)
      setError('')
      
      const result = await signIn.create({
        identifier: email,
        password,
      })
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Error signing in:', err)
      setError(err.errors?.[0]?.message || 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold">Neurosphere</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold">Sign in to your account</h2>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
              
              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 