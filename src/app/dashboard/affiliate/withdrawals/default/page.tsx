"use client"
import React, { useState } from 'react'
import {
  Settings,
  Calendar,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const DefaultWithdrawalPage = () => {
  const [selectedMethod, setSelectedMethod] = useState('bank')
  const [withdrawalDay, setWithdrawalDay] = useState('15')
  const [minimumAmount, setMinimumAmount] = useState('50')
  const [isActive, setIsActive] = useState(true)

  const paymentMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Building,
      description: 'Direct transfer to your bank account',
      processingTime: '1-3 business days',
      fee: 'Free'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: CreditCard,
      description: 'Instant transfer to PayPal account',
      processingTime: 'Instant',
      fee: '2.9% + $0.30'
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'MTN, Vodafone, AirtelTigo',
      processingTime: 'Instant',
      fee: '1.5%'
    }
  ]

  const withdrawalDays = [
    { value: '1', label: '1st of month' },
    { value: '7', label: '7th of month' },
    { value: '15', label: '15th of month' },
    { value: '30', label: '30th of month' }
  ]

  const handleSaveSettings = () => {
    // Save settings logic here
    alert('Default withdrawal settings saved successfully!')
  }

  const handleResetSettings = () => {
    setSelectedMethod('bank')
    setWithdrawalDay('15')
    setMinimumAmount('50')
    setIsActive(true)
  }

  return (
    <div className="space-y-6">
      {/* Current Settings Overview */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#ed874a] rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Default Withdrawal Settings</h3>
                <p className="text-gray-600">
                  Configure automatic withdrawals for your earnings
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Withdrawal Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Default Payment Method
              </label>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === method.id
                        ? 'border-[#ed874a] bg-[#ed874a]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <method.icon className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{method.name}</h4>
                        <p className="text-sm text-gray-600">{method.description}</p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>Fee: {method.fee}</span>
                          <span>{method.processingTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawal Day Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Automatic Withdrawal Day
              </label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={withdrawalDay}
                onChange={(e) => setWithdrawalDay(e.target.value)}
              >
                {withdrawalDays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Earnings will be automatically withdrawn on this day each month
              </p>
            </div>

            {/* Minimum Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Minimum Withdrawal Amount (USD)
              </label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(e.target.value)}
                min="10"
                max="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum balance required before automatic withdrawal
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Automatic Withdrawals</h4>
                <p className="text-sm text-gray-600">
                  Enable automatic withdrawals on the configured day
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ed874a]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  isActive ? 'peer-checked:bg-[#ed874a]' : ''
                }`}></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveSettings}
                className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleResetSettings}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Automatic Processing</h4>
                <p className="text-sm text-gray-600">
                  Withdrawals are processed automatically on your chosen day if balance meets minimum requirement
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Processing Times</h4>
                <p className="text-sm text-gray-600">
                  Bank transfers: 1-3 business days, PayPal: Instant, Mobile Money: Instant
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Schedule</h4>
                <p className="text-sm text-gray-600">
                  Automatic withdrawals occur on the 1st, 7th, 15th, or 30th of each month
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  If you need to modify your payment method or have questions about automatic withdrawals, contact our support team.
                </p>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Settings Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Current Settings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Payment Method</p>
              <p className="font-semibold text-gray-900">
                {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Withdrawal Day</p>
              <p className="font-semibold text-gray-900">
                {withdrawalDays.find(d => d.value === withdrawalDay)?.label}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Minimum Amount</p>
              <p className="font-semibold text-gray-900">${minimumAmount} USD</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className={`font-semibold ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DefaultWithdrawalPage
