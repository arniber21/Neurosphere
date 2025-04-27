import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router'
import { DashboardLayout } from '../components/layout/dashboard-layout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { getScanDetails, getScanStatus } from '../lib/api'

type ScanDetail = {
  id: string
  date: string
  status: 'completed' | 'processing' | 'failed'
  tumorDetected: boolean
  location?: string
  size?: string
  visualizationUrl?: string
  notes?: string
  originalImageUrl?: string
  heatmapUrl?: string
}

export default function ScanDetail() {
  const params = useParams()
  const [scan, setScan] = useState<ScanDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const scanId = params.id
  
  // Poll for status updates when the scan is processing
  useEffect(() => {
    let intervalId: number | undefined
    
    if (scan?.status === 'processing') {
      intervalId = window.setInterval(async () => {
        try {
          const statusData = await getScanStatus(null, scan.id)
          if (statusData.status !== 'processing') {
            // If status changed from processing, fetch full details
            fetchScanDetails()
            clearInterval(intervalId)
          }
        } catch (err) {
          console.error('Failed to check scan status:', err)
        }
      }, 3000) // Poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [scan?.status, scan?.id])
  
  const fetchScanDetails = async () => {
    if (!scanId) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await getScanDetails(null, scanId)
      
      setScan({
        id: data.id,
        date: data.date,
        status: data.status,
        tumorDetected: data.tumorDetected,
        location: data.location,
        size: data.size,
        visualizationUrl: data.visualizationUrl,
        notes: data.notes,
        originalImageUrl: data.originalImageUrl,
        heatmapUrl: data.heatmapUrl
      })
    } catch (err) {
      console.error('Failed to fetch scan details:', err)
      setError('Failed to load scan details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchScanDetails()
  }, [scanId])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg font-medium">Loading scan details...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Link to="/scans">
            <Button className="mt-4">Back to Scans</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!scan) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Scan not found</h2>
          <p className="text-muted-foreground mt-2">
            The scan you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/scans">
            <Button className="mt-4">Back to Scans</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top row - Scan info */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Information</CardTitle>
            <CardDescription>Details about this brain scan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{new Date(scan.date).toLocaleDateString()}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="capitalize">{scan.status}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Result</p>
                  <p className={scan.tumorDetected ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                    {scan.tumorDetected ? 'Tumor Detected' : 'No Tumor Detected'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {scan.location && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{scan.location}</p>
                  </div>
                )}
                
                {scan.size && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Size</p>
                    <p>{scan.size}</p>
                  </div>
                )}
                
                {scan.notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{scan.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full">Download Report</Button>
                  <Link to="/scans">
                    <Button variant="ghost" className="w-full">Back to Scans</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tumor Heatmap Section */}
        {scan.heatmapUrl && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Tumor Heatmap Analysis</CardTitle>
              <CardDescription>AI-generated heat visualization of detected tumor regions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Color Key - Horizontal on top */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Detection Results</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-red-500"></div>
                    <p>High probability tumor region</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
                    <p>Medium probability region</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                    <p>Region of interest</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side - Text Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Findings Summary</h4>
                    <p className="text-muted-foreground mt-1">
                      {scan.notes || "Tumor detected in the frontal lobe region with high confidence. The highlighted areas show the extent and intensity of the detected abnormality."}
                    </p>
                  </div>
                  {scan.location && (
                    <div>
                      <h4 className="font-medium">Location</h4>
                      <p className="text-muted-foreground">{scan.location}</p>
                    </div>
                  )}
                  {scan.size && (
                    <div>
                      <h4 className="font-medium">Approximate Size</h4>
                      <p className="text-muted-foreground">{scan.size}</p>
                    </div>
                  )}
                </div>
                
                {/* Right Side - Images Side by Side */}
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Original Scan</h3>
                      <img
                        src={scan.originalImageUrl}
                        alt="Original MRI scan"
                        className="w-full h-auto rounded-lg border shadow-sm"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">AI Heatmap Overlay</h3>
                      <img
                        src={scan.heatmapUrl}
                        alt="Tumor heatmap visualization"
                        className="w-full h-auto rounded-lg border shadow-sm"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Areas highlighted with warmer colors indicate regions identified by our AI as potential tumor locations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Bottom row - 3D visualization with interaction guide */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Interaction Guide</CardTitle>
              <CardDescription>How to interact with the 3D model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="bg-muted p-2 rounded">🖱️</div>
                  <div>
                    <p className="font-medium">Mouse Controls</p>
                    <p className="text-muted-foreground">Click and drag to rotate, scroll to zoom</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-muted p-2 rounded">✋</div>
                  <div>
                    <p className="font-medium">Gesture Controls</p>
                    <p className="text-muted-foreground">Use hand movements to rotate and zoom (if enabled)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-muted p-2 rounded">🔍</div>
                  <div>
                    <p className="font-medium">Highlighting</p>
                    <p className="text-muted-foreground">Tumor areas are highlighted in red</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3 h-full flex flex-col">
            <CardHeader>
              <CardTitle>3D Brain Visualization</CardTitle>
              <CardDescription>Interactive 3D model with tumor location</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-grow">
              {scan.visualizationUrl ? (
                <div className="w-full h-full" style={{ height: "calc(100vh - 500px)", minHeight: "600px" }}>
                  <iframe 
                    ref={iframeRef}
                    src={scan.visualizationUrl} 
                    className="w-full h-full border-0" 
                    title="K3D Brain Visualization"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[500px] bg-muted/50">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      {scan.status === 'processing' 
                        ? 'Visualization is being generated...' 
                        : '3D visualization not available'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 