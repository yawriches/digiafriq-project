'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useCurrency, CURRENCY_RATES, Currency } from '@/contexts/CurrencyContext'

export function CurrencySwitcher() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element
    if (!target.closest('.currency-switcher')) {
      setDropdownOpen(false)
    }
  }

  // Add click outside listener
  if (typeof window !== 'undefined') {
    document.addEventListener('mousedown', handleClickOutside)
  }

  return (
    <div className="relative currency-switcher">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">{CURRENCY_RATES[selectedCurrency].symbol}</span>
        <span className="text-gray-600">{selectedCurrency}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {Object.entries(CURRENCY_RATES).map(([code, currency]) => (
              <button
                key={code}
                onClick={() => {
                  setSelectedCurrency(code as Currency)
                  setDropdownOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  selectedCurrency === code ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{currency.symbol} {code}</span>
                  {selectedCurrency === code && (
                    <span className="text-orange-600">✓</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{currency.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
