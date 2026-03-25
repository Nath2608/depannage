import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@constants/theme';

type StatusType =
  | 'online'
  | 'offline'
  | 'busy'
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const statusConfig: Record<StatusType, {
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  online: {
    label: 'Disponible',
    color: Colors.light.success,
    bgColor: Colors.light.successLight,
    icon: 'checkmark-circle',
  },
  offline: {
    label: 'Hors ligne',
    color: Colors.light.textTertiary,
    bgColor: Colors.light.surface,
    icon: 'moon',
  },
  busy: {
    label: 'Occupé',
    color: Colors.light.warning,
    bgColor: Colors.light.warningLight,
    icon: 'time',
  },
  pending: {
    label: 'En attente',
    color: Colors.light.warning,
    bgColor: Colors.light.warningLight,
    icon: 'hourglass',
  },
  accepted: {
    label: 'Accepté',
    color: Colors.light.success,
    bgColor: Colors.light.successLight,
    icon: 'checkmark-circle',
  },
  in_progress: {
    label: 'En cours',
    color: Colors.light.info,
    bgColor: Colors.light.infoLight,
    icon: 'construct',
  },
  completed: {
    label: 'Terminé',
    color: Colors.light.success,
    bgColor: Colors.light.successLight,
    icon: 'checkmark-done-circle',
  },
  cancelled: {
    label: 'Annulé',
    color: Colors.light.error,
    bgColor: Colors.light.errorLight,
    icon: 'close-circle',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const config = statusConfig[status];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={size === 'sm' ? 12 : 14}
        color={config.color}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: config.color },
            size === 'sm' && styles.labelSm,
          ]}
        >
          {config.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  labelSm: {
    fontSize: FontSizes.xs,
  },
});
