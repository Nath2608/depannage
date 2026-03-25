import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, StatusBadge, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@constants/theme';
import { api } from '@services/api';
import { socketService } from '@services/socket';

const statusActions: Record<string, { next: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  ACCEPTED: { next: 'EN_ROUTE', label: 'Démarrer le trajet', icon: 'car' },
  EN_ROUTE: { next: 'ARRIVED', label: "Je suis arrivé", icon: 'location' },
  ARRIVED: { next: 'IN_PROGRESS', label: "Démarrer l'intervention", icon: 'construct' },
  IN_PROGRESS: { next: 'COMPLETED', label: 'Terminer la mission', icon: 'checkmark-done-circle' },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [finalAmount, setFinalAmount] = useState('');
  const [workDescription, setWorkDescription] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.jobs.getById(id!),
  });

  const updateStatus = useMutation({
    mutationFn: (action: string) => {
      switch (action) {
        case 'EN_ROUTE':
          return api.jobs.startRoute(id!);
        case 'ARRIVED':
          return api.jobs.arrive(id!);
        case 'IN_PROGRESS':
          return api.jobs.startWork(id!);
        default:
          throw new Error('Invalid action');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      refetch();
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  const completeJob = useMutation({
    mutationFn: () => api.jobs.complete(id!, {
      finalAmount: parseFloat(finalAmount),
      workDescription,
    }),
    onSuccess: () => {
      Alert.alert('Mission terminée', 'La mission a été marquée comme terminée.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  useEffect(() => {
    if (data?.data?.status === 'EN_ROUTE') {
      startLocationTracking();
    }
    return () => {
      stopLocationTracking();
    };
  }, [data?.data?.status]);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    setIsTracking(true);

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      (location) => {
        socketService.sendLocationUpdate(
          location.coords.latitude,
          location.coords.longitude
        );
        api.professional.updateLocation(
          location.coords.latitude,
          location.coords.longitude
        );
      }
    );
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
  };

  const handleCall = () => {
    if (job?.customer?.user?.phone) {
      Linking.openURL(`tel:${job.customer.user.phone}`);
    }
  };

  const handleNavigate = () => {
    if (job?.serviceRequest) {
      const { latitude, longitude, address } = job.serviceRequest;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url);
    }
  };

  const handleStatusAction = () => {
    const action = statusActions[job?.status];
    if (action) {
      if (action.next === 'COMPLETED') {
        setShowCompleteForm(true);
      } else {
        updateStatus.mutate(action.next);
      }
    }
  };

  const handleComplete = () => {
    if (!finalAmount) {
      Alert.alert('Erreur', 'Veuillez renseigner le montant final');
      return;
    }
    if (!workDescription) {
      Alert.alert('Erreur', 'Veuillez décrire les travaux effectués');
      return;
    }
    completeJob.mutate();
  };

  if (isLoading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  const job = data?.data;

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mission non trouvée</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const currentAction = statusActions[job.status];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Mission',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: job.serviceRequest.latitude,
                longitude: job.serviceRequest.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: job.serviceRequest.latitude,
                  longitude: job.serviceRequest.longitude,
                }}
              >
                <View style={styles.marker}>
                  <Ionicons name="home" size={20} color={Colors.light.white} />
                </View>
              </Marker>
            </MapView>

            <Button
              title="Itinéraire"
              variant="primary"
              onPress={handleNavigate}
              style={styles.navigateButton}
              icon={<Ionicons name="navigate" size={18} color={Colors.light.white} />}
            />
          </View>

          {/* Status */}
          <Card variant="elevated" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <StatusBadge status={job.status.toLowerCase() as any} />
              {isTracking && (
                <View style={styles.trackingBadge}>
                  <View style={styles.trackingDot} />
                  <Text style={styles.trackingText}>Position partagée</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Customer Info */}
          <Card variant="outlined" style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <Text style={styles.avatarText}>
                  {job.customer.user.firstName[0]}
                  {job.customer.user.lastName[0]}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {job.customer.user.firstName} {job.customer.user.lastName}
                </Text>
                <Text style={styles.customerAddress} numberOfLines={1}>
                  {job.serviceRequest.address}
                </Text>
              </View>
              <Button
                title=""
                variant="outline"
                onPress={handleCall}
                icon={<Ionicons name="call" size={20} color={Colors.light.primary} />}
                style={styles.callButton}
              />
            </View>
          </Card>

          {/* Job Details */}
          <Card variant="outlined" style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Détails de la mission</Text>

            <View style={styles.detailRow}>
              <Ionicons
                name={job.serviceRequest.tradeType === 'PLUMBING' ? 'water' : 'key'}
                size={18}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.detailText}>
                {job.serviceRequest.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={18} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>{job.serviceRequest.description}</Text>
            </View>

            {job.quote && (
              <View style={styles.quoteInfo}>
                <Text style={styles.quoteLabel}>Devis accepté</Text>
                <Text style={styles.quoteAmount}>{job.quote.totalAmount.toFixed(2)} €</Text>
              </View>
            )}
          </Card>

          {/* Complete Form */}
          {showCompleteForm && (
            <Card variant="outlined" style={styles.completeCard}>
              <Text style={styles.cardTitle}>Terminer la mission</Text>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Montant final (€)</Text>
                <TextInput
                  style={styles.formInput}
                  value={finalAmount}
                  onChangeText={setFinalAmount}
                  keyboardType="decimal-pad"
                  placeholder={job.quote?.totalAmount.toString() || '0.00'}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Travaux effectués</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={workDescription}
                  onChangeText={setWorkDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Décrivez les travaux réalisés..."
                />
              </View>

              <View style={styles.formActions}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={() => setShowCompleteForm(false)}
                  style={styles.formButton}
                />
                <Button
                  title="Confirmer"
                  onPress={handleComplete}
                  loading={completeJob.isPending}
                  style={styles.formButton}
                />
              </View>
            </Card>
          )}

          {/* Action Button */}
          {currentAction && !showCompleteForm && (
            <Button
              title={currentAction.label}
              onPress={handleStatusAction}
              loading={updateStatus.isPending}
              style={styles.actionButton}
              icon={<Ionicons name={currentAction.icon} size={20} color={Colors.light.white} />}
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
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.white,
  },
  navigateButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  statusCard: {},
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
  },
  trackingText: {
    fontSize: FontSizes.sm,
    color: Colors.light.success,
  },
  customerCard: {},
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  customerAddress: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  callButton: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
  },
  detailsCard: {
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
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
  quoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  quoteLabel: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  quoteAmount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.primary,
  },
  completeCard: {
    gap: Spacing.md,
  },
  formField: {
    gap: Spacing.xs,
  },
  formLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.textSecondary,
  },
  formInput: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formButton: {
    flex: 1,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
});
