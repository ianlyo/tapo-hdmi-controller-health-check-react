import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusThemePalette } from '../types/health';

interface Props {
  palette: StatusThemePalette;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const AmbientGlowBackground: React.FC<Props> = ({ palette }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base dark canvas */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bgBottom }]} pointerEvents="none" />

      {/* Ambient Radial / Vertical Glow */}
      <AnimatedLinearGradient
        colors={[palette.bgTop, palette.bgBottom]}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 0.9 }}
        style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]}
        pointerEvents="none"
      />
    </View>
  );
};
