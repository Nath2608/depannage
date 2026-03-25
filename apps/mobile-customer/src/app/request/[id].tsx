import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

interface Quote {
  id: string;
  laborCost: number;
  partsCost: number;
  travelCost: number;
  totalAmount: number;
  estimatedDuration: number;
  validUntil: string;
  notes?: string;
  professional: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    rating: number;
    reviewCount: number;
    tradeType: string;
  };
}

interface ServiceRequest {
  id: string;
  tradeType: string;
  urgencyLevel: string;
  status: string;
  description: string;
  address?: string;
  createdAt: string;
  quotes: Quote[];
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
};

const QuoteCard: React.FC<{
  quote: Quote;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
}> = ({ quote, onAccept, onDecline, isLoading }) => {
  const isExpired = new Date(quote.validUntil) < new Date();

  return (
    <Card variant="outlined" style={styles.quoteCard}>
      <View style={styles.quoteHeader}>
        <View style={styles.proInfo}>
          <View style={styles.proAvatar}>
            <Text style={styles.proAvatarText}>
              {quote.professional.user.firstName[0]}
              {quote.professional.user.lastName[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.proName}>
              {quote.professional.user.firstName} {quote.professional.user.lastName}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.light.warning} />
              <Text style={styles.ratingText}>
                {quote.professional.rating.toFixed(1)} ({quote.professional.reviewCount})
              </Text>
            </View>
          </View>
        </View>

        {isExpired ? (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expiré</Text>
          </View>
        ) : (
          <View style={styles.validBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.light.success} />
            <Text style={styles.validText}>
              Valide jusqu'au {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.quoteDetails}>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>Main d'œuvre</Text>
          <Text style={styles.quoteValue}>{quote.laborCost.toFixed(2)} €</Text>
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>Pièces</Text>
          <Text style={styles.quoteValue}>{quote.partsCost.toFixed(2)} €</Text>
        </View>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteLabel}>Déplacement</Text>
          <Text style={styles.quoteValue}>{quote.travelCost.toFixed(2)} €</Text>
        </View>
        <View style={[styles.quoteRow, styles.quoteTotalRow]}>
          <Text style={styles.quoteTotalLabel}>Total TTC</Text>
          <Text style={styles.quoteTotalValue}>{quote.totalAmount.toFixed(2)} €</Text>
        </View>
      </View>

      <View style={styles.durationRow}>
        <Ionicons name="time-outline" size={18} color={Colors.light.textSecondary} />
        <Text style={styles.durationText}>
          Durée estimée : {formatDuration(quote.estimatedDuration)}
        </Text>
      </View>

      {quote.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes du professionnel :</Text>
          <Text style={styles.notesText}>{quote.notes}</Text>
        </View>
      )}

      {!isExpired && (
        <View style={styles.quoteActions}>
          <Button
            title="Refuser"
            variant="outline"
            onPress={onDecline}
            style={styles.actionButton}
            disabled={isLoading}
          />
          <Button
            title="Accepter"
            onPress={onAccept}
            style={styles.actionButton}
            loading={isLoading}
          />
        </View>
      )}
    </Card>
  );
};

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => api.requests.getById(id!),
  });

  const acceptQuote = useMutation({
    mutationFn: (quoteId: string) => api.quotes.accept(quoteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-request', id] });
      Alert.alert(
        'Devis accepté',
        'Le professionnel a été notifié. Vous pouvez suivre l\'intervention.',
        [
          {
            text: 'Suivre',
            onPress: () => router.push(`/job/${data.data.jobId}`),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  const declineQuote = useMutation({
    mutationFn: (quoteId: string) => api.quotes.decline(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request', id] });
      Alert.alert('Devis refusé', 'Vous pouvez accepter un autre devis.');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  const cancelRequest = useMutation({
    mutationFn: () => api.requests.cancel(id!),
    onSuccess: () => {
      Alert.alert('Demande annulée', 'Votre demande a été annulée.');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  const handleCancel = () => {
    Alert.alert(
      'Annuler la demande',
      'Êtes-vous sûr de vouloir annuler cette demande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => cancelRequest.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  const request: ServiceRequest | undefined = data?.data;

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Demande non trouvée</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const canCancel = ['PENDING', 'SEARCHING', 'QUOTE_SENT'].includes(request.status);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Détails de la demande',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="elevated" style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.tradeIconContainer}>
                <Ionicons
                  name={request.tradeType === 'PLUMBING' ? 'water-outline' : 'key-outline'}
                  size={24}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.requestHeaderInfo}>
                <Text style={styles.tradeLabel}>
                  {request.tradeType === 'PLUMBING' ? 'Plomberie' : 'Serrurerie'}
                </Text>
                <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.statusBadge}>
              <Ionicons
                name={request.status === 'SEARCHING' ? 'search' : 'time-outline'}
                size={16}
                color={Colors.light.info}
              />
              <Text style={styles.statusText}>
                {request.status === 'PENDING' && 'En attente'}
                {request.status === 'SEARCHING' && 'Recherche de professionnels...'}
                {request.status === 'QUOTE_SENT' && `${request.quotes.length} devis reçu(s)`}
              </Text>
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{request.description}</Text>
            </View>

            {request.address && (
              <View style={styles.addressSection}>
                <Ionicons name="location-outline" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.addressText}>{request.address}</Text>
              </View>
            )}
          </Card>

          {request.quotes.length > 0 && (
            <View style={styles.quotesSection}>
              <Text style={styles.sectionTitle}>Devis reçus</Text>

              {request.quotes.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  onAccept={() => acceptQuote.mutate(quote.id)}
                  onDecline={() => declineQuote.mutate(quote.id)}
                  isLoading={acceptQuote.isPending || declineQuote.isPending}
                />
              ))}
            </View>
          )}

          {request.quotes.length === 0 && request.status === 'SEARCHING' && (
            <Card variant="outlined" style={styles.waitingCard}>
              <Ionicons name="hourglass-outline" size={48} color={Colors.light.textTertiary} />
              <Text style={styles.waitingTitle}>En attente de devis</Text>
              <Text style={styles.waitingText}>
                Les professionnels à proximité examinent votre demande.
                Vous serez notifié dès qu'un devis sera disponible.
              </Text>
            </Card>
          )}

          {canCancel && (
            <Button
              title="Annuler la demande"
              variant="danger"
              onPress={handleCancel}
              loading={cancelRequest.isPending}
              style={styles.cancelButton}
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
    gap: Spacing.lg,
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
  requestCard: {
    gap: Spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tradeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  requestHeaderInfo: {
    flex: 1,
  },
  tradeLabel: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  requestDate: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.infoLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.info,
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
  descriptionText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  addressText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  quotesSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  quoteCard: {
    gap: Spacing.md,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  proAvatarText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  proName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  expiredBadge: {
    backgroundColor: Colors.light.errorLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  expiredText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.light.error,
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  validText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.light.success,
  },
  quoteDetails: {
    gap: Spacing.xs,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  durationText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  notesContainer: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  notesLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    lineHeight: 20,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  waitingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  waitingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  waitingText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelButton: {
    marginTop: Spacing.sm,
  },
});
