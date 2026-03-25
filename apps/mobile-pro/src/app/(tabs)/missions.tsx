import React, { useState } from 'react';
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
import { Card, StatusBadge, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

type FilterStatus = 'all' | 'in_progress' | 'completed' | 'cancelled';

const filters: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'completed', label: 'Terminées' },
  { key: 'cancelled', label: 'Annulées' },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface Job {
  id: string;
  status: string;
  createdAt: string;
  finalAmount?: number;
  serviceRequest: {
    tradeType: string;
    address?: string;
    urgencyLevel: string;
  };
  customer: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

const JobCard: React.FC<{ job: Job }> = ({ job }) => (
  <Card
    variant="elevated"
    onPress={() => router.push(`/job/${job.id}`)}
    style={styles.jobCard}
  >
    <View style={styles.jobHeader}>
      <View style={styles.jobIcon}>
        <Ionicons
          name={job.serviceRequest.tradeType === 'PLUMBING' ? 'water' : 'key'}
          size={20}
          color={Colors.light.primary}
        />
      </View>
      <View style={styles.jobHeaderInfo}>
        <Text style={styles.jobType}>
          {job.serviceRequest.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
        </Text>
        <Text style={styles.jobDate}>{formatDate(job.createdAt)}</Text>
      </View>
      <StatusBadge status={job.status.toLowerCase() as any} />
    </View>

    <View style={styles.jobDetails}>
      <View style={styles.jobDetailRow}>
        <Ionicons name="person" size={16} color={Colors.light.textSecondary} />
        <Text style={styles.jobDetailText}>
          {job.customer.user.firstName} {job.customer.user.lastName}
        </Text>
      </View>
      <View style={styles.jobDetailRow}>
        <Ionicons name="location" size={16} color={Colors.light.textSecondary} />
        <Text style={styles.jobDetailText} numberOfLines={1}>
          {job.serviceRequest.address || 'Adresse non disponible'}
        </Text>
      </View>
    </View>

    {job.finalAmount && (
      <View style={styles.jobFooter}>
        <Text style={styles.jobAmount}>{job.finalAmount.toFixed(2)} €</Text>
      </View>
    )}
  </Card>
);

export default function MissionsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-jobs', selectedFilter],
    queryFn: () => api.jobs.getMyJobs(selectedFilter === 'all' ? undefined : selectedFilter.toUpperCase()),
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement des missions..." />;
  }

  const jobs: Job[] = data?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.filters}>
        {filters.map((filter) => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
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
              name="briefcase-outline"
              size={64}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>Aucune mission</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all'
                ? "Vous n'avez pas encore de missions"
                : `Aucune mission ${filters.find((f) => f.key === selectedFilter)?.label.toLowerCase()}`}
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: Colors.light.white,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  jobCard: {
    gap: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  jobHeaderInfo: {
    flex: 1,
  },
  jobType: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  jobDate: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  jobDetails: {
    gap: Spacing.xs,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jobDetailText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  jobFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.md,
    alignItems: 'flex-end',
  },
  jobAmount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.primary,
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
