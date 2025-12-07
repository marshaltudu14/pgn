import React, { useState, useCallback, useEffect } from 'react';
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
import { ChevronLeft, Plus, Phone, Mail, MapPin, User, Sprout, Users, ChevronDown } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useFarmerStore } from '@/store/farmer-store';
import { useRegionStore } from '@/store/region-store';
import { FarmerFormData, Retailer } from '@pgn/shared';
import { COLORS } from '@/constants';
import Spinner from '@/components/Spinner';
import RetailerSearchModal from '@/components/RetailerSearchModal';

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
  region_id?: string;
}

export default function CreateFarmerModal({ visible, onClose, retailerId }: CreateFarmerModalProps) {
  const colors = useThemeColors();
  const { createFarmer, isCreating } = useFarmerStore();
  const { regions, fetchRegions } = useRegionStore();

  const [formData, setFormData] = useState<FarmerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    farm_name: '',
    retailer_id: retailerId || '',
    region_id: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showRetailerSearch, setShowRetailerSearch] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // Fetch regions when modal opens
  useEffect(() => {
    if (visible && regions.length === 0) {
      fetchRegions();
    }
  }, [visible, regions.length, fetchRegions]);

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

    // Region validation
    if (!formData.region_id.trim()) {
      newErrors.region_id = 'Region is required';
    }

    // Retailer ID validation (optional for farmer)
    if (formData.retailer_id && !formData.retailer_id.trim()) {
      newErrors.retailer_id = 'Invalid retailer selection';
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
          region_id: '',
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
      region_id: '',
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
        <View style={styles.inputLabelContainer}>
          <Icon size={20} color={hasError ? colors.error : colors.primary} />
          <Text style={[styles.inputLabel, { color: hasError ? colors.error : colors.text }]}>
            {label}{required && ' *'}
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
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
        <View style={styles.header}>
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
            <View style={[styles.infoBox, { backgroundColor: colors.listBg }]}>
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

          {/* Region Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <MapPin size={20} color={errors.region_id ? colors.error : colors.primary} />
              <Text style={[styles.inputLabel, { color: errors.region_id ? colors.error : colors.text }]}>
                Region *
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.regionSelector,
                {
                  backgroundColor: colors.background,
                  borderColor: errors.region_id ? colors.error : colors.border,
                }
              ]}
              onPress={() => setShowRegionPicker(true)}
              disabled={isCreating}
            >
              <Text
                style={[
                  styles.regionSelectorText,
                  {
                    color: formData.region_id ? colors.text : colors.textSecondary,
                  }
                ]}
              >
                {(() => {
                  const selectedRegion = regions.find(r => r.id === formData.region_id);
                  return formData.region_id
                    ? selectedRegion ? `${selectedRegion.city}, ${selectedRegion.state}` : formData.region_id
                    : 'Select region';
                })()}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {errors.region_id && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.region_id}
              </Text>
            )}
          </View>

          {/* Region Picker Modal */}
          <Modal
            visible={showRegionPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRegionPicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowRegionPicker(false)}
            >
              <View style={[styles.regionPickerModal, { backgroundColor: colors.background }]}>
                <Text style={[styles.regionPickerTitle, { color: colors.text }]}>
                  Select Region
                </Text>
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                  {regions.map((region) => (
                    <TouchableOpacity
                      key={region.id}
                      style={[
                        styles.regionOption,
                        {
                          backgroundColor: colors.listBg,
                          borderBottomColor: colors.border,
                        }
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, region_id: region.id }));
                        setShowRegionPicker(false);
                        if (errors.region_id) {
                          setErrors(prev => ({ ...prev, region_id: undefined }));
                        }
                      }}
                    >
                      <Text style={[styles.regionOptionText, { color: colors.text }]}>
                        {region.city}, {region.state}
                      </Text>
                      {formData.region_id === region.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Retailer Selection Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Users size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Retailer (Optional)
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.retailerSelectionButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setShowRetailerSearch(true)}
              disabled={isCreating}
            >
              <Text style={[
                styles.retailerSelectionText,
                { color: selectedRetailer ? colors.text : colors.textSecondary }
              ]}>
                {selectedRetailer ? `${selectedRetailer.shop_name || selectedRetailer.name}` : 'Select retailer (optional)'}
              </Text>
              {selectedRetailer && (
                <TouchableOpacity
                  style={styles.clearRetailerButton}
                  onPress={() => {
                    setSelectedRetailer(null);
                    setFormData(prev => ({ ...prev, retailer_id: '' }));
                  }}
                >
                  <ChevronLeft size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.listBg }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Note: Farmers can be independent or linked to retailers. Selecting a retailer helps with tracking.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Retailer Search Modal */}
      <RetailerSearchModal
        visible={showRetailerSearch}
        onClose={() => setShowRetailerSearch(false)}
        onRetailerSelect={(retailer) => {
          setSelectedRetailer(retailer);
          setFormData(prev => ({ ...prev, retailer_id: retailer.id }));
        }}
        selectedRetailerId={selectedRetailer?.id}
      />
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
    paddingHorizontal: 4,
    paddingVertical: 4,
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
  retailerSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retailerSelectionText: {
    fontSize: 16,
    flex: 1,
  },
  clearRetailerButton: {
    marginLeft: 12,
    padding: 4,
  },
  regionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 50,
  },
  regionSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  regionPickerModal: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  regionPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  regionOptionText: {
    fontSize: 16,
  },
});