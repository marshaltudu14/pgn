/**
 * Dealer Quick View Component
 * Displays a modal with dealer details and quick actions
 */

'use client';

import { Dealer } from '@pgn/shared';
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
import { Edit, Building, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';

interface DealerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer: Dealer | null;
  onEdit?: (dealer: Dealer) => void;
}

export function DealerQuickView({
  open,
  onOpenChange,
  dealer,
  onEdit,
}: DealerQuickViewProps) {
  if (!dealer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {dealer.name}
          </DialogTitle>
          <DialogDescription>
            Dealer information and details
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
                <span className="text-sm font-medium">Dealer ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {dealer.id.slice(0, 8)}...
                </Badge>
              </div>

              {dealer.shop_name && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Shop Name:</span>
                  <p className="text-sm">{dealer.shop_name}</p>
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
              {dealer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <p className="text-sm">{dealer.email}</p>
                  </div>
                </div>
              )}

              {dealer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Phone:</span>
                    <p className="text-sm">{dealer.phone}</p>
                  </div>
                </div>
              )}

              {dealer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Address:</span>
                    <p className="text-sm">{dealer.address}</p>
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
                  {new Date(dealer.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(dealer.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onEdit?.(dealer)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Dealer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}