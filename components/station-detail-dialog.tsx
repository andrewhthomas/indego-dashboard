"use client"

import { Station, BikeInfo } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bike, Zap, Brain, Battery, MapPin, Clock } from "lucide-react"

interface StationDetailDialogProps {
  station: Station | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StationDetailDialog({ station, open, onOpenChange }: StationDetailDialogProps) {
  if (!station) return null

  const getBikeIcon = (bike: BikeInfo) => {
    if (bike.isElectric) return Zap
    // You might need to add logic here to determine if it's a smart bike
    return Bike
  }

  const getBikeTypeLabel = (bike: BikeInfo) => {
    if (bike.isElectric) return "Electric"
    return "Classic"
  }

  const availableBikes = station.bikes.filter(b => b.isAvailable)
  const unavailableBikes = station.bikes.filter(b => !b.isAvailable)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{station.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {station.addressStreet}, {station.addressCity}, {station.addressState} {station.addressZipCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={station.kioskPublicStatus === "Active" ? "default" : "secondary"}>
              {station.kioskPublicStatus}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Station ID: {station.id}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Bike className="h-5 w-5 mx-auto mb-1" />
              <div className="text-2xl font-bold">{station.classicBikesAvailable}</div>
              <div className="text-xs text-muted-foreground">Classic</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
              <div className="text-2xl font-bold">{station.electricBikesAvailable}</div>
              <div className="text-xs text-muted-foreground">Electric</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Brain className="h-5 w-5 mx-auto mb-1 text-indigo-600" />
              <div className="text-2xl font-bold">{station.smartBikesAvailable}</div>
              <div className="text-xs text-muted-foreground">Smart</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <div className="text-2xl font-bold">{station.docksAvailable}</div>
              <div className="text-xs text-muted-foreground">Docks</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Available Bikes ({availableBikes.length})</h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {availableBikes.length === 0 ? (
                <p className="text-center text-muted-foreground">No bikes available</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableBikes.map((bike) => {
                    const BikeIcon = getBikeIcon(bike)
                    return (
                      <div
                        key={bike.dockNumber}
                        className="flex flex-col items-center p-2 border rounded-lg"
                      >
                        <BikeIcon className={`h-5 w-5 mb-1 ${bike.isElectric ? 'text-yellow-600' : ''}`} />
                        <span className="text-xs font-medium">Dock {bike.dockNumber}</span>
                        <span className="text-xs text-muted-foreground">{getBikeTypeLabel(bike)}</span>
                        {bike.isElectric && bike.battery !== null && (
                          <div className="flex items-center gap-1 mt-1">
                            <Battery className="h-3 w-3" />
                            <span className="text-xs">{bike.battery}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-muted-foreground">Occupied Docks ({unavailableBikes.length})</h3>
            <div className="text-sm text-muted-foreground">
              {unavailableBikes.length} docks are currently occupied
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}