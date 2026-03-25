import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';

interface ServiceCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  title,
  description,
  color,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
  >
    <View style={[styles.serviceIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={32} color={color} />
    </View>
    <Text style={styles.serviceTitle}>{title}</Text>
    <Text style={styles.serviceDescription}>{description}</Text>
  </Pressable>
);

export default function HomeScreen() {
  const { user } = useAuthStore();

  const handleServicePress = (tradeType: 'PLUMBING' | 'LOCKSMITH') => {
    router.push({
      pathname: '/new-request',
      params: { tradeType },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            Bonjour, {user?.firstName || 'Client'} !
          </Text>
          <Text style={styles.welcomeText}>
            De quoi avez-vous besoin aujourd'hui ?
          </Text>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Nos services</Text>
          <View style={styles.servicesGrid}>
            <ServiceCard
              icon="water-outline"
              title="Plomberie"
              description="Fuites, débouchage, installation..."
              color={Colors.light.info}
              onPress={() => handleServicePress('PLUMBING')}
            />
            <ServiceCard
              icon="key-outline"
              title="Serrurerie"
              description="Ouverture de porte, changement de serrure..."
              color={Colors.light.warning}
              onPress={() => handleServicePress('LOCKSMITH')}
            />
          </View>
        </View>

        <View style={styles.urgencySection}>
          <Card variant="elevated" style={styles.urgencyCard}>
            <View style={styles.urgencyContent}>
              <View style={styles.urgencyIconContainer}>
                <Ionicons
                  name="flash"
                  size={28}
                  color={Colors.light.error}
                />
              </View>
              <View style={styles.urgencyTextContainer}>
                <Text style={styles.urgencyTitle}>Urgence ?</Text>
                <Text style={styles.urgencyDescription}>
                  Intervention rapide 24h/24, 7j/7
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.urgencyButton}
              onPress={() => router.push('/new-request?urgent=true')}
            >
              <Text style={styles.urgencyButtonText}>Demande urgente</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.light.white} />
            </Pressable>
          </Card>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Comment ça marche ?</Text>

          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Décrivez votre besoin</Text>
                <Text style={styles.stepDescription}>
                  Expliquez votre problème et ajoutez des photos si nécessaire
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Recevez des devis</Text>
                <Text style={styles.stepDescription}>
                  Des professionnels qualifiés vous envoient leurs propositions
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choisissez et suivez</Text>
                <Text style={styles.stepDescription}>
                  Acceptez un devis et suivez l'intervention en temps réel
                </Text>
              </View>
            </View>
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
  },
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  welcomeText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  servicesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  serviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  serviceTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  serviceDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  urgencySection: {
    marginBottom: Spacing.xl,
  },
  urgencyCard: {
    backgroundColor: Colors.light.errorLight,
    borderWidth: 1,
    borderColor: Colors.light.error + '30',
  },
  urgencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  urgencyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  urgencyTextContainer: {
    flex: 1,
  },
  urgencyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.error,
  },
  urgencyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.text,
  },
  urgencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.error,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  urgencyButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.white,
  },
  infoSection: {
    marginBottom: Spacing.lg,
  },
  steps: {
    gap: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});
