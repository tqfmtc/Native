export interface LocationCoords {
  lat: number;
  lng: number;
}

export const calculateDistance = (loc1: LocationCoords, loc2: LocationCoords): number => {
  // Haversine formula to calculate distance between two points
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Convert to meters
};

export const isWithinRadius = (userLocation: LocationCoords, centerLocation: LocationCoords, radiusInMeters: number): boolean => {
  const distance = calculateDistance(userLocation, centerLocation);
  return distance <= radiusInMeters;
};