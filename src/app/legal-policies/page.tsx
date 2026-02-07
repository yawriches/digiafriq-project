'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Shield, FileText, AlertTriangle, Brain } from 'lucide-react'

const LegalPoliciesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/digiafriqlogo.png"
              alt="DigiAfriq Logo"
              width={100}
              height={100}
              className="object-contain"
            />
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-[#ed874a] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Terms of Service */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#ed874a]/10 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#ed874a]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">DIGIAFRIQ – TERMS OF SERVICE</h1>
          </div>
          
          <p className="text-gray-600 mb-8">Effective Date: February 4, 2026</p>

          <div className="space-y-8 text-gray-700">
            {/* Section 1 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. About Digiafriq</h2>
              <p className="mb-3">
                Digiafriq is an AI skills learning and monetization platform designed to help Africans earn by learning artificial intelligence (AI) skills and monetizing them. Digiafriq is powered by Noxgrid Prestige Enterprise.
              </p>
              <p>
                The platform provides structured training, resources, and opportunities that enable users to offer AI-related services and earn through approved affiliate programs.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Digiafriq is open to users across African countries.</li>
                <li>Users must be 15 years or older. Users under 18 years old may use Digiafriq under parental or guardian guidance. By using the platform, such users confirm that consent has been obtained from a parent or legal guardian, especially for financial and contractual activities.</li>
                <li>By creating an account, you confirm that you meet these requirements.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>An account is required to access Digiafriq.</li>
                <li>One person is allowed only one account.</li>
                <li>Creating or operating multiple accounts is strictly prohibited and may result in suspension or permanent termination.</li>
                <li>Users are responsible for keeping their login details secure.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Nature of Services</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Digiafriq currently provides training only, not AI tools.</li>
                <li>Training may include courses, tutorials, guides, and learning materials related to AI skills and monetization.</li>
                <li>Digiafriq may modify, update, remove, or add programs and content at any time.</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payments & Fees</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payments are processed through Paystack.</li>
                <li>Third-party payment providers may charge transaction or platform fees, which Digiafriq is not responsible for.</li>
                <li>Digiafriq may introduce additional payment methods in the future.</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. No Refund Policy</h2>
              <p>
                Due to the nature of digital products and online training, Digiafriq does not offer refunds under any circumstances once payment has been made.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Earnings & Monetization Disclaimer</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Digiafriq does not guarantee income or profits.</li>
                <li>Earnings depend entirely on the user's effort, skill application, consistency, and market conditions.</li>
                <li>Users earn by:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Offering AI services using skills learned on Digiafriq</li>
                    <li>Participating in Digiafriq's approved affiliate programs</li>
                  </ul>
                </li>
                <li>Any income examples shared are illustrative only and not promises of results.</li>
              </ul>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Affiliate Program Rules</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users may sell Digiafriq programs only through official affiliate links.</li>
                <li>Unauthorized selling, reselling, or misrepresentation of Digiafriq programs is prohibited.</li>
                <li>Illegal or misleading representation of Digiafriq may result in immediate account termination.</li>
              </ul>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Withdrawals</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Withdrawal requests are processed on Sundays.</li>
                <li>Disbursement occurs within 72 hours after processing.</li>
                <li>Digiafriq reserves the right to delay or withhold payments in cases of suspected fraud or policy violations.</li>
              </ul>
            </div>

            {/* Section 10 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All content on Digiafriq is owned by Digiafriq / Noxgrid Prestige Enterprise.</li>
                <li>Users are not allowed to download, copy, redistribute, or resell Digiafriq content.</li>
                <li>Violation of this rule may lead to:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Account deletion</li>
                    <li>Forfeiture of earnings</li>
                    <li>Legal action where applicable</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Section 11 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. AI Usage Responsibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users are fully responsible for how they use AI outputs learned through Digiafriq.</li>
                <li>Digiafriq is not liable for the misuse of AI-generated content.</li>
                <li>Prohibited AI Uses include:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Scams or deceptive advertisements</li>
                    <li>Fake testimonials or false claims</li>
                    <li>Impersonation of individuals or businesses</li>
                    <li>Fraudulent documents</li>
                    <li>Illegal misrepresentation of Digiafriq</li>
                    <li>Harmful or unethical AI practices</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Section 12 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Suspension & Termination</h2>
              <p className="mb-3">Digiafriq reserves the right to suspend or permanently terminate accounts without prior notice if users:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Engage in fraud or deceptive practices</li>
                <li>Operate multiple accounts</li>
                <li>Pirate or redistribute content</li>
                <li>Misuse affiliate systems</li>
                <li>Misrepresent Digiafriq</li>
                <li>Violate any platform rules</li>
              </ul>
              <p className="mt-3">In such cases, earnings may be forfeited.</p>
            </div>

            {/* Section 13 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Communication</h2>
              <p className="mb-3">Official communication from Digiafriq will be done through:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email</li>
                <li>In-platform notifications</li>
              </ul>
              <p className="mt-3">Users are responsible for checking these channels.</p>
            </div>

            {/* Section 14 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Changes to Terms</h2>
              <p>
                Digiafriq may update these Terms of Service with or without prior notice. Continued use of the platform constitutes acceptance of updated terms.
              </p>
            </div>

            {/* Section 15 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the Republic of Ghana.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">DIGIAFRIQ – PRIVACY POLICY (SUMMARY)</h2>
          </div>
          
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li>Digiafriq collects basic user information for account management and payments.</li>
            <li>User data is not sold or shared with unauthorized third parties.</li>
            <li>Payment data is handled securely through Paystack.</li>
            <li>Digiafriq uses reasonable measures to protect user data but cannot guarantee absolute security.</li>
          </ul>
        </section>

        {/* Earnings Disclaimer */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">EARNINGS DISCLAIMER</h2>
          </div>
          
          <p className="text-gray-700">
            Digiafriq is an educational and monetization platform. We do not promise or guarantee any level of income. Success depends on individual effort, skills, consistency, and market demand.
          </p>
        </section>

        {/* AI Usage Policy */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AI USAGE POLICY</h2>
          </div>
          
          <p className="text-gray-700">
            Digiafriq provides AI education only. Users are fully responsible for how they apply AI skills. Any illegal, unethical, or deceptive use of AI learned on this platform is strictly prohibited.
          </p>
        </section>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-[#ed874a] hover:bg-[#d76f32] text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} DigiAfriq. Powered by Noxgrid Prestige Enterprise. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LegalPoliciesPage
