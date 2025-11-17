import React, { useMemo, useEffect } from 'react';
import { Animated } from 'react-native';
import { Loader2 } from 'lucide-react-native';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function Spinner({ size = 20, color = '#000000', className = '' }: SpinnerProps) {
  const spinValue = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const spin = () => {
      Animated.sequence([
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        spinValue.setValue(0);
        spin();
      });
    };

    spin();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate: spin }],
      }}
      className={className}
    >
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
}