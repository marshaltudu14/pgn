// Basic shared type definitions for PGN applications

export interface Employee {
  id: string;
  humanReadableUserId: string;
  name: string;
  contactInfo: {
    email?: string;
    phone?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckInOutData {
  employeeId: string;
  location: LocationData;
  selfie?: string;
  timestamp: Date;
  userId: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  distanceFromPrevious?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkIn?: CheckInOutData;
  checkOut?: CheckInOutData;
  userId: string;
  date: string; // YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

export interface PathSegment {
  id: string;
  employeeId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  startTime: Date;
  endTime: Date;
  distance: number;
}

export interface LocationUpdate {
  id: string;
  employeeId: string;
  location: LocationData;
  pathSegmentId?: string;
}