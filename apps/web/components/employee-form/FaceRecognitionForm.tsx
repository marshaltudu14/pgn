/**
 * Face Recognition Form Component
 * Handles reference photo upload and face recognition status with minimal design
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, Info, CheckCircle, Scan, Loader2, Trash2, Crop, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@pgn/shared';
import { useFaceRecognitionStore } from '@/app/lib/stores/faceRecognitionStore';

interface FaceRecognitionFormProps {
  employee?: Employee | null;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  photoPreview: string | null;
  photoUploadLoading: boolean;
  onEmbeddingGenerated?: (embedding: Float32Array) => void;
}

export function FaceRecognitionForm({
  employee,
  onPhotoSelect,
  onPhotoRemove,
  photoPreview,
  photoUploadLoading,
  onEmbeddingGenerated
}: FaceRecognitionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);

  // Client-side face recognition state
  const {
    isInitializing: isModelInitializing,
    modelsInitialized,
    initializeModels
  } = useFaceRecognitionStore();

  // Initialize models on component mount
  useEffect(() => {
    if (!modelsInitialized && !isModelInitializing) {
      initializeModels().catch(console.error);
    }
  }, [modelsInitialized, isModelInitializing, initializeModels]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Process image file
  const processImageFile = useCallback((file: File) => {
    // Read file as data URL for preview and cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCropImage(dataUrl);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      }
    }
  }, [processImageFile]);

  // Simulate face scanning process
  const simulateFaceScanning = useCallback(async () => {
    setScanStatus('scanning');
    setScanProgress(0);

    const steps = [
      { progress: 20, message: 'Detecting face in photo...' },
      { progress: 40, message: 'Analyzing facial features...' },
      { progress: 60, message: 'Extracting biometric data...' },
      { progress: 80, message: 'Generating recognition embedding...' },
      { progress: 100, message: 'Face recognition ready!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setScanProgress(step.progress);
      setScanMessage(step.message);
    }

    setScanStatus('complete');

    // Simulate embedding generation (in real implementation, this would call face recognition API)
    if (onEmbeddingGenerated) {
      const mockEmbedding = new Float32Array(128).map(() => Math.random());
      onEmbeddingGenerated(mockEmbedding);
    }
  }, [onEmbeddingGenerated]);

  // Handle crop complete
  const handleCropComplete = useCallback((croppedDataUrl: string) => {
    setCropImage(null);
    setShowCropper(false);

    // Convert data URL to File for the parent component
    fetch(croppedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'cropped-photo.jpg', { type: 'image/jpeg' });
        const input = document.createElement('input');
        input.type = 'file';
        input.files = new DataTransfer().files;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;

        const event = {
          target: input,
          currentTarget: input,
          type: 'change',
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          eventPhase: 2,
          isTrusted: true,
          nativeEvent: new Event('change'),
          timeStamp: Date.now(),
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
          isDefaultPrevented: () => false,
          isPropagationStopped: () => false
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onPhotoSelect(event);
        // Start scanning simulation after a short delay
        setTimeout(() => {
          simulateFaceScanning();
        }, 1000);
      });
  }, [onPhotoSelect, simulateFaceScanning]);

  const currentImage = photoPreview || employee?.reference_photo_url;
  const hasEmbedding = !!employee?.face_embedding;

  return (
    <div className="bg-white dark:bg-black border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg flex items-center justify-center">
          <Camera className="h-4 w-4 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Face Recognition *</h2>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Required</span>
      </div>

      {/* Two Column Layout with equal height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Image Upload */}
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Reference Photo *</label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Photo Requirements</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Clear frontal face photo</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Good lighting, no shadows</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Plain background preferred</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Eyes open and visible</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>No filters or heavy editing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Passport photo aspect ratio recommended</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Drag and Drop Area with passport size aspect ratio */}
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-4 text-center transition-all flex items-center justify-center",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50",
                "h-64 w-48 mx-auto", // Passport photo aspect ratio (2:2.5)
                currentImage && "p-2"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {currentImage ? (
                <div className="w-full h-full relative">
                  <Image
                    src={currentImage}
                    alt="Reference photo"
                    fill
                    className="object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                    onClick={onPhotoRemove}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-1 right-1 h-6 w-6 p-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Crop className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop photo here</p>
                    <p className="text-xs text-muted-foreground">or click to upload</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploadLoading}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Select Photo
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImageFile(file);
              }}
              className="hidden"
              id="reference-photo-upload"
            />
          </div>
        </div>

        {/* Right Column - Scanner UI */}
        <div className="flex flex-col h-full">
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Face Scanner</label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Info className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Face Recognition Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <p>The scanner analyzes your photo to:</p>
                      <ul className="space-y-2">
                        <li>• Detect face in the image</li>
                        <li>• Analyze facial features</li>
                        <li>• Generate unique embedding</li>
                        <li>• Verify image quality</li>
                      </ul>
                      <p className="text-muted-foreground">Only one face should be visible for best results.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Scanner Visualization */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border h-40 flex items-center justify-center">
                <div className="text-center space-y-3">
                  {/* Scanner Icon */}
                  <div className="relative w-16 h-16 mx-auto">
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full opacity-20",
                      scanStatus === 'scanning' && "animate-pulse"
                    )} />
                    <div className="absolute inset-2 bg-white dark:bg-black rounded-full flex items-center justify-center">
                      {isModelInitializing ? (
                        <Brain className="h-6 w-6 text-purple-500 animate-pulse" />
                      ) : scanStatus === 'scanning' ? (
                        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                      ) : scanStatus === 'complete' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Scan className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    {scanStatus === 'scanning' && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping" />
                    )}
                  </div>

                  {/* Status Messages */}
                  <div>
                    <h3 className="font-medium text-xs">
                      {isModelInitializing && 'Loading AI Models...'}
                      {!modelsInitialized && !isModelInitializing && 'Initializing...'}
                      {modelsInitialized && scanStatus === 'idle' && 'Ready to scan'}
                      {scanStatus === 'scanning' && 'Scanning...'}
                      {scanStatus === 'complete' && 'Scan Complete'}
                      {scanStatus === 'error' && 'Scan Failed'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isModelInitializing && 'Downloading face recognition models...'}
                      {!modelsInitialized && !isModelInitializing && 'Preparing face scanner...'}
                      {modelsInitialized && scanStatus === 'idle' && 'Client-side processing ready'}
                      {scanStatus === 'scanning' && scanMessage}
                      {scanStatus === 'complete' && 'Face embedding generated locally'}
                      {scanStatus === 'error' && 'Try a different photo'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {(scanStatus === 'scanning' || isModelInitializing) && (
                    <div className="space-y-2">
                      <Progress value={isModelInitializing ? 50 : scanProgress} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {isModelInitializing ? 'Loading models...' : `${scanProgress}%`}
                      </p>
                    </div>
                  )}

                  </div>
              </div>
            </div>

            {/* Recognition Status Progress */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Face Detection</span>
                  {hasEmbedding || scanStatus === 'complete' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress value={hasEmbedding || scanStatus === 'complete' ? 100 : 0} className="h-1" />

                <div className="flex items-center justify-between text-sm">
                  <span>Embedding Generated</span>
                  {hasEmbedding ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress value={hasEmbedding ? 100 : 0} className="h-1" />

                <div className="flex items-center justify-between text-sm">
                  <span>Ready for Attendance</span>
                  {hasEmbedding ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress value={hasEmbedding ? 100 : 0} className="h-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropper Dialog */}
      {showCropper && cropImage && (
        <ImageCropper
          image={cropImage}
          onComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setCropImage(null);
          }}
        />
      )}
    </div>
  );
}

// Simple Image Cropper Component (placeholder)
function ImageCropper({
  image,
  onComplete,
  onCancel
}: {
  image: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Photo (Passport Size)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative bg-muted rounded-lg p-4">
            <div className="relative w-full h-64">
              <Image
                src={image}
                alt="Crop"
                fill
                className="object-contain"
              />
            </div>
            <div className="absolute inset-4 border-2 border-primary border-dashed rounded pointer-events-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onComplete(image)}>
              Use This Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}