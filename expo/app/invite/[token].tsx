import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { UserPlus, CheckCircle2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { state, completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviterName, setInviterName] = useState('');

  const validateMutation = trpc.invite.validate.useQuery(
    { inviteToken: token || '' },
    { enabled: !!token }
  );
  const acceptMutation = trpc.invite.accept.useMutation();

  useEffect(() => {
    if (validateMutation.data) {
      setInviteValid(validateMutation.data.valid);
      setInviterName(validateMutation.data.inviterName);
      setIsLoading(false);
    } else if (validateMutation.error) {
      setInviteValid(false);
      setIsLoading(false);
    }
  }, [validateMutation.data, validateMutation.error]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await acceptMutation.mutateAsync({
        inviteToken: token,
        userId: state.profile?.id || `receiver-${Date.now()}`,
        deviceToken: undefined,
      });

      if (!state.hasCompletedOnboarding) {
        completeOnboarding({
          id: `receiver-${Date.now()}`,
          name: 'Notification Receiver',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdAt: new Date().toISOString(),
        });
      }

      Alert.alert(
        'Uitnodiging geaccepteerd',
        'Je ontvangt nu meldingen wanneer ze inchecken.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to accept invite:', error);
      Alert.alert('Fout', 'Kon uitnodiging niet accepteren. Probeer het opnieuw.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!inviteValid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.errorIconContainer}>
            <X size={64} color={colors.error} strokeWidth={1.5} />
          </View>
          <Text style={styles.errorTitle}>Ongeldige uitnodiging</Text>
          <Text style={styles.errorText}>
            Deze uitnodigingslink is ongeldig of verlopen.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.buttonText}>Ga naar Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <UserPlus size={64} color={colors.primary} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>Je bent uitgenodigd!</Text>
        <Text style={styles.subtitle}>
          {inviterName} heeft je uitgenodigd om meldingen te ontvangen wanneer ze inchecken met de &quot;I&apos;m OK&quot; app.
        </Text>

        <View style={styles.benefitsCard}>
          <View style={styles.benefitRow}>
            <CheckCircle2 size={20} color={colors.success} />
            <Text style={styles.benefitText}>Ontvang meldingen wanneer ze veilig zijn</Text>
          </View>
          <View style={styles.benefitRow}>
            <CheckCircle2 size={20} color={colors.success} />
            <Text style={styles.benefitText}>Word gewaarschuwd bij gemiste check-ins</Text>
          </View>
          <View style={styles.benefitRow}>
            <CheckCircle2 size={20} color={colors.success} />
            <Text style={styles.benefitText}>Gratis voor contacten - geen abonnement vereist</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAcceptInvite}
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.acceptButtonText}>Accepteer Uitnodiging</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.declineButtonText}>Misschien later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.error,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    marginTop: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  declineButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
});
