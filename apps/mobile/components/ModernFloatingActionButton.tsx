import { COLORS } from '@/constants';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  Store,
  Users,
  Sprout,
  Plus,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FAB,
  Portal,
  Provider,
  MD3LightTheme,
} from 'react-native-paper';
import CreateDealerModal from './CreateDealerModal';
import CreateFarmerModal from './CreateFarmerModal';
import CreateRetailerModal from './CreateRetailerModal';

interface FabOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

interface ModernFloatingActionButtonProps {
  options: FabOption[];
  bottomOffset?: number;
}

export default function ModernFloatingActionButton({
  options,
  bottomOffset = 20,
}: ModernFloatingActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showRetailerModal, setShowRetailerModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const colors = useThemeColors();

  // Enhanced theme for Material Design 3
  const theme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: COLORS.SAFFRON,
      secondary: colors.primary,
      background: colors.background,
      surface: colors.background,
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onBackground: colors.text,
      onSurface: colors.text,
      shadow: colors.border,
      elevation: {
        level0: 'transparent',
        level1: colors.border,
        level2: colors.border,
        level3: colors.border,
        level4: colors.border,
        level5: colors.border,
      },
    },
  };

  // Handle FAB state change
  const onStateChange = useCallback(({ open }: { open: boolean }) => {
    setOpen(open);
  }, []);

  // Handle option press with proper modal management
  const handleOptionPress = useCallback((option: FabOption) => {
    setOpen(false);

    // Open the appropriate modal based on the option
    setTimeout(() => {
      switch (option.id) {
        case 'create-dealer':
          setShowDealerModal(true);
          break;
        case 'create-retailer':
          setShowRetailerModal(true);
          break;
        case 'create-farmer':
          setShowFarmerModal(true);
          break;
        default:
          option.onPress();
      }
    }, 300);
  }, []);

  // Auto-collapse after 5 seconds of inactivity
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [open]);

  // Prepare actions with enhanced icons
  const actions = [
    {
      icon: ({ size, color }: { size?: number; color?: string }) => (
        <Store size={size || 20} color={color || '#FFFFFF'} />
      ),
      label: 'Add Dealer',
      onPress: () =>
        handleOptionPress(
          options.find(o => o.id === 'create-dealer') || options[0]
        ),
      accessibilityLabel: 'Create new dealer',
      style: { backgroundColor: '#3B82F6' },
    },
    {
      icon: ({ size, color }: { size?: number; color?: string }) => (
        <Users size={size || 20} color={color || '#FFFFFF'} />
      ),
      label: 'Add Retailer',
      onPress: () =>
        handleOptionPress(
          options.find(o => o.id === 'create-retailer') || options[1]
        ),
      accessibilityLabel: 'Create new retailer',
      style: { backgroundColor: '#10B981' },
    },
    {
      icon: ({ size, color }: { size?: number; color?: string }) => (
        <Sprout size={size || 20} color={color || '#FFFFFF'} />
      ),
      label: 'Add Farmer',
      onPress: () =>
        handleOptionPress(
          options.find(o => o.id === 'create-farmer') || options[2]
        ),
      accessibilityLabel: 'Create new farmer',
      style: { backgroundColor: '#F59E0B' },
    },
  ];

  // Calculate position - position above the bottom navigation
  const bottomPosition = 10; // Fixed position above the tab bar

  return (
    <Provider theme={theme}>
      <Portal>
        {/* FAB Group with Material Design 3 styling */}
        <FAB.Group
          open={open}
          visible={true}
          icon={({ color, size }) =>
            open ? (
              <X size={size || 24} color={color || '#FFFFFF'} />
            ) : (
              <Plus size={size || 24} color={color || '#FFFFFF'} />
            )
          }
          actions={actions}
          onStateChange={onStateChange}
          onPress={() => {
            if (open) {
              setOpen(false);
            }
          }}
          fabStyle={{
            backgroundColor: COLORS.SAFFRON,
            borderRadius: 16,
            marginBottom: 8,
          }}
          style={{
            position: 'absolute',
            bottom: bottomPosition,
            right: 16,
            zIndex: 1000,
          }}
          color="#FFFFFF"
          accessibilityLabel="Add new entity"
        />

        {/* Create Dealer Modal */}
        <CreateDealerModal
          visible={showDealerModal}
          onClose={() => setShowDealerModal(false)}
        />

        {/* Create Retailer Modal */}
        <CreateRetailerModal
          visible={showRetailerModal}
          onClose={() => setShowRetailerModal(false)}
        />

        {/* Create Farmer Modal */}
        <CreateFarmerModal
          visible={showFarmerModal}
          onClose={() => setShowFarmerModal(false)}
        />
      </Portal>
    </Provider>
  );
}
