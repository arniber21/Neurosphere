import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useUser } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { DashboardLayout } from '../components/layout/dashboard-layout'

type ScanSummary = {
  id: string
  date: string
  status: 'completed' | 'processing' | 'failed'
  tumorDetected: boolean
}

export default function Dashboard() {
  const { user } = useUser()
  const [recentScans, setRecentScans] = useState<ScanSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch recent scans
    setTimeout(() => {
      // Mock data
      setRecentScans([
        { id: '1', date: '2023-06-15', status: 'completed', tumorDetected: true },
        { id: '2', date: '2023-05-22', status: 'completed', tumorDetected: false },
        { id: '3', date: '2023-04-10', status: 'completed', tumorDetected: true },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your brain scan analysis and recent activity.
          </p>
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Your latest brain scan analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-4">Loading recent scans...</div>
              ) : (
                <div className="space-y-4">
                  {recentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{new Date(scan.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="capitalize">{scan.status}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Result: {scan.tumorDetected ? 'Tumor detected' : 'No tumor detected'}
                        </p>
                      </div>
                      <Link to={`/scans/${scan.id}`}>
                        <Button variant="outline" size="sm" className="relative overflow-hidden group">
                          <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                            View
                          </span>
                          <span
                            className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"
                            aria-hidden="true"
                          ></span>
                        </Button>
                      </Link>
                    </div>
                  ))}
                  
                  <div className="pt-2 text-center">
                    <Link to="/scans">
                      <Button variant="ghost" className="relative overflow-hidden inline-block group">
                        <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                          View all scans
                        </span>
                        <span
                          className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"
                          aria-hidden="true"
                        ></span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link to="/upload" className="block">
                  <Button className="w-full relative overflow-hidden group">
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                      Upload New CT Scan
                    </span>
                    <span
                      className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"
                      aria-hidden="true"
                    ></span>
                  </Button>
                </Link>
                
                <Link to="/scans" className="block">
                  <Button variant="outline" className="w-full relative overflow-hidden group">
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                      View Scan History
                    </span>
                    <span
                      className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"
                      aria-hidden="true"
                    ></span>
                  </Button>
                </Link>
                
                {recentScans.length > 0 && (
                  <Link to={`/scans/${recentScans[0].id}`} className="block">
                    <Button variant="outline" className="w-full relative overflow-hidden group">
                      <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                        View Latest Result
                      </span>
                      <span
                        className="absolute inset-0 bg-pink-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"
                        aria-hidden="true"
                      ></span>
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 