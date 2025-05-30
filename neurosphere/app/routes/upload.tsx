import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { DashboardLayout } from '../components/layout/dashboard-layout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { uploadScan } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function Upload() {
  const navigate = useNavigate()
  const { token, isLoaded: isAuthLoaded } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Check file type (ideally you'd want to check for DICOM files or other medical imaging formats)
      if (!file.type.includes('image/')) {
        setError('Please upload a valid image file')
        return
      }
      
      // Check file size (5MB limit for this example)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview for image files
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      // Manually trigger file input change to use the same validation logic
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        
        // Trigger change event manually
        const event = new Event('change', { bubbles: true })
        fileInputRef.current.dispatchEvent(event)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !isAuthLoaded || !token) return
    
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    // Simulate initial upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 500)
    
    try {
      // Add any additional metadata you want to send with the scan
      const metadata = {
        uploadDate: new Date().toISOString(),
        fileType: selectedFile.type,
        fileName: selectedFile.name
      }
      
      // Upload the scan to the backend
      const response = await uploadScan(token, selectedFile, metadata)
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (response && response.scanId) {
        // Navigate to the scan detail page
        navigate(`/scans/${response.scanId}`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Failed to upload scan. Please try again.')
      setIsUploading(false)
      console.error('Upload error:', err)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload MRI Scan</h1>
          <p className="text-muted-foreground mt-2">
            Upload a brain MRI scan for tumor detection and 3D visualization
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>MRI Scan Upload</CardTitle>
            <CardDescription>
              Upload a MRI scan image to analyze for potential brain tumors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isUploading ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Processing MRI Scan</h3>
                    <p className="text-muted-foreground">
                      Please wait while we analyze your brain scan
                    </p>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    {uploadProgress}% - {
                      uploadProgress < 30 
                        ? 'Uploading scan...' 
                        : uploadProgress < 60 
                          ? 'Analyzing image...' 
                          : uploadProgress < 90 
                            ? 'Building 3D model...' 
                            : 'Finalizing results...'
                    }
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                  />
                  
                  {previewUrl ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto overflow-hidden rounded-lg max-w-sm">
                        <img
                          src={previewUrl}
                          alt="MRI Scan Preview"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selected file: {selectedFile?.name}
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewUrl(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-medium">
                          Drag and drop your MRI scan here
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          or
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse files
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: JPEG, PNG, DICOM (up to 5MB)
                      </p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 text-sm text-red-500">
                      {error}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">What happens next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Your MRI scan will be securely uploaded to our servers</li>
                  <li>Our AI model will analyze the image to detect potential tumors</li>
                  <li>A 3D model of your brain will be generated, highlighting any findings</li>
                  <li>You'll be able to interactively explore the 3D visualization</li>
                </ol>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              disabled={!selectedFile || isUploading || !isAuthLoaded}
              onClick={handleUpload}
            >
              {isUploading ? 'Processing...' : 'Analyze MRI Scan'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
} 