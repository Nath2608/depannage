import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';

export default function PendingScreen() {
  const { logout, user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="hourglass" size={64} color={Colors.light.warning} />
        </View>

        <Text style={styles.title}>Dossier en cours de vérification</Text>

        <Text style={styles.subtitle}>
          Merci {user?.firstName} ! Votre dossier est en cours d'examen par notre équipe.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={Colors.light.info} />
            <Text style={styles.infoText}>Délai de traitement : 24-48h</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={Colors.light.info} />
            <Text style={styles.infoText}>Vous recevrez un email de confirmation</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="notifications" size={20} color={Colors.light.info} />
            <Text style={styles.infoText}>Une notification vous alertera</Text>
          </View>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Prochaines étapes</Text>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepCompleted]}>
              <Ionicons name="checkmark" size={16} color={Colors.light.white} />
            </View>
            <Text style={styles.stepText}>Inscription</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepCompleted]}>
              <Ionicons name="checkmark" size={16} color={Colors.light.white} />
            </View>
            <Text style={styles.stepText}>Documents envoyés</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepCurrent]}>
              <Ionicons name="hourglass" size={14} color={Colors.light.white} />
            </View>
            <Text style={[styles.stepText, styles.stepTextCurrent]}>Vérification en cours</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.stepPending]}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextPending]}>Compte activé</Text>
          </View>
        </View>

        <Button
          title="Se déconnecter"
          variant="outline"
          onPress={logout}
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.light.infoLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
    flex: 1,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stepsTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: Colors.light.success,
  },
  stepCurrent: {
    backgroundColor: Colors.light.warning,
  },
  stepPending: {
    backgroundColor: Colors.light.border,
  },
  stepNumber: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.light.textTertiary,
  },
  stepText: {
    fontSize: FontSizes.md,
    color: Colors.light.text,
  },
  stepTextCurrent: {
    fontWeight: FontWeights.semibold,
    color: Colors.light.warning,
  },
  stepTextPending: {
    color: Colors.light.textTertiary,
  },
  logoutButton: {
    width: '100%',
  },
});
