/**
 * Farmer Quick View Component
 * Displays a full-screen modal with farmer details and quick actions
 */

'use client';

import { FarmerWithRetailer } from '@pgn/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FullScreenModal } from '@/components/ui/full-screen-modal';
import { Edit, Mail, Phone, MapPin, Calendar, User, Store, Clock, UserCheck, AlertCircle, Sprout } from 'lucide-react';

interface FarmerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer: FarmerWithRetailer | null;
  onEdit?: (farmer: FarmerWithRetailer) => void;
  hideEditButtons?: boolean;
}

export function FarmerQuickView({
  open,
  onOpenChange,
  farmer,
  onEdit,
  hideEditButtons = false,
}: FarmerQuickViewProps) {
  if (!farmer) return null;

  const actions = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
        Close
      </Button>
      {!hideEditButtons && onEdit && (
        <Button onClick={() => onEdit(farmer)} className="cursor-pointer">
          <Edit className="h-4 w-4 mr-2" />
          Edit Farmer
        </Button>
      )}
    </>
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title={farmer.name}
      description="Complete farmer information and all details"
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
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Farmer Name</span>
              <span className="text-gray-900 dark:text-gray-100">{farmer.name}</span>
            </div>
            {farmer.farm_name && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Sprout className="h-4 w-4" />
                  Farm Name
                </span>
                <span className="text-gray-900 dark:text-gray-100">{farmer.farm_name}</span>
              </div>
            )}
            {farmer.retailer && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  Retailer
                </span>
                <div className="text-right">
                  <p className="text-gray-900 dark:text-gray-100">{farmer.retailer.name}</p>
                  {farmer.retailer.shop_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{farmer.retailer.shop_name}</p>
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
            {farmer.email && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Email
                </span>
                <a
                  href={`mailto:${farmer.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                >
                  {farmer.email}
                </a>
              </div>
            )}
            {farmer.phone && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Phone
                </span>
                <a
                  href={`tel:${farmer.phone}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                >
                  {farmer.phone}
                </a>
              </div>
            )}
            {farmer.address && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 pt-1">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Address
                </span>
                <p className="text-right text-gray-900 dark:text-gray-100 max-w-md">{farmer.address}</p>
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
                <UserCheck className="h-4 w-4" />
                Created By
              </span>
              <div className="text-right">
                {farmer.created_by_employee ? (
                  <div>
                    <p className="text-gray-900 dark:text-gray-100">
                      {farmer.created_by_employee.first_name} {farmer.created_by_employee.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {farmer.created_by_employee.human_readable_user_id}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(farmer.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })} at {new Date(farmer.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-gray-900 dark:text-gray-100">Admin</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(farmer.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })} at {new Date(farmer.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                Last Updated By
              </span>
              <div className="text-right">
                {farmer.updated_by_employee ? (
                  <div>
                    <p className="text-gray-900 dark:text-gray-100">
                      {farmer.updated_by_employee.first_name} {farmer.updated_by_employee.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {farmer.updated_by_employee.human_readable_user_id}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(farmer.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })} at {new Date(farmer.updated_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-gray-900 dark:text-gray-100">Admin</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(farmer.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })} at {new Date(farmer.updated_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullScreenModal>
  );
}