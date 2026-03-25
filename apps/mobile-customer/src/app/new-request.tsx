import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

type TradeType = 'PLUMBING' | 'LOCKSMITH';
type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

interface FormData {
  tradeType: TradeType | null;
  urgencyLevel: UrgencyLevel;
  description: string;
  addressId: string | null;
  useCurrentLocation: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
}

const urgencyOptions: { value: UrgencyLevel; label: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'LOW', label: 'Pas urgent', description: 'Sous quelques jours', icon: 'time-outline', color: Colors.light.success },
  { value: 'MEDIUM', label: 'Normal', description: 'Dans les 24h', icon: 'calendar-outline', color: Colors.light.info },
  { value: 'HIGH', label: 'Urgent', description: 'Dans les 2h', icon: 'alert-circle-outline', color: Colors.light.warning },
  { value: 'EMERGENCY', label: 'Urgence', description: 'Immédiat', icon: 'flash-outline', color: Colors.light.error },
];

export default function NewRequestScreen() {
  const params = useLocalSearchParams<{ tradeType?: string; urgent?: string }>();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    tradeType: (params.tradeType as TradeType) || null,
    urgencyLevel: params.urgent === 'true' ? 'EMERGENCY' : 'MEDIUM',
    description: '',
    addressId: null,
    useCurrentLocation: true,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (params.tradeType) {
      setStep(2);
    }
  }, [params.tradeType]);

  const createRequest = useMutation({
    mutationFn: api.requests.create,
    onSuccess: (data) => {
      Alert.alert(
        'Demande envoyée',
        'Votre demande a été envoyée. Vous recevrez bientôt des propositions de professionnels.',
        [
          {
            text: 'Voir ma demande',
            onPress: () => router.replace(`/request/${data.data.id}`),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    },
  });

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre position pour trouver des professionnels à proximité.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = [
        address.streetNumber,
        address.street,
        address.postalCode,
        address.city,
      ].filter(Boolean).join(' ');

      setFormData((prev) => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: formattedAddress,
        useCurrentLocation: true,
      }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.tradeType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire votre problème');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Erreur', 'Veuillez indiquer votre position');
      return;
    }

    createRequest.mutate({
      tradeType: formData.tradeType,
      urgencyLevel: formData.urgencyLevel,
      description: formData.description,
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
    });
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quel service recherchez-vous ?</Text>

      <View style={styles.serviceCards}>
        <Pressable
          style={[
            styles.serviceCard,
            formData.tradeType === 'PLUMBING' && styles.serviceCardSelected,
          ]}
          onPress={() => setFormData((prev) => ({ ...prev, tradeType: 'PLUMBING' }))}
        >
          <View style={[styles.serviceIcon, { backgroundColor: Colors.light.info + '15' }]}>
            <Ionicons name="water-outline" size={40} color={Colors.light.info} />
          </View>
          <Text style={styles.serviceTitle}>Plomberie</Text>
          <Text style={styles.serviceDescription}>
            Fuites, débouchage, installation, réparation
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.serviceCard,
            formData.tradeType === 'LOCKSMITH' && styles.serviceCardSelected,
          ]}
          onPress={() => setFormData((prev) => ({ ...prev, tradeType: 'LOCKSMITH' }))}
        >
          <View style={[styles.serviceIcon, { backgroundColor: Colors.light.warning + '15' }]}>
            <Ionicons name="key-outline" size={40} color={Colors.light.warning} />
          </View>
          <Text style={styles.serviceTitle}>Serrurerie</Text>
          <Text style={styles.serviceDescription}>
            Ouverture de porte, changement de serrure
          </Text>
        </Pressable>
      </View>

      <Button
        title="Continuer"
        onPress={() => setStep(2)}
        disabled={!formData.tradeType}
        style={styles.continueButton}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quel est le niveau d'urgence ?</Text>

      <View style={styles.urgencyOptions}>
        {urgencyOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.urgencyOption,
              formData.urgencyLevel === option.value && styles.urgencyOptionSelected,
              formData.urgencyLevel === option.value && { borderColor: option.color },
            ]}
            onPress={() => setFormData((prev) => ({ ...prev, urgencyLevel: option.value }))}
          >
            <View style={[styles.urgencyIcon, { backgroundColor: option.color + '15' }]}>
              <Ionicons name={option.icon} size={24} color={option.color} />
            </View>
            <View style={styles.urgencyContent}>
              <Text style={styles.urgencyLabel}>{option.label}</Text>
              <Text style={styles.urgencyDescription}>{option.description}</Text>
            </View>
            {formData.urgencyLevel === option.value && (
              <Ionicons name="checkmark-circle" size={24} color={option.color} />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <Button
          title="Retour"
          variant="outline"
          onPress={() => setStep(1)}
          style={styles.navButton}
        />
        <Button
          title="Continuer"
          onPress={() => setStep(3)}
          style={styles.navButton}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Décrivez votre problème</Text>

      <TextInput
        style={styles.descriptionInput}
        placeholder="Ex: Fuite d'eau sous l'évier de la cuisine, l'eau coule en permanence..."
        placeholderTextColor={Colors.light.textTertiary}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={formData.description}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
      />

      <Text style={styles.hintText}>
        Plus vous donnez de détails, plus le professionnel pourra vous faire une estimation précise.
      </Text>

      <View style={styles.navigationButtons}>
        <Button
          title="Retour"
          variant="outline"
          onPress={() => setStep(2)}
          style={styles.navButton}
        />
        <Button
          title="Continuer"
          onPress={() => setStep(4)}
          disabled={!formData.description.trim()}
          style={styles.navButton}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Où êtes-vous ?</Text>

      <Pressable
        style={[styles.locationOption, formData.useCurrentLocation && styles.locationOptionSelected]}
        onPress={getCurrentLocation}
      >
        <View style={styles.locationIcon}>
          <Ionicons name="locate" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Utiliser ma position actuelle</Text>
          {formData.address && formData.useCurrentLocation && (
            <Text style={styles.locationAddress}>{formData.address}</Text>
          )}
        </View>
        {isLoadingLocation ? (
          <Loading size="small" />
        ) : formData.useCurrentLocation && formData.address ? (
          <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
        ) : null}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={[styles.locationOption, !formData.useCurrentLocation && styles.locationOptionSelected]}
        onPress={() => router.push('/profile/addresses?select=true')}
      >
        <View style={styles.locationIcon}>
          <Ionicons name="home-outline" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Choisir une adresse enregistrée</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.textTertiary} />
      </Pressable>

      <View style={styles.navigationButtons}>
        <Button
          title="Retour"
          variant="outline"
          onPress={() => setStep(3)}
          style={styles.navButton}
        />
        <Button
          title="Envoyer"
          onPress={handleSubmit}
          loading={createRequest.isPending}
          disabled={!formData.latitude || !formData.longitude}
          style={styles.navButton}
        />
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nouvelle demande',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.progressBar}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressStep,
                s <= step && styles.progressStepActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: Platform.OS === 'ios' ? 0 : -Spacing.sm,
  },
  progressBar: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.light.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    padding: Spacing.lg,
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  serviceCards: {
    gap: Spacing.md,
    flex: 1,
  },
  serviceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '08',
  },
  serviceIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  serviceTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  serviceDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: Spacing.lg,
  },
  urgencyOptions: {
    gap: Spacing.md,
    flex: 1,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  urgencyOptionSelected: {
    backgroundColor: Colors.light.background,
  },
  urgencyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  urgencyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  navButton: {
    flex: 1,
  },
  descriptionInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.light.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  hintText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '08',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.light.text,
  },
  locationAddress: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    fontSize: FontSizes.sm,
    color: Colors.light.textTertiary,
    marginHorizontal: Spacing.md,
  },
});
