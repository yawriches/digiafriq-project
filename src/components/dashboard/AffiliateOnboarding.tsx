'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Sparkles, Link2, DollarSign, BarChart3, Globe, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/supabase/auth'

interface OnboardingData {
  user_motivation: string | null
  experience_level: string | null
  promotion_channels: string[]
}

interface AffiliateOnboardingProps {
  onComplete: () => void
}

const STORAGE_KEY = 'affiliate_onboarding_step'
const DATA_STORAGE_KEY = 'affiliate_onboarding_data'

// Social Media SVG Icons
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const XTwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const motivationOptions = [
  { value: 'extra_income', label: 'To earn extra income', icon: '💰' },
  { value: 'online_business', label: 'To build an online business', icon: '🚀' },
  { value: 'learn_ai', label: 'To learn valuable AI skills', icon: '🧠' },
  { value: 'promote_audience', label: 'To promote to my audience', icon: '📱' },
  { value: 'exploring', label: 'Just exploring for now', icon: '🤔' },
]

const experienceOptions = [
  { value: 'beginner', label: 'Complete beginner', icon: '🌱' },
  { value: 'tried_before', label: "I've tried before", icon: '🙂' },
  { value: 'already_earning', label: "I'm already earning online", icon: '💼' },
]

type ChannelOption = {
  value: string
  label: string
  icon: React.ReactNode
}

const channelOptions: ChannelOption[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon /> },
  { value: 'tiktok', label: 'TikTok', icon: <TikTokIcon /> },
  { value: 'facebook', label: 'Facebook', icon: <FacebookIcon /> },
  { value: 'twitter', label: 'X (Twitter)', icon: <XTwitterIcon /> },
  { value: 'website', label: 'Website / Blog', icon: <Globe className="w-6 h-6" /> },
  { value: 'not_sure', label: 'Not sure yet', icon: <HelpCircle className="w-6 h-6" /> },
]

export default function AffiliateOnboarding({ onComplete }: AffiliateOnboardingProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    user_motivation: null,
    experience_level: null,
    promotion_channels: [],
  })

  // Load saved progress on mount
  useEffect(() => {
    const savedStep = localStorage.getItem(STORAGE_KEY)
    const savedData = localStorage.getItem(DATA_STORAGE_KEY)
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10))
    }
    if (savedData) {
      try {
        setOnboardingData(JSON.parse(savedData))
      } catch (e) {
        console.error('Failed to parse saved onboarding data')
      }
    }
  }, [])

  // Save progress on step change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentStep.toString())
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(onboardingData))
  }, [currentStep, onboardingData])

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const handleSelectMotivation = (value: string) => {
    setOnboardingData(prev => ({ ...prev, user_motivation: value }))
  }

  const handleSelectExperience = (value: string) => {
    setOnboardingData(prev => ({ ...prev, experience_level: value }))
  }

  const handleToggleChannel = (value: string) => {
    setOnboardingData(prev => {
      const channels = prev.promotion_channels.includes(value)
        ? prev.promotion_channels.filter(c => c !== value)
        : [...prev.promotion_channels, value]
      return { ...prev, promotion_channels: channels }
    })
  }

  const handleComplete = async () => {
    if (!user) return
    
    setIsSubmitting(true)
    try {
      // Save onboarding data to profile
      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          affiliate_onboarding_completed: true,
          affiliate_user_motivation: onboardingData.user_motivation,
          affiliate_experience_level: onboardingData.experience_level,
          affiliate_promotion_channels: onboardingData.promotion_channels,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Failed to save onboarding data:', error)
      }

      // Clear local storage
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(DATA_STORAGE_KEY)

      // Trigger completion
      onComplete()
    } catch (err) {
      console.error('Error completing onboarding:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true
      case 1:
        return onboardingData.user_motivation !== null
      case 2:
        return onboardingData.experience_level !== null
      case 3:
        return onboardingData.promotion_channels.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ed874a]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-lg mx-4">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'bg-[#ed874a] w-8 shadow-lg shadow-orange-500/50'
                  : step < currentStep
                  ? 'bg-[#ed874a]/60'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content Container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl min-h-[480px] flex flex-col">
          <AnimatePresence mode="wait" custom={1}>
            {/* Screen 1: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#ed874a] to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Welcome to Your Affiliate Dashboard 🎉
                </h1>
                <p className="text-gray-300 text-lg mb-8 max-w-md">
                  You now have access to tools that help you earn with AI — even as a beginner.
                </p>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Let's set this up
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Screen 2: Motivation */}
            {currentStep === 1 && (
              <motion.div
                key="motivation"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  What's your main reason for joining?
                </h2>
                <p className="text-gray-400 text-center mb-6">Select one option</p>
                
                <div className="space-y-3 flex-1">
                  {motivationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectMotivation(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        onboardingData.user_motivation === option.value
                          ? 'border-[#ed874a] bg-[#ed874a]/10 shadow-lg shadow-orange-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-white font-medium">{option.label}</span>
                      {onboardingData.user_motivation === option.value && (
                        <Check className="w-5 h-5 text-[#ed874a] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white py-6 text-lg font-semibold rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Screen 3: Experience */}
            {currentStep === 2 && (
              <motion.div
                key="experience"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  How experienced are you with affiliate marketing?
                </h2>
                <p className="text-gray-400 text-center mb-6">Select your experience level</p>
                
                <div className="space-y-3 flex-1">
                  {experienceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelectExperience(option.value)}
                      className={`w-full p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        onboardingData.experience_level === option.value
                          ? 'border-[#ed874a] bg-[#ed874a]/10 shadow-lg shadow-orange-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-white font-medium">{option.label}</span>
                      {onboardingData.experience_level === option.value && (
                        <Check className="w-5 h-5 text-[#ed874a] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white py-6 text-lg font-semibold rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Screen 4: Promotion Channels */}
            {currentStep === 3 && (
              <motion.div
                key="channels"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-1 flex flex-col"
              >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Where do you plan to share your affiliate link?
                </h2>
                <p className="text-gray-400 text-center mb-6">Select all that apply</p>
                
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {channelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleToggleChannel(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                        onboardingData.promotion_channels.includes(option.value)
                          ? 'border-[#ed874a] bg-[#ed874a]/10 shadow-lg shadow-orange-500/20 text-[#ed874a]'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 text-white'
                      }`}
                    >
                      <span className="flex items-center justify-center">{option.icon}</span>
                      <span className="text-white text-sm font-medium text-center">{option.label}</span>
                      {onboardingData.promotion_channels.includes(option.value) && (
                        <Check className="w-4 h-4 text-[#ed874a]" />
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white py-6 text-lg font-semibold rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Screen 5: Completion */}
            {currentStep === 4 && (
              <motion.div
                key="complete"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  You're All Set 🚀
                </h1>
                <p className="text-gray-300 text-lg mb-8 max-w-md">
                  Your affiliate link is ready. Share it, invite people, and earn when they take action.
                </p>

                {/* Highlight Cards */}
                <div className="grid grid-cols-3 gap-4 w-full mb-8">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Link2 className="w-6 h-6 text-[#ed874a] mx-auto mb-2" />
                    <p className="text-white text-xs font-medium">Your Affiliate Link</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <DollarSign className="w-6 h-6 text-[#ed874a] mx-auto mb-2" />
                    <p className="text-white text-xs font-medium">Earn Per Referral</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <BarChart3 className="w-6 h-6 text-[#ed874a] mx-auto mb-2" />
                    <p className="text-white text-xs font-medium">Track Real-time</p>
                  </div>
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Go to My Dashboard'}
                  {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
