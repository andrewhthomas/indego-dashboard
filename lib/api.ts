export interface BikeInfo {
  dockNumber: number
  isElectric: boolean
  isAvailable: boolean
  battery: number | null
}

export interface Station {
  id: string
  name: string
  lat: number
  lng: number
  bikesAvailable: number
  docksAvailable: number
  totalDocks: number
  classicBikesAvailable: number
  electricBikesAvailable: number
  smartBikesAvailable: number
  kioskStatus: string
  kioskPublicStatus: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZipCode: string
  bikes: BikeInfo[]
}

export interface StationFeature {
  geometry: {
    coordinates: [number, number]
    type: string
  }
  properties: {
    id: number
    name: string
    coordinates: [number, number]
    totalDocks: number
    docksAvailable: number
    bikesAvailable: number
    classicBikesAvailable: number
    smartBikesAvailable: number
    electricBikesAvailable: number
    rewardBikesAvailable: number
    rewardDocksAvailable: number
    kioskStatus: string
    kioskPublicStatus: string
    kioskConnectionStatus: string
    kioskType: number
    addressStreet: string
    addressCity: string
    addressState: string
    addressZipCode: string
    bikes: BikeInfo[]
    closeTime?: string
    eventEnd?: string
    eventStart?: string
    isEventBased?: boolean
    isVirtual?: boolean
    kioskId?: number
    notes?: string
    openTime?: string
    publicText?: string
    timeZone?: string
    trikesAvailable?: number
    latitude: number
    longitude: number
  }
  type: string
}

export interface StationStatus {
  features: StationFeature[]
  type: string
  crs?: {
    type: string
    properties: {
      name: string
    }
  }
}

export async function fetchStationStatus(): Promise<Station[]> {
  try {
    const response = await fetch('https://bts-status.bicycletransit.workers.dev/phl')
    if (!response.ok) {
      throw new Error('Failed to fetch station data')
    }
    
    const data: StationStatus = await response.json()
    
    return data.features.map(feature => ({
      id: feature.properties.id.toString(),
      name: feature.properties.name,
      lat: feature.properties.latitude,
      lng: feature.properties.longitude,
      bikesAvailable: feature.properties.bikesAvailable,
      docksAvailable: feature.properties.docksAvailable,
      totalDocks: feature.properties.totalDocks,
      classicBikesAvailable: feature.properties.classicBikesAvailable,
      electricBikesAvailable: feature.properties.electricBikesAvailable,
      smartBikesAvailable: feature.properties.smartBikesAvailable,
      kioskStatus: feature.properties.kioskStatus,
      kioskPublicStatus: feature.properties.kioskPublicStatus,
      addressStreet: feature.properties.addressStreet,
      addressCity: feature.properties.addressCity,
      addressState: feature.properties.addressState,
      addressZipCode: feature.properties.addressZipCode,
      bikes: feature.properties.bikes || [],
    }))
  } catch (error) {
    console.error('Error fetching station status:', error)
    return []
  }
}

export interface SystemStats {
  totalStations: number
  totalBikes: number
  totalDocks: number
  availableBikes: number
  availableDocks: number
  classicBikes: number
  electricBikes: number
  smartBikes: number
  activeStations: number
}

export async function fetchSystemStats(): Promise<SystemStats | null> {
  try {
    const stations = await fetchStationStatus()
    
    const stats = stations.reduce((acc, station) => ({
      totalStations: acc.totalStations + 1,
      totalBikes: acc.totalBikes + station.bikesAvailable,
      totalDocks: acc.totalDocks + station.totalDocks,
      availableBikes: acc.availableBikes + station.bikesAvailable,
      availableDocks: acc.availableDocks + station.docksAvailable,
      classicBikes: acc.classicBikes + station.classicBikesAvailable,
      electricBikes: acc.electricBikes + station.electricBikesAvailable,
      smartBikes: acc.smartBikes + station.smartBikesAvailable,
      activeStations: acc.activeStations + (station.kioskPublicStatus === 'Active' ? 1 : 0),
    }), {
      totalStations: 0,
      totalBikes: 0,
      totalDocks: 0,
      availableBikes: 0,
      availableDocks: 0,
      classicBikes: 0,
      electricBikes: 0,
      smartBikes: 0,
      activeStations: 0,
    })
    
    return stats
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return null
  }
}