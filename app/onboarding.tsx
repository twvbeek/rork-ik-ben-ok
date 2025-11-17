import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, User, Clock } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import type { UserProfile } from '@/types';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const handleComplete = () => {
    if (!name.trim()) return;

    const profile: UserProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      customMessage: customMessage.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    completeOnboarding(profile);
    router.replace('/(tabs)/home');
  };

  const handleNext = () => {
    if (step === 0 && !name.trim()) return;
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Heart size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Welkom bij Ik ben OK</Text>
            <Text style={styles.subtitle}>
              Een eenvoudige manier om je dierbaren elke dag te laten weten dat het goed met je gaat.
            </Text>
            <View style={styles.inputContainer}>
              <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Wat is je naam?"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Clock size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Dagelijkse check-in</Text>
            <Text style={styles.subtitle}>
              Je ontvangt elke dag een vriendelijke herinnering om &quot;Ik ben OK&quot; aan te tikken.
              Wanneer je dat doet, worden je contacten automatisch op de hoogte gebracht.
            </Text>
            <Text style={styles.note}>
              Je kunt je check-in tijd later aanpassen in de instellingen.
            </Text>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <Heart size={64} color={colors.secondary} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Voeg een persoonlijk tintje toe</Text>
            <Text style={styles.subtitle}>
              Voeg optioneel een aangepast bericht toe dat met je check-ins wordt verstuurd.
            </Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="bijv. 'Heb een fijne ochtendwandeling gemaakt!'"
                placeholderTextColor={colors.textLight}
                value={customMessage}
                onChangeText={setCustomMessage}
                multiline
                numberOfLines={3}
                maxLength={150}
                returnKeyType="done"
              />
              <Text style={styles.charCount}>{customMessage.length}/150</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === step && styles.progressDotActive,
                  i < step && styles.progressDotComplete,
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            {step > 0 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep(step - 1)}
              >
                <Text style={styles.secondaryButtonText}>Terug</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.primaryButton,
                step === 0 && !name.trim() && styles.primaryButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={step === 0 && !name.trim()}
            >
              <Text style={styles.primaryButtonText}>
                {step === 2 ? 'Beginnen' : 'Volgende'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  note: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic' as const,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  textAreaContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  textArea: {
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 24,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  progressDotComplete: {
    backgroundColor: colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
});
