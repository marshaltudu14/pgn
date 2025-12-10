/**
 * Employee Quick View Component
 * Shows important employee details in a modern, professional dialog
 */

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { EmploymentStatus, EmployeeWithRegions } from '@pgn/shared';
import {
  Mail,
  Phone,
  Calendar,
  Edit,
  Building,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Briefcase,
  User,
  ChevronRight,
} from 'lucide-react';

interface EmployeeQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeWithRegions | null;
  onEdit?: (employee: EmployeeWithRegions) => void;
}

const EMPLOYMENT_STATUS_CONFIG: Record<EmploymentStatus, {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  ACTIVE: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Active'
  },
  SUSPENDED: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Suspended'
  },
  RESIGNED: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Resigned'
  },
  TERMINATED: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Terminated'
  },
  ON_LEAVE: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'On Leave'
  },
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

  const StatusIcon = STATUS_ICON_MAP[employee.employment_status as EmploymentStatus] || Users;
  const statusConfig = EMPLOYMENT_STATUS_CONFIG[employee.employment_status as EmploymentStatus];

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto px-0 py-0">
        {/* Modern Header Section */}
        <SheetHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-background to-muted/20">
          <SheetTitle className="sr-only">
            {employee.first_name} {employee.last_name} - Employee Details
          </SheetTitle>

          {/* Profile Header with Avatar */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar with status indicator */}
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${statusConfig.bgColor} flex items-center justify-center`}>
                  <StatusIcon className="h-3 w-3" />
                </div>
              </div>

              {/* Employee Info */}
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  {employee.human_readable_user_id}
                </p>

                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={`mt-2 font-medium ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border-current`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Main Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Email Card */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate" title={employee.email}>
                      {employee.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">
                      {employee.phone || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Access Card */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    employee.can_login
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    {employee.can_login ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Access</p>
                    <p className="text-sm font-medium">
                      {employee.can_login ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regions Count Card */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Regions</p>
                    <p className="text-sm font-medium">
                      {employee.assigned_regions?.regions?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Details Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contact Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <span className="text-sm font-mono">{employee.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </span>
                    <span className="text-sm">{employee.phone || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Details Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Employment Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Status
                    </span>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border-current`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Login Access
                    </span>
                    <div className="flex items-center gap-2">
                      {employee.can_login ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {employee.can_login ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Timeline</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{formatDate(employee.created_at!)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">{formatDate(employee.updated_at!)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Regions Section */}
          {employee.assigned_regions && employee.assigned_regions.regions && employee.assigned_regions.regions.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Assigned Regions</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {employee.assigned_regions.regions.length} {employee.assigned_regions.regions.length === 1 ? 'Region' : 'Regions'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {employee.assigned_regions.regions.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {region.city}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {region.state}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No regions assigned */}
          {(!employee.assigned_regions?.regions || employee.assigned_regions.regions.length === 0) && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No Regions Assigned</h3>
                    <p className="text-sm text-muted-foreground">
                      This employee hasn&apos;t been assigned to any regions yet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 pt-4 pb-6 border-t border-border bg-muted/20">
          {onEdit && (
            <Button
              onClick={() => {
                onEdit(employee);
                onOpenChange(false);
              }}
              className="cursor-pointer px-6 py-2"
              size="lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Employee Details
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}