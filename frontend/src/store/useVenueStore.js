import { create } from 'zustand'

export const useVenueStore = create((set) => ({
  venue: null,
  zones: [],
  pois: [],
  queues: [],
  densityData: {},
  selectedPoi: null,
  filterType: null,
  userZone: null,

  setVenue: (venue) => set({ venue }),
  setZones: (zones) => set({ zones }),
  setPois: (pois) => set({ pois }),
  setQueues: (queues) => set({ queues }),
  setSelectedPoi: (poi) => set({ selectedPoi: poi }),
  setFilterType: (type) => set({ filterType: type }),
  setUserZone: (zone) => set({ userZone: zone }),

  updateDensity: (zoneId, density) => set((state) => ({
    densityData: { ...state.densityData, [zoneId]: density }
  })),

  updateQueue: (queueData) => set((state) => ({
    queues: state.queues.map(q =>
      q.poi_id === queueData.poi_id ? { ...q, ...queueData } : q
    )
  })),

  updateZoneDensity: (snapshot) => set((state) => ({
    zones: state.zones.map(z =>
      z.id === snapshot.zone_id ? { ...z, density: snapshot } : z
    )
  }))
}))
