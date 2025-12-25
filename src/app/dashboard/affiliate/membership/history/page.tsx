"use client"
import React from 'react'
import { 
  Calendar, 
  Award,
  CheckCircle,
  Download,
  Eye,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const MembershipHistoryPage = () => {
  const membershipHistory = [
    {
      date: "2024-09-01",
      plan: "Basic Affiliate",
      action: "Initial Signup",
      amount: "70.00 Cedis",
      status: "Active",
      statusColor: "text-green-600 bg-green-100",
      paymentMethod: "Mobile Money",
      reference: "MP001234",
      benefits: "10% commission, Basic materials"
    }
  ]

  const planBenefits = {
    "Basic Affiliate": [
      "10% commission on all sales",
      "Basic marketing materials",
      "Email support",
      "Monthly payout",
      "Basic analytics dashboard"
    ]
  }

  const currentPlanStats = {
    planName: "Basic Affiliate",
    activeSince: "September 1, 2024",
    totalSpent: "70.00 Cedis",
    commissionRate: "10%",
    totalEarnings: "58.00 USD",
    totalReferrals: 4
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-800 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Current Plan Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Plan:</span>
                <span className="font-semibold text-green-800">{currentPlanStats.planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Active Since:</span>
                <span className="font-medium text-green-700">{currentPlanStats.activeSince}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Commission Rate:</span>
                <span className="font-semibold text-green-800">{currentPlanStats.commissionRate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Total Spent:</span>
                <span className="font-medium text-green-700">{currentPlanStats.totalSpent}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Earnings:</span>
                <span className="font-semibold text-gray-900">{currentPlanStats.totalEarnings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Referrals:</span>
                <span className="font-semibold text-gray-900">{currentPlanStats.totalReferrals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ROI:</span>
                <span className="font-semibold text-green-600">+183%</span>
              </div>
              <div className="pt-3 border-t">
                <Button className="w-full bg-[#ed874a] hover:bg-[#d76f32]">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Plan Benefits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Current Plan Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planBenefits["Basic Affiliate"].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Membership History Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Membership History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Payment Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {membershipHistory.map((record, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{record.date}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.plan}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{record.action}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.amount}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{record.paymentMethod}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">{record.reference}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.statusColor}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {membershipHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No membership history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recommended Upgrades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
              <div className="flex items-center space-x-3 mb-3">
                <Star className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Pro Affiliate</h3>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Increase your commission to 15% and get weekly payouts
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-purple-800">150 Cedis</span>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Upgrade Now
                </Button>
              </div>
            </div>

            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-center space-x-3 mb-3">
                <Award className="w-6 h-6 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Elite Affiliate</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Maximum 20% commission with daily payouts and premium tools
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-yellow-800">300 Cedis</span>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MembershipHistoryPage
