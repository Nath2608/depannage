import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@store/auth.store';

export default function AuthLayout() {
  const { isAuthenticated, isOnboarded } = useAuthStore();

  if (isAuthenticated && isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  if (isAuthenticated && !isOnboarded) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
