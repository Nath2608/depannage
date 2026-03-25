import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    requestId?: string;
    jobId?: string;
    quoteId?: string;
  };
  isRead: boolean;
  createdAt: string;
}

const getNotificationIcon = (type: string): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
  const iconMap: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    QUOTE_RECEIVED: { icon: 'document-text', color: Colors.light.primary },
    JOB_ACCEPTED: { icon: 'checkmark-circle', color: Colors.light.success },
    JOB_STARTED: { icon: 'play-circle', color: Colors.light.info },
    JOB_COMPLETED: { icon: 'checkmark-done-circle', color: Colors.light.success },
    PAYMENT_SUCCESS: { icon: 'card', color: Colors.light.success },
    PROFESSIONAL_ARRIVING: { icon: 'car', color: Colors.light.info },
    MESSAGE_RECEIVED: { icon: 'chatbubble', color: Colors.light.primary },
  };
  return iconMap[type] || { icon: 'notifications', color: Colors.light.textSecondary };
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const NotificationItem: React.FC<{
  notification: Notification;
  onPress: () => void;
}> = ({ notification, onPress }) => {
  const { icon, color } = getNotificationIcon(notification.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notificationItem,
        !notification.isRead && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !notification.isRead && styles.unreadText]}>
            {notification.title}
          </Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.getAll,
  });

  const markAsRead = useMutation({
    mutationFn: api.notifications.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: api.notifications.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    if (notification.data?.jobId) {
      router.push(`/job/${notification.data.jobId}`);
    } else if (notification.data?.requestId) {
      router.push(`/request/${notification.data.requestId}`);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Chargement des notifications..." />;
  }

  const notifications = data?.data || [];
  const hasUnread = notifications.some((n: Notification) => !n.isRead);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {hasUnread && (
        <Pressable
          style={styles.markAllButton}
          onPress={() => markAllAsRead.mutate()}
        >
          <Ionicons name="checkmark-done" size={18} color={Colors.light.primary} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </Pressable>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore reçu de notification
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  markAllText: {
    fontSize: FontSizes.sm,
    color: Colors.light.primary,
    fontWeight: FontWeights.medium,
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  unread: {
    backgroundColor: Colors.light.primaryLight + '08',
  },
  pressed: {
    backgroundColor: Colors.light.surface,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    flex: 1,
  },
  unreadText: {
    fontWeight: FontWeights.semibold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginLeft: Spacing.sm,
  },
  notificationBody: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    color: Colors.light.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
