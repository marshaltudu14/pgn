import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useAttendance,
  useAttendanceLoading,
  useAttendanceError
} from '@/store/attendance-store';
import { getCurrentLocation } from '@/utils/location';
import { CheckInMobileRequest, CheckOutMobileRequest } from '@pgn/shared';
import { COLORS } from '@/constants';

interface CheckInOutModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'checkin' | 'checkout';
}


export default function CheckInOutModal({ visible, onClose, mode }: CheckInOutModalProps) {
  const colorScheme = useColorScheme();
  const isLoading = useAttendanceLoading();
  const error = useAttendanceError();

  const [isCapturing, setIsCapturing] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [step, setStep] = useState<'location' | 'camera' | 'processing'>('location');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const cameraRef = useRef<CameraView>(null);
  const [cameraType, setCameraType] = useState<CameraType>('front');

  const checkIn = useAttendance((state) => state.checkIn);
  const checkOut = useAttendance((state) => state.checkOut);
  const clearError = useAttendance((state) => state.clearError);

  // Camera methods from attendance store
  const capturePhoto = useAttendance((state) => state.capturePhoto);
  const validateCapturedPhoto = useAttendance((state) => state.validateCapturedPhoto);

  
  // Pulse animation for loading states
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const fetchLocation = useCallback(async () => {
    try {
      setStep('location');
      const location = await getCurrentLocation();
      setLocationData(location);
      setStep('camera');
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert(
        'Location Required',
        'Unable to get your current location. Please ensure GPS is enabled and try again.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, [onClose]);

  const initializeModal = useCallback(async () => {
    try {
      // Reset state
      setStep('location');
      setLocationData(null);
      setIsCapturing(false);
      setIsCameraReady(false);

      // Get current location (permissions already handled by permissions screen)
      await fetchLocation();
    } catch (error) {
      console.error('Failed to initialize modal:', error);
      Alert.alert('Error', 'Failed to initialize attendance. Please try again.');
      onClose();
    }
  }, [onClose, fetchLocation]);

  useEffect(() => {
    if (visible) {
      initializeModal();
    }
  }, [visible, initializeModal]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);

  const captureSelfie = async () => {
    try {
      console.log('🎯 CheckInOutModal.captureSelfie: Starting selfie capture');
      console.log('🎯 CheckInOutModal.captureSelfie: Camera ready state:', isCameraReady);

      // Validate camera is ready
      if (!isCameraReady) {
        console.log('🎯 CheckInOutModal.captureSelfie: ERROR - Camera is not ready yet');
        throw new Error('Camera is still initializing. Please wait a moment and try again.');
      }

      setIsCapturing(true);
      setStep('processing');

      console.log('🎯 CheckInOutModal.captureSelfie: Checking camera ref...');
      console.log('🎯 CheckInOutModal.captureSelfie: cameraRef.current exists:', !!cameraRef.current);
      console.log('🎯 CheckInOutModal.captureSelfie: cameraRef.current type:', typeof cameraRef.current);

      // Validate camera is available
      if (!cameraRef.current) {
        console.log('🎯 CheckInOutModal.captureSelfie: ERROR - Camera ref is null');
        throw new Error('Camera is not ready');
      }

      console.log('🎯 CheckInOutModal.captureSelfie: Calling store capturePhoto...');
      // Capture photo directly with camera ref - no need to set it in store first
      const photo = await capturePhoto(cameraRef.current, {
        quality: 0.8,
        aspectRatio: 1,
      });
      console.log('🎯 CheckInOutModal.captureSelfie: Store capturePhoto completed');

      console.log('🎯 CheckInOutModal.captureSelfie: Validating photo...');
      // Validate photo
      const validation = validateCapturedPhoto(photo);
      console.log('🎯 CheckInOutModal.captureSelfie: Photo validation result:', validation);

      if (!validation.isValid) {
        console.log('🎯 CheckInOutModal.captureSelfie: ERROR - Photo validation failed:', validation.errors);
        throw new Error(validation.errors.join(', '));
      }

      console.log('🎯 CheckInOutModal.captureSelfie: Processing attendance...');
      // Process attendance
      await processAttendance(photo);
      console.log('🎯 CheckInOutModal.captureSelfie: Attendance processing completed');
    } catch (error) {
      console.log('🎯 CheckInOutModal.captureSelfie: ERROR - Exception occurred');
      console.log('🎯 CheckInOutModal.captureSelfie: Error type:', typeof error);
      console.log('🎯 CheckInOutModal.captureSelfie: Error:', error);
      console.error('Failed to capture selfie:', error);
      Alert.alert(
        'Camera Error',
        error instanceof Error ? error.message : 'Failed to capture photo. Please try again.',
        [{ text: 'OK', onPress: () => setStep('camera') }]
      );
    } finally {
      setIsCapturing(false);
      console.log('🎯 CheckInOutModal.captureSelfie: Finally block - isCapturing set to false');
    }
  };

  const processAttendance = async (photo: any) => {
    try {
      if (!locationData || !photo.base64) {
        throw new Error('Missing location or photo data');
      }

      const attendanceData = {
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp.getTime(),
          address: locationData.address,
        },
        selfie: photo.base64,
        deviceInfo: {
          platform: 'mobile',
          version: '1.0.0',
          model: 'React Native Device',
        },
      };

      let result;
      if (mode === 'checkin') {
        result = await checkIn(attendanceData as CheckInMobileRequest);
      } else {
        result = await checkOut(attendanceData as CheckOutMobileRequest);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          result.message || (mode === 'checkin' ? 'Checked in successfully!' : 'Checked out successfully!'),
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        throw new Error(result.message || 'Attendance failed');
      }
    } catch (error) {
      console.error('Attendance processing failed:', error);
      Alert.alert(
        'Attendance Error',
        error instanceof Error ? error.message : 'Failed to process attendance. Please try again.',
        [{ text: 'OK', onPress: () => setStep('camera') }]
      );
    }
  };

  const closeModal = () => {
    if (!isLoading && !isCapturing) {
      onClose();
    }
  };

  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.locationIcon, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.locationDot} />
          <View style={[styles.locationRing, { borderColor: COLORS.SAFFRON }]} />
        </Animated.View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          Getting Your Location
        </Text>
        <Text style={[styles.stepDescription, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
          Please wait while we accurately determine your current location...
        </Text>
      </View>

      <ActivityIndicator size="large" color={COLORS.SAFFRON} style={styles.loader} />
    </View>
  );

  const renderCameraStep = () => (
    <View style={styles.cameraStepContainer}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.fullCamera}
          facing={cameraType}
          flash="off"
          onCameraReady={() => {
            console.log('📷 CheckInOutModal: Camera ready callback triggered');
            setIsCameraReady(true);
          }}
        />

        {/* Camera overlay with instructions */}
        <View style={styles.cameraOverlay}>
          {/* Top section with instructions and flip button */}
          <View style={styles.cameraTopSection}>
            <View style={styles.cameraInstructionsTop}>
              <Text style={[styles.cameraTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                Take Your Selfie
              </Text>
              <Text style={[styles.cameraDescription, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                Position your face within the face frame
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.flipButtonTop, { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}
              onPress={() => setCameraType(cameraType === 'front' ? 'back' : 'front')}
            >
              <Camera
                size={24}
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          {/* Center face guide */}
          <View style={styles.faceGuideCenter}>
            <View style={[
              styles.faceOvalGuide,
              { borderColor: colorScheme === 'dark' ? 'rgba(255, 153, 51, 0.8)' : 'rgba(255, 153, 51, 1)' }
            ]} />
          </View>

          {/* Bottom section with capture button */}
          <View style={styles.cameraBottomSection}>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.captureButton, { backgroundColor: COLORS.SAFFRON }]}
                onPress={captureSelfie}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View style={styles.captureIcon}>
                    <View style={styles.captureInner} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.processingIcon, { transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="large" color={COLORS.SAFFRON} />
        </Animated.View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          Processing Attendance
        </Text>
        <Text style={[styles.stepDescription, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
          {mode === 'checkin' ? 'Checking you in and verifying your location...' : 'Checking you out and finalizing your attendance...'}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeModal}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' }]}>
        {/* Modern Header */}
        <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={closeModal}
            disabled={isLoading || isCapturing}
          >
            <ChevronLeft
              size={24}
              color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>
              {mode === 'checkin' ? 'Check In' : 'Check Out'}
            </Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 'location' && renderLocationStep()}
          {step === 'camera' && renderCameraStep()}
          {step === 'processing' && renderProcessingStep()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  locationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.SAFFRON,
    position: 'absolute',
  },
  locationRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  loader: {
    marginTop: 24,
  },
  cameraStepContainer: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  fullCamera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  cameraTopSection: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cameraInstructionsTop: {
    flex: 1,
    marginRight: 20,
  },
  flipButtonTop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'left',
  },
  cameraDescription: {
    fontSize: 16,
    textAlign: 'left',
    lineHeight: 24,
  },
  faceGuideCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -140 }, { translateY: -180 }],
    width: 280,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOvalGuide: {
    width: 280,
    height: 360,
    borderRadius: 140,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  cameraBottomSection: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraControls: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.SAFFRON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
  },
});