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
import { Card, StatusBadge } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
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
      <Ionicons name="chevron-forward" size={20} color={Colors.light.textTertiary} />
    )}
  </Pressable>
);

export default function ProfileScreen() {
  const { user, professional, logout } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() || 'P'}
                {user?.lastName?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.tradeBadge}>
                {professional?.tradeType === 'PLUMBING' ? 'Plombier' : 'Serrurier'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={20} color={Colors.light.warning} />
              <Text style={styles.statValue}>{(professional?.rating || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>{professional?.reviewCount || 0} avis</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.light.success} />
              <Text style={styles.statValue}>{professional?.completedJobs || 0}</Text>
              <Text style={styles.statLabel}>missions</Text>
            </View>
          </View>
        </Card>

        {/* Professional Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professionnel</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Informations personnelles"
              onPress={() => router.push('/profile/edit')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="briefcase-outline"
              title="Informations entreprise"
              subtitle={professional?.companyName || professional?.siretNumber}
              onPress={() => router.push('/profile/company')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="map-outline"
              title="Zone d'intervention"
              onPress={() => router.push('/profile/service-area')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-text-outline"
              title="Mes documents"
              onPress={() => router.push('/profile/documents')}
            />
          </Card>
        </View>

        {/* Finances Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finances</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="wallet-outline"
              title="Mes revenus"
              onPress={() => router.push('/earnings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="card-outline"
              title="Informations bancaires"
              onPress={() => router.push('/profile/bank-info')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="receipt-outline"
              title="Factures"
              onPress={() => router.push('/profile/invoices')}
            />
          </Card>
        </View>

        {/* Performance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="star-outline"
              title="Mes avis clients"
              onPress={() => router.push('/profile/reviews')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="stats-chart-outline"
              title="Statistiques"
              onPress={() => router.push('/profile/stats')}
            />
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <Card variant="outlined" style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => router.push('/profile/notifications')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Sécurité"
              onPress={() => router.push('/profile/security')}
            />
          </Card>
        </View>

        {/* Support Section */}
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
          </Card>
        </View>

        {/* Logout */}
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
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.light.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  tradeBadge: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: Spacing.md,
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
  version: {
    fontSize: FontSizes.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
