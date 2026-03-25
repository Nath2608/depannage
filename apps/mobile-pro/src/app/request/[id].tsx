import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@constants/theme';
import { api } from '@services/api';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quote, setQuote] = useState({
    laborCost: '',
    partsCost: '',
    travelCost: '',
    estimatedDuration: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => api.requests.getById(id!),
  });

  const sendQuote = useMutation({
    mutationFn: () => api.requests.sendQuote(id!, {
      laborCost: parseFloat(quote.laborCost) || 0,
      partsCost: parseFloat(quote.partsCost) || 0,
      travelCost: parseFloat(quote.travelCost) || 0,
      estimatedDuration: parseInt(quote.estimatedDuration) || 60,
      notes: quote.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      Alert.alert('Devis envoyé', 'Votre devis a été envoyé au client.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  const declineRequest = useMutation({
    mutationFn: () => api.requests.decline(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      router.back();
    },
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  const request = data?.data;

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Demande non trouvée</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const totalQuote =
    (parseFloat(quote.laborCost) || 0) +
    (parseFloat(quote.partsCost) || 0) +
    (parseFloat(quote.travelCost) || 0);

  const handleSendQuote = () => {
    if (!quote.laborCost) {
      Alert.alert('Erreur', 'Veuillez renseigner le coût de main d\'œuvre');
      return;
    }
    if (!quote.estimatedDuration) {
      Alert.alert('Erreur', 'Veuillez renseigner la durée estimée');
      return;
    }
    sendQuote.mutate();
  };

  const handleDecline = () => {
    Alert.alert(
      'Refuser la demande',
      'Êtes-vous sûr de vouloir refuser cette demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: () => declineRequest.mutate() },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nouvelle demande',
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
                latitude: request.latitude,
                longitude: request.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: request.latitude,
                  longitude: request.longitude,
                }}
              >
                <View style={styles.marker}>
                  <Ionicons name="home" size={20} color={Colors.light.white} />
                </View>
              </Marker>
            </MapView>
          </View>

          {/* Request Details */}
          <Card variant="elevated" style={styles.detailsCard}>
            <View style={styles.headerRow}>
              <View style={styles.typeIcon}>
                <Ionicons
                  name={request.tradeType === 'PLUMBING' ? 'water' : 'key'}
                  size={24}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.typeName}>
                  {request.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
                </Text>
                <Text style={styles.customerName}>
                  {request.customer.user.firstName} {request.customer.user.lastName}
                </Text>
              </View>
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>
                  {request.urgencyLevel === 'EMERGENCY' ? 'Urgence' :
                   request.urgencyLevel === 'HIGH' ? 'Urgent' : 'Normal'}
                </Text>
              </View>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>Description du problème</Text>
              <Text style={styles.description}>{request.description}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={Colors.light.textSecondary} />
              <Text style={styles.infoText}>{request.address || 'Adresse en attente'}</Text>
            </View>

            {request.customer.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.infoText}>{request.customer.phone}</Text>
              </View>
            )}
          </Card>

          {/* Quote Form */}
          {showQuoteForm ? (
            <Card variant="outlined" style={styles.quoteCard}>
              <Text style={styles.quoteTitle}>Envoyer un devis</Text>

              <View style={styles.quoteRow}>
                <View style={styles.quoteField}>
                  <Text style={styles.quoteLabel}>Main d'œuvre (€)</Text>
                  <TextInput
                    style={styles.quoteInput}
                    value={quote.laborCost}
                    onChangeText={(v) => setQuote({ ...quote, laborCost: v })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
                <View style={styles.quoteField}>
                  <Text style={styles.quoteLabel}>Pièces (€)</Text>
                  <TextInput
                    style={styles.quoteInput}
                    value={quote.partsCost}
                    onChangeText={(v) => setQuote({ ...quote, partsCost: v })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
              </View>

              <View style={styles.quoteRow}>
                <View style={styles.quoteField}>
                  <Text style={styles.quoteLabel}>Déplacement (€)</Text>
                  <TextInput
                    style={styles.quoteInput}
                    value={quote.travelCost}
                    onChangeText={(v) => setQuote({ ...quote, travelCost: v })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
                <View style={styles.quoteField}>
                  <Text style={styles.quoteLabel}>Durée (min)</Text>
                  <TextInput
                    style={styles.quoteInput}
                    value={quote.estimatedDuration}
                    onChangeText={(v) => setQuote({ ...quote, estimatedDuration: v })}
                    keyboardType="number-pad"
                    placeholder="60"
                  />
                </View>
              </View>

              <View style={styles.quoteField}>
                <Text style={styles.quoteLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.quoteInput, styles.notesInput]}
                  value={quote.notes}
                  onChangeText={(v) => setQuote({ ...quote, notes: v })}
                  multiline
                  numberOfLines={3}
                  placeholder="Informations complémentaires..."
                />
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total TTC</Text>
                <Text style={styles.totalValue}>{totalQuote.toFixed(2)} €</Text>
              </View>

              <View style={styles.quoteActions}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={() => setShowQuoteForm(false)}
                  style={styles.actionButton}
                />
                <Button
                  title="Envoyer"
                  onPress={handleSendQuote}
                  loading={sendQuote.isPending}
                  style={styles.actionButton}
                />
              </View>
            </Card>
          ) : (
            <View style={styles.actions}>
              <Button
                title="Refuser"
                variant="outline"
                onPress={handleDecline}
                loading={declineRequest.isPending}
                style={styles.actionButton}
              />
              <Button
                title="Envoyer un devis"
                onPress={() => setShowQuoteForm(true)}
                style={styles.actionButton}
              />
            </View>
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
    height: 180,
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
  detailsCard: {
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  customerName: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    backgroundColor: Colors.light.warning + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  urgencyText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.light.warning,
  },
  descriptionSection: {
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  quoteCard: {
    gap: Spacing.md,
  },
  quoteTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  quoteRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quoteField: {
    flex: 1,
    gap: Spacing.xs,
  },
  quoteLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.textSecondary,
  },
  quoteInput: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.light.primary,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
