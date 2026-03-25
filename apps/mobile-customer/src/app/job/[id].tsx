import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@constants/theme';
import { api } from '@services/api';

interface JobDetails {
  id: string;
  status: string;
  estimatedArrival?: string;
  startedAt?: string;
  completedAt?: string;
  finalAmount?: number;
  professional: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string;
    };
    rating: number;
    reviewCount: number;
    currentLatitude?: number;
    currentLongitude?: number;
  };
  serviceRequest: {
    id: string;
    tradeType: string;
    urgencyLevel: string;
    description: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  quote?: {
    laborCost: number;
    partsCost: number;
    travelCost: number;
    totalAmount: number;
  };
}

const statusSteps = [
  { key: 'ACCEPTED', label: 'Accepté', icon: 'checkmark-circle' },
  { key: 'EN_ROUTE', label: 'En route', icon: 'car' },
  { key: 'ARRIVED', label: 'Arrivé', icon: 'location' },
  { key: 'IN_PROGRESS', label: 'En cours', icon: 'construct' },
  { key: 'COMPLETED', label: 'Terminé', icon: 'checkmark-done-circle' },
];

const getStatusIndex = (status: string) => {
  const index = statusSteps.findIndex((s) => s.key === status);
  return index === -1 ? 0 : index;
};

export default function JobTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.jobs.getById(id!),
    refetchInterval: 10000,
  });

  const job: JobDetails | undefined = data?.data;

  const handleCall = () => {
    if (job?.professional.user.phone) {
      Linking.openURL(`tel:${job.professional.user.phone}`);
    }
  };

  const handleChat = () => {
    router.push(`/chat/${job?.id}`);
  };

  const handlePayment = () => {
    router.push(`/payment/${job?.id}`);
  };

  const handleReview = () => {
    router.push(`/review/${job?.id}`);
  };

  if (isLoading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mission non trouvée</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const currentStatusIndex = getStatusIndex(job.status);
  const isCompleted = job.status === 'COMPLETED';
  const isPaid = job.status === 'PAID';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Suivi de mission',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {job.professional.currentLatitude && job.professional.currentLongitude && !isCompleted && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: job.serviceRequest.latitude,
                  longitude: job.serviceRequest.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: job.serviceRequest.latitude,
                    longitude: job.serviceRequest.longitude,
                  }}
                  title="Votre position"
                >
                  <View style={styles.customerMarker}>
                    <Ionicons name="home" size={20} color={Colors.light.white} />
                  </View>
                </Marker>

                <Marker
                  coordinate={{
                    latitude: job.professional.currentLatitude,
                    longitude: job.professional.currentLongitude,
                  }}
                  title={`${job.professional.user.firstName} ${job.professional.user.lastName}`}
                >
                  <View style={styles.proMarker}>
                    <Ionicons name="car" size={20} color={Colors.light.white} />
                  </View>
                </Marker>
              </MapView>
            </View>
          )}

          <Card variant="elevated" style={styles.professionalCard}>
            <View style={styles.professionalHeader}>
              <View style={styles.professionalAvatar}>
                <Text style={styles.avatarText}>
                  {job.professional.user.firstName[0]}
                  {job.professional.user.lastName[0]}
                </Text>
              </View>
              <View style={styles.professionalInfo}>
                <Text style={styles.professionalName}>
                  {job.professional.user.firstName} {job.professional.user.lastName}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={Colors.light.warning} />
                  <Text style={styles.ratingText}>
                    {job.professional.rating.toFixed(1)} ({job.professional.reviewCount} avis)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contactButtons}>
              <Pressable style={styles.contactButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color={Colors.light.primary} />
                <Text style={styles.contactButtonText}>Appeler</Text>
              </Pressable>
              <View style={styles.contactDivider} />
              <Pressable style={styles.contactButton} onPress={handleChat}>
                <Ionicons name="chatbubble" size={20} color={Colors.light.primary} />
                <Text style={styles.contactButtonText}>Message</Text>
              </Pressable>
            </View>
          </Card>

          <Card variant="outlined" style={styles.statusCard}>
            <Text style={styles.cardTitle}>Statut de l'intervention</Text>

            <View style={styles.statusTimeline}>
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <View key={step.key} style={styles.statusStep}>
                    <View style={styles.statusIconContainer}>
                      <View
                        style={[
                          styles.statusIcon,
                          isActive && styles.statusIconActive,
                          isCurrent && styles.statusIconCurrent,
                        ]}
                      >
                        <Ionicons
                          name={step.icon as any}
                          size={18}
                          color={isActive ? Colors.light.white : Colors.light.textTertiary}
                        />
                      </View>
                      {index < statusSteps.length - 1 && (
                        <View
                          style={[
                            styles.statusLine,
                            isActive && styles.statusLineActive,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.statusContent}>
                      <Text
                        style={[
                          styles.statusLabel,
                          isActive && styles.statusLabelActive,
                          isCurrent && styles.statusLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {job.estimatedArrival && job.status === 'EN_ROUTE' && (
              <View style={styles.etaContainer}>
                <Ionicons name="time" size={18} color={Colors.light.info} />
                <Text style={styles.etaText}>
                  Arrivée estimée : {new Date(job.estimatedArrival).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </Card>

          <Card variant="outlined" style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Détails de l'intervention</Text>

            <View style={styles.detailRow}>
              <Ionicons
                name={job.serviceRequest.tradeType === 'PLUMBING' ? 'water-outline' : 'key-outline'}
                size={20}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.detailText}>
                {job.serviceRequest.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>{job.serviceRequest.address || 'Position actuelle'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>{job.serviceRequest.description}</Text>
            </View>
          </Card>

          {job.quote && (
            <Card variant="outlined" style={styles.quoteCard}>
              <Text style={styles.cardTitle}>Devis accepté</Text>

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Main d'œuvre</Text>
                <Text style={styles.quoteValue}>{job.quote.laborCost.toFixed(2)} €</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Pièces</Text>
                <Text style={styles.quoteValue}>{job.quote.partsCost.toFixed(2)} €</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Déplacement</Text>
                <Text style={styles.quoteValue}>{job.quote.travelCost.toFixed(2)} €</Text>
              </View>
              <View style={[styles.quoteRow, styles.quoteTotalRow]}>
                <Text style={styles.quoteTotalLabel}>Total</Text>
                <Text style={styles.quoteTotalValue}>{job.quote.totalAmount.toFixed(2)} €</Text>
              </View>
            </Card>
          )}

          {isCompleted && !isPaid && (
            <Button
              title="Procéder au paiement"
              onPress={handlePayment}
              style={styles.paymentButton}
            />
          )}

          {isPaid && (
            <Button
              title="Laisser un avis"
              onPress={handleReview}
              variant="outline"
              style={styles.reviewButton}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  mapContainer: {
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  map: {
    flex: 1,
  },
  customerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.white,
  },
  proMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.white,
  },
  professionalCard: {
    gap: Spacing.md,
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  contactButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  contactButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.light.primary,
  },
  contactDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  statusCard: {
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  statusTimeline: {
    gap: 0,
  },
  statusStep: {
    flexDirection: 'row',
  },
  statusIconContainer: {
    alignItems: 'center',
    width: 36,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  statusIconActive: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  statusIconCurrent: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.light.border,
  },
  statusLineActive: {
    backgroundColor: Colors.light.success,
  },
  statusContent: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.md,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.textTertiary,
  },
  statusLabelActive: {
    color: Colors.light.text,
  },
  statusLabelCurrent: {
    fontWeight: FontWeights.semibold,
    color: Colors.light.primary,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  etaText: {
    fontSize: FontSizes.md,
    color: Colors.light.info,
    fontWeight: FontWeights.medium,
  },
  detailsCard: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  quoteCard: {
    gap: Spacing.sm,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  quoteValue: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },
  quoteTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  quoteTotalLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  quoteTotalValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.primary,
  },
  paymentButton: {
    marginTop: Spacing.sm,
  },
  reviewButton: {
    marginTop: Spacing.sm,
  },
});
