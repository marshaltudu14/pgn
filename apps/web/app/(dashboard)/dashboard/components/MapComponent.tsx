'use client';

import { DailyAttendanceRecord } from '@pgn/shared';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
// Leaflet requires 'window' to be defined, which is not available during server-side rendering.
// next/dynamic with ssr: false is the standard way to handle this in Next.js.
const MapInner = dynamic(
  () => import('./MapInner'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-lg border">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading Map...</p>
        </div>
      </div>
    )
  }
);

interface MapComponentProps {
  selectedRecord: DailyAttendanceRecord | null;
  employeeName?: string;
  shouldCenter?: boolean;
}

export default function MapComponent(props: MapComponentProps) {
  return <MapInner {...props} />;
}
