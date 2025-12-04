/**
 * Retailer Quick View Component
 * Displays a full-screen modal with retailer details and quick actions
 */

'use client';

import { RetailerWithFarmers } from '@pgn/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FullScreenModal } from '@/components/ui/full-screen-modal';
import { Edit, Mail, Phone, MapPin, Calendar, User, Building2, Clock, UserCheck, AlertCircle } from 'lucide-react';

interface RetailerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailer: RetailerWithFarmers | null;
  onEdit?: (retailer: RetailerWithFarmers) => void;
}

export function RetailerQuickView({
  open,
  onOpenChange,
  retailer,
  onEdit,
}: RetailerQuickViewProps) {
  if (!retailer) return null;

  const actions = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Close
      </Button>
      <Button onClick={() => onEdit?.(retailer)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit Retailer
      </Button>
    </>
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title={retailer.name}
      description="Complete retailer information and all details"
      actions={actions}
    >
      <div className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <User className="h-5 w-5" />
            Basic Information
          </h3>
          <div className="space-y-4 pl-7">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Retailer Name</span>
              <span className="text-gray-900 dark:text-gray-100">{retailer.name}</span>
            </div>
            {retailer.shop_name && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Shop Name</span>
                <span className="text-gray-900 dark:text-gray-100">{retailer.shop_name}</span>
              </div>
            )}
            {retailer.dealer && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Dealer
                </span>
                <div className="text-right">
                  <p className="text-gray-900 dark:text-gray-100">{retailer.dealer.name}</p>
                  {retailer.dealer.shop_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{retailer.dealer.shop_name}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Mail className="h-5 w-5" />
            Contact Information
          </h3>
          <div className="space-y-4 pl-7">
            {retailer.email && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Email
                </span>
                <a
                  href={`mailto:${retailer.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                >
                  {retailer.email}
                </a>
              </div>
            )}
            {retailer.phone && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Phone
                </span>
                <a
                  href={`tel:${retailer.phone}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                >
                  {retailer.phone}
                </a>
              </div>
            )}
            {retailer.address && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 pt-1">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Address
                </span>
                <p className="text-right text-gray-900 dark:text-gray-100 max-w-md">{retailer.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Clock className="h-5 w-5" />
            System Information
          </h3>
          <div className="space-y-4 pl-7">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created Date
              </span>
              <div className="text-right">
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(retailer.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(retailer.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last Updated
              </span>
              <div className="text-right">
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(retailer.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(retailer.updated_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Status
              </span>
              <Badge variant="default" className="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30">
                Active
              </Badge>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                Created By
              </span>
              <div className="text-right">
                {retailer.created_by_employee ? (
                  <div>
                    <p className="text-gray-900 dark:text-gray-100">
                      {retailer.created_by_employee.first_name} {retailer.created_by_employee.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {retailer.created_by_employee.human_readable_user_id}
                    </p>
                  </div>
                ) : (
                  <span className="text-gray-900 dark:text-gray-100">Admin</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                Last Updated By
              </span>
              <div className="text-right">
                {retailer.updated_by_employee ? (
                  <div>
                    <p className="text-gray-900 dark:text-gray-100">
                      {retailer.updated_by_employee.first_name} {retailer.updated_by_employee.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {retailer.updated_by_employee.human_readable_user_id}
                    </p>
                  </div>
                ) : (
                  <span className="text-gray-900 dark:text-gray-100">Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullScreenModal>
  );
}