import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Card, StatusBadge, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { api } from '@services/api';
import { socketService } from '@services/socket';

export default function DashboardScreen() {
  const { user, professional, setAvailability } = useAuthStore();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['professional-stats'],
    queryFn: api.professional.getStats,
  });

  const { data: earnings } = useQuery({
    queryKey: ['professional-earnings', 'month'],
    queryFn: () => api.professional.getEarnings('month'),
  });

  const { data: pendingJobs } = useQuery({
    queryKey: ['pending-jobs'],
    queryFn: () => api.jobs.getMyJobs('IN_PROGRESS'),
  });

  useEffect(() => {
    // Connect to socket for real-time notifications
    socketService.connect();

    const unsubscribe = socketService.onNewRequest((data) => {
      // Handle new request notification
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAvailabilityChange = async (value: boolean) => {
    try {
      await setAvailability(value);
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  const statsData = stats?.data || {};
  const earningsData = earnings?.data || {};
  const activeJobs = pendingJobs?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Header with availability toggle */}
        <Card variant="elevated" style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <StatusBadge
                  status={professional?.isAvailable ? 'online' : 'offline'}
                  size="sm"
                />
              </View>
            </View>
            <View style={styles.availabilityToggle}>
              <Text style={styles.toggleLabel}>Disponible</Text>
              <Switch
                value={professional?.isAvailable}
                onValueChange={handleAvailabilityChange}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary + '50' }}
                thumbColor={professional?.isAvailable ? Colors.light.primary : Colors.light.textTertiary}
              />
            </View>
          </View>
        </Card>

        {/* Earnings Card */}
        <Card variant="elevated" style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsTitle}>Gains ce mois</Text>
            <Ionicons name="trending-up" size={20} color={Colors.light.success} />
          </View>
          <Text style={styles.earningsAmount}>
            {(earningsData.total || 0).toFixed(2)} €
          </Text>
          <View style={styles.earningsDetails}>
            <View style={styles.earningsDetail}>
              <Text style={styles.earningsDetailLabel}>Missions</Text>
              <Text style={styles.earningsDetailValue}>{earningsData.jobsCount || 0}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsDetail}>
              <Text style={styles.earningsDetailLabel}>Moyenne/mission</Text>
              <Text style={styles.earningsDetailValue}>
                {(earningsData.average || 0).toFixed(0)} €
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card variant="outlined" style={styles.statCard}>
            <Ionicons name="checkmark-done-circle" size={28} color={Colors.light.success} />
            <Text style={styles.statValue}>{statsData.completedJobs || 0}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <Ionicons name="star" size={28} color={Colors.light.warning} />
            <Text style={styles.statValue}>{(statsData.rating || 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <Ionicons name="time" size={28} color={Colors.light.info} />
            <Text style={styles.statValue}>{statsData.avgResponseTime || 0}min</Text>
            <Text style={styles.statLabel}>Temps réponse</Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <Ionicons name="thumbs-up" size={28} color={Colors.light.primary} />
            <Text style={styles.statValue}>{statsData.acceptanceRate || 0}%</Text>
            <Text style={styles.statLabel}>Acceptation</Text>
          </Card>
        </View>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missions en cours</Text>
            {activeJobs.map((job: any) => (
              <Card
                key={job.id}
                variant="outlined"
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
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>
                      {job.serviceRequest.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
                    </Text>
                    <Text style={styles.jobAddress} numberOfLines={1}>
                      {job.serviceRequest.address || 'Adresse non disponible'}
                    </Text>
                  </View>
                  <StatusBadge status={job.status.toLowerCase() as any} size="sm" />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <Card
              variant="outlined"
              onPress={() => router.push('/(tabs)/requests')}
              style={styles.quickAction}
            >
              <Ionicons name="notifications" size={24} color={Colors.light.primary} />
              <Text style={styles.quickActionText}>Demandes</Text>
            </Card>
            <Card
              variant="outlined"
              onPress={() => router.push('/(tabs)/missions')}
              style={styles.quickAction}
            >
              <Ionicons name="calendar" size={24} color={Colors.light.primary} />
              <Text style={styles.quickActionText}>Planning</Text>
            </Card>
            <Card
              variant="outlined"
              onPress={() => router.push('/earnings')}
              style={styles.quickAction}
            >
              <Ionicons name="wallet" size={24} color={Colors.light.primary} />
              <Text style={styles.quickActionText}>Revenus</Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  availabilityCard: {
    backgroundColor: Colors.light.background,
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  availabilityToggle: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  earningsCard: {
    backgroundColor: Colors.light.primary,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  earningsTitle: {
    fontSize: FontSizes.md,
    color: Colors.light.white,
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
    marginBottom: Spacing.md,
  },
  earningsDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  earningsDetail: {
    flex: 1,
    alignItems: 'center',
  },
  earningsDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  earningsDetailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.white,
    opacity: 0.8,
  },
  earningsDetailValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  jobCard: {
    marginBottom: Spacing.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  jobAddress: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  quickActionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.text,
  },
});
