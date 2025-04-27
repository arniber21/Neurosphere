import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { DashboardLayout } from '../components/layout/dashboard-layout'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { getScans } from '../lib/api'

type Scan = {
  id: string
  date: string
  status: 'completed' | 'processing' | 'failed'
  tumorDetected: boolean | null
  location?: string
  size?: string
  thumbnailUrl?: string
}

export default function Scans() {
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const loadScans = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getScans(null, {
        status: statusFilter || undefined,
        page: currentPage,
        limit: 10
      })
      
      setScans(response.scans)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error('Failed to fetch scans:', err)
      setError('Failed to load scans. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScans()
  }, [currentPage, statusFilter])

  const filteredScans = scans.filter(scan => {
    if (!searchTerm) return true
    
    // Simple client-side filtering (in a real app, this would be handled by the API)
    const searchLower = searchTerm.toLowerCase()
    const dateMatch = new Date(scan.date).toLocaleDateString().toLowerCase().includes(searchLower)
    const statusMatch = scan.status.toLowerCase().includes(searchLower)
    const locationMatch = scan.location?.toLowerCase().includes(searchLower) || false
    
    return dateMatch || statusMatch || locationMatch
  })

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when changing filters
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scans</h1>
            <p className="text-muted-foreground">View and manage all your MRI scans</p>
          </div>
          <Link to="/upload">
            <Button>Upload New Scan</Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-[300px]">
            <Input
              placeholder="Search scans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
              </div>
          
          <div className="flex flex-wrap gap-2">
                <Button 
              variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
              onClick={() => handleStatusFilterChange(null)}
                >
                  All
                </Button>
                <Button 
              variant={statusFilter === "completed" ? "default" : "outline"}
                  size="sm"
              onClick={() => handleStatusFilterChange("completed")}
                >
                  Completed
                </Button>
                <Button 
              variant={statusFilter === "processing" ? "default" : "outline"}
                  size="sm"
              onClick={() => handleStatusFilterChange("processing")}
                >
                  Processing
                </Button>
              </div>
            </div>
        
            {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="text-lg font-medium">Loading scans...</div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={loadScans}>
              Retry
            </Button>
          </div>
            ) : filteredScans.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No scans found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Upload your first scan to get started"}
            </p>
            {!searchTerm && (
              <Link to="/upload">
                <Button className="mt-4">Upload New Scan</Button>
              </Link>
            )}
              </div>
            ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredScans.map((scan) => (
                <Link to={`/scans/${scan.id}`} key={scan.id}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                        {scan.thumbnailUrl ? (
                          <img
                            src={scan.thumbnailUrl}
                            alt={`Scan from ${new Date(scan.date).toLocaleDateString()}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No preview
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{new Date(scan.date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5">
                          <span 
                            className={`inline-block w-2 h-2 rounded-full ${
                              scan.status === 'completed' 
                                ? 'bg-green-500' 
                                : scan.status === 'processing' 
                                ? 'bg-amber-500' 
                                : 'bg-red-500'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                              {scan.status}
                          </span>
                        </div>
                      </div>
                      
                      {scan.status === 'completed' && (
                        <div className="mt-1 text-sm">
                          <span className={scan.tumorDetected ? 'text-red-500' : 'text-green-500'}>
                            {scan.tumorDetected ? 'Tumor Detected' : 'No Tumor Detected'}
                          </span>
                          {scan.location && (
                            <span className="block text-muted-foreground mt-0.5">
                              Location: {scan.location}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                            </Link>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
} 