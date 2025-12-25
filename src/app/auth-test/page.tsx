"use client"

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function AuthTestPage() {
  const [results, setResults] = useState<any>({
    envVars: { status: 'pending', message: '' },
    connection: { status: 'pending', message: '' },
    users: { status: 'pending', message: '', data: [] },
    profiles: { status: 'pending', message: '', data: [] }
  })
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('Test123!')

  const runTests = async () => {
    setLoading(true)
    const newResults: any = {}

    // Test 1: Environment Variables
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        newResults.envVars = {
          status: 'error',
          message: 'Missing environment variables. Create .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        }
      } else {
        newResults.envVars = {
          status: 'success',
          message: `URL: ${url.substring(0, 30)}...\nKey: ${key.substring(0, 20)}...`
        }
      }
    } catch (error: any) {
      newResults.envVars = {
        status: 'error',
        message: error.message
      }
    }

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        newResults.connection = {
          status: 'error',
          message: `Connection error: ${error.message}`
        }
      } else {
        newResults.connection = {
          status: 'success',
          message: data.session ? 'Connected with active session' : 'Connected (no active session)'
        }
      }
    } catch (error: any) {
      newResults.connection = {
        status: 'error',
        message: error.message
      }
    }

    // Test 3: Check Users in Auth
    try {
      // Note: This requires admin access, may not work with anon key
      const { data: { users }, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        newResults.users = {
          status: 'warning',
          message: 'Cannot list users (requires admin access). Check Supabase Dashboard → Authentication → Users manually.',
          data: []
        }
      } else {
        newResults.users = {
          status: 'success',
          message: `Found ${users?.length || 0} users in authentication`,
          data: users || []
        }
      }
    } catch (error: any) {
      newResults.users = {
        status: 'warning',
        message: 'Cannot list users with anon key. Check Supabase Dashboard → Authentication → Users manually.',
        data: []
      }
    }

    // Test 4: Check Profiles Table
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .limit(10)

      if (error) {
        newResults.profiles = {
          status: 'error',
          message: `Profiles table error: ${error.message}`,
          data: []
        }
      } else {
        newResults.profiles = {
          status: 'success',
          message: `Found ${data?.length || 0} profiles in database`,
          data: data || []
        }
      }
    } catch (error: any) {
      newResults.profiles = {
        status: 'error',
        message: error.message,
        data: []
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  const testSignup = async () => {
    try {
      console.log('🧪 Testing signup...')
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (error) {
        alert(`Signup Error: ${error.message}`)
      } else {
        alert(`Signup Success! User ID: ${data.user?.id}\nCheck your email for confirmation (if enabled)`)
        runTests() // Refresh results
      }
    } catch (error: any) {
      alert(`Unexpected Error: ${error.message}`)
    }
  }

  const testLogin = async () => {
    try {
      console.log('🧪 Testing login...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (error) {
        alert(`Login Error: ${error.message}`)
      } else {
        alert(`Login Success! User: ${data.user?.email}`)
        runTests() // Refresh results
      }
    } catch (error: any) {
      alert(`Unexpected Error: ${error.message}`)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      default:
        return <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#ed874a] mb-2">Authentication Diagnostics</h1>
        <p className="text-gray-600 mb-6">Test your Supabase authentication setup</p>

        <div className="grid gap-4 mb-6">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStatusIcon(results.envVars.status)}
                <h2 className="text-xl font-semibold">Environment Variables</h2>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {results.envVars.message || 'Testing...'}
              </pre>
            </CardContent>
          </Card>

          {/* Connection Test */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStatusIcon(results.connection.status)}
                <h2 className="text-xl font-semibold">Supabase Connection</h2>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {results.connection.message || 'Testing...'}
              </pre>
            </CardContent>
          </Card>

          {/* Users Test */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStatusIcon(results.users.status)}
                <h2 className="text-xl font-semibold">Authentication Users</h2>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {results.users.message || 'Testing...'}
              </pre>
              {results.users.data && results.users.data.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Users Found:</h3>
                  <ul className="list-disc list-inside">
                    {results.users.data.map((user: any) => (
                      <li key={user.id} className="text-sm">
                        {user.email} - {user.email_confirmed_at ? '✅ Confirmed' : '⏳ Pending'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profiles Test */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getStatusIcon(results.profiles.status)}
                <h2 className="text-xl font-semibold">Profiles Table</h2>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {results.profiles.message || 'Testing...'}
              </pre>
              {results.profiles.data && results.profiles.data.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Profiles Found:</h3>
                  <ul className="list-disc list-inside">
                    {results.profiles.data.map((profile: any) => (
                      <li key={profile.id} className="text-sm">
                        {profile.email} - {profile.full_name} ({profile.role})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Test Authentication</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Password</label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Test123!"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={testSignup}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Test Signup
                </Button>
                <Button
                  onClick={testLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Test Login
                </Button>
                <Button
                  onClick={runTests}
                  disabled={loading}
                  className="bg-[#ed874a] hover:bg-[#d76f32] text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh Tests'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Next Steps</h2>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>If environment variables are missing, create <code className="bg-gray-200 px-1 rounded">.env.local</code> file</li>
              <li>If connection fails, check your Supabase URL and API key</li>
              <li>If no users found, try the "Test Signup" button</li>
              <li>If signup works but login fails, check email confirmation settings</li>
              <li>Check Supabase Dashboard → Authentication → Users for all registered users</li>
              <li>Check Supabase Dashboard → Database → profiles table for user profiles</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
    </Suspense>
  )
}
