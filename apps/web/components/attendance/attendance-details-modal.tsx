/**
 * Attendance Details Modal Component (Redesigned)
 * Custom two-column dialog with OpenStreetMap integration for attendance details
 */

'use client';

import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TwoColumnDialog,
  TwoColumnDialogContent,
  TwoColumnDialogLeft,
  TwoColumnDialogRight,
} from '@/components/ui/two-column-dialog';
import { AttendancePathMap, AttendancePathMapRef } from '@/components/maps/attendance-path-map';
import {
  DailyAttendanceRecord,
  VerificationStatus,
  VERIFICATION_STATUS_CONFIG,
} from '@pgn/shared';
import {
  Clock,
  User,
  Route,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  LogIn,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

// Simple inline status badge
const StatusBadge = ({ status }: { status?: string }) => {
  const config = status && status in VERIFICATION_STATUS_CONFIG
    ? VERIFICATION_STATUS_CONFIG[status as keyof typeof VERIFICATION_STATUS_CONFIG]
    : VERIFICATION_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

interface AttendanceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceRecord: DailyAttendanceRecord | null;
  onVerificationUpdate: (recordId: string, status: VerificationStatus, notes?: string) => Promise<void>;
  updateError?: string;
}

const VERIFICATION_STATUSES = [
  { value: 'PENDING', label: 'Pending', description: 'Awaiting verification' },
  { value: 'VERIFIED', label: 'Verified', description: 'Approved and verified' },
  { value: 'REJECTED', label: 'Rejected', description: 'Rejected attendance' },
  { value: 'FLAGGED', label: 'Flagged', description: 'Flagged for review' },
];

export function AttendanceDetailsModal({
  open,
  onOpenChange,
  attendanceRecord,
  onVerificationUpdate,
  updateError,
}: AttendanceDetailsModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('PENDING');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isUpdatingVerification, setIsUpdatingVerification] = useState(false);
  const mapRef = useRef<AttendancePathMapRef>(null);

  
  // Reset form when record changes
  if (attendanceRecord) {
    if (verificationStatus !== attendanceRecord.verificationStatus) {
      setVerificationStatus(attendanceRecord.verificationStatus || 'PENDING');
    }
  }

  const handleVerificationUpdate = async () => {
    if (!attendanceRecord) return;

    setIsUpdatingVerification(true);
    try {
      await onVerificationUpdate(attendanceRecord.id, verificationStatus, verificationNotes);
      setVerificationNotes('');
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsUpdatingVerification(false);
    }
  };

  if (!attendanceRecord) return null;

  // Convert path data format for map with validation
  const mapPathData = attendanceRecord.locationPath
    ?.filter(point => {
      const lat = typeof point.latitude === 'string' ? parseFloat(point.latitude) : point.latitude;
      const lng = typeof point.longitude === 'string' ? parseFloat(point.longitude) : point.longitude;
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    })
    .map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp,
      accuracy: point.accuracy,
      batteryLevel: point.batteryLevel,
    })) || [];

  // Check if we have valid check-in coordinates (minimum requirement for showing map)
  const hasValidCheckInLocation = !!(
    attendanceRecord.checkInLocation?.latitude &&
    attendanceRecord.checkInLocation?.longitude &&
    !isNaN(typeof attendanceRecord.checkInLocation.latitude === 'string' ? parseFloat(attendanceRecord.checkInLocation.latitude) : attendanceRecord.checkInLocation.latitude) &&
    !isNaN(typeof attendanceRecord.checkInLocation.longitude === 'string' ? parseFloat(attendanceRecord.checkInLocation.longitude) : attendanceRecord.checkInLocation.longitude)
  );

  return (
    <TwoColumnDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Attendance Details"
      description={
        attendanceRecord.humanReadableEmployeeId
          ? `${attendanceRecord.humanReadableEmployeeId} • ${format(new Date(attendanceRecord.date), 'MMMM dd, yyyy')}`
          : `${format(new Date(attendanceRecord.date), 'MMMM dd, yyyy')}`
      }
      maxWidth="max-w-7xl"
    >
      <TwoColumnDialogContent>
        {/* LEFT COLUMN - MAP */}
        <TwoColumnDialogLeft className="flex flex-col">
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Location & Path</h3>
              </div>
              {hasValidCheckInLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mapRef.current?.resetMap()}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
            {hasValidCheckInLocation ? (
              <AttendancePathMap
                ref={mapRef}
                checkInLocation={attendanceRecord.checkInLocation}
                checkOutLocation={attendanceRecord.checkOutLocation}
                locationPath={mapPathData}
                height="500px"
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No Check-in Location Available</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                    No check-in coordinates recorded for this attendance
                  </p>
                </div>
              </div>
            )}

            {/* Path Statistics */}
            {attendanceRecord.locationPath && attendanceRecord.locationPath.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Route className="h-4 w-4" />
                    <span className="font-medium">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {calculateTotalDistance(attendanceRecord.locationPath).toFixed(2)} km
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Path Points</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                    {attendanceRecord.locationPath.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TwoColumnDialogLeft>

        {/* RIGHT COLUMN - DETAILS */}
        <TwoColumnDialogRight className="flex flex-col">
          <div className="p-6 space-y-6">
            {/* Error Display */}
            {updateError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{updateError}</p>
              </div>
            )}

            {/* Minimal List-style Information */}
            <div className="space-y-4">
              {/* Section Headers */}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                <User className="h-4 w-4" />
                Employee Details
              </div>

              {/* Employee Information List */}
              <div className="space-y-3 pl-6">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Employee ID</span>
                  <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                    {attendanceRecord.humanReadableEmployeeId || attendanceRecord.employeeId}
                  </span>
                </div>
                {attendanceRecord.employeeName && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {attendanceRecord.employeeName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <StatusBadge status={attendanceRecord.status} />
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Verification</span>
                  <StatusBadge status={attendanceRecord.verificationStatus || 'PENDING'} />
                </div>
                {attendanceRecord.device && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Device</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {attendanceRecord.device}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Check-in Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                <LogIn className="h-4 w-4 text-green-600" />
                Check-in
              </div>

              <div className="pl-6">
                {/* Two-column layout: Image on left, Details on right */}
                <div className="flex gap-6">
                  {/* Left: Image */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                      {attendanceRecord.checkInSelfieUrl ? (
                        <Image
                          src={attendanceRecord.checkInSelfieUrl}
                          alt="Check-in selfie"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-sm">--</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                      <div className="text-right">
                        {attendanceRecord.checkInTime ? (
                          <>
                            <div className="text-sm font-medium text-green-700 dark:text-green-400">
                              {format(new Date(attendanceRecord.checkInTime), 'hh:mm a')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {format(new Date(attendanceRecord.checkInTime), 'MMM dd, yyyy')}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">--</div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-start py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                      <div className="text-right max-w-xs">
                        {attendanceRecord.checkInLocation ? (
                          <>
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {attendanceRecord.checkInLocation.address ||
                               `${attendanceRecord.checkInLocation.latitude.toFixed(4)}, ${attendanceRecord.checkInLocation.longitude.toFixed(4)}`}
                            </div>
                            {attendanceRecord.checkInLocation.accuracy && (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                Accuracy: ±{attendanceRecord.checkInLocation.accuracy}m
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">--</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-out Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                <LogOut className="h-4 w-4 text-red-600" />
                Check-out
              </div>

              <div className="pl-6">
                {/* Two-column layout: Image on left, Details on right */}
                <div className="flex gap-6">
                  {/* Left: Image */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                      {attendanceRecord.checkOutSelfieUrl ? (
                        <Image
                          src={attendanceRecord.checkOutSelfieUrl}
                          alt="Check-out selfie"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('✅ [SUCCESS] Check-out image loaded successfully:', attendanceRecord.checkOutSelfieUrl);
                          }}
                          onError={(e) => {
                            console.error('❌ [ERROR] Check-out image failed to load:', {
                              imagePath: attendanceRecord.checkOutSelfieUrl,
                              urlLength: attendanceRecord.checkOutSelfieUrl?.length
                            });
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-sm">--</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                      <div className="text-right">
                        {attendanceRecord.checkOutTime ? (
                          <>
                            <div className="text-sm font-medium text-red-700 dark:text-red-400">
                              {format(new Date(attendanceRecord.checkOutTime), 'hh:mm a')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {format(new Date(attendanceRecord.checkOutTime), 'MMM dd, yyyy')}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">--</div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-start py-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                      <div className="text-right max-w-xs">
                        {attendanceRecord.checkOutLocation ? (
                          <>
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {attendanceRecord.checkOutLocation.address ||
                               `${attendanceRecord.checkOutLocation.latitude.toFixed(4)}, ${attendanceRecord.checkOutLocation.longitude.toFixed(4)}`}
                            </div>
                            {attendanceRecord.checkOutLocation.accuracy && (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                Accuracy: ±{attendanceRecord.checkOutLocation.accuracy}m
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">--</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Summary */}
            {attendanceRecord.workHours && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  <Clock className="h-4 w-4" />
                  Work Summary
                </div>

                <div className="space-y-3 pl-6">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Hours</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {attendanceRecord.workHours.toFixed(1)}h
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(attendanceRecord.date), 'EEEE, MMMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            )}

  
            {/* Verification Actions */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <Label htmlFor="verificationStatus" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Verification Status
                </Label>
                <Select
                  value={verificationStatus}
                  onValueChange={(value) => setVerificationStatus(value as VerificationStatus)}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2 w-full justify-center">
                          {status.value === 'VERIFIED' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {status.value === 'REJECTED' && <XCircle className="h-4 w-4 text-red-600" />}
                          {status.value === 'FLAGGED' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                          {status.value === 'PENDING' && <Clock className="h-4 w-4 text-yellow-600" />}
                          <span className="font-medium">{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="verificationNotes" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Notes
                </Label>
                <Textarea
                  id="verificationNotes"
                  placeholder="Add verification notes..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerificationUpdate}
                  disabled={isUpdatingVerification}
                  className={`cursor-pointer ${
                    verificationStatus === 'VERIFIED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : verificationStatus === 'REJECTED'
                      ? 'bg-red-600 hover:bg-red-700'
                      : verificationStatus === 'FLAGGED'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : undefined
                  }`}
                >
                  {isUpdatingVerification ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      {verificationStatus === 'VERIFIED' && <CheckCircle className="h-4 w-4 mr-2" />}
                      {verificationStatus === 'REJECTED' && <XCircle className="h-4 w-4 mr-2" />}
                      {verificationStatus === 'FLAGGED' && <AlertTriangle className="h-4 w-4 mr-2" />}
                      {verificationStatus === 'PENDING' && <Clock className="h-4 w-4 mr-2" />}
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TwoColumnDialogRight>
      </TwoColumnDialogContent>
    </TwoColumnDialog>
  );
}

// Helper function to calculate total distance from path data
function calculateTotalDistance(path: Array<{ latitude: number | string; longitude: number | string }>): number {
  if (!path || path.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];

    // Convert coordinates to numbers and validate
    const prevLat = typeof prev.latitude === 'string' ? parseFloat(prev.latitude) : prev.latitude;
    const prevLng = typeof prev.longitude === 'string' ? parseFloat(prev.longitude) : prev.longitude;
    const currLat = typeof curr.latitude === 'string' ? parseFloat(curr.latitude) : curr.latitude;
    const currLng = typeof curr.longitude === 'string' ? parseFloat(curr.longitude) : curr.longitude;

    // Skip invalid coordinates
    if (isNaN(prevLat) || isNaN(prevLng) || isNaN(currLat) || isNaN(currLng)) continue;
    if (prevLat < -90 || prevLat > 90 || currLat < -90 || currLat > 90) continue;
    if (prevLng < -180 || prevLng > 180 || currLng < -180 || currLng > 180) continue;

    totalDistance += calculateDistance(prevLat, prevLng, currLat, currLng);
  }

  return totalDistance / 1000; // Convert to kilometers
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}