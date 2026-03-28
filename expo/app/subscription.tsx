import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, X, Crown, Calendar, Zap } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';

export default function SubscriptionScreen() {
  const { state, updateSubscription } = useApp();
  const insets = useSafeAreaInsets();
  const sub = state.subscription;

  const daysLeft = sub.trialEndsAt ? 
    Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubscribe = () => {
    Alert.alert(
      'Demo Modus',
      'In productie zou deze knop leiden naar de App Store/Play Store abonnementspagina. Voor demo-doeleinden kun je op "Activeer Abonnement" klikken om te simuleren.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Activeer Abonnement',
          onPress: () => {
            updateSubscription({
              isActive: true,
              isTrialing: false,
              subscribedAt: new Date().toISOString(),
            });
            Alert.alert('Geactiveerd!', 'Je abonnement is actief.');
            router.back();
          },
        },
      ]
    );
  };

  const handleRestorePurchase = () => {
    Alert.alert(
      'Aankopen herstellen',
      'In productie zou deze functie je abonnementen via de App Store/Play Store herstellen.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sub.isActive ? (
          <View style={styles.activeContainer}>
            <View style={styles.activeIconContainer}>
              <Crown size={64} color={colors.primary} fill={colors.primaryLight} />
            </View>
            <Text style={styles.activeTitle}>Premium Actief</Text>
            <Text style={styles.activeSubtitle}>
              Je hebt toegang tot alle functies
            </Text>
            {sub.subscribedAt && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Actief sinds</Text>
                <Text style={styles.infoValue}>
                  {new Date(sub.subscribedAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        ) : sub.isTrialing ? (
          <View style={styles.trialContainer}>
            <View style={styles.trialBadge}>
              <Calendar size={20} color={colors.secondary} />
              <Text style={styles.trialBadgeText}>
                {daysLeft} {daysLeft === 1 ? 'dag' : 'dagen'} gratis proefperiode
              </Text>
            </View>
            <Text style={styles.trialTitle}>Probeer Premium Gratis</Text>
            <Text style={styles.trialSubtitle}>
              Je proefperiode eindigt op {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString('nl-NL') : 'onbekend'}
            </Text>
          </View>
        ) : (
          <View style={styles.expiredContainer}>
            <Text style={styles.expiredTitle}>Abonnement Verlopen</Text>
            <Text style={styles.expiredSubtitle}>
              Activeer Premium om door te gaan met check-ins
            </Text>
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Premium Functies</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <CheckCircle2 size={24} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Onbeperkte Check-ins</Text>
              <Text style={styles.featureDescription}>
                Plan meerdere dagelijkse check-ins
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Zap size={24} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Push Notificaties</Text>
              <Text style={styles.featureDescription}>
                Contacten ontvangen direct meldingen
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Crown size={24} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Prioriteitsondersteuning</Text>
              <Text style={styles.featureDescription}>
                Snelle hulp wanneer je het nodig hebt
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <View style={styles.priceCard}>
            <Text style={styles.priceAmount}>€4,99</Text>
            <Text style={styles.pricePeriod}>per maand</Text>
          </View>
          <Text style={styles.priceNote}>
            Abonnement automatisch verlengd. Annuleer op elk moment.
          </Text>
        </View>

        {!sub.isActive && (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
          >
            <Text style={styles.subscribeButtonText}>
              {sub.isTrialing ? 'Activeer Premium' : 'Abonneer Nu'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchase}
        >
          <Text style={styles.restoreButtonText}>Aankopen herstellen</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Door te abonneren ga je akkoord met onze Algemene Voorwaarden en Privacybeleid.
          </Text>
          <Text style={styles.footerNote}>
            Abonnementen worden beheerd via {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  activeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  activeIconContainer: {
    marginBottom: 16,
  },
  activeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  activeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  trialContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondaryLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  trialBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.secondary,
  },
  trialTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  trialSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  expiredContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  expiredTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.error,
  },
  expiredSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresSection: {
    marginTop: 32,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  pricingSection: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  priceCard: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.primaryDark,
    marginTop: 4,
  },
  priceNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 32,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  footer: {
    marginTop: 32,
    gap: 8,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});
