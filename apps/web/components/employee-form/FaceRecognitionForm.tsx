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
import { Camera, Upload, Info, CheckCircle, Scan, Loader2, Trash2, RefreshCw, Brain, XCircle } from 'lucide-react';
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
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [qualityProgress, setQualityProgress] = useState(0);
  const [faceBoundingBox, setFaceBoundingBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [originalImageSize, setOriginalImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Local preview state for immediate feedback
  const [localPreview, setLocalPreview] = useState<string | null>(null);

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

  // Validate file size and aspect ratio
  const validateImageFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is 5MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`
      };
    }

    return { isValid: true };
  }, []);

  // Crop image to face region with proper aspect ratio
  const cropImageToFace = useCallback(async (img: HTMLImageElement, boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Target aspect ratio 7:9
      const targetAspectRatio = 7 / 9;
      let cropWidth = boundingBox.width * img.width;
      let cropHeight = boundingBox.height * img.height;
      let cropX = boundingBox.x * img.width;
      let cropY = boundingBox.y * img.height;

      // Add padding around face (20% of face size)
      const paddingX = cropWidth * 0.2;
      const paddingY = cropHeight * 0.2;

      cropX = Math.max(0, cropX - paddingX);
      cropY = Math.max(0, cropY - paddingY);
      cropWidth = Math.min(img.width - cropX, cropWidth + paddingX * 2);
      cropHeight = Math.min(img.height - cropY, cropHeight + paddingY * 2);

      // Adjust to maintain 7:9 aspect ratio
      const currentRatio = cropWidth / cropHeight;
      if (currentRatio > targetAspectRatio) {
        // Too wide, reduce width
        const newWidth = cropHeight * targetAspectRatio;
        cropX += (cropWidth - newWidth) / 2;
        cropWidth = newWidth;
      } else {
        // Too tall, reduce height
        const newHeight = cropWidth / targetAspectRatio;
        cropY += (cropHeight - newHeight) / 2;
        cropHeight = newHeight;
      }

      // Set canvas size to target dimensions (high quality)
      const outputSize = 400; // 400px width for high quality
      canvas.width = outputSize;
      canvas.height = Math.round(outputSize / targetAspectRatio);

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    });
  }, []);

  // Perform face detection and automatic cropping
  
  // Reset alert state when processing new image
  const resetAlertState = useCallback(() => {
    setFaceDetectionError(null);
    setDetectionProgress(0);
    setEmbeddingProgress(0);
    setQualityProgress(0);
    setScanStatus('idle');
    setScanProgress(0);
    setFaceBoundingBox(null);
    setOriginalImageSize(null);
  }, []);

  
  // Process image file with automatic face detection and cropping
  const processImageFile = useCallback(async (file: File) => {
    resetAlertState();

    // Validate file size and type
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setFaceDetectionError(validation.error || 'File validation failed');
      setScanStatus('error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFaceDetectionError('Invalid file type. Please upload an image file.');
      setScanStatus('error');
      return;
    }

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setScanStatus('scanning');
    setDetectionProgress(20);
    setEmbeddingProgress(0);

    try {
      // Perform face detection and embedding generation using client-side service
      setDetectionProgress(40);
      const result = await generateEmbeddingClientSide(file);

      if (!result.success || !result.detection?.detected) {
        setFaceDetectionError(result.error || 'No face detected in the image. Please upload a clear photo showing your face.');
        setScanStatus('error');
        setDetectionProgress(100);
        setEmbeddingProgress(0);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      setDetectionProgress(60);
      setEmbeddingProgress(30);

      // Validate face size and quality
      if (!result.detection.boundingBox) {
        setFaceDetectionError('No face bounding box detected');
        setScanStatus('error');
        setDetectionProgress(100);
        setEmbeddingProgress(0);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      const faceSize = result.detection.boundingBox.width * result.detection.boundingBox.height;
      if (faceSize < 0.08) {
        setFaceDetectionError('Face too small. Please upload a photo with a larger, clearer face.');
        setScanStatus('error');
        setDetectionProgress(100);
        setEmbeddingProgress(0);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      // Check for multiple faces
      if (result.detection.faceCount && result.detection.faceCount > 1) {
        setFaceDetectionError('Multiple faces detected. Please upload a photo with only one face.');
        setScanStatus('error');
        setDetectionProgress(100);
        setEmbeddingProgress(0);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      // Check face quality
      if (result.quality?.overall === 'unacceptable' || result.quality?.overall === 'poor') {
        const issues = result.quality?.issues?.join(', ') || 'Image quality too poor';
        setFaceDetectionError(`Image quality issues: ${issues}. Please upload a clearer photo.`);
        setScanStatus('error');
        setDetectionProgress(100);
        setEmbeddingProgress(0);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      // Set face detection marker for visualization
      if (result.detection.boundingBox) {
        setFaceBoundingBox({
          x: result.detection.boundingBox.x || 0,
          y: result.detection.boundingBox.y || 0,
          width: result.detection.boundingBox.width,
          height: result.detection.boundingBox.height
        });
      }

      setDetectionProgress(80);
      setEmbeddingProgress(60);

      // Crop image to face region if we have a valid detection
      let finalFile = file;
      let finalPreview = previewUrl;

      if (result.detection.boundingBox) {
        // Load image to HTML element for cropping
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = document.createElement('img') as HTMLImageElement;
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = previewUrl;
        });

        const croppedDataUrl = await cropImageToFace(img, result.detection.boundingBox);
        if (croppedDataUrl) {
          // Convert data URL to File
          const response = await fetch(croppedDataUrl);
          const blob = await response.blob();
          finalFile = new File([blob], 'face-cropped.jpg', { type: 'image/jpeg' });
          finalPreview = URL.createObjectURL(finalFile);
          setLocalPreview(finalPreview);
          URL.revokeObjectURL(previewUrl); // Clean up original preview
        }
      }

      setDetectionProgress(100);
      setEmbeddingProgress(80);

      // Final validation with cropped image
      const finalResult = await generateEmbeddingClientSide(finalFile);
      if (finalResult.success && finalResult.embedding) {
        // Create the event for parent component
        const input = document.createElement('input');
        input.type = 'file';
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(finalFile);
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
          nativeEvent: new Event('change', { bubbles: true }),
          timeStamp: Date.now(),
          preventDefault: () => {},
          stopPropagation: () => {},
          persist: () => {},
          isDefaultPrevented: () => false,
          isPropagationStopped: () => false
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onPhotoSelect(event);

        // Also call embedding callback if provided
        if (onEmbeddingGenerated) {
          onEmbeddingGenerated(finalResult.embedding);
        }

        setEmbeddingProgress(100);
        setScanStatus('complete');
      } else {
        // Fallback to original result if cropped validation fails
        if (result.embedding) {
          const input = document.createElement('input');
          input.type = 'file';
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(finalFile);
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
            nativeEvent: new Event('change', { bubbles: true }),
            timeStamp: Date.now(),
            preventDefault: () => {},
            stopPropagation: () => {},
            persist: () => {},
            isDefaultPrevented: () => false,
            isPropagationStopped: () => false
          } as unknown as React.ChangeEvent<HTMLInputElement>;

          onPhotoSelect(event);

          if (onEmbeddingGenerated) {
            onEmbeddingGenerated(result.embedding);
          }

          setEmbeddingProgress(100);
          setScanStatus('complete');
        } else {
          setFaceDetectionError('Failed to generate face embedding from processed image.');
          setScanStatus('error');
          setDetectionProgress(100);
          setEmbeddingProgress(0);
        }
      }

    } catch (error) {
      console.error('Error processing image:', error);
      setFaceDetectionError('Failed to process image. Please try again.');
      setScanStatus('error');
      setDetectionProgress(100);
      setEmbeddingProgress(0);
      URL.revokeObjectURL(previewUrl);
    }
  }, [resetAlertState, validateImageFile, setFaceDetectionError, onPhotoSelect, onEmbeddingGenerated, cropImageToFace]);

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

  const currentImage = localPreview || photoPreview || employee?.reference_photo_url;
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
                      Automatic face detection and cropping will be applied to your photo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Maximum file size: 5MB (high quality preferred)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Aspect ratio: 7:9 portrait recommended</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Clear frontal face with good lighting</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Only one face should be visible (auto-detected)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>No filters or heavy editing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>Automatic cropping to face region will be applied</span>
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
                "h-80 w-60 mx-auto", // 7:9 aspect ratio (320:400 ≈ 4:5)
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

                  {/* Face Detection Markers */}
                  {faceBoundingBox && originalImageSize && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className="absolute border-2 border-green-500 rounded"
                        style={{
                          left: `${(faceBoundingBox.x * 100)}%`,
                          top: `${(faceBoundingBox.y * 100)}%`,
                          width: `${(faceBoundingBox.width * 100)}%`,
                          height: `${(faceBoundingBox.height * 100)}%`,
                        }}
                      >
                        {/* Corner markers */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-green-500" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-green-500" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-green-500" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-green-500" />

                        {/* Confidence indicator */}
                        <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Face detected
                        </div>
                      </div>
                    </div>
                  )}

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
                    title="Replace photo"
                  >
                    <RefreshCw className="h-3 w-3" />
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
                      {scanStatus === 'scanning' && 'Scanning face...'}
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
    </div>
  );
}