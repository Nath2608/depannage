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
import { useQuery } from '@tanstack/react-query';
import { Card, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

interface ServiceRequest {
  id: string;
  tradeType: 'PLUMBING' | 'LOCKSMITH';
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: string;
  description: string;
  createdAt: string;
  job?: {
    id: string;
    status: string;
    professional: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    PENDING: { label: 'En attente', color: Colors.light.warning, icon: 'time-outline' },
    SEARCHING: { label: 'Recherche pro', color: Colors.light.info, icon: 'search-outline' },
    QUOTE_SENT: { label: 'Devis reçu', color: Colors.light.primary, icon: 'document-text-outline' },
    ACCEPTED: { label: 'Acceptée', color: Colors.light.success, icon: 'checkmark-circle-outline' },
    IN_PROGRESS: { label: 'En cours', color: Colors.light.primary, icon: 'construct-outline' },
    COMPLETED: { label: 'Terminée', color: Colors.light.success, icon: 'checkmark-done-outline' },
    CANCELLED: { label: 'Annulée', color: Colors.light.textTertiary, icon: 'close-circle-outline' },
  };
  return statusMap[status] || { label: status, color: Colors.light.textSecondary, icon: 'help-outline' };
};

const getTradeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  return type === 'PLUMBING' ? 'water-outline' : 'key-outline';
};

const getTradeLabel = (type: string) => {
  return type === 'PLUMBING' ? 'Plomberie' : 'Serrurerie';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const RequestCard: React.FC<{ request: ServiceRequest }> = ({ request }) => {
  const statusInfo = getStatusInfo(request.status);

  const handlePress = () => {
    if (request.job) {
      router.push(`/job/${request.job.id}`);
    } else {
      router.push(`/request/${request.id}`);
    }
  };

  return (
    <Card variant="elevated" onPress={handlePress} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.tradeInfo}>
          <View style={[styles.tradeIcon, { backgroundColor: Colors.light.primary + '15' }]}>
            <Ionicons
              name={getTradeIcon(request.tradeType)}
              size={20}
              color={Colors.light.primary}
            />
          </View>
          <View>
            <Text style={styles.tradeLabel}>{getTradeLabel(request.tradeType)}</Text>
            <Text style={styles.date}>{formatDate(request.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {request.description}
      </Text>

      {request.job?.professional && (
        <View style={styles.professionalInfo}>
          <Ionicons name="person-circle-outline" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.professionalName}>
            {request.job.professional.user.firstName} {request.job.professional.user.lastName}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Pressable style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Voir détails</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
        </Pressable>
      </View>
    </Card>
  );
};

export default function RequestsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['service-requests'],
    queryFn: api.requests.getMyRequests,
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement des demandes..." />;
  }

  const requests = data?.data || [];

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="folder-open-outline"
              size={64}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore fait de demande de service
            </Text>
            <Pressable
              style={styles.newRequestButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.newRequestButtonText}>Faire une demande</Text>
            </Pressable>
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
  card: {
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tradeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  date: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.xs,
  },
  professionalName: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
    fontWeight: FontWeights.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.light.primary,
    fontWeight: FontWeights.medium,
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
    marginBottom: Spacing.lg,
  },
  newRequestButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  newRequestButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.white,
  },
});
