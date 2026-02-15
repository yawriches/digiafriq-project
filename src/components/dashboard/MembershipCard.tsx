'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface MembershipCardProps {
  membership: {
    id: string
    name: string
    description: string
    price: number
    currency: string
    duration_months: number
    features: string[]
  }
  onSelect: (membershipId: string) => void
  selected?: boolean
  isRenewal?: boolean
  renewalPrice?: number
}

export function MembershipCard({ membership, onSelect, selected, isRenewal, renewalPrice }: MembershipCardProps) {
  const handleSubscribe = () => {
    onSelect(membership.id)
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
              {isRenewal && renewalPrice !== undefined ? (
                <>
                  <span className="text-4xl font-bold text-[#ed874a]">${renewalPrice}</span>
                  <span className="text-lg text-muted-foreground line-through">${membership.price}</span>
                  <span className="text-muted-foreground">per year</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold">${membership.price}</span>
                  <span className="text-muted-foreground">per year</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isRenewal ? 'Renewal — Full access to AI Cashflow Program' : 'Full access to AI Cashflow Program'}
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
        </div>
      </CardContent>

      <CardFooter className="p-0 mt-6">
        <Button 
          className="w-full py-6 text-lg bg-[#ed874a] hover:bg-[#ed874a]/90 text-white" 
          onClick={handleSubscribe}
        >
          {isRenewal ? 'Renew Now' : 'Get Started'}
        </Button>
      </CardFooter>
    </Card>
  )
}
