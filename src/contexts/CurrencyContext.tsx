'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

// Currency types and rates
type Currency = 'USD' | 'GHS' | 'NGN' | 'KES' | 'ZAR' | 'XOF' | 'XAF'

const CURRENCY_RATES = {
  USD: { rate: 1, symbol: '$', name: 'US Dollar' },
  GHS: { rate: 10.0, symbol: '₵', name: 'Ghanaian Cedi' },
  NGN: { rate: 888.89, symbol: '₦', name: 'Nigerian Naira' },
  KES: { rate: 129.44, symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { rate: 17.22, symbol: 'R', name: 'South African Rand' },
  XOF: { rate: 561.11, symbol: 'CFA', name: 'West African CFA Franc' },
  XAF: { rate: 561.11, symbol: 'XAF', name: 'Central African CFA Franc' },
} as const

interface CurrencyContextType {
  selectedCurrency: Currency
  setSelectedCurrency: (currency: Currency) => void
  convertAmount: (usdAmount: number) => number
  formatAmount: (usdAmount: number) => string
  formatAmountWithCurrency: (amount: number, sourceCurrency: string) => string
  currencyLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Country to currency mapping
const getCountryCurrency = (country: string): Currency => {
  const countryLower = country.toLowerCase().trim()
  
  const countryCurrencyMap: Record<string, Currency> = {
    'ghana': 'GHS',
    'kenya': 'KES',
    'nigeria': 'NGN',
    'south africa': 'ZAR',
    'united states': 'USD',
    'usa': 'USD',
    'america': 'USD',
    'benin': 'XOF',
    'burkina faso': 'XOF',
    'côte d\'ivoire': 'XOF',
    'ivory coast': 'XOF',
    'guinea-bissau': 'XOF',
    'mali': 'XOF',
    'niger': 'XOF',
    'senegal': 'XOF',
    'togo': 'XOF',
    'cameroon': 'XAF',
    'central african republic': 'XAF',
    'chad': 'XAF',
    'republic of the congo': 'XAF',
    'congo': 'XAF',
    'equatorial guinea': 'XAF',
    'gabon': 'XAF',
  }
  
  return countryCurrencyMap[countryLower] || 'USD'
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>('USD')
  const [currencyLoading, setCurrencyLoading] = useState(true)

  // Convert amount from USD to selected currency
  const convertAmount = (usdAmount: number): number => {
    if (!selectedCurrency || selectedCurrency === 'USD') return usdAmount
    return Math.round(usdAmount * CURRENCY_RATES[selectedCurrency].rate)
  }

  // Format amount with currency symbol (assumes USD input)
  const formatAmount = (usdAmount: number): string => {
    const convertedAmount = convertAmount(usdAmount)
    const symbol = CURRENCY_RATES[selectedCurrency].symbol
    
    // Format with proper spacing for different currencies
    if (selectedCurrency === 'NGN' || selectedCurrency === 'XOF' || selectedCurrency === 'XAF') {
      return `${symbol}${convertedAmount.toLocaleString()}`
    } else if (selectedCurrency === 'GHS') {
      return `${symbol}${convertedAmount.toLocaleString()}`
    } else {
      return `${symbol}${convertedAmount.toLocaleString()}`
    }
  }

  // Format amount with source currency conversion
  const formatAmountWithCurrency = (amount: number, sourceCurrency: string): string => {
    const sourceKey = sourceCurrency.toUpperCase() as Currency
    
    // If source currency is the same as selected currency, no conversion needed
    if (sourceKey === selectedCurrency) {
      const symbol = CURRENCY_RATES[selectedCurrency].symbol
      return `${symbol}${amount.toLocaleString()}`
    }
    
    // Convert from source currency to USD first, then to selected currency
    let usdAmount: number
    if (sourceKey in CURRENCY_RATES) {
      usdAmount = amount / CURRENCY_RATES[sourceKey].rate
    } else {
      // If source currency not recognized, assume it's USD
      usdAmount = amount
    }
    
    // Then convert USD to selected currency
    return formatAmount(usdAmount)
  }

  // Set currency and persist to localStorage
  const setSelectedCurrency = (currency: Currency) => {
    setSelectedCurrencyState(currency)
    localStorage.setItem('selectedCurrency', currency)
  }

  // Initialize currency from user profile or localStorage
  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // First check localStorage for previously selected currency
        const storedCurrency = localStorage.getItem('selectedCurrency') as Currency
        if (storedCurrency && Object.keys(CURRENCY_RATES).includes(storedCurrency)) {
          setSelectedCurrencyState(storedCurrency)
          setCurrencyLoading(false)
          return
        }

        // If no stored currency, get from user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('country')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            // Type assertion to satisfy TypeScript
            const profileData = profile as { country?: string }
            if (profileData.country) {
              const currencyFromCountry = getCountryCurrency(profileData.country)
              setSelectedCurrencyState(currencyFromCountry)
            }
          }
        }
      } catch (error) {
        console.error('Error initializing currency:', error)
      } finally {
        setCurrencyLoading(false)
      }
    }

    initializeCurrency()
  }, [])

  const value: CurrencyContextType = {
    selectedCurrency,
    setSelectedCurrency,
    convertAmount,
    formatAmount,
    formatAmountWithCurrency,
    currencyLoading,
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

export { CURRENCY_RATES }
export type { Currency, CurrencyContextType }
