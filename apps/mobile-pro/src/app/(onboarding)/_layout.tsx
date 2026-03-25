import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@store/auth.store';

export default function OnboardingLayout() {
  const { isAuthenticated, isOnboarded } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="service-area" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
