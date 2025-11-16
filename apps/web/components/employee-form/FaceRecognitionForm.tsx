/**
 * Face Recognition Form Component
 * Handles reference photo upload and face recognition status
 */

'use client';

import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { Employee } from '@pgn/shared';

interface FaceRecognitionFormProps {
  employee?: Employee | null;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  photoPreview: string | null;
  photoUploadLoading: boolean;
}

export function FaceRecognitionForm({
  employee,
  onPhotoSelect,
  onPhotoRemove,
  photoPreview,
  photoUploadLoading
}: FaceRecognitionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white dark:bg-black border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
          <Camera className="h-4 w-4 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Face Recognition *</h2>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Required</span>
      </div>

      <div className="space-y-4">
        {/* Reference Photo Upload */}
        <div>
          <label className="text-sm font-medium mb-3 block">Reference Photo *</label>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={photoPreview || employee?.reference_photo_url || undefined} />
                <AvatarFallback>
                  <User className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoSelect}
                className="hidden"
                id="reference-photo-upload"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploadLoading}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Upload className="h-4 w-4 mr-2 inline" />
                  {photoUploadLoading ? 'Uploading...' : 'Upload Photo'}
                </button>
                {(photoPreview || employee?.reference_photo_url) && (
                  <button
                    type="button"
                    onClick={onPhotoRemove}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a clear frontal photo for face recognition. Max size: 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Face Embedding Status */}
        <div>
          <label className="text-sm font-medium mb-3 block">Face Recognition Status</label>
          <div className="flex items-center gap-3">
            {employee?.face_embedding ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Face recognition enabled</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Face recognition not set up</span>
              </div>
            )}
          </div>
        </div>

        {photoUploadLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing photo...</span>
              <span>60%</span>
            </div>
            <Progress value={60} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Generating face embedding for recognition
            </p>
          </div>
        )}
      </div>
    </div>
  );
}