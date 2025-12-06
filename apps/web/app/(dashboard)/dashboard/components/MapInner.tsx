'use client';

import { DailyAttendanceRecord } from '@pgn/shared';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';

// Fix for Leaflet default icon issues in Webpack/Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different markers
const StartIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const EndIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CurrentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapInnerProps {
  selectedRecord: DailyAttendanceRecord | null;
  employeeName?: string;
  shouldCenter?: boolean;
}

// Component to handle map centering
function MapUpdater({ center, shouldCenter }: { center: [number, number]; shouldCenter: boolean }) {
  const map = useMap();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted && shouldCenter) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map, shouldCenter, hasInteracted]);

  useEffect(() => {
    // Detect user interaction with the map
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);
    };
  }, [map]);

  return null;
}

export default function MapInner({ selectedRecord, employeeName, shouldCenter = true }: MapInnerProps) {
  // Default center (e.g., India or a neutral location if no data)
  const defaultCenter: [number, number] = [20.5937, 78.9629]; 
  
  const checkInLoc = selectedRecord?.checkInLocation;
  const checkOutLoc = selectedRecord?.checkOutLocation;
  const pathData = selectedRecord?.locationPath || [];

  // Determine current location:
  let currentLocation: { latitude: number; longitude: number; timestamp?: Date; address?: string } | undefined;

  if (pathData.length > 0) {
    const lastPoint = pathData[pathData.length - 1];
    currentLocation = {
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      timestamp: lastPoint.timestamp
    };
  } else if (checkOutLoc) {
    currentLocation = checkOutLoc;
  } else if (checkInLoc) {
    currentLocation = checkInLoc;
  }

  // Calculate center directly during render
  let viewCenter: [number, number] = defaultCenter;
  if (currentLocation) {
    viewCenter = [currentLocation.latitude, currentLocation.longitude];
  } else if (checkInLoc) {
    viewCenter = [checkInLoc.latitude, checkInLoc.longitude];
  }

  // Prepare path coordinates
  const polylinePositions: [number, number][] = pathData.map(p => [p.latitude, p.longitude]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border shadow-sm relative z-0">
      <MapContainer
        center={viewCenter}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={viewCenter} shouldCenter={shouldCenter} />

        {/* Start Marker (Check In) */}
        {checkInLoc && (
          <Marker position={[checkInLoc.latitude, checkInLoc.longitude]} icon={StartIcon}>
            <Popup>
              <strong>Check In</strong><br />
              Time: {checkInLoc.timestamp ? new Date(checkInLoc.timestamp).toLocaleTimeString() : 'N/A'}
            </Popup>
          </Marker>
        )}

        {/* End Marker (Check Out) */}
        {checkOutLoc && (
          <Marker position={[checkOutLoc.latitude, checkOutLoc.longitude]} icon={EndIcon}>
            <Popup>
              <strong>Check Out</strong><br />
              Time: {checkOutLoc.timestamp ? new Date(checkOutLoc.timestamp).toLocaleTimeString() : 'N/A'}
            </Popup>
          </Marker>
        )}

        {/* Current Location Marker (if different from checkin/checkout or if tracking is active) */}
        {currentLocation && 
         (!checkInLoc || currentLocation.latitude !== checkInLoc.latitude || currentLocation.longitude !== checkInLoc.longitude) &&
         (!checkOutLoc || currentLocation.latitude !== checkOutLoc.latitude || currentLocation.longitude !== checkOutLoc.longitude) && (
          <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={CurrentIcon}>
            <Popup>
              <strong>Current Location</strong><br />
              Employee: {employeeName}<br />
              Last Update: {currentLocation.timestamp ? new Date(currentLocation.timestamp).toLocaleTimeString() : 'N/A'}
            </Popup>
          </Marker>
        )}

        {/* Path Polyline */}
        {polylinePositions.length > 1 && (
          <Polyline positions={polylinePositions} color="blue" weight={3} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
}
