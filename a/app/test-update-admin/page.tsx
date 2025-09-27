"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function TestUpdateAdmin() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const handleUpdateCredentials = async () => {
    setIsUpdating(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        toast({
          title: "Success",
          description: "Admin credentials updated successfully!",
        })
      } else {
        throw new Error(data.error || 'Failed to update credentials')
      }
    } catch (error) {
      console.error('Error updating credentials:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update credentials",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Admin Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Current Action:</h3>
            <p className="text-sm text-muted-foreground">
              This will update the admin credentials from "arun/123456" to "Tejas/T0360j@36"
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">New Credentials:</h3>
            <div className="bg-gray-100 p-3 rounded">
              <p><strong>Username:</strong> Tejas</p>
              <p><strong>Password:</strong> T0360j@36</p>
            </div>
          </div>
          
          <Button 
            onClick={handleUpdateCredentials}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? "Updating..." : "Update Admin Credentials"}
          </Button>
          
          {result && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Result:</h3>
              <div className="bg-green-100 p-3 rounded">
                <p className="text-green-800">{result.message}</p>
                {result.verification && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Verification:</p>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.verification, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
