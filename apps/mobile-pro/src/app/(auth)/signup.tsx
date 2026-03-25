import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';

type TradeType = 'PLUMBING' | 'LOCKSMITH';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  tradeType: TradeType | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  tradeType?: string;
}

export default function SignupScreen() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    tradeType: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { register, isLoading } = useAuthStore();

  const updateField = (field: keyof FormData) => (value: string | TradeType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';

    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.phone) {
      newErrors.phone = 'Téléphone requis';
    } else if (!/^(\+33|0)[1-9](\d{2}){4}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.tradeType) {
      newErrors.tradeType = 'Sélectionnez votre métier';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.replace(/\s/g, ''),
        tradeType: formData.tradeType!,
      });
      // Redirection vers onboarding gérée par le store
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Devenir partenaire</Text>
            <Text style={styles.subtitle}>
              Rejoignez le réseau Depan Express et développez votre activité
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Votre métier</Text>
            <View style={styles.tradeOptions}>
              <Pressable
                style={[
                  styles.tradeOption,
                  formData.tradeType === 'PLUMBING' && styles.tradeOptionSelected,
                ]}
                onPress={() => updateField('tradeType')('PLUMBING')}
              >
                <Ionicons
                  name="water"
                  size={32}
                  color={formData.tradeType === 'PLUMBING' ? Colors.light.primary : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.tradeLabel,
                    formData.tradeType === 'PLUMBING' && styles.tradeLabelSelected,
                  ]}
                >
                  Plombier
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tradeOption,
                  formData.tradeType === 'LOCKSMITH' && styles.tradeOptionSelected,
                ]}
                onPress={() => updateField('tradeType')('LOCKSMITH')}
              >
                <Ionicons
                  name="key"
                  size={32}
                  color={formData.tradeType === 'LOCKSMITH' ? Colors.light.primary : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.tradeLabel,
                    formData.tradeType === 'LOCKSMITH' && styles.tradeLabelSelected,
                  ]}
                >
                  Serrurier
                </Text>
              </Pressable>
            </View>
            {errors.tradeType && <Text style={styles.error}>{errors.tradeType}</Text>}

            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Prénom"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChangeText={updateField('firstName')}
                  error={errors.firstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Nom"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChangeText={updateField('lastName')}
                  error={errors.lastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Input
              label="Email professionnel"
              placeholder="pro@email.com"
              value={formData.email}
              onChangeText={updateField('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />

            <Input
              label="Téléphone"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChangeText={updateField('phone')}
              error={errors.phone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <Input
              label="Mot de passe"
              placeholder="Minimum 8 caractères"
              value={formData.password}
              onChangeText={updateField('password')}
              error={errors.password}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Retapez votre mot de passe"
              value={formData.confirmPassword}
              onChangeText={updateField('confirmPassword')}
              error={errors.confirmPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            <Text style={styles.terms}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions Générales Partenaires</Text> et
              notre <Text style={styles.termsLink}>Charte Qualité</Text>
            </Text>

            <Button
              title="Créer mon compte pro"
              onPress={handleSignup}
              loading={isLoading}
              style={styles.signupButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà partenaire ?</Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.loginLink}>Se connecter</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  tradeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tradeOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  tradeOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  tradeLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
  tradeLabelSelected: {
    color: Colors.light.primary,
  },
  error: {
    fontSize: FontSizes.sm,
    color: Colors.light.error,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  terms: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.light.primary,
  },
  signupButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  footerText: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
  },
  loginLink: {
    fontSize: FontSizes.md,
    color: Colors.light.primary,
    fontWeight: FontWeights.semibold,
  },
});
