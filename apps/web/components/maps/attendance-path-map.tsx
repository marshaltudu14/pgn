/**
 * Simple Attendance Path Map Component
 * Uses Leaflet with a straightforward implementation
 */

'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

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
  onResetMap?: () => void;
}


// Define ref interface
export interface AttendancePathMapRef {
  resetMap: () => void;
}

const AttendancePathMap = forwardRef<AttendancePathMapRef, AttendancePathMapProps>(({
  checkInLocation,
  checkOutLocation,
  locationPath = [],
  className = '',
  height = '400px',
  onResetMap,
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Function to reset map to check-in location
  const resetMapToCheckIn = useCallback(() => {
    if (mapInstanceRef.current && checkInLocation && checkInLocation.latitude && checkInLocation.longitude) {
      const lat = Number(checkInLocation.latitude);
      const lng = Number(checkInLocation.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        mapInstanceRef.current.setView([lat, lng], 15);
      }
    }

    // Also call external reset handler if provided
    if (onResetMap) {
      onResetMap();
    }
  }, [checkInLocation, onResetMap]);

  // Function to add markers and path to the map
  const addMarkersAndPath = useCallback((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map: any) => {
    if (!map || !L) return;

    // Clear existing markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds();

    // Add check-in marker
    if (checkInLocation && checkInLocation.latitude && checkInLocation.longitude) {
      const checkInMarker = L.marker([
        Number(checkInLocation.latitude),
        Number(checkInLocation.longitude)
      ], {
        icon: L.divIcon({
          html: '<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">🟢</div>',
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      });

      checkInMarker.bindPopup(`
        <div style="font-size: 14px;">
          <strong>Check-in</strong><br>
          ${checkInLocation.address || 'Location recorded'}<br>
          <small>Accuracy: ${checkInLocation.accuracy ? `±${checkInLocation.accuracy}m` : 'N/A'}</small>
        </div>
      `);

      checkInMarker.addTo(map);
      bounds.extend([Number(checkInLocation.latitude), Number(checkInLocation.longitude)]);
    }

    // Add check-out marker
    if (checkOutLocation && checkOutLocation.latitude && checkOutLocation.longitude) {
      const checkOutMarker = L.marker([
        Number(checkOutLocation.latitude),
        Number(checkOutLocation.longitude)
      ], {
        icon: L.divIcon({
          html: '<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px;">🔴</div>',
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      });

      checkOutMarker.bindPopup(`
        <div style="font-size: 14px;">
          <strong>Check-out</strong><br>
          ${checkOutLocation.address || 'Location recorded'}<br>
          <small>Accuracy: ${checkOutLocation.accuracy ? `±${checkOutLocation.accuracy}m` : 'N/A'}</small>
        </div>
      `);

      checkOutMarker.addTo(map);
      bounds.extend([Number(checkOutLocation.latitude), Number(checkOutLocation.longitude)]);
    }

    // Add location path
    if (locationPath && locationPath.length > 1) {
      const latLngs = locationPath.map(point => [Number(point.latitude), Number(point.longitude)]);

      const polyline = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1
      });

      polyline.addTo(map);

      // Extend bounds to include path
      latLngs.forEach(latLng => bounds.extend(latLng));

      // Add battery indicators along the path
      locationPath.forEach((point, index) => {
        if (index % 5 === 0 && point.batteryLevel !== undefined) { // Show every 5th point
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

          const batteryMarker = L.marker([
            Number(point.latitude),
            Number(point.longitude)
          ], { icon: batteryIcon }).addTo(map);

          batteryMarker.bindPopup(`
            <div style="font-size: 12px;">
              <strong>Path Point ${index + 1}</strong><br>
              Time: ${new Date(point.timestamp).toLocaleTimeString()}<br>
              Battery: ${point.batteryLevel}%<br>
              Accuracy: ${point.accuracy ? `±${point.accuracy}m` : 'N/A'}
            </div>
          `);
        }
      });
    }

    // Fit map to show all markers and path
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (checkInLocation && checkInLocation.latitude && checkInLocation.longitude) {
      // If only check-in is available, center on it
      map.setView([Number(checkInLocation.latitude), Number(checkInLocation.longitude)], 15);
    }
  }, [checkInLocation, checkOutLocation, locationPath]);

  // Expose the reset function via ref
  useImperativeHandle(ref, () => ({
    resetMap: resetMapToCheckIn,
  }), [resetMapToCheckIn]);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet

        const leafletModule = await import('leaflet');
        const L = leafletModule.default;

        // Import CSS
        if (typeof window !== 'undefined') {
          await import('leaflet/dist/leaflet.css');
        }

        // Fix default icon paths
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!mapRef.current) return;

        // Check if map is already initialized
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((mapRef.current as any)._leaflet_id) {
          return;
        }

        // Determine initial center (prefer check-in location, default to Bhubaneswar)
        let initialLat = 20.2961; // Bhubaneswar coordinates
        let initialLng = 85.8245;
        let initialZoom = 13;

        if (checkInLocation && checkInLocation.latitude && checkInLocation.longitude) {
          initialLat = Number(checkInLocation.latitude);
          initialLng = Number(checkInLocation.longitude);
          initialZoom = 15;
        } else if (checkOutLocation && checkOutLocation.latitude && checkOutLocation.longitude) {
          initialLat = Number(checkOutLocation.latitude);
          initialLng = Number(checkOutLocation.longitude);
          initialZoom = 15;
        }

        // Initialize map
        const map = L.map(mapRef.current).setView([initialLat, initialLng], initialZoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Store map instance
        mapInstanceRef.current = map;

        // Add markers after a short delay to ensure map is ready
        setTimeout(() => {
          addMarkersAndPath(L, map);
          setIsMapReady(true);
        }, 100);

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setIsMapReady(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [addMarkersAndPath, checkInLocation, checkOutLocation]); // Include dependencies

  // Update markers when location data changes
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current) {
      const L = window.L;
      if (L) {
        addMarkersAndPath(L, mapInstanceRef.current);
      }
    }
  }, [isMapReady, addMarkersAndPath]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">
            Loading map...
          </div>
        </div>
      )}

    </div>
  );
});

AttendancePathMap.displayName = 'AttendancePathMap';

export { AttendancePathMap };