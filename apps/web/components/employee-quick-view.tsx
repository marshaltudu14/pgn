/**
 * Employee Quick View Component
 * Shows important employee details in a dialog
 */

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Employee, EmploymentStatus } from '@pgn/shared';
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  Edit,
  Building,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';

interface EmployeeQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
}

const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  SUSPENDED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  RESIGNED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  TERMINATED: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
  ON_LEAVE: 'bg-muted text-muted-foreground',
};

const STATUS_ICON_MAP = {
  ACTIVE: CheckCircle,
  SUSPENDED: XCircle,
  RESIGNED: Users,
  TERMINATED: XCircle,
  ON_LEAVE: Clock,
};

export function EmployeeQuickView({ open, onOpenChange, employee, onEdit }: EmployeeQuickViewProps) {
  if (!employee) return null;

  const StatusIcon = STATUS_ICON_MAP[employee.employmentStatus] || Users;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <StatusIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {employee.firstName} {employee.lastName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {employee.humanReadableUserId}
              </p>
            </div>
          </div>
          <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employmentStatus]}>
            {employee.employmentStatus.replace('_', ' ')}
          </Badge>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{employee.email}</span>
                </div>
              </div>

              {employee.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{employee.phone}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatDate(employee.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatDate(employee.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment & Regional Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employmentStatus]} variant="outline">
                  {employee.employmentStatus.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Login Access</span>
                <div className="flex items-center gap-2">
                  {employee.canLogin ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {employee.canLogin ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <Separator />

              {employee.primaryRegion && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Primary Region</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{employee.primaryRegion}</span>
                  </div>
                </div>
              )}

              {employee.regionCode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Region Code</span>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{employee.regionCode}</span>
                  </div>
                </div>
              )}

              {employee.assignedRegions && employee.assignedRegions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Assigned Regions</span>
                  <div className="flex flex-wrap gap-1">
                    {employee.assignedRegions.map((region, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Information */}
        {(employee.employmentStatusChangedAt || employee.employmentStatusChangedBy) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Status Change Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.employmentStatusChangedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status Changed On</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatDate(employee.employmentStatusChangedAt)}
                    </span>
                  </div>
                </div>
              )}

              {employee.employmentStatusChangedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Changed By</span>
                  <span className="text-sm font-medium">{employee.employmentStatusChangedBy}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Employee ID: {employee.id}
          </div>
          {onEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(employee);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Employee
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}