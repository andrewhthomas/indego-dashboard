"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { TripRecord } from "@/lib/trip-data"

interface TripSearchProps {
  trips: TripRecord[]
  onFilteredTrips: (filteredTrips: TripRecord[]) => void
}

export function TripSearch({ trips, onFilteredTrips }: TripSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [bikeTypeFilter, setBikeTypeFilter] = useState<string>("all")
  const [passholderFilter, setPassholderFilter] = useState<string>("all")

  const handleFilter = () => {
    let filtered = trips

    // Search by station names or bike ID
    if (searchTerm) {
      filtered = filtered.filter(trip => 
        trip.start_station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.end_station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.bike_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by bike type
    if (bikeTypeFilter !== "all") {
      filtered = filtered.filter(trip => trip.bike_type === bikeTypeFilter)
    }

    // Filter by passholder type
    if (passholderFilter !== "all") {
      filtered = filtered.filter(trip => trip.passholder_type === passholderFilter)
    }

    onFilteredTrips(filtered)
  }

  const handleReset = () => {
    setSearchTerm("")
    setBikeTypeFilter("all")
    setPassholderFilter("all")
    onFilteredTrips(trips)
  }

  // Get unique passholder types
  const passholderTypes = [...new Set(trips.map(trip => trip.passholder_type))]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Trip Search & Filter
        </CardTitle>
        <CardDescription>
          Search and filter through {trips.length.toLocaleString()} trip records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by station or bike ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={bikeTypeFilter} onValueChange={setBikeTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Bike Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bikes</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
          <Select value={passholderFilter} onValueChange={setPassholderFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Membership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {passholderTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}