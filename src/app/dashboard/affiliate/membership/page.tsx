"use client"
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const MembershipPage = () => {
  const membershipCard = {
    planName: "Basic Affiliate",
    activeSince: "September 1, 2024",
    setupFee: "70.00 Cedis",
    commission: "100 Cedis",
    totalEarnings: "400.00 Cedis",
    totalReferrals: 4,
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Membership</h1>
        </div>

        {/* Affiliate Membership Card */}
        <div className="max-w-sm">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            {/* Plan Title */}
            <h3 className="text-[#ed874a] text-lg font-medium mb-4">Affiliate Plan</h3>
            
            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{membershipCard.setupFee.split(' ')[0]}</span>
                <span className="text-lg text-gray-600">Cedis</span>
              </div>
              <p className="text-gray-500 mt-1 text-sm">One-time setup fee</p>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/membershipcoin.png"
                  alt="Membership Coin"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Commission Info */}
            <div className="text-center mb-6">
              <p className="text-gray-700 text-sm">
                Earn <span className="font-bold text-gray-900">{membershipCard.commission}</span> per referral
              </p>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Welcome bonus:</span>
                <span className="font-medium text-gray-900">0.00 Cedis</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium text-gray-900">{membershipCard.activeSince}</span>
              </div>
            </div>
            <Button className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white py-6 text-base">
              Activated
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
  )
}

export default MembershipPage
