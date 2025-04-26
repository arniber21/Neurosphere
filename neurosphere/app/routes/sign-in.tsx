import { SignIn } from '@clerk/clerk-react'
import { useNavigate } from 'react-router'

export default function SignInPage() {
  const navigate = useNavigate()
  
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-4 mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Neurosphere</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        
        <SignIn 
          routing="path" 
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-none",
              headerTitle: "hidden", // Hide default title as we have our own
              headerSubtitle: "hidden", // Hide default subtitle
              socialButtonsBlockButton: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              formButtonPrimary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              footerActionText: "text-muted-foreground",
              footerActionLink: "text-primary hover:text-primary/90"
            }
          }}
        />
      </div>
    </div>
  )
} 