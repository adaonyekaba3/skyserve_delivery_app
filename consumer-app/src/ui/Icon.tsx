import React from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type IconName =
  | 'home'
  | 'file-text'
  | 'shopping-cart'
  | 'user'
  | 'search'
  | 'map-pin'
  | 'bell'
  | 'refresh-cw'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'check'
  | 'check-circle'
  | 'x'
  | 'plus'
  | 'minus'
  | 'credit-card'
  | 'log-out'
  | 'help-circle'
  | 'settings'
  | 'arrow-left'
  | 'arrow-right'
  | 'star'
  | 'clock'
  | 'navigation'
  | 'cpu'
  | 'battery'
  | 'phone'
  | 'mail'
  | 'map'
  | 'shield'
  | 'alert-triangle'
  | 'smartphone'
  | 'heart'
  | 'trash-2'
  | 'package'
  | 'send'
  | 'share-2'
  | 'copy'
  | 'truck'
  | 'gift'
  | 'briefcase'
  | 'feather'
  | 'image'
  | 'upload'
  | 'download'
  | 'info'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'edit-3'
  | 'zap';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle | ViewStyle>;
}

export function Icon({ name, size = 22, color, style }: IconProps) {
  return <Feather name={name} size={size} color={color} style={style as any} />;
}

export default Icon;
