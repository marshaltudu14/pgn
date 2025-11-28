import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Phone, Mail, MapPin, User, Sprout } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFarmerStore } from '@/store/farmer-store';
import { FarmerFormData } from '@pgn/shared';
import { COLORS } from '@/constants';
import Spinner from '@/components/Spinner';

interface CreateFarmerModalProps {
  visible: boolean;
  onClose: () => void;
  retailerId?: string; // For farmer hierarchy
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  farm_name?: string;
  retailer_id?: string;
}

export default function CreateFarmerModal({ visible, onClose, retailerId }: CreateFarmerModalProps) {
  const colorScheme = useColorScheme();
  const { createFarmer, isCreating } = useFarmerStore();

  const [formData, setFormData] = useState<FarmerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    farm_name: '',
    retailer_id: retailerId || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const colors = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTertiary: colorScheme === 'dark' ? '#48484A' : '#8E8E93',
    border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    primary: COLORS.SAFFRON,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    separator: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    statusBar: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    input: colorScheme === 'dark' ? '#2c2c2e' : '#f9fafb',
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must not exceed 100 characters';
    }

    // Retailer ID validation (required for farmer)
    if (!formData.retailer_id.trim()) {
      newErrors.retailer_id = 'Retailer selection is required';
    }

    // Phone validation
    if (formData.phone && !/^[+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    } else if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Phone number must have at least 10 digits';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Farm name validation
    if (formData.farm_name && formData.farm_name.trim().length > 100) {
      newErrors.farm_name = 'Farm name must not exceed 100 characters';
    }

    // Address validation
    if (formData.address && formData.address.trim().length > 500) {
      newErrors.address = 'Address must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof FarmerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form.');
      return;
    }

    try {
      const response = await createFarmer(formData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Farmer created successfully!',
          [{ text: 'OK', onPress: () => onClose() }]
        );
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          farm_name: '',
          retailer_id: retailerId || '',
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to create farmer');
      }
    } catch (error) {
      console.error('Error creating farmer:', error);
      Alert.alert(
        'Network Error',
        'Failed to create farmer. Please check your connection and try again.'
      );
    }
  }, [formData, validateForm, createFarmer, onClose, retailerId]);

  const handleClose = useCallback(() => {
    if (isCreating) return; // Prevent closing during submission

    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      farm_name: '',
      retailer_id: retailerId || '',
    });
    setErrors({});
    onClose();
  }, [isCreating, onClose, retailerId]);

  const renderInput = (
    field: keyof FarmerFormData,
    label: string,
    placeholder: string,
    icon: React.ComponentType<{ size?: number; color?: string }>,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    multiline: boolean = false,
    required: boolean = false
  ) => {
    const Icon = icon;
    const hasError = errors[field as keyof FormErrors];

    return (
      <View style={styles.inputContainer}>
        <View style={[styles.inputLabelContainer, { borderColor: hasError ? colors.error : colors.border }]}>
          <Icon size={20} color={hasError ? colors.error : colors.primary} />
          <Text style={[styles.inputLabel, { color: hasError ? colors.error : colors.text }]}>
            {label}{required && ' *'}
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              borderColor: hasError ? colors.error : colors.border,
              color: colors.text,
              height: multiline ? 100 : 50,
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={!isCreating}
        />
        {hasError && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors[field as keyof FormErrors]}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Modern Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            disabled={isCreating}
          >
            <ChevronLeft
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Create New Farmer
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.plusButton, { opacity: isCreating ? 0.5 : 1 }]}
            onPress={handleSubmit}
            disabled={isCreating}
          >
            <Plus size={24} color={isCreating ? colors.textSecondary : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {isCreating && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Spinner size={32} color={COLORS.SAFFRON} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Creating Farmer...
              </Text>
            </View>
          </View>
        )}

        {/* Form Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add a new farmer under a retailer to your business network
          </Text>

          {/* Retailer ID (hidden field, but shown for debugging) */}
          {retailerId && (
            <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F9FAFB' }]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Creating farmer under existing retailer
              </Text>
            </View>
          )}

          {/* Name Field */}
          {renderInput('name', 'Farmer Name', 'Enter farmer name', User, 'default', false, true)}

          {/* Farm Name Field */}
          {renderInput('farm_name', 'Farm Name', 'Enter farm name', Sprout, 'default')}

          {/* Phone Field */}
          {renderInput('phone', 'Phone Number', 'Enter phone number', Phone, 'phone-pad')}

          {/* Email Field */}
          {renderInput('email', 'Email Address', 'Enter email address', Mail, 'email-address')}

          {/* Address Field */}
          {renderInput('address', 'Address', 'Enter complete address', MapPin, 'default', true)}

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F9FAFB' }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Note: Farmers are linked to retailers and dealers. You can create unlimited farmers with proper tracking.
            </Text>
          </View>
        </ScrollView>
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
  plusButton: {
    padding: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 24,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoBox: {
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});