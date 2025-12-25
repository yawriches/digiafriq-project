"use client"
import React, { useState } from 'react'
import { 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCommissions } from '@/hooks/useReferrals'
import { useProfile } from '@/lib/hooks/useProfile'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { createWithdrawal, getUserWithdrawals, formatWithdrawalAmount } from '@/lib/withdrawals'
import type { Withdrawal, AccountDetails, BankAccountDetails, MobileMoneyDetails } from '@/lib/withdrawals'

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  reference?: string | null
}

const WithdrawalsPage = () => {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // 1: Amount & Method, 2: Confirmation, 3: Add Payment Method
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    network: '',
    mobileNumber: ''
  })

  const { getAvailableEarnings, refresh: refreshCommissions } = useCommissions()
  const availableBalance = getAvailableEarnings()
  const minimumWithdrawal = 8.00

  // Check if today is Friday (withdrawals only allowed on Fridays)
  // TODO: Re-enable Friday-only check after testing
  const isFriday = () => {
    // const today = new Date()
    // return today.getDay() === 5 // 5 = Friday (0 = Sunday, 6 = Saturday)
    return true // Allow withdrawals any day for testing
  }
  const withdrawalsEnabled = isFriday()

  // Get real payment methods from user profile
  const { 
    paymentMethods: savedPaymentMethods, 
    loading: profileLoading,
    addPaymentMethod 
  } = useProfile()

  const paymentMethods = [
    {
      id: 'mobile',
      name: 'Mobile Money',
      description: 'MTN Mobile Money, Vodafone Cash',
      fee: 'No fees',
      processingTime: 'Within 24 hours',
      icon: CreditCard
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct transfer to your bank account',
      fee: 'No fees',
      processingTime: '3-5 business days',
      icon: CreditCard
    }
  ]

  // const recentWithdrawals = [
  //   {
  //     date: "2024-09-24",
  //     amount: "40.00 USD",
  //     method: "Bank Transfer",
  //     status: "Completed",
  //     statusColor: "text-green-600 bg-green-100",
  //     reference: "WD001234"
  //   },
  //   {
  //     date: "2024-09-10",
  //     amount: "25.00 USD",
  //     method: "PayPal",
  //     status: "Completed",
  //     statusColor: "text-green-600 bg-green-100",
  //     reference: "WD001235"
  //   },
  //   {
  //     date: "2024-08-28",
  //     amount: "30.00 USD",
  //     method: "Mobile Money",
  //     status: "Processing",
  //     statusColor: "text-yellow-600 bg-yellow-100",
  //     reference: "WD001236"
  //   }
  // ]

  // Check if user has a payment method of a specific type
  const hasPaymentMethodOfType = (type: string) => {
    return savedPaymentMethods.some((method: any) => method.type === type)
  }

  // Get saved payment method by type
  const getSavedMethodByType = (type: string) => {
    return savedPaymentMethods.find((method: any) => method.type === type)
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!withdrawalAmount || !selectedMethod) {
        toast.error('Please enter amount and select payment method')
        return
      }
      
      const amount = parseFloat(withdrawalAmount)
      if (amount < minimumWithdrawal) {
        toast.error(`Minimum withdrawal amount is ${minimumWithdrawal} USD`)
        return
      }
      
      if (amount > availableBalance) {
        toast.error('Insufficient balance')
        return
      }

      // Check if payment method exists
      const savedMethod = getSavedMethodByType(selectedMethod)
      if (!savedMethod) {
        // Show add payment form instead of error
        setShowAddPaymentForm(true)
        setNewPaymentMethod({ ...newPaymentMethod, type: selectedMethod })
        return
      }
      
      setStep(2)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([])
  const [recentPayouts, setRecentPayouts] = useState<Payout[]>([])

  // Load user's recent withdrawals
  const loadWithdrawals = async () => {
    const { data } = await getUserWithdrawals()
    setRecentWithdrawals(data.slice(0, 5)) // Show last 5
  }

  // Load user's recent payout records (completed withdrawals)
  const loadPayouts = async () => {
    if (!user) return

    const { data, error } = await (supabase as any)
      .from('payouts')
      .select('*')
      .eq('affiliate_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && data) {
      setRecentPayouts(data as Payout[])
    } else {
      setRecentPayouts([])
    }
  }

  // Load withdrawals on mount
  React.useEffect(() => {
    loadWithdrawals()
    loadPayouts()
  }, [user])

  const handleConfirmWithdrawal = async () => {
    setIsSubmitting(true)
    
    try {
      // Get the saved payment method details
      const savedMethod = getSavedMethodByType(selectedMethod)
      if (!savedMethod) {
        toast.error('Payment method not found')
        setIsSubmitting(false)
        return
      }

      // Build account details based on payout channel
      let accountDetails: AccountDetails
      
      if (selectedMethod === 'bank') {
        const bankMethod = savedMethod as any
        accountDetails = {
          bank_name: bankMethod.bankName,
          bank_code: bankMethod.bankCode || bankMethod.bankName.toUpperCase().substring(0, 3),
          account_number: bankMethod.accountNumber,
          account_name: bankMethod.accountName
        } as BankAccountDetails
      } else {
        const mobileMethod = savedMethod as any
        accountDetails = {
          network: mobileMethod.network,
          network_code: mobileMethod.network.toUpperCase(),
          mobile_number: mobileMethod.mobileNumber,
          account_name: mobileMethod.accountName || ''
        } as MobileMoneyDetails
      }

      // Create withdrawal request
      const { data, error } = await createWithdrawal({
        amount_usd: parseFloat(withdrawalAmount),
        payout_channel: selectedMethod === 'bank' ? 'bank' : 'mobile_money',
        account_details: accountDetails,
        currency: 'GHS'
      })

      if (error) {
        toast.error(error)
        setIsSubmitting(false)
        return
      }

      toast.success(`Withdrawal request submitted! Reference: ${data?.reference}`)
      
      // Reset form and reload withdrawals + balance
      setStep(1)
      setWithdrawalAmount('')
      setSelectedMethod('')
      loadWithdrawals()
      refreshCommissions() // Refresh balance after withdrawal
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (showAddPaymentForm) {
      setShowAddPaymentForm(false)
      return
    }
    setStep(step - 1)
  }

  // Handle adding a new payment method
  const handleAddPaymentMethod = async () => {
    if (newPaymentMethod.type === 'bank' && (!newPaymentMethod.bankName || !newPaymentMethod.accountNumber || !newPaymentMethod.accountName)) {
      toast.error('Please fill in all bank details')
      return
    }
    if (newPaymentMethod.type === 'mobile' && (!newPaymentMethod.network || !newPaymentMethod.mobileNumber)) {
      toast.error('Please fill in all mobile money details')
      return
    }

    try {
      if (newPaymentMethod.type === 'bank') {
        await addPaymentMethod({
          type: 'bank',
          bankName: newPaymentMethod.bankName,
          accountNumber: newPaymentMethod.accountNumber,
          accountName: newPaymentMethod.accountName,
          isDefault: savedPaymentMethods.length === 0
        })
      } else if (newPaymentMethod.type === 'mobile') {
        await addPaymentMethod({
          type: 'mobile',
          network: newPaymentMethod.network,
          mobileNumber: newPaymentMethod.mobileNumber,
          isDefault: savedPaymentMethods.length === 0
        })
      }

      toast.success('Payment method added successfully!')
      setNewPaymentMethod({
        type: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        network: '',
        mobileNumber: ''
      })
      setShowAddPaymentForm(false)
      // Proceed to confirmation
      setStep(2)
    } catch (err: any) {
      toast.error(`Failed to add payment method: ${err.message}`)
    }
  }

  // Auto-populate payment details when method is selected
  const handleMethodSelection = (methodId: string) => {
    setSelectedMethod(methodId)
    setShowAddPaymentForm(false)
  }

  const getStatusBadgeClasses = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    const normalized = status.toUpperCase()

    switch (normalized) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800'
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatusLabel = (status: string) => {
    if (!status) return '-'
    const lower = status.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Combine withdrawal requests and actual payouts into a single history list
  const combinedHistory = [
    ...recentWithdrawals.map(w => ({
      id: w.id,
      kind: 'request' as const,
      amountUsd: w.amount_usd,
      amountLocal: w.amount_local,
      currency: w.currency,
      status: w.status,
      reference: w.reference,
      created_at: w.created_at
    })),
    ...recentPayouts.map(p => ({
      id: p.id,
      kind: 'payout' as const,
      amountUsd: p.amount,
      amountLocal: null as number | null,
      currency: p.currency,
      status: p.status,
      reference: p.reference || p.id.slice(0, 12).toUpperCase(),
      created_at: p.created_at
    }))
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-gray-600">Loading payment methods...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Withdraw Funds</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber ? 'bg-[#ed874a] text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 2 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  step > stepNumber ? 'bg-[#ed874a]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Withdrawal Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {step === 1 && 'Enter Amount & Select Method'}
                {step === 2 && 'Confirm Withdrawal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Amount & Method Selection */}
              {step === 1 && (
                <>
                  {/* Check if withdrawals are enabled (Friday only) */}
                  {!withdrawalsEnabled ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-800">Withdrawals Available on Fridays Only</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Withdrawal requests can only be submitted on Fridays (12:00 AM - 11:59 PM). 
                            Please come back on Friday to request your withdrawal.
                          </p>
                          <p className="text-sm text-blue-600 mt-2">
                            Your available balance: <span className="font-medium">{availableBalance.toFixed(2)} USD</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : availableBalance < minimumWithdrawal ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-yellow-800">Insufficient Balance</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            You need at least {minimumWithdrawal.toFixed(2)} USD to make a withdrawal. 
                            Current balance: {availableBalance.toFixed(2)} USD
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Withdrawal Amount (USD)
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          min={minimumWithdrawal}
                          max={availableBalance}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum: {minimumWithdrawal.toFixed(2)} USD | Available: {availableBalance.toFixed(2)} USD
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Payment Method
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
                              onClick={() => handleMethodSelection(method.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <method.icon className="w-5 h-5 text-gray-600 mt-1" />
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

                      {/* Show indicator if payment method exists for selected type */}
                      {selectedMethod && (
                        <div className={`p-3 rounded-lg text-sm ${
                          hasPaymentMethodOfType(selectedMethod) 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {hasPaymentMethodOfType(selectedMethod) ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>You have a saved {selectedMethod === 'bank' ? 'bank account' : 'mobile money'} for withdrawals</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>You&apos;ll need to add {selectedMethod === 'bank' ? 'bank account' : 'mobile money'} details to proceed</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Button 
                        onClick={handleNextStep}
                        className="w-full bg-[#ed874a] hover:bg-[#d76f32]"
                        disabled={!withdrawalAmount || !selectedMethod}
                      >
                        {selectedMethod && !hasPaymentMethodOfType(selectedMethod) ? 'Add Payment Method & Continue' : 'Review & Confirm'}
                      </Button>
                    </>
                  )}
                </>
              )}

              {/* Add Payment Method Form (shown when user doesn't have the selected method) */}
              {showAddPaymentForm && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Plus className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-800">Add Payment Method</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Please add your {newPaymentMethod.type === 'bank' ? 'bank account' : 'mobile money'} details to receive withdrawals.
                        </p>
                      </div>
                    </div>
                  </div>

                  {newPaymentMethod.type === 'bank' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <Input
                          placeholder="e.g. GCB Bank, Ecobank, Fidelity Bank"
                          value={newPaymentMethod.bankName}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, bankName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                        <Input
                          placeholder="Enter your account number"
                          value={newPaymentMethod.accountNumber}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                        <Input
                          placeholder="Name on the account"
                          value={newPaymentMethod.accountName}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountName: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {newPaymentMethod.type === 'mobile' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                        <select
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                          value={newPaymentMethod.network}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, network: e.target.value})}
                        >
                          <option value="">Select Network</option>
                          <option value="mtn">MTN Mobile Money</option>
                          <option value="vodafone">Vodafone Cash</option>
                          <option value="airteltigo">AirtelTigo Money</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                        <Input
                          placeholder="e.g. 0241234567"
                          value={newPaymentMethod.mobileNumber}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, mobileNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleAddPaymentMethod}
                      className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                    >
                      Save & Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation */}
              {step === 2 && (
                <>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-medium text-gray-900 mb-4">Withdrawal Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="text-sm font-medium text-gray-900">${withdrawalAmount} USD</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Method:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {paymentMethods.find(m => m.id === selectedMethod)?.name}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processing Time:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedMethod === 'bank' ? 'Within 72 hours' : 'Within 48 hours'}
                        </span>
                      </div>

                      <hr className="my-3" />

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium text-gray-900">Payment Details:</h4>
                          <Link 
                            href="/dashboard/profile" 
                            className="text-sm text-orange-600 hover:text-[#d76f32] underline"
                          >
                            Edit Details
                          </Link>
                        </div>
                        {(() => {
                          const savedMethod = getSavedMethodByType(selectedMethod)
                          if (!savedMethod) return null

                          if (selectedMethod === 'bank') {
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Bank:</span>
                                  <span className="text-sm text-gray-900">{(savedMethod as any).bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Account:</span>
                                  <span className="text-sm text-gray-900">{(savedMethod as any).accountNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Name:</span>
                                  <span className="text-sm text-gray-900">{(savedMethod as any).accountName}</span>
                                </div>
                              </>
                            )
                          }

                          if (selectedMethod === 'mobile') {
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Network:</span>
                                  <span className="text-sm text-gray-900">{(savedMethod as any).network?.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Number:</span>
                                  <span className="text-sm text-gray-900">{(savedMethod as any).mobileNumber}</span>
                                </div>
                              </>
                            )
                          }

                          return null
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleConfirmWithdrawal}
                      className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Confirm Withdrawal'
                      )}
                    </Button>
                  </div>
                </>
              )}
          </CardContent>
        </Card>
        </div>

        {/* Withdrawal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Withdrawal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Processing Times</h4>
                  <p className="text-sm text-gray-600">Bank transfers: within 72 hours, Mobile Money: within 48 hours</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Withdrawal Schedule</h4>
                  <p className="text-sm text-gray-600">Withdrawal requests can only be submitted on Fridays (12:00 AM - 11:59 PM)</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Important Notes</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Minimum withdrawal: {minimumWithdrawal.toFixed(2)} USD</li>
                    <li>• No maximum withdrawal limit</li>
                    <li>• No fees apply</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link href="/dashboard/profile">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Payment Methods
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}

export default WithdrawalsPage
