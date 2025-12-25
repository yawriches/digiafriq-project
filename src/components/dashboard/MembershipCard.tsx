'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatPrice } from '@/lib/utils'
import { Crown, Check } from 'lucide-react'

interface MembershipCardProps {
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
  onSelect: (membershipId: string, withDigitalCashflow: boolean) => void
  selected?: boolean
  withDigitalCashflow?: boolean
}

export function MembershipCard({ membership, onSelect, selected }: MembershipCardProps) {
  // Default addon to selected (true) if addon is available
  const [isAddonSelected, setIsAddonSelected] = useState(membership.has_digital_cashflow)
  
  // Use database values for pricing
  const basePrice = membership.price
  const addonPrice = membership.digital_cashflow_price || 0
  const totalPrice = isAddonSelected && membership.has_digital_cashflow ? basePrice + addonPrice : basePrice
  
  const handleAddonToggle = (checked: boolean) => {
    setIsAddonSelected(checked)
  }
  
  const handleSubscribe = () => {
    onSelect(membership.id, isAddonSelected)
  }

  return (
    <Card className={`relative overflow-hidden transition-all bg-white p-6 ${selected ? 'ring-2 ring-[#ed874a]' : ''}`}>
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ed874a] to-[#ed874a]/50" />

      <CardHeader className="p-0 space-y-2">
        <CardTitle className="text-2xl font-bold">{membership.name}</CardTitle>
      </CardHeader>

      <CardContent className="p-0 mt-6 space-y-6">
        {/* Price Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${totalPrice}</span>
              <span className="text-muted-foreground">per year</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Renews at ${basePrice}/year
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            {membership.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-[#ed874a] shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Add-ons Section */}
        {membership.has_digital_cashflow && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Add ons</h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="font-medium">Digital Cashflow System</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get the Digital Cashflow Program + lifetime promo tools. Earn 80% commission + 20% yearly recurring.
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">
                    <Switch
                      checked={isAddonSelected}
                      onCheckedChange={handleAddonToggle}
                    />
                  </div>
                </div>
                {isAddonSelected && (
                  <div className="pl-4 border-l-2 border-[#ed874a]/20">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Crown className="h-4 w-4 text-[#ed874a]" />
                      Unlock Affiliate Features
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </CardContent>

      <CardFooter className="p-0 mt-6">
        <Button 
          className="w-full py-6 text-lg bg-[#ed874a] hover:bg-[#ed874a]/90 text-white" 
          onClick={handleSubscribe}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  )
}
