/**
 * Face Recognition Form Component
 * Handles reference photo upload and face recognition status with minimal design
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, Info, CheckCircle, Scan, Loader2, Trash2, Crop, Brain, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee } from '@pgn/shared';
import { useFaceRecognitionStore } from '@/app/lib/stores/faceRecognitionStore';
import { generateEmbeddingClientSide } from '@/lib/face-recognition-client';

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
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [qualityProgress, setQualityProgress] = useState(0);

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
    if (!modelsInitialized) return;
    setIsDragOver(true);
  }, [modelsInitialized]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Reset alert state when processing new image
  const resetAlertState = useCallback(() => {
    setFaceDetectionError(null);
    setDetectionProgress(0);
    setEmbeddingProgress(0);
    setQualityProgress(0);
    setScanStatus('idle');
    setScanProgress(0);
  }, []);

  // Process image file
  const processImageFile = useCallback((file: File) => {
    resetAlertState();
    // Read file as data URL for preview and cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCropImage(dataUrl);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, [resetAlertState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!modelsInitialized) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      }
    }
  }, [processImageFile, modelsInitialized]);

  // Real face detection and embedding generation
  const performFaceScanning = useCallback(async (imageFile: File) => {
    setScanStatus('scanning');
    setScanProgress(0);
    setFaceDetectionError(null);

    try {
      // Step 1: Detect face
      setScanProgress(20);
      setScanMessage('Detecting face in photo...');
      setDetectionProgress(50);

      const result = await generateEmbeddingClientSide(imageFile);

      if (!result.success) {
        setDetectionProgress(100);
        setScanStatus('error');
        setScanProgress(100);
        setFaceDetectionError(result.error || 'Face detection failed');
        return;
      }

      setDetectionProgress(100);
      setScanProgress(50);
      setScanMessage('Face detected successfully');

      // Step 2: Check face quality and confidence
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!result.detection?.confidence || result.detection.confidence < 0.8) {
        setScanStatus('error');
        setScanProgress(100);
        setFaceDetectionError('Face not clearly visible or confidence too low. Please upload a clear, well-lit frontal photo showing the full face.');
        return;
      }

      if (result.quality && (result.quality.overall === 'unacceptable' || result.quality.overall === 'poor' || result.quality.overall === 'fair')) {
        setScanStatus('error');
        setScanProgress(100);
        const qualityIssues = result.quality.issues.length > 0 ? result.quality.issues.join(', ') : 'Insufficient image quality';
        setFaceDetectionError(`Image quality not sufficient for face recognition: ${qualityIssues}. Please provide a clear, well-lit photo with good contrast and sharpness.`);
        return;
      }

      // Step 3: Generate embedding
      setScanProgress(75);
      setScanMessage('Generating face embedding...');
      setEmbeddingProgress(75);

      await new Promise(resolve => setTimeout(resolve, 300));
      setEmbeddingProgress(100);

      // Step 4: Complete
      setQualityProgress(100);
      setScanProgress(100);
      setScanMessage('Face recognition ready!');
      setScanStatus('complete');

      if (onEmbeddingGenerated && result.embedding) {
        onEmbeddingGenerated(result.embedding);
      }

    } catch (error) {
      console.error('Face scanning error:', error);
      setScanStatus('error');
      setScanProgress(100);
      setFaceDetectionError('Face scanning failed: ' + (error as Error).message);
    }
  }, [onEmbeddingGenerated]);

  // Handle crop complete
  const handleCropComplete = useCallback(async (croppedDataUrl: string) => {
    setCropImage(null);
    setShowCropper(false);

    try {
      // Convert data URL to File for the parent component
      const response = await fetch(croppedDataUrl);
      const blob = await response.blob();
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

      // Start real face scanning after a short delay
      setTimeout(() => {
        performFaceScanning(file);
      }, 1000);
    } catch (error) {
      console.error('Error processing cropped image:', error);
      setFaceDetectionError('Failed to process image. Please try again.');
      setScanStatus('error');
    }
  }, [onPhotoSelect, performFaceScanning]);

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
                    <DialogDescription>
                      Guidelines for uploading a suitable reference photo for face recognition
                    </DialogDescription>
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
                isDragOver && modelsInitialized
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50",
                "h-64 w-48 mx-auto", // Passport photo aspect ratio (2:2.5)
                currentImage && "p-2",
                (!modelsInitialized || isModelInitializing) && "opacity-50 cursor-not-allowed"
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
                    onClick={() => {
                      resetAlertState();
                      onPhotoRemove();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-1 right-1 h-6 w-6 p-0 rounded-full"
                    onClick={() => {
                      resetAlertState();
                      fileInputRef.current?.click();
                    }}
                    disabled={!modelsInitialized || isModelInitializing}
                  >
                    <Crop className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center justify-center h-full">
                  {isModelInitializing ? (
                    <>
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                      <div>
                        <p className="text-sm font-medium">Loading face recognition models...</p>
                        <p className="text-xs text-muted-foreground">Please wait</p>
                      </div>
                    </>
                  ) : !modelsInitialized ? (
                    <>
                      <Brain className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Models failed to load</p>
                        <p className="text-xs text-muted-foreground">Please refresh the page</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Drop photo here</p>
                        <p className="text-xs text-muted-foreground">or click to upload</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetAlertState();
                          fileInputRef.current?.click();
                        }}
                        disabled={photoUploadLoading}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Select Photo
                      </Button>
                    </>
                  )}
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
                      <DialogDescription>
                        Information about how the face recognition system processes photos
                      </DialogDescription>
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

            {/* Face Detection Alert */}
            {faceDetectionError && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {faceDetectionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Recognition Status Progress */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Face Detection</span>
                  {hasEmbedding || scanStatus === 'complete' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : scanStatus === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress
                  value={scanStatus === 'error' ? 100 : (hasEmbedding || scanStatus === 'complete' ? 100 : detectionProgress)}
                  className={cn(
                    "h-1",
                    scanStatus === 'error' && "[&>div]:bg-red-500"
                  )}
                />

                <div className="flex items-center justify-between text-sm">
                  <span>Embedding Generated</span>
                  {hasEmbedding ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : scanStatus === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress
                  value={scanStatus === 'error' ? 100 : (hasEmbedding ? 100 : embeddingProgress)}
                  className={cn(
                    "h-1",
                    scanStatus === 'error' && "[&>div]:bg-red-500"
                  )}
                />

                <div className="flex items-center justify-between text-sm">
                  <span>Quality Check</span>
                  {hasEmbedding ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : scanStatus === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress
                  value={scanStatus === 'error' ? 100 : (hasEmbedding ? 100 : qualityProgress)}
                  className={cn(
                    "h-1",
                    scanStatus === 'error' && "[&>div]:bg-red-500"
                  )}
                />

                <div className="flex items-center justify-between text-sm">
                  <span>Ready for Attendance</span>
                  {hasEmbedding ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : scanStatus === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <Progress
                  value={scanStatus === 'error' ? 100 : (hasEmbedding ? 100 : scanProgress)}
                  className={cn(
                    "h-1",
                    scanStatus === 'error' && "[&>div]:bg-red-500"
                  )}
                />
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
          <DialogDescription>
            Adjust the photo to ensure proper framing and composition for face recognition
          </DialogDescription>
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