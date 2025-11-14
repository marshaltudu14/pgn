/**
 * Employee Detail Component
 * Displays comprehensive employee information with quick actions
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Employee, EmploymentStatus } from '@pgn/shared';
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  Edit,
  X,
  Building,
  Globe,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface EmployeeDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
}

const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  RESIGNED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
  ON_LEAVE: 'bg-gray-100 text-gray-800',
};

const EMPLOYMENT_STATUS_ICONS: Record<EmploymentStatus, React.ComponentType<{ className?: string }>> = {
  ACTIVE: CheckCircle,
  SUSPENDED: XCircle,
  RESIGNED: Clock,
  TERMINATED: UserX,
  ON_LEAVE: Calendar,
};

export function EmployeeDetail({ open, onOpenChange, employee, onEdit }: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!employee) return null;

  const formatDate = (dateInput: string | Date | undefined) => {
    if (!dateInput) return 'Not set';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleString();
  };

  const StatusIcon = EMPLOYMENT_STATUS_ICONS[employee.employmentStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl">
              {employee.firstName} {employee.lastName}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employmentStatus]}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {employee.employmentStatus.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {employee.humanReadableUserId}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit?.(employee)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="regions">Regions</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg">
                      {employee.firstName} {employee.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="font-mono">{employee.humanReadableUserId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p>{employee.email}</p>
                    </div>
                  </div>
                  {employee.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p>{employee.phone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employment Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIcon className="h-4 w-4" />
                      <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employmentStatus]}>
                        {employee.employmentStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Can Login</label>
                    <div className="flex items-center gap-2 mt-1">
                      {employee.canLogin ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Yes</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">No</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status Changed</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{formatDate(employee.employmentStatusChangedAt)}</p>
                    </div>
                  </div>
                  {employee.employmentStatusChangedBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status Changed By</label>
                      <p>{employee.employmentStatusChangedBy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-gray-600">{formatDate(employee.createdAt)}</p>
                    </div>
                  </div>
                  {employee.updatedAt !== employee.createdAt && (
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-gray-600">{formatDate(employee.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {employee.employmentStatusChangedAt && (
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Status Last Changed</p>
                        <p className="text-sm text-gray-600">{formatDate(employee.employmentStatusChangedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-lg">{employee.email}</p>
                    </div>
                  </div>
                  {employee.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-lg">{employee.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-gray-500">Device Information</label>
                  {employee.deviceInfo ? (
                    <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
                      {JSON.stringify(employee.deviceInfo, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-400">No device information available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Primary Region
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.primaryRegion ? (
                    <div>
                      <p className="text-lg font-medium">{employee.primaryRegion}</p>
                      {employee.regionCode && (
                        <Badge variant="outline" className="mt-2">
                          Code: {employee.regionCode}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">No primary region assigned</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Assigned Regions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.assignedRegions && employee.assignedRegions.length > 0 ? (
                    <div className="space-y-2">
                      {employee.assignedRegions.map((region, index) => (
                        <Badge key={index} variant="secondary" className="mr-2">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No regions assigned</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Login Access</label>
                    <div className="flex items-center gap-2 mt-1">
                      {employee.canLogin ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-green-600 font-medium">Allowed</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="text-red-600 font-medium">Restricted</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Failed Login Attempts</label>
                    <p className="text-lg">{employee.failedLoginAttempts || 0}</p>
                  </div>
                </div>

                <Separator />

                {employee.accountLockedUntil && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Locked Until</label>
                    <div className="flex items-center gap-2 mt-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <p className="text-red-600">
                        {formatDate(employee.accountLockedUntil)}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Face Recognition</label>
                  <div className="flex items-center gap-2 mt-1">
                    {employee.faceEmbedding ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Face data registered</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">No face data registered</span>
                      </>
                    )}
                  </div>
                </div>

                {employee.referencePhotoUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reference Photo</label>
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={employee.referencePhotoUrl}
                        alt="Reference"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}