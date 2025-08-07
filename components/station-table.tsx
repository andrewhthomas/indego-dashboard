"use client"

import { useState, useMemo } from "react"
import { Station } from "@/lib/api"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Bike, Zap, Brain } from "lucide-react"

interface StationTableProps {
  stations: Station[]
  onStationClick?: (station: Station) => void
}

export function StationTable({ stations, onStationClick }: StationTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStations = useMemo(() => {
    return stations.filter(
      (station) =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.addressStreet.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [stations, searchTerm])

  const getStatusBadge = (status: string) => {
    const variant = status === "Active" ? "default" : "secondary"
    return <Badge variant={variant}>{status}</Badge>
  }

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total
    if (ratio > 0.5) return "text-green-600"
    if (ratio > 0.2) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stations by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Station</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Bike className="h-4 w-4" />
                  <span>Classic</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>Electric</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Brain className="h-4 w-4" />
                  <span>Smart</span>
                </div>
              </TableHead>
              <TableHead className="text-center">Docks</TableHead>
              <TableHead>Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No stations found
                </TableCell>
              </TableRow>
            ) : (
              filteredStations.map((station) => (
                <TableRow 
                  key={station.id} 
                  className={onStationClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onStationClick?.(station)}
                >
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell>{getStatusBadge(station.kioskPublicStatus)}</TableCell>
                  <TableCell className="text-center">
                    <span className={getAvailabilityColor(station.classicBikesAvailable, station.totalDocks)}>
                      {station.classicBikesAvailable}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getAvailabilityColor(station.electricBikesAvailable, station.totalDocks)}>
                      {station.electricBikesAvailable}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getAvailabilityColor(station.smartBikesAvailable, station.totalDocks)}>
                      {station.smartBikesAvailable}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getAvailabilityColor(station.docksAvailable, station.totalDocks)}>
                      {station.docksAvailable}/{station.totalDocks}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {station.addressStreet}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredStations.length} of {stations.length} stations
      </div>
    </div>
  )
}