import { useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

export default function Index() {
  const router = useRouter();
  const { state, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (!state.hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [isLoading, state.hasCompletedOnboarding, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={state.hasCompletedOnboarding ? '/(tabs)/home' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
