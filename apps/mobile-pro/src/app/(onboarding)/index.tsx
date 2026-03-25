import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';

const steps = [
  {
    icon: 'document-text',
    title: 'Documents',
    description: 'Carte d\'identité, justificatif de domicile, assurance RC Pro',
  },
  {
    icon: 'location',
    title: 'Zone d\'intervention',
    description: 'Définissez votre rayon d\'action',
  },
  {
    icon: 'checkmark-circle',
    title: 'Validation',
    description: 'Notre équipe vérifie votre dossier sous 24-48h',
  },
];

export default function OnboardingIndexScreen() {
  const { user, professional } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="rocket" size={48} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>
            Bienvenue {user?.firstName} !
          </Text>
          <Text style={styles.subtitle}>
            Complétez votre profil pour commencer à recevoir des missions
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.sectionTitle}>Les étapes pour devenir partenaire</Text>

          {steps.map((step, index) => (
            <Card key={index} variant="outlined" style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepIcon}>
                <Ionicons
                  name={step.icon as any}
                  size={24}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.light.info} />
          <Text style={styles.infoText}>
            Votre profil : <Text style={styles.infoBold}>
              {professional?.tradeType === 'PLUMBING' ? 'Plombier' : 'Serrurier'}
            </Text>
          </Text>
        </View>

        <Button
          title="Commencer"
          onPress={() => router.push('/(onboarding)/documents')}
          style={styles.startButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
  },
  stepDescription: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },
  infoBold: {
    fontWeight: FontWeights.semibold,
    color: Colors.light.primary,
  },
  startButton: {
    marginBottom: Spacing.lg,
  },
});
