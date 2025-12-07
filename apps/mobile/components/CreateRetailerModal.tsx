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
import { ChevronLeft, Plus, Phone, Mail, MapPin, Store, User, ChevronDown } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useRetailerStore } from '@/store/retailer-store';
import { useAuth } from '@/store/auth-store';
import { RetailerFormData, Dealer } from '@pgn/shared';
import { COLORS } from '@/constants';
import Spinner from '@/components/Spinner';
import DealerSearchModal from '@/components/DealerSearchModal';

interface CreateRetailerModalProps {
  visible: boolean;
  onClose: () => void;
  dealerId?: string; // For retailer hierarchy
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  shop_name?: string;
  dealer_id?: string;
  region_id?: string;
}

export default function CreateRetailerModal({ visible, onClose, dealerId }: CreateRetailerModalProps) {
  const colors = useThemeColors();
  const { createRetailer, isCreating } = useRetailerStore();
  const { user } = useAuth();

  const [formData, setFormData] = useState<RetailerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    shop_name: '',
    dealer_id: dealerId || '',
    region_id: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showDealerSearch, setShowDealerSearch] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

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

    // Dealer ID validation (optional for retailer)
    if (formData.dealer_id && !formData.dealer_id.trim()) {
      newErrors.dealer_id = 'Invalid dealer selection';
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

    // Shop name validation
    if (formData.shop_name && formData.shop_name.trim().length > 100) {
      newErrors.shop_name = 'Shop name must not exceed 100 characters';
    }

    // Address validation
    if (formData.address && formData.address.trim().length > 500) {
      newErrors.address = 'Address must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof RetailerFormData, value: string) => {
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
      const response = await createRetailer(formData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Retailer created successfully!',
          [{ text: 'OK', onPress: () => onClose() }]
        );
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          shop_name: '',
          dealer_id: dealerId || '',
          region_id: '',
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to create retailer');
      }
    } catch (error) {
      console.error('Error creating retailer:', error);
      Alert.alert(
        'Network Error',
        'Failed to create retailer. Please check your connection and try again.'
      );
    }
  }, [formData, validateForm, createRetailer, onClose, dealerId]);

  const handleClose = useCallback(() => {
    if (isCreating) return; // Prevent closing during submission

    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      shop_name: '',
      dealer_id: dealerId || '',
      region_id: '',
    });
    setErrors({});
    onClose();
  }, [isCreating, onClose, dealerId]);

  const renderInput = (
    field: keyof RetailerFormData,
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
              Create New Retailer
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
                Creating Retailer...
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
            Add a new retailer under a dealer to your business network
          </Text>

          {/* Dealer ID (hidden field, but shown for debugging) */}
          {dealerId && (
            <View style={[styles.infoBox, { backgroundColor: colors.listBg }]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Creating retailer under existing dealer
              </Text>
            </View>
          )}

          {/* Name Field */}
          {renderInput('name', 'Retailer Name', 'Enter retailer name', User, 'default', false, true)}

          {/* Shop Name Field */}
          {renderInput('shop_name', 'Shop Name', 'Enter shop name', Store, 'default')}

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
                {formData.region_id
                  ? user?.assignedCities.find(city => city === formData.region_id) || formData.region_id
                  : 'Select region'
                }
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
                {user?.assignedCities.map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.regionOption,
                      {
                        backgroundColor: colors.listBg,
                        borderBottomColor: colors.border,
                      }
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, region_id: city }));
                      setShowRegionPicker(false);
                      if (errors.region_id) {
                        setErrors(prev => ({ ...prev, region_id: undefined }));
                      }
                    }}
                  >
                    <Text style={[styles.regionOptionText, { color: colors.text }]}>
                      {city}
                    </Text>
                    {formData.region_id === city && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Dealer Selection Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Store size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Dealer (Optional)
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dealerSelectionButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setShowDealerSearch(true)}
              disabled={isCreating}
            >
              <Text style={[
                styles.dealerSelectionText,
                { color: selectedDealer ? colors.text : colors.textSecondary }
              ]}>
                {selectedDealer ? `${selectedDealer.shop_name || selectedDealer.name}` : 'Select dealer (optional)'}
              </Text>
              {selectedDealer && (
                <TouchableOpacity
                  style={styles.clearDealerButton}
                  onPress={() => {
                    setSelectedDealer(null);
                    setFormData(prev => ({ ...prev, dealer_id: '' }));
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
              Note: Retailers can be independent or linked to dealers. Selecting a dealer helps with tracking.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Dealer Search Modal */}
      <DealerSearchModal
        visible={showDealerSearch}
        onClose={() => setShowDealerSearch(false)}
        onDealerSelect={(dealer) => {
          setSelectedDealer(dealer);
          setFormData(prev => ({ ...prev, dealer_id: dealer.id }));
        }}
        selectedDealerId={selectedDealer?.id}
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
  dealerSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dealerSelectionText: {
    fontSize: 16,
    flex: 1,
  },
  clearDealerButton: {
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