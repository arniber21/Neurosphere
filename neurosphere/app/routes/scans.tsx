import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { DashboardLayout } from '../components/layout/dashboard-layout'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

type Scan = {
  id: string
  date: string
  status: 'completed' | 'processing' | 'failed'
  tumorDetected: boolean | null
  location?: string
  size?: string
}

export default function Scans() {
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing'>('all')

  useEffect(() => {
    // Simulate API call to fetch scans
    setTimeout(() => {
      // Mock data
      setScans([
        { id: '1', date: '2023-06-15', status: 'completed', tumorDetected: true, location: 'Frontal lobe', size: '2.3cm' },
        { id: '2', date: '2023-05-22', status: 'completed', tumorDetected: false },
        { id: '3', date: '2023-04-10', status: 'completed', tumorDetected: true, location: 'Temporal lobe', size: '1.5cm' },
        { id: '4', date: '2023-03-05', status: 'completed', tumorDetected: false },
        { id: '5', date: '2023-02-18', status: 'completed', tumorDetected: true, location: 'Cerebellum', size: '3.1cm' },
        { id: '6', date: '2023-01-30', status: 'processing', tumorDetected: null },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredScans = filter === 'all' 
    ? scans 
    : scans.filter(scan => scan.status === filter)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My CT Scans</h1>
            <p className="text-muted-foreground">View and manage your brain scan history</p>
          </div>
          <Link to="/upload">
            <Button>Upload New Scan</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>View all your previous scan results</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'completed' ? 'default' : 'outline'} 
                  onClick={() => setFilter('completed')}
                  size="sm"
                >
                  Completed
                </Button>
                <Button 
                  variant={filter === 'processing' ? 'default' : 'outline'} 
                  onClick={() => setFilter('processing')}
                  size="sm"
                >
                  Processing
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-8">Loading scans...</div>
            ) : filteredScans.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">No scans found with the current filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Result</th>
                        <th className="text-left p-2 font-medium">Location</th>
                        <th className="text-left p-2 font-medium">Size</th>
                        <th className="text-right p-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScans.map((scan) => (
                        <tr key={scan.id} className="border-b">
                          <td className="p-2">{new Date(scan.date).toLocaleDateString()}</td>
                          <td className="p-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              scan.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : scan.status === 'processing' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {scan.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {scan.tumorDetected === null
                              ? '—'
                              : scan.tumorDetected
                                ? 'Tumor detected'
                                : 'No tumor detected'
                            }
                          </td>
                          <td className="p-2">{scan.location || '—'}</td>
                          <td className="p-2">{scan.size || '—'}</td>
                          <td className="p-2 text-right">
                            <Link to={`/scans/${scan.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 