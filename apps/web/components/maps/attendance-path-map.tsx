/**
 * Attendance Path Map Component
 * Uses OpenStreetMap with Leaflet to display location path and check-in/out points
 */

'use client';

import { useEffect, useRef, useState } from 'react';

// Dynamically import Leaflet and its CSS to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importLeaflet = async () => {
  const L = await import('leaflet');

  // Import CSS with a workaround for TypeScript
  if (typeof window !== 'undefined') {
    await import('leaflet/dist/leaflet.css');
  }

  // Fix Leaflet's default icon issue with webpack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  return L;
};

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  batteryLevel?: number;
}

interface CheckInLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

interface AttendancePathMapProps {
  checkInLocation?: CheckInLocation;
  checkOutLocation?: CheckInLocation;
  locationPath?: LocationPoint[];
  className?: string;
  height?: string;
}

// Custom icons for check-in and check-out points
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createCustomIcon = (L: any, type: 'checkin' | 'checkout') => {
  const color = type === 'checkin' ? '#10b981' : '#ef4444';
  const symbol = type === 'checkin' ? '🟢' : '🔴';

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      ">
        ${symbol}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export function AttendancePathMap({
  checkInLocation,
  checkOutLocation,
  locationPath = [],
  className = '',
  height = '400px',
}: AttendancePathMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to reset map view to check-in location
  const resetMapToCheckIn = () => {
    if (mapInstanceRef.current && checkInLocation) {
      const lat = typeof checkInLocation.latitude === 'string'
        ? parseFloat(checkInLocation.latitude)
        : checkInLocation.latitude;
      const lng = typeof checkInLocation.longitude === 'string'
        ? parseFloat(checkInLocation.longitude)
        : checkInLocation.longitude;

      if (!isNaN(lat) && !isNaN(lng)) {
        mapInstanceRef.current.setView([lat, lng], 15);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadLeaflet = async () => {
      try {
        const leaflet = await importLeaflet();
        if (mounted) {
          setL(leaflet);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current || isLoading) return;

    try {
      // Initialize map with OpenStreetMap tiles
      const map = L.map(mapRef.current).setView([0, 0], 13);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => setIsMapReady(true), 0);
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, isLoading]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!mapInstanceRef.current || !isMapReady || !L) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.eachLayer((layer: any) => {
      // Check if it's a marker or polyline based on methods available
      if (layer.bindPopup !== undefined) {
        map.removeLayer(layer);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markers: any[] = [];
    const bounds = new L.LatLngBounds();

    // Add check-in marker (convert string coordinates to numbers if needed)
    if (checkInLocation) {
      const lat = typeof checkInLocation.latitude === 'string'
        ? parseFloat(checkInLocation.latitude)
        : checkInLocation.latitude;
      const lng = typeof checkInLocation.longitude === 'string'
        ? parseFloat(checkInLocation.longitude)
        : checkInLocation.longitude;

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const checkInMarker = L.marker(
          [lat, lng],
          { icon: createCustomIcon(L, 'checkin') }
        );

      checkInMarker.bindPopup(`
        <div class="text-sm">
          <strong>Check-in</strong><br>
          ${checkInLocation.address || 'Location recorded'}<br>
          <small>Accuracy: ${checkInLocation.accuracy ? `±${checkInLocation.accuracy}m` : 'N/A'}</small>
        </div>
      `);

      checkInMarker.addTo(map);
      markers.push(checkInMarker);
      bounds.extend([lat, lng]);
      }
    }

    // Add check-out marker (convert string coordinates to numbers if needed)
    if (checkOutLocation) {
      const lat = typeof checkOutLocation.latitude === 'string'
        ? parseFloat(checkOutLocation.latitude)
        : checkOutLocation.latitude;
      const lng = typeof checkOutLocation.longitude === 'string'
        ? parseFloat(checkOutLocation.longitude)
        : checkOutLocation.longitude;

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const checkOutMarker = L.marker(
          [lat, lng],
          { icon: createCustomIcon(L, 'checkout') }
        );

      checkOutMarker.bindPopup(`
        <div class="text-sm">
          <strong>Check-out</strong><br>
          ${checkOutLocation.address || 'Location recorded'}<br>
          <small>Accuracy: ${checkOutLocation.accuracy ? `±${checkOutLocation.accuracy}m` : 'N/A'}</small>
        </div>
      `);

      checkOutMarker.addTo(map);
      markers.push(checkOutMarker);
      bounds.extend([lat, lng]);
      }
    }

    // Add path polyline if we have path data
    if (locationPath.length > 1) {
      const pathCoordinates = locationPath.map(point => {
        const lat = typeof point.latitude === 'string'
          ? parseFloat(point.latitude)
          : point.latitude;
        const lng = typeof point.longitude === 'string'
          ? parseFloat(point.longitude)
          : point.longitude;

        return [lat, lng] as [number, number];
      }).filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng)); // Filter out invalid coordinates

      const polyline = L.polyline(pathCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
      });

      polyline.addTo(map);

      // Add battery level indicators for path points
      locationPath.forEach((point, index) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (point.batteryLevel !== undefined && index % 3 === 0) { // Show every 3rd point to avoid clutter
          const lat = typeof point.latitude === 'string'
            ? parseFloat(point.latitude)
            : point.latitude;
          const lng = typeof point.longitude === 'string'
            ? parseFloat(point.longitude)
            : point.longitude;

          if (!isNaN(lat) && !isNaN(lng)) {
            const batteryIcon = L.divIcon({
              html: `
                <div style="
                  background-color: ${point.batteryLevel > 50 ? '#10b981' : point.batteryLevel > 20 ? '#f59e0b' : '#ef4444'};
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  border: 1px solid white;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                " title="Battery: ${point.batteryLevel}%"></div>
              `,
              className: 'battery-indicator',
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            });

            const batteryMarker = L.marker([lat, lng], { icon: batteryIcon });
            batteryMarker.addTo(map);
            batteryMarker.bindPopup(`
              <div class="text-xs">
                <strong>Path Point ${index + 1}</strong><br>
                Time: ${new Date(point.timestamp).toLocaleTimeString()}<br>
                Battery: ${point.batteryLevel}%<br>
                Accuracy: ${point.accuracy ? `±${point.accuracy}m` : 'N/A'}
              </div>
            `);
          }

          bounds.extend([lat, lng]);
        }
      });
    }

    // Fit map to show all markers and path
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (checkInLocation) {
      // If only check-in is available, center on it (with coordinate conversion)
      const lat = typeof checkInLocation.latitude === 'string'
        ? parseFloat(checkInLocation.latitude)
        : checkInLocation.latitude;
      const lng = typeof checkInLocation.longitude === 'string'
        ? parseFloat(checkInLocation.longitude)
        : checkInLocation.longitude;

      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 15);
      }
    }

  }, [isMapReady, checkInLocation, checkOutLocation, locationPath, L]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      />
      {(isLoading || !isMapReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">
            {isLoading ? 'Loading map library...' : 'Initializing map...'}
          </div>
        </div>
      )}
      {/* Reset button */}
      {isMapReady && checkInLocation && (
        <button
          onClick={resetMapToCheckIn}
          className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
          title="Reset to check-in location"
        >
          📍 Reset
        </button>
      )}
    </div>
  );
}