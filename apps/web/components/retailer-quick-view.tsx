/**
 * Retailer Quick View Component
 * Displays a modal with retailer details and quick actions
 */

'use client';

import { Retailer } from '@pgn/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit, Store, Mail, Phone, MapPin, Calendar, User, Building2 } from 'lucide-react';

interface RetailerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailer: Retailer | null;
  onEdit?: (retailer: Retailer) => void;
}

export function RetailerQuickView({
  open,
  onOpenChange,
  retailer,
  onEdit,
}: RetailerQuickViewProps) {
  if (!retailer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {retailer.name}
          </DialogTitle>
          <DialogDescription>
            Retailer information and details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Retailer ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {retailer.id.slice(0, 8)}...
                </Badge>
              </div>

              {retailer.shop_name && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Shop Name:</span>
                  <p className="text-sm">{retailer.shop_name}</p>
                </div>
              )}

              {retailer.dealer_id && (
                <div className="space-y-1">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Dealer:
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    ID: {retailer.dealer_id.slice(0, 8)}...
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {retailer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <p className="text-sm">{retailer.email}</p>
                  </div>
                </div>
              )}

              {retailer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Phone:</span>
                    <p className="text-sm">{retailer.phone}</p>
                  </div>
                </div>
              )}

              {retailer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Address:</span>
                    <p className="text-sm">{retailer.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* System Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(retailer.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(retailer.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onEdit?.(retailer)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Retailer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}