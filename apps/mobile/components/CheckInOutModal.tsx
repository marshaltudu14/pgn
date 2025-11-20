import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useAttendance,
  useAttendanceLoading,
  useAttendanceError
} from '@/store/attendance-store';
import { getCurrentLocation } from '@/utils/location';
import { CheckInMobileRequest, CheckOutMobileRequest } from '@pgn/shared';

interface CheckInOutModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'checkin' | 'checkout';
}

const { width: screenWidth } = Dimensions.get('window');

export default function CheckInOutModal({ visible, onClose, mode }: CheckInOutModalProps) {
  const colorScheme = useColorScheme();
  const isLoading = useAttendanceLoading();
  const error = useAttendanceError();

  const [isCapturing, setIsCapturing] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [step, setStep] = useState<'location' | 'camera' | 'processing'>('location');

  const cameraRef = useRef<CameraView>(null);
  const [cameraType, setCameraType] = useState<CameraType>('front');

  const checkIn = useAttendance((state) => state.checkIn);
  const checkOut = useAttendance((state) => state.checkOut);
  const clearError = useAttendance((state) => state.clearError);

  // Camera methods from attendance store
  const setCameraRef = useAttendance((state) => state.setCameraRef);
  const capturePhoto = useAttendance((state) => state.capturePhoto);
  const validateCapturedPhoto = useAttendance((state) => state.validateCapturedPhoto);

  const fetchLocation = useCallback(async () => {
    try {
      setStep('location');
      const location = await getCurrentLocation();
      setLocationData(location);
      setStep('camera');
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please ensure GPS is enabled.',
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
      setIsCapturing(true);
      setStep('processing');

      // Set camera reference for attendance store
      if (cameraRef.current) {
        setCameraRef(cameraRef.current);
      }

      // Capture photo with compression
      const photo = await capturePhoto({
        quality: 0.7,
        aspectRatio: 1, // Square aspect ratio for consistency
      });

      // Validate photo
      const validation = validateCapturedPhoto(photo);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Process attendance
      await processAttendance(photo);
    } catch (error) {
      console.error('Failed to capture selfie:', error);
      Alert.alert(
        'Camera Error',
        error instanceof Error ? error.message : 'Failed to capture photo. Please try again.',
        [{ text: 'OK', onPress: () => setStep('camera') }]
      );
    } finally {
      setIsCapturing(false);
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
      <Text style={[styles.stepTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
        Getting Your Location
      </Text>
      <ActivityIndicator size="large" color="#FF9933" />
      <Text style={[styles.stepDescription, { color: colorScheme === 'dark' ? '#9ca3af' : '#64748b' }]}>
        Please wait while we get your current location...
      </Text>
    </View>
  );

  const renderCameraStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
        Take Your Selfie
      </Text>
      <Text style={[styles.stepDescription, { color: colorScheme === 'dark' ? '#9ca3af' : '#64748b' }]}>
        Position your face in the frame and tap capture
      </Text>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash="off"
        />

        {/* Face overlay guide */}
        <View style={styles.faceGuide} />

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[styles.captureButton, { backgroundColor: '#10b981' }]}
            onPress={captureSelfie}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.captureButtonText}>CAPTURE</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleCameraButton]}
            onPress={() => setCameraType(
              cameraType === 'front' ? 'back' : 'front'
            )}
          >
            <Text style={styles.toggleCameraText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
        Processing Attendance
      </Text>
      <ActivityIndicator size="large" color="#FF9933" />
      <Text style={[styles.stepDescription, { color: colorScheme === 'dark' ? '#9ca3af' : '#64748b' }]}>
        {mode === 'checkin' ? 'Checking you in...' : 'Checking you out...'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeModal}
    >
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeModal}
            disabled={isLoading || isCapturing}
          >
            <Text style={[styles.closeButtonText, { color: colorScheme === 'dark' ? '#9ca3af' : '#64748b' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
            {mode === 'checkin' ? 'Check In' : 'Check Out'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 'location' && renderLocationStep()}
          {step === 'camera' && renderCameraStep()}
          {step === 'processing' && renderProcessingStep()}
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  cameraContainer: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    maxWidth: 320,
    maxHeight: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  camera: {
    flex: 1,
  },
  faceGuide: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: 'transparent',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  captureButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleCameraButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
  },
  toggleCameraText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});