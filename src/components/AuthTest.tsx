'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/supabase/auth'

export function AuthTest() {
  const { user, profile, loading, signUp, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName)
        if (error) {
          setMessage(`Sign up error: ${error.message}`)
        } else {
          setMessage('Sign up successful! Check your email for verification.')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setMessage(`Sign in error: ${error.message}`)
        } else {
          setMessage('Sign in successful!')
        }
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      setMessage(`Sign out error: ${error.message}`)
    } else {
      setMessage('Signed out successfully!')
    }
  }

  if (loading) {
    return <div className="p-4">Loading authentication...</div>
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">Authenticated User</h3>
            <p className="text-sm text-green-600">Email: {user.email}</p>
            <p className="text-sm text-green-600">ID: {user.id}</p>
            {profile && (
              <>
                <p className="text-sm text-green-600">Name: {profile.full_name || 'Not set'}</p>
                <p className="text-sm text-green-600">Role: {profile.role}</p>
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`px-4 py-2 rounded ${!isSignUp ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`px-4 py-2 rounded ${isSignUp ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Sign Up
            </button>
          </div>

          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('error') || message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
