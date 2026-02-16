/**
 * HeaderButton - Clean header icon/text buttons for navigation headers
 * Avoids React Native Paper's IconButton which adds unwanted container styling on iOS
 */
import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/theme';

interface HeaderIconButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
  backgroundColor?: string;
}

interface HeaderTextButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  fontSize?: number;
}

/**
 * Icon button for headers - no background container
 */
export function HeaderIconButton({
  icon,
  onPress,
  color = colors.white,
  size = 22,
  backgroundColor,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.iconButton,
        backgroundColor ? { backgroundColor, borderRadius: 6 } : undefined,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </Pressable>
  );
}

/**
 * Text button for headers - e.g. "+ New"
 */
export function HeaderTextButton({
  label,
  onPress,
  color = colors.white,
  fontSize = 15,
}: HeaderTextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.textButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={{ color, fontSize, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Container for multiple header buttons in a row
 */
export function HeaderButtonGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
