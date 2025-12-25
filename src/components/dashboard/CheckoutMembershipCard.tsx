'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Crown } from 'lucide-react'

interface CheckoutMembershipCardProps {
  membership: {
    id: string
    name: string
    description: string
    price: number
    currency: string
    duration_months: number
    features: string[]
    has_digital_cashflow: boolean
    digital_cashflow_price: number
  }
  selectedCurrency?: string
  convertedPrice?: number
  hasAddon?: boolean
}

export function CheckoutMembershipCard({ 
  membership, 
  selectedCurrency = 'USD',
  convertedPrice,
  hasAddon = false
}: CheckoutMembershipCardProps) {
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      GHS: '₵',
      NGN: '₦',
      KES: 'KSh',
      ZAR: 'R',
      XOF: 'CFA',
      XAF: 'XAF',
    }
    return symbols[currency] || currency
  }

  const displayPrice = convertedPrice || membership.price
  const basePrice = membership.price
  const addonPrice = membership.has_digital_cashflow ? membership.digital_cashflow_price : 0
  const totalPrice = hasAddon ? basePrice + addonPrice : basePrice

  return (
    <Card className="relative overflow-hidden bg-white">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ed874a] to-orange-500" />

      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {membership.name}
          {hasAddon && ' + Digital Cashflow System'}
        </CardTitle>
        {membership.description && (
          <p className="text-sm text-gray-600 mt-2">{membership.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Section */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {getCurrencySymbol(selectedCurrency)}{displayPrice.toLocaleString()}
            </span>
            <span className="text-gray-600">
              / {membership.duration_months} {membership.duration_months === 1 ? 'month' : 'months'}
            </span>
          </div>
          {selectedCurrency !== 'USD' && (
            <p className="text-sm text-gray-600">
              ≈ ${totalPrice.toLocaleString()} USD
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {membership.duration_months >= 12 
              ? 'Annual subscription. Renews automatically.' 
              : `${membership.duration_months} month subscription. Renews automatically.`}
          </p>
        </div>

        {/* Features List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Included Features</h3>
          <ul className="space-y-3">
            {membership.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#ed874a] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
            {hasAddon && (
              <>
                <li className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-[#ed874a] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">80% commission on referrals</span>
                </li>
                <li className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-[#ed874a] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Affiliate dashboard access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-[#ed874a] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Digital Cashflow Program + lifetime promo tools</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Addon Info */}
        {hasAddon && membership.has_digital_cashflow && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Digital Cashflow System Added:</strong> +${addonPrice} - Unlock affiliate features and earn 80% commission + 20% yearly recurring.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
