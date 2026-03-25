import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';
import { socketService } from '@services/socket';

interface ServiceRequest {
  id: string;
  tradeType: string;
  urgencyLevel: string;
  description: string;
  address?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  createdAt: string;
  customer: {
    user: {
      firstName: string;
    };
  };
}

const getUrgencyInfo = (level: string) => {
  const map: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    LOW: { label: 'Pas urgent', color: Colors.light.success, icon: 'time-outline' },
    MEDIUM: { label: 'Normal', color: Colors.light.info, icon: 'calendar-outline' },
    HIGH: { label: 'Urgent', color: Colors.light.warning, icon: 'alert-circle' },
    EMERGENCY: { label: 'Urgence', color: Colors.light.error, icon: 'flash' },
  };
  return map[level] || map.MEDIUM;
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const RequestCard: React.FC<{ request: ServiceRequest }> = ({ request }) => {
  const urgency = getUrgencyInfo(request.urgencyLevel);

  return (
    <Card
      variant="elevated"
      onPress={() => router.push(`/request/${request.id}`)}
      style={[
        styles.requestCard,
        request.urgencyLevel === 'EMERGENCY' && styles.emergencyCard,
      ]}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestType}>
          <View style={styles.typeIcon}>
            <Ionicons
              name={request.tradeType === 'PLUMBING' ? 'water' : 'key'}
              size={20}
              color={Colors.light.primary}
            />
          </View>
          <View>
            <Text style={styles.typeName}>
              {request.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
            </Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(request.createdAt)}</Text>
          </View>
        </View>

        <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '15' }]}>
          <Ionicons name={urgency.icon} size={14} color={urgency.color} />
          <Text style={[styles.urgencyText, { color: urgency.color }]}>
            {urgency.label}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {request.description}
      </Text>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>
            {request.address || 'Adresse en attente'}
          </Text>
        </View>
        {request.distance !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>
              À {request.distance < 1 ? `${(request.distance * 1000).toFixed(0)}m` : `${request.distance.toFixed(1)}km`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.requestFooter}>
        <Text style={styles.customerName}>
          Demande de {request.customer.user.firstName}
        </Text>
        <View style={styles.viewAction}>
          <Text style={styles.viewActionText}>Voir et répondre</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
        </View>
      </View>
    </Card>
  );
};

export default function RequestsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['available-requests'],
    queryFn: api.requests.getAvailable,
    refetchInterval: 30000,
  });

  useEffect(() => {
    socketService.connect();

    const unsubscribe = socketService.onNewRequest((newRequest) => {
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  if (isLoading) {
    return <Loading fullScreen text="Chargement des demandes..." />;
  }

  const requests: ServiceRequest[] = data?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.light.primary]}
          />
        }
        ListHeaderComponent={
          requests.length > 0 ? (
            <View style={styles.headerInfo}>
              <Ionicons name="information-circle" size={18} color={Colors.light.info} />
              <Text style={styles.headerInfoText}>
                {requests.length} demande{requests.length > 1 ? 's' : ''} dans votre zone
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off" size={48} color={Colors.light.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              Il n'y a pas de nouvelles demandes dans votre zone pour le moment.
              Activez votre disponibilité pour recevoir des alertes.
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
    backgroundColor: Colors.light.surface,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  headerInfoText: {
    fontSize: FontSizes.sm,
    color: Colors.light.info,
    fontWeight: FontWeights.medium,
  },
  requestCard: {
    gap: Spacing.md,
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  timeAgo: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  urgencyText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  requestDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  customerName: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  viewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewActionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
