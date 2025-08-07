"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAvailableMonths } from "@/lib/trip-data"

interface MonthFilterProps {
  value: string
  onValueChange: (value: string) => void
}

export function MonthFilter({ value, onValueChange }: MonthFilterProps) {
  const [months, setMonths] = useState<Array<{value: string, label: string}>>([
    { value: 'all', label: 'All Months' }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMonths = async () => {
      try {
        const availableMonths = await getAvailableMonths()
        setMonths(availableMonths)
      } catch (error) {
        console.error('Error loading months:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMonths()
  }, [])

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="month-filter" className="text-sm font-medium">
        Filter by month:
      </label>
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger className="w-48" id="month-filter">
          <SelectValue placeholder={loading ? "Loading..." : "Select month"} />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}