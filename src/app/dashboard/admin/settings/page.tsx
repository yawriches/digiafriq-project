"use client"
import React, { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Globe,
  DollarSign,
  Shield,
  Bell,
  Loader2,
  CreditCard,
  Users,
  Lock,
  ShoppingCart,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Settings {
  site_name: string
  site_url: string
  support_email: string
  default_commission_rate: string
  affiliate_referral_rate: string
  minimum_payout: string
  default_currency: string
  email_notifications: string
  sms_notifications: string
  maintenance_mode: string
  membership_auto_renew: string
  allow_guest_checkout: string
  max_login_attempts: string
  session_timeout_hours: string
  paystack_live_mode: string
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<Settings>({
    site_name: 'DigiAfriq',
    site_url: 'https://digiafriq.com',
    support_email: 'support@digiafriq.com',
    default_commission_rate: '80',
    affiliate_referral_rate: '10',
    minimum_payout: '50',
    default_currency: 'USD',
    email_notifications: 'true',
    sms_notifications: 'false',
    maintenance_mode: 'false',
    membership_auto_renew: 'true',
    allow_guest_checkout: 'true',
    max_login_attempts: '5',
    session_timeout_hours: '24',
    paystack_live_mode: 'false',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState<'database' | 'defaults'>('defaults')
  const [dirty, setDirty] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const initialLoadDone = React.useRef(false)

  const fetchSettings = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch settings')

      const data = await response.json()
      setSettings(data.settings)
      setSource(data.source)
      setDirty(false)
      setLastSynced(new Date())
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Auto-refresh every 15 seconds, but only if no unsaved changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!dirty && !saving) fetchSettings()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchSettings, dirty, saving])

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ settings })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Settings saved successfully (${data.savedCount} settings updated)`)
        setSource('database')
        setDirty(false)
        setLastSynced(new Date())
      } else {
        toast.error(data.message || 'Failed to save settings')
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const update = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const toggleBool = (key: keyof Settings) => {
    setSettings(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))
    setDirty(true)
  }

  const Toggle = ({ settingKey, label, description }: { settingKey: keyof Settings; label: string; description: string }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={settings[settingKey] === 'true'}
          onChange={() => toggleBool(settingKey)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ed874a]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ed874a]" />
      </label>
    </div>
  )

  if (loading) {
    return (
      <AdminDashboardLayout title="Platform Settings">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Platform Settings">
      <div className="space-y-6">
        {/* Sync status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dirty && (
              <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
                Unsaved changes
              </Badge>
            )}
            {!dirty && lastSynced && (
              <span className="text-xs text-gray-400">Last synced: {lastSynced.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${dirty ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
            <span className="text-xs text-gray-400">{dirty ? 'Unsaved' : 'Live sync'}</span>
          </div>
        </div>

        {/* Source indicator */}
        {source === 'defaults' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Settings are loaded from defaults. Save to persist them to the database.
              If the platform_settings table doesn&apos;t exist yet, run the migration first.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                General Settings
              </CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
                <Input
                  value={settings.site_name}
                  onChange={(e) => update('site_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site URL</label>
                <Input
                  value={settings.site_url}
                  onChange={(e) => update('site_url', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
                <Input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => update('support_email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Currency</label>
                <select
                  value={settings.default_currency}
                  onChange={(e) => update('default_currency', e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ed874a]/25"
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="GHS">GHS — Ghana Cedi</option>
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Commission & Payment Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Commission & Payments
              </CardTitle>
              <CardDescription>Configure affiliate commissions and payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Default Commission Rate (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.default_commission_rate}
                  onChange={(e) => update('default_commission_rate', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Percentage of sale amount paid as commission</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Affiliate Referral Rate (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.affiliate_referral_rate}
                  onChange={(e) => update('affiliate_referral_rate', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Commission rate for affiliate-to-affiliate referrals</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Minimum Payout Amount (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={settings.minimum_payout}
                  onChange={(e) => update('minimum_payout', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum balance required before withdrawal</p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Notifications
              </CardTitle>
              <CardDescription>Control how notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Toggle
                settingKey="email_notifications"
                label="Email Notifications"
                description="Send email notifications for payments, signups, and updates"
              />
              <Toggle
                settingKey="sms_notifications"
                label="SMS Notifications"
                description="Send SMS notifications to users (requires SMS provider)"
              />
            </CardContent>
          </Card>

          {/* Checkout & Membership Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                Checkout & Memberships
              </CardTitle>
              <CardDescription>Configure checkout and membership behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Toggle
                settingKey="allow_guest_checkout"
                label="Allow Guest Checkout"
                description="Let users purchase without creating an account first"
              />
              <Toggle
                settingKey="membership_auto_renew"
                label="Auto-Renew Memberships"
                description="Automatically renew memberships when they expire"
              />
            </CardContent>
          </Card>

          {/* Payment Gateway */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Payment Gateway
              </CardTitle>
              <CardDescription>Paystack payment configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Toggle
                settingKey="paystack_live_mode"
                label="Paystack Live Mode"
                description="Switch between test and live payment processing"
              />
              {settings.paystack_live_mode === 'true' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Live mode is active.</strong> Real payments will be processed.
                  </p>
                </div>
              )}
              {settings.paystack_live_mode === 'false' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Test mode is active.</strong> No real payments will be processed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Security & Access
              </CardTitle>
              <CardDescription>Security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Login Attempts</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_login_attempts}
                  onChange={(e) => update('max_login_attempts', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Lock account after this many failed attempts</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Timeout (hours)</label>
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={settings.session_timeout_hours}
                  onChange={(e) => update('session_timeout_hours', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Auto-logout after this many hours of inactivity</p>
              </div>
              <div className="pt-2">
                <Toggle
                  settingKey="maintenance_mode"
                  label="Maintenance Mode"
                  description="Make the site inaccessible to regular users"
                />
              </div>
              {settings.maintenance_mode === 'true' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>⚠ Warning:</strong> Maintenance mode is ON. The site is inaccessible to regular users.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#ed874a] hover:bg-[#d76f32] px-8">
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default SettingsPage
