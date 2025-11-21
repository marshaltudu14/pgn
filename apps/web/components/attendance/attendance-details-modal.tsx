/**
 * Attendance Details Modal Component
 * Shows detailed information about an attendance record
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DailyAttendanceRecord,
  VerificationStatus,
  VERIFICATION_STATUS_CONFIG,
} from '@pgn/shared';
import {
  Clock,
  User,
  Calendar,
  Route,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

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
  isUpdating: boolean;
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
  isUpdating,
  updateError,
}: AttendanceDetailsModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('PENDING');
  const [verificationNotes, setVerificationNotes] = useState('');

  // Reset form when record changes
  if (attendanceRecord) {
    if (verificationStatus !== attendanceRecord.verificationStatus) {
      setVerificationStatus(attendanceRecord.verificationStatus || 'PENDING');
    }
  }

  const handleVerificationUpdate = async () => {
    if (!attendanceRecord) return;

    try {
      await onVerificationUpdate(attendanceRecord.id, verificationStatus, verificationNotes);
      setVerificationNotes('');
    } catch {
      // Error handling is done by parent component
    }
  };

  if (!attendanceRecord) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Details
          </DialogTitle>
          <DialogDescription>
            View and manage attendance verification for{' '}
            {format(new Date(attendanceRecord.date), 'MMMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {updateError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200">{updateError}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                  <p className="font-mono">{attendanceRecord.employeeId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p>{format(new Date(attendanceRecord.date), 'EEEE, MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={attendanceRecord.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Verification Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={attendanceRecord.verificationStatus || 'PENDING'} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check-in Information */}
          {attendanceRecord.checkInTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check-in Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Time</Label>
                    <p className="text-lg font-semibold">
                      {format(new Date(attendanceRecord.checkInTime), 'hh:mm:ss a')}
                    </p>
                  </div>
                  {attendanceRecord.checkInLocation && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Location
                      </Label>
                      <p className="font-mono text-sm">
                        {attendanceRecord.checkInLocation.latitude.toFixed(6)}, {attendanceRecord.checkInLocation.longitude.toFixed(6)}
                      </p>
                      {attendanceRecord.checkInLocation.address && (
                        <p className="text-sm text-muted-foreground">
                          {attendanceRecord.checkInLocation.address}
                        </p>
                      )}
                      {attendanceRecord.checkInLocation.accuracy && (
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{attendanceRecord.checkInLocation.accuracy}m
                        </p>
                      )}
                    </div>
                  )}
                                  </div>
              </CardContent>
            </Card>
          )}

          {/* Check-out Information */}
          {attendanceRecord.checkOutTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Check-out Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Time</Label>
                    <p className="text-lg font-semibold">
                      {format(new Date(attendanceRecord.checkOutTime), 'hh:mm:ss a')}
                    </p>
                  </div>
                  {attendanceRecord.checkOutLocation && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Location
                      </Label>
                      <p className="font-mono text-sm">
                        {attendanceRecord.checkOutLocation.latitude.toFixed(6)}, {attendanceRecord.checkOutLocation.longitude.toFixed(6)}
                      </p>
                      {attendanceRecord.checkOutLocation.address && (
                        <p className="text-sm text-muted-foreground">
                          {attendanceRecord.checkOutLocation.address}
                        </p>
                      )}
                      {attendanceRecord.checkOutLocation.accuracy && (
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{attendanceRecord.checkOutLocation.accuracy}m
                        </p>
                      )}
                    </div>
                  )}
                                  </div>
              </CardContent>
            </Card>
          )}

          {/* Path Summary */}
          {attendanceRecord.locationPath && attendanceRecord.locationPath.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Location Path Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Distance</Label>
                    <p className="text-lg font-semibold">
                      {calculateTotalDistance(attendanceRecord.locationPath).toFixed(2)} km
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Path Points</Label>
                    <p className="text-lg font-semibold">{attendanceRecord.locationPath.length} points</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Start Location</Label>
                    <p className="text-sm text-muted-foreground">
                      {attendanceRecord.locationPath[0]?.latitude.toFixed(6)}, {attendanceRecord.locationPath[0]?.longitude.toFixed(6)}
                    </p>
                  </div>
                  {attendanceRecord.locationPath.length > 1 && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">End Location</Label>
                      <p className="text-sm text-muted-foreground">
                        {attendanceRecord.locationPath[attendanceRecord.locationPath.length - 1]?.latitude.toFixed(6)}, {attendanceRecord.locationPath[attendanceRecord.locationPath.length - 1]?.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Summary */}
          {attendanceRecord.workHours && (
            <Card>
              <CardHeader>
                <CardTitle>Work Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Work Hours</Label>
                    <p className="text-lg font-semibold">{attendanceRecord.workHours.toFixed(1)} hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selfie Images */}
          {(attendanceRecord.checkInLocation || attendanceRecord.checkOutLocation) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Verification Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendanceRecord.checkInLocation && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">Check-in Selfie</Label>
                      <div className="border rounded-lg p-4 text-center text-muted-foreground">
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Image not available</p>
                      </div>
                    </div>
                  )}
                  {attendanceRecord.checkOutLocation && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">Check-out Selfie</Label>
                      <div className="border rounded-lg p-4 text-center text-muted-foreground">
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Image not available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <Select
                  value={verificationStatus}
                  onValueChange={(value) => setVerificationStatus(value as VerificationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          {status.value === 'VERIFIED' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {status.value === 'REJECTED' && <XCircle className="h-4 w-4 text-red-600" />}
                          {status.value === 'FLAGGED' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                          {status.value === 'PENDING' && <Clock className="h-4 w-4 text-yellow-600" />}
                          <div>
                            <div className="font-medium">{status.label}</div>
                            <div className="text-xs text-muted-foreground">{status.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="verificationNotes">Verification Notes</Label>
                <Textarea
                  id="verificationNotes"
                  placeholder="Add notes about this verification..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleVerificationUpdate}
                  disabled={isUpdating}
                  className={
                    verificationStatus === 'VERIFIED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : verificationStatus === 'REJECTED'
                      ? 'bg-red-600 hover:bg-red-700'
                      : verificationStatus === 'FLAGGED'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : undefined
                  }
                >
                  {isUpdating ? (
                    'Updating...'
                  ) : (
                    <>
                      {verificationStatus === 'VERIFIED' && <CheckCircle className="h-4 w-4 mr-2" />}
                      {verificationStatus === 'REJECTED' && <XCircle className="h-4 w-4 mr-2" />}
                      {verificationStatus === 'FLAGGED' && <AlertTriangle className="h-4 w-4 mr-2" />}
                      {verificationStatus === 'PENDING' && <Clock className="h-4 w-4 mr-2" />}
                      Update Verification
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to calculate total distance from path data
function calculateTotalDistance(path: Array<{ latitude: number; longitude: number }>): number {
  if (path.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    totalDistance += calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
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