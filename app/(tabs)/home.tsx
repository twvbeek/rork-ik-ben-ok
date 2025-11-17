import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Heart, CheckCircle2, Clock, Lock } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';

export default function HomeScreen() {
  const { state, checkIn, hasActiveSubscription } = useApp();
  const insets = useSafeAreaInsets();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAnim] = useState(new Animated.Value(-100));
  
  const profile = state.profile;
  const contactCount = state.contacts.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentAlert = () => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const enabledTimes = state.schedule.times
      .filter(t => t.enabled)
      .map(t => ({ ...t, totalMinutes: t.hour * 60 + t.minute }))
      .sort((a, b) => a.totalMinutes - b.totalMinutes);
    
    if (enabledTimes.length === 0) return null;
    
    for (const time of enabledTimes) {
      const isCheckedIn = state.todayCheckIns.some(c => c.scheduleTimeId === time.id);
      if (!isCheckedIn && time.totalMinutes <= currentMinutes) {
        return time;
      }
    }
    
    const nextTime = enabledTimes.find(t => {
      const isCheckedIn = state.todayCheckIns.some(c => c.scheduleTimeId === t.id);
      return !isCheckedIn && t.totalMinutes > currentMinutes;
    });
    
    if (nextTime) return nextTime;
    
    const firstUnchecked = enabledTimes.find(t => {
      const isCheckedIn = state.todayCheckIns.some(c => c.scheduleTimeId === t.id);
      return !isCheckedIn;
    });
    
    return firstUnchecked || null;
  };

  const currentAlert = getCurrentAlert();
  const isCurrentAlertActive = currentAlert ? (() => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const alertMinutes = currentAlert.hour * 60 + currentAlert.minute;
    return currentMinutes >= alertMinutes;
  })() : false;
  
  const isCurrentAlertCheckedIn = currentAlert ? 
    state.todayCheckIns.some(c => c.scheduleTimeId === currentAlert.id) : false;

  useEffect(() => {
    if (isCurrentAlertCheckedIn) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCurrentAlertCheckedIn, glowAnim]);

  const handleCheckIn = () => {
    if (!currentAlert || isCurrentAlertCheckedIn || !isCurrentAlertActive) return;

    if (!hasActiveSubscription()) {
      Alert.alert(
        'Premium Vereist',
        'Je proefperiode is verlopen. Activeer Premium om door te gaan met check-ins.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Bekijk Abonnement',
            onPress: () => router.push('/subscription'),
          },
        ]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    checkIn(currentAlert.id);

    setShowConfirmation(true);
    Animated.sequence([
      Animated.timing(confirmationAnim, {
        toValue: 16,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(confirmationAnim, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowConfirmation(false);
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  const getCheckInTime = (scheduleTimeId: string) => {
    const checkIn = state.todayCheckIns.find(c => c.scheduleTimeId === scheduleTimeId);
    if (!checkIn) return null;
    const time = new Date(checkIn.timestamp);
    return time.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatCheckInTime = (time: { hour: number; minute: number }) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  const getNextAlertAfterCurrent = () => {
    if (!currentAlert) return null;
    
    const enabledTimes = state.schedule.times
      .filter(t => t.enabled && t.id !== currentAlert.id)
      .map(t => ({ ...t, totalMinutes: t.hour * 60 + t.minute }))
      .sort((a, b) => a.totalMinutes - b.totalMinutes);
    
    const currentMinutes = currentAlert.hour * 60 + currentAlert.minute;
    const nextTime = enabledTimes.find(t => {
      const isCheckedIn = state.todayCheckIns.some(c => c.scheduleTimeId === t.id);
      return !isCheckedIn && t.totalMinutes > currentMinutes;
    });
    
    if (nextTime) return nextTime;
    
    return enabledTimes.find(t => {
      const isCheckedIn = state.todayCheckIns.some(c => c.scheduleTimeId === t.id);
      return !isCheckedIn;
    }) || null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showConfirmation && (
        <Animated.View 
          style={[
            styles.confirmationBanner,
            { 
              top: insets.top,
              transform: [{ translateY: confirmationAnim }] 
            }
          ]}
        >
          <CheckCircle2 size={20} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.confirmationText}>Je melding is verzonden!</Text>
        </Animated.View>
      )}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}, {profile?.name}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('nl-NL', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.mainContent}>
        {!currentAlert ? (
          <View style={styles.checkedInContainer}>
            <Animated.View style={[styles.successIconContainer]}>
              <CheckCircle2 size={80} color={colors.success} strokeWidth={2} />
            </Animated.View>
            
            <Text style={styles.checkedInTitle}>Alles klaar voor vandaag!</Text>
            <Text style={styles.checkedInSubtitle}>
              Je hebt alle check-ins voltooid
            </Text>

            {contactCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {contactCount} {contactCount === 1 ? 'contact' : 'contacten'} op de hoogte gebracht
                </Text>
              </View>
            )}
          </View>
        ) : isCurrentAlertCheckedIn ? (
          <View style={styles.checkedInContainer}>
            <Animated.View 
              style={[
                styles.successIconContainer,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.7],
                  }),
                  transform: [{
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  }],
                },
              ]}
            >
              <CheckCircle2 size={80} color={colors.success} strokeWidth={2} />
            </Animated.View>
            
            <Text style={styles.checkedInTitle}>Check-in voltooid!</Text>
            <Text style={styles.checkedInSubtitle}>
              Ingecheckt om {getCheckInTime(currentAlert.id)}
            </Text>
            
            {contactCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {contactCount} {contactCount === 1 ? 'contact' : 'contacten'} op de hoogte gebracht
                </Text>
              </View>
            )}

            {profile?.customMessage && (
              <View style={styles.messageCard}>
                <Text style={styles.messageLabel}>Jouw bericht</Text>
                <Text style={styles.messageText}>&quot;{profile.customMessage}&quot;</Text>
              </View>
            )}

            {getNextAlertAfterCurrent() && (
              <View style={styles.infoCard}>
                <Clock size={20} color={colors.textSecondary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoText}>
                    Volgende check-in om {formatCheckInTime(getNextAlertAfterCurrent()!)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.checkInContainer}>
            <View style={styles.promptContainer}>
              <Heart size={48} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.promptTitle}>
                {isCurrentAlertActive ? 'Klaar om in te checken?' : 'Wachten op check-in tijd'}
              </Text>
              <Text style={styles.promptSubtitle}>
                {isCurrentAlertActive 
                  ? 'Laat je dierbaren weten dat het goed met je gaat'
                  : `Check-in beschikbaar om ${formatCheckInTime(currentAlert)}`
                }
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.checkInButton, !isCurrentAlertActive && styles.checkInButtonDisabled]}
                onPress={handleCheckIn}
                activeOpacity={0.8}
                disabled={!isCurrentAlertActive}
              >
                <Text style={styles.checkInButtonText}>Ik ben OK</Text>
                {!hasActiveSubscription() ? (
                  <Lock size={24} color={colors.surface} />
                ) : (
                  <Heart size={24} color={colors.surface} fill={colors.surface} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {!isCurrentAlertActive && (
              <View style={styles.infoCard}>
                <Clock size={20} color={colors.textSecondary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoText}>
                    Deze check-in wordt beschikbaar om {formatCheckInTime(currentAlert)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {!hasActiveSubscription() && (
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.8}
        >
          <Lock size={20} color={colors.secondary} />
          <View style={styles.subscriptionBannerContent}>
            <Text style={styles.subscriptionBannerTitle}>
              {state.subscription.isTrialing ? 'Proefperiode actief' : 'Abonnement verlopen'}
            </Text>
            <Text style={styles.subscriptionBannerText}>
              {state.subscription.isTrialing
                ? `${Math.max(0, Math.ceil((new Date(state.subscription.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dagen resterend`
                : 'Tik om Premium te activeren'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {contactCount === 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Nog geen contacten toegevoegd</Text>
          <Text style={styles.warningText}>
            Voeg contacten toe in het Contacten tabblad om ze op de hoogte te brengen
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  checkInContainer: {
    alignItems: 'center',
    gap: 32,
  },
  promptContainer: {
    alignItems: 'center',
    gap: 12,
  },
  promptTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  promptSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  checkInButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkInButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  checkInButtonDisabled: {
    opacity: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkedInContainer: {
    alignItems: 'center',
    gap: 16,
  },
  successIconContainer: {
    marginBottom: 8,
  },
  checkedInTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.success,
  },
  checkedInSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  notificationBadge: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primaryDark,
  },
  messageCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    marginTop: 16,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  warningCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: colors.secondaryLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  subscriptionBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: colors.secondaryLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionBannerContent: {
    flex: 1,
  },
  subscriptionBannerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  subscriptionBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  confirmationBanner: {
    position: 'absolute' as const,
    left: 24,
    right: 24,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  confirmationText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.surface,
  },
});
