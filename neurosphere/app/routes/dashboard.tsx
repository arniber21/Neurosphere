import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { DashboardLayout } from '../components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getDashboardStats } from '../lib/api'

interface DashboardStats {
  totalScans: number
  completedScans: number
  processingScans: number
  tumorDetectedCount: number
  tumorDetectionRate: number
  recentScans: Array<{
    id: string
    date: string
    status: string
    tumorDetected: boolean | null
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const data = await getDashboardStats(null)
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
        setError('Failed to load dashboard statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg font-medium">Loading dashboard data...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          {error}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to Neurosphere, analyze brain MRIs with AI</p>
          </div>
          <Link to="/upload">
            <Button>Upload New Scan</Button>
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group border border-gray-300 transition-all duration-200 hover:scale-105 hover:border-pink-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-pink-500">
                Total Scans
              </CardTitle>
              <CardDescription className="group-hover:text-pink-500">
                Lifetime processed scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold group-hover:text-pink-500">12</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-pink-500">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="group border border-gray-300 transition-all duration-200 hover:scale-105 hover:border-pink-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-pink-500">
                Detected Issues
              </CardTitle>
              <CardDescription className="group-hover:text-pink-500">
                Scans with tumors detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold group-hover:text-pink-500">4</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-pink-500">
                33% of total scans
              </p>
            </CardContent>
          </Card>
          
          <Card className="group border border-gray-300 transition-all duration-200 hover:scale-105 hover:border-pink-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-pink-500">
                Last Scan
              </CardTitle>
              <CardDescription className="group-hover:text-pink-500">
                Most recent analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold group-hover:text-pink-500">June 15</div>
              <p className="text-xs text-muted-foreground mt-1 group-hover:text-pink-500">
                2 weeks ago
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>
                Your most recently analyzed scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentScans && stats.recentScans.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex flex-col">
                        <div className="flex gap-2 items-center">
                          <span className="font-medium">{new Date(scan.date).toLocaleDateString()}</span>
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              scan.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : scan.status === 'processing' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {scan.status}
                          </span>
                        </div>
                        {scan.status === 'completed' && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {scan.tumorDetected 
                              ? 'Tumor detected' 
                              : 'No tumor detected'
                            }
                          </div>
                        )}
                      </div>
                      <Link to={`/scans/${scan.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent scans found
                </div>
              )}
              
              <div className="mt-6">
                <Link to="/scans">
                  <Button variant="outline" className="w-full">View All Scans</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>About Neurosphere</CardTitle>
              <CardDescription>
                AI-powered brain MRI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">What is Neurosphere?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Neurosphere is an advanced AI system designed to help doctors analyze and interpret brain MRI scans, specializing in tumor detection and visualization.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Key Features</h4>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                  <li>Automatic tumor detection</li>
                  <li>3D visualization of brain and tumor</li>
                  <li>Size and location analysis</li>
                  <li>Interactive visualization tools</li>
                  <li>Report generation for clinical use</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Getting Started</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your first MRI scan to see Neurosphere in action. The analysis takes just a few minutes.
                </p>
                <Link to="/upload">
                  <Button className="mt-2 w-full">Upload Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 