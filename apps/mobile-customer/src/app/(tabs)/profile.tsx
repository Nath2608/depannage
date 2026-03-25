import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
  >
    <View
      style={[
        styles.menuIconContainer,
        { backgroundColor: danger ? Colors.light.errorLight : Colors.light.surface },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? Colors.light.error : Colors.light.primary}
      />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && (
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors.light.textTertiary}
      />
    )}
  </Pressable>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Info', 'Contactez le support pour supprimer votre compte.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
                {user?.lastName?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
            <Pressable style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={Colors.light.white} />
            </Pressable>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Pressable
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Modifier le profil</Text>
          </Pressable>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Informations personnelles"
              onPress={() => router.push('/profile/edit')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="location-outline"
              title="Mes adresses"
              onPress={() => router.push('/profile/addresses')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="card-outline"
              title="Moyens de paiement"
              onPress={() => router.push('/profile/payment-methods')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="time-outline"
              title="Historique des interventions"
              onPress={() => router.push('/profile/history')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="receipt-outline"
              title="Factures"
              onPress={() => router.push('/profile/invoices')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => router.push('/profile/notifications-settings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Sécurité"
              onPress={() => router.push('/profile/security')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="language-outline"
              title="Langue"
              subtitle="Français"
              onPress={() => {}}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              title="Centre d'aide"
              onPress={() => router.push('/support/help')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="chatbubbles-outline"
              title="Contacter le support"
              onPress={() => router.push('/support/contact')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-text-outline"
              title="Conditions d'utilisation"
              onPress={() => router.push('/support/terms')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-outline"
              title="Politique de confidentialité"
              onPress={() => router.push('/support/privacy')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              title="Déconnexion"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </Card>
        </View>

        <Pressable style={styles.deleteAccount} onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0</Text>
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
    paddingBottom: Spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  editProfileButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  editProfileText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.primary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemPressed: {
    backgroundColor: Colors.light.surface,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.light.text,
  },
  menuTitleDanger: {
    color: Colors.light.error,
  },
  menuSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 68,
  },
  deleteAccount: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  deleteAccountText: {
    fontSize: FontSizes.sm,
    color: Colors.light.error,
  },
  version: {
    fontSize: FontSizes.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
