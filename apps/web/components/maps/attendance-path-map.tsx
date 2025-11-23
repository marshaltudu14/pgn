/**
 * Attendance Path Map Component
 * Uses OpenStreetMap with Leaflet to display location path and check-in/out points
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon issue with webpack
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
const createCustomIcon = (type: 'checkin' | 'checkout') => {
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

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
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const markers: L.Marker[] = [];
    const bounds: L.LatLngBounds = new L.LatLngBounds([]);

    // Add check-in marker
    if (checkInLocation) {
      const checkInMarker = L.marker(
        [checkInLocation.latitude, checkInLocation.longitude],
        { icon: createCustomIcon('checkin') }
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
      bounds.extend([checkInLocation.latitude, checkInLocation.longitude]);
    }

    // Add check-out marker
    if (checkOutLocation) {
      const checkOutMarker = L.marker(
        [checkOutLocation.latitude, checkOutLocation.longitude],
        { icon: createCustomIcon('checkout') }
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
      bounds.extend([checkOutLocation.latitude, checkOutLocation.longitude]);
    }

    // Add path polyline if we have path data
    if (locationPath.length > 1) {
      const pathCoordinates = locationPath.map(point => [
        point.latitude,
        point.longitude,
      ] as [number, number]);

      const polyline = L.polyline(pathCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
      });

      polyline.addTo(map);

      // Add battery level indicators for path points
      locationPath.forEach((point, index) => {
        if (point.batteryLevel !== undefined && index % 3 === 0) { // Show every 3rd point to avoid clutter
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

          const batteryMarker = L.marker([point.latitude, point.longitude], { icon: batteryIcon });
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

        bounds.extend([point.latitude, point.longitude]);
      });
    }

    // Fit map to show all markers and path
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (checkInLocation) {
      // If only check-in is available, center on it
      map.setView([checkInLocation.latitude, checkInLocation.longitude], 15);
    }

  }, [isMapReady, checkInLocation, checkOutLocation, locationPath]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
        </div>
      )}
    </div>
  );
}