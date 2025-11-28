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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Sprout, Phone, Mail, MapPin, User } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFarmerStore } from '@/store/farmer-store';
import { FarmerFormData } from '@pgn/shared';
import { COLORS } from '@/constants';

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
    background: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#8e8e93' : '#3c3c43',
    border: colorScheme === 'dark' ? '#38383a' : '#e5e7eb',
    input: colorScheme === 'dark' ? '#2c2c2e' : '#f9fafb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    primary: COLORS.SAFFRON,
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
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <Sprout size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Create New Farmer</Text>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { opacity: isCreating ? 0.5 : 1 }]}
            onPress={handleClose}
            disabled={isCreating}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

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
            <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f3f4f6' }]}>
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

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: isCreating ? 0.7 : 1,
              }
            ]}
            onPress={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Farmer</Text>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f3f4f6' }]}>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
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
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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