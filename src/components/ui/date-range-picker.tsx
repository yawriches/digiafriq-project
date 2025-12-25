"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface DateRange {
  startDate: Date | null
  endDate: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  placeholder?: string
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date range",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const getDisplayValue = () => {
    if (value.startDate && value.endDate) {
      return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
    } else if (value.startDate) {
      return formatDate(value.startDate)
    }
    return ''
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )

    if (selectingStart) {
      onChange({ startDate: selectedDate, endDate: null })
      setSelectingStart(false)
    } else {
      if (value.startDate && selectedDate < value.startDate) {
        // If end date is before start date, swap them
        onChange({ startDate: selectedDate, endDate: value.startDate })
      } else {
        onChange({ ...value, endDate: selectedDate })
      }
      setSelectingStart(true)
      setIsOpen(false)
    }
  }

  const isDateInRange = (day: number) => {
    if (!value.startDate || !value.endDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date >= value.startDate && date <= value.endDate
  }

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toDateString()
    return (
      (value.startDate && dateStr === value.startDate.toDateString()) ||
      (value.endDate && dateStr === value.endDate.toDateString())
    )
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })
  const year = currentMonth.getFullYear()

  const days = []
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>)
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const inRange = isDateInRange(day)
    const selected = isDateSelected(day)
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`
          p-2 text-sm rounded hover:bg-gray-100 transition-colors
          ${inRange ? 'bg-[#ed874a]/10' : ''}
          ${selected ? 'bg-[#ed874a] text-white hover:bg-[#ed874a]' : 'text-gray-700'}
        `}
      >
        {day}
      </button>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center border border-gray-300 rounded-lg px-4 py-2.5 cursor-pointer bg-white hover:border-gray-400 transition-colors shadow-sm"
      >
        <input
          type="text"
          value={getDisplayValue()}
          placeholder={placeholder}
          readOnly
          className="flex-1 outline-none cursor-pointer text-sm text-gray-700"
        />
        <Calendar className="w-4 h-4 text-gray-500 ml-2" />
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm font-medium text-gray-700">
              {monthName}, {year}
            </div>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
              <div key={day} className="text-xs font-medium text-[#ed874a] text-center p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>

          {/* View All Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onChange({ startDate: null, endDate: null })
                setSelectingStart(true)
              }}
              className="text-xs text-[#ed874a] hover:underline"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
