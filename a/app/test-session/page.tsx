"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSession = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-session")
      const data = await response.json()
      setSessionInfo(data)
    } catch (error) {
      console.error("Error testing session:", error)
    } finally {
      setLoading(false)
    }
  }

  const testBuyerRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/buyer-requests")
      if (response.ok) {
        const data = await response.json()
        alert("✅ Buyer requests API works! Found " + data.data.length + " orders")
      } else {
        alert("❌ Buyer requests API failed: " + response.status)
      }
    } catch (error) {
      alert("❌ Error: " + error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testSession()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Session Test Page</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={testSession} disabled={loading}>
            {loading ? "Testing..." : "Test Session"}
          </Button>
          <Button onClick={testBuyerRequests} disabled={loading}>
            {loading ? "Testing..." : "Test Buyer Requests API"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Make sure you're logged in as admin (admin123/admin123)</li>
              <li>Click "Test Session" to check if session cookie exists</li>
              <li>Click "Test Buyer Requests API" to test the API access</li>
              <li>If session shows "hasSessionCookie": false, you need to log in again</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
