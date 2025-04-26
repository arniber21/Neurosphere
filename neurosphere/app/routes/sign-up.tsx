import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSignUp } from '@clerk/clerk-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp, isLoaded, setActive } = useSignUp()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
      
      // Start the sign up process
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })
      
      // Prepare verification if needed
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      
      // In a real application, you'd redirect to a verification step here
      // For simplicity, we assume the verification is automatic
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Error signing up:', err)
      setError(err.errors?.[0]?.message || 'An error occurred during sign up')
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
          <h2 className="mt-6 text-2xl font-bold">Create your account</h2>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your information to create an account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              
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
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              
              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link to="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 