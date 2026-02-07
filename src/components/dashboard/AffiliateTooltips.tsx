'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface TooltipConfig {
  id: string
  targetSelector: string
  message: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const TOOLTIPS: TooltipConfig[] = [
  {
    id: 'affiliate-link',
    targetSelector: '[data-tooltip="affiliate-link"]',
    message: 'This is what you share to earn',
    position: 'bottom',
  },
  {
    id: 'earnings-tab',
    targetSelector: '[data-tooltip="earnings-tab"]',
    message: 'Your earnings appear here',
    position: 'bottom',
  },
  {
    id: 'training-section',
    targetSelector: '[data-tooltip="training-section"]',
    message: "Start here if you're new",
    position: 'right',
  },
]

const STORAGE_KEY = 'affiliate_tooltips_dismissed'

export default function AffiliateTooltips() {
  const [dismissedTooltips, setDismissedTooltips] = useState<string[]>([])
  const [activeTooltip, setActiveTooltip] = useState<TooltipConfig | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    // Load dismissed tooltips from storage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setDismissedTooltips(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse dismissed tooltips')
      }
    }
  }, [])

  useEffect(() => {
    // Find the first non-dismissed tooltip that has a visible target
    const findNextTooltip = () => {
      for (const tooltip of TOOLTIPS) {
        if (dismissedTooltips.includes(tooltip.id)) continue
        
        const target = document.querySelector(tooltip.targetSelector)
        if (target) {
          const rect = target.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            setActiveTooltip(tooltip)
            
            // Calculate position based on tooltip position preference
            let top = 0
            let left = 0
            
            switch (tooltip.position) {
              case 'bottom':
                top = rect.bottom + 10
                left = rect.left + rect.width / 2
                break
              case 'top':
                top = rect.top - 10
                left = rect.left + rect.width / 2
                break
              case 'left':
                top = rect.top + rect.height / 2
                left = rect.left - 10
                break
              case 'right':
                top = rect.top + rect.height / 2
                left = rect.right + 10
                break
            }
            
            setTooltipPosition({ top, left })
            return
          }
        }
      }
      setActiveTooltip(null)
    }

    // Initial check
    const timeout = setTimeout(findNextTooltip, 500)
    
    // Re-check on scroll or resize
    window.addEventListener('scroll', findNextTooltip)
    window.addEventListener('resize', findNextTooltip)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('scroll', findNextTooltip)
      window.removeEventListener('resize', findNextTooltip)
    }
  }, [dismissedTooltips])

  const handleDismiss = (tooltipId: string) => {
    const updated = [...dismissedTooltips, tooltipId]
    setDismissedTooltips(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setActiveTooltip(null)
  }

  if (!activeTooltip) return null

  return (
    <AnimatePresence>
      <motion.div
        key={activeTooltip.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[100] pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: activeTooltip.position === 'bottom' || activeTooltip.position === 'top'
            ? 'translateX(-50%)'
            : activeTooltip.position === 'left'
            ? 'translateX(-100%) translateY(-50%)'
            : 'translateY(-50%)',
        }}
      >
        <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl border border-gray-700 flex items-center gap-3 max-w-xs">
          <p className="text-sm font-medium">{activeTooltip.message}</p>
          <button
            onClick={() => handleDismiss(activeTooltip.id)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-gray-900 border-gray-700 transform rotate-45 ${
            activeTooltip.position === 'bottom'
              ? '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t'
              : activeTooltip.position === 'top'
              ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b'
              : activeTooltip.position === 'left'
              ? '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t'
              : '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b'
          }`}
        />
      </motion.div>
    </AnimatePresence>
  )
}
