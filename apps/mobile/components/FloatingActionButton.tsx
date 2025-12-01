import { COLORS } from '@/constants';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateDealerModal from './CreateDealerModal';
import CreateFarmerModal from './CreateFarmerModal';
import CreateRetailerModal from './CreateRetailerModal';

interface FabOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  onPress: () => void;
}

interface FloatingActionButtonProps {
  options: FabOption[];
  bottomOffset?: number;
}

export default function FloatingActionButton({
  options,
  bottomOffset = 20,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showRetailerModal, setShowRetailerModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const optionAnimations = useRef(
    options.map(() => new Animated.Value(0))
  ).current;

  const themeColors = {
    background: colors.background,
    text: colors.text,
    overlay: 'rgba(0, 0, 0, 0.3)',
  };

  // Toggle FAB expansion
  const toggleExpanded = () => {
    if (isExpanded) {
      collapseFAB();
    } else {
      expandFAB();
    }
  };

  // Expand FAB with animations
  const expandFAB = () => {
    setIsExpanded(true);

    // Animate main button
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate option appearance with stagger
    optionAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  };

  // Collapse FAB with animations
  const collapseFAB = useCallback(() => {
    // Animate option disappearance
    optionAnimations.forEach(anim => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    // Animate main button
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Update state after animation
    setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  }, [optionAnimations, rotationAnim, scaleAnim]);

  // Handle option press
  const handleOptionPress = (option: FabOption) => {
    collapseFAB();

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
  };

  // Close FAB when tapping outside
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        // Auto-collapse after 5 seconds if no interaction
        collapseFAB();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isExpanded, collapseFAB]);

  // Calculate position
  const bottomPosition = bottomOffset + insets.bottom;

  return (
    <>
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

      {/* Overlay backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={collapseFAB}
          activeOpacity={1}
        />
      )}

      {/* FAB Options */}
      {isExpanded &&
        options.map((option, index) => {
          const translateY = optionAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(index + 1) * 70],
          });

          const opacity = optionAnimations[index];

          return (
            <Animated.View
              key={option.id}
              style={[
                styles.optionContainer,
                {
                  bottom: bottomPosition + 20,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: option.color,
                  },
                ]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.8}
              >
                <option.icon size={20} color="#ffffff" />
              </TouchableOpacity>
              <View
                style={[
                  styles.optionLabel,
                  {
                    backgroundColor: themeColors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionLabelText,
                    {
                      color: themeColors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </View>
            </Animated.View>
          );
        })}

      {/* Main FAB Button */}
      <View
        style={[
          styles.container,
          {
            bottom: bottomPosition,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.mainButton,
            {
              backgroundColor: COLORS.SAFFRON,
              transform: [
                { scale: scaleAnim },
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.mainButtonInner}
            onPress={toggleExpanded}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    // No shadows for floating components
  },
  mainButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  optionContainer: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
  },
  optionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // No shadows for floating components
  },
  optionLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    // No shadows for floating components
  },
  optionLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
