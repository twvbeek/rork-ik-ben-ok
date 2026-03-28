import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Modal, KeyboardAvoidingView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, MessageSquare, Clock, Bell, Plus, X, Trash2, Crown, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import { scheduleCheckInNotifications, requestNotificationPermissions } from '@/utils/notifications';
import colors from '@/constants/colors';
import type { CheckInTime } from '@/types';

export default function SettingsScreen() {
  const { state, updateProfile, updateSchedule, addCheckInTime, updateCheckInTime, deleteCheckInTime } = useApp();
  const insets = useSafeAreaInsets();
  const profile = state.profile;
  
  const [editingName, setEditingName] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [customMessage, setCustomMessage] = useState(profile?.customMessage || '');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [timeLabel, setTimeLabel] = useState('');
  const [timeHour, setTimeHour] = useState(9);
  const [timeMinute, setTimeMinute] = useState(0);
  const [timeEnabled, setTimeEnabled] = useState(true);

  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleCheckInNotifications(state.schedule.times);
      }
    };
    setupNotifications();
  }, [state.schedule.times]);

  const handleSaveName = () => {
    if (!name.trim()) {
      Alert.alert('Fout', 'Naam mag niet leeg zijn');
      return;
    }
    updateProfile({ name: name.trim() });
    setEditingName(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveMessage = () => {
    updateProfile({ customMessage: customMessage.trim() || undefined });
    setEditingMessage(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const openAddTimeModal = () => {
    setEditingTimeId(null);
    setTimeLabel('');
    setTimeHour(9);
    setTimeMinute(0);
    setTimeEnabled(true);
    setModalVisible(true);
  };

  const openEditTimeModal = (time: CheckInTime) => {
    setEditingTimeId(time.id);
    setTimeLabel(time.label || '');
    setTimeHour(time.hour);
    setTimeMinute(time.minute);
    setTimeEnabled(time.enabled);
    setModalVisible(true);
  };

  const handleSaveTime = async () => {
    if (editingTimeId) {
      updateCheckInTime(editingTimeId, {
        hour: timeHour,
        minute: timeMinute,
        label: timeLabel.trim() || undefined,
        enabled: timeEnabled,
      });
    } else {
      const newTime: CheckInTime = {
        id: Date.now().toString(),
        hour: timeHour,
        minute: timeMinute,
        label: timeLabel.trim() || undefined,
        enabled: timeEnabled,
      };
      addCheckInTime(newTime);
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setModalVisible(false);
  };

  const handleDeleteTime = (id: string) => {
    if (state.schedule.times.length <= 1) {
      Alert.alert('Kan niet verwijderen', 'Je moet minimaal één check-in tijd hebben');
      return;
    }

    Alert.alert(
      'Check-in tijd verwijderen',
      'Weet je zeker dat je deze check-in tijd wilt verwijderen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: () => {
            deleteCheckInTime(id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleToggleTime = (id: string, enabled: boolean) => {
    updateCheckInTime(id, { enabled });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Instellingen</Text>
        <Text style={styles.subtitle}>Pas je check-in ervaring aan</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Profiel</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Naam</Text>
              {editingName ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    autoCapitalize="words"
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setName(profile?.name || '');
                        setEditingName(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Annuleren</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveEditButton]}
                      onPress={handleSaveName}
                    >
                      <Text style={styles.saveButtonText}>Opslaan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.settingValue}
                  onPress={() => setEditingName(true)}
                >
                  <Text style={styles.settingValueText}>{profile?.name}</Text>
                  <Text style={styles.editText}>Bewerken</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Aangepast bericht</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>
                Bericht verstuurd met check-ins
              </Text>
              {editingMessage ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.editInput, styles.textAreaInput]}
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    multiline
                    numberOfLines={3}
                    maxLength={150}
                    placeholder="Voeg een persoonlijk bericht toe..."
                    placeholderTextColor={colors.textLight}
                  />
                  <Text style={styles.charCount}>
                    {customMessage.length}/150
                  </Text>
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setCustomMessage(profile?.customMessage || '');
                        setEditingMessage(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Annuleren</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveEditButton]}
                      onPress={handleSaveMessage}
                    >
                      <Text style={styles.saveButtonText}>Opslaan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.settingValue}
                  onPress={() => setEditingMessage(true)}
                >
                  <Text style={styles.settingValueText}>
                    {profile?.customMessage || 'Geen bericht ingesteld'}
                  </Text>
                  <Text style={styles.editText}>Bewerken</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Check-in tijden</Text>
          </View>

          {state.schedule.times.map((time) => (
            <View key={time.id} style={styles.timeCard}>
              <View style={styles.timeCardHeader}>
                <View style={styles.timeCardInfo}>
                  <Text style={styles.timeCardTime}>{formatTime(time.hour, time.minute)}</Text>
                  {time.label && (
                    <Text style={styles.timeCardLabel}>{time.label}</Text>
                  )}
                </View>
                <Switch
                  value={time.enabled}
                  onValueChange={(value) => handleToggleTime(time.id, value)}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={time.enabled ? colors.primary : colors.textLight}
                />
              </View>
              <View style={styles.timeCardActions}>
                <TouchableOpacity
                  style={styles.timeCardButton}
                  onPress={() => openEditTimeModal(time)}
                >
                  <Text style={styles.timeCardButtonText}>Bewerken</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timeCardButton, styles.deleteTimeButton]}
                  onPress={() => handleDeleteTime(time.id)}
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text style={[styles.timeCardButtonText, styles.deleteTimeButtonText]}>Verwijderen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addTimeButton} onPress={openAddTimeModal}>
            <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.addTimeButtonText}>Check-in tijd toevoegen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Meldingen</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Eerste herinnering</Text>
              <Text style={styles.infoValue}>
                {state.schedule.reminderMinutes} min na check-in tijd
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Waarschuw contacten</Text>
              <Text style={styles.infoValue}>
                {state.schedule.alertMinutes} min bij geen reactie
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Abonnement</Text>
          </View>

          <TouchableOpacity
            style={styles.subscriptionCard}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.8}
          >
            <View style={styles.subscriptionCardContent}>
              <View style={styles.subscriptionCardHeader}>
                <Crown size={24} color={colors.primary} fill={state.subscription.isActive ? colors.primary : 'transparent'} />
                <View style={styles.subscriptionCardInfo}>
                  <Text style={styles.subscriptionCardTitle}>
                    {state.subscription.isActive ? 'Premium Actief' : state.subscription.isTrialing ? 'Proefperiode' : 'Activeer Premium'}
                  </Text>
                  <Text style={styles.subscriptionCardSubtitle}>
                    {state.subscription.isActive
                      ? 'Je hebt volledige toegang'
                      : state.subscription.isTrialing
                      ? `${Math.max(0, Math.ceil((new Date(state.subscription.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dagen resterend`
                      : 'Tik om te upgraden'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ik ben OK v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Gemaakt met ❤️ voor gemoedsrust
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTimeId ? 'Check-in tijd bewerken' : 'Check-in tijd toevoegen'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.labelText}>Label (optioneel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="bijv. Ochtend check-in"
                  placeholderTextColor={colors.textLight}
                  value={timeLabel}
                  onChangeText={setTimeLabel}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.timePickerRow}>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.labelText}>Uur</Text>
                  <View style={styles.timePickerButtons}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setTimeHour(timeHour === 0 ? 23 : timeHour - 1)}
                    >
                      <Text style={styles.timeButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>
                      {timeHour.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setTimeHour(timeHour === 23 ? 0 : timeHour + 1)}
                    >
                      <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timePickerColumn}>
                  <Text style={styles.labelText}>Minuut</Text>
                  <View style={styles.timePickerButtons}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setTimeMinute(timeMinute === 0 ? 45 : timeMinute - 15)}
                    >
                      <Text style={styles.timeButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeValue}>{timeMinute.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setTimeMinute(timeMinute === 45 ? 0 : timeMinute + 15)}
                    >
                      <Text style={styles.timeButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>


              </View>

              <View style={styles.switchRow}>
                <Text style={styles.labelText}>Ingeschakeld</Text>
                <Switch
                  value={timeEnabled}
                  onValueChange={setTimeEnabled}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={timeEnabled ? colors.primary : colors.textLight}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Annuleren</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveTime}
              >
                <Text style={styles.saveModalButtonText}>
                  {editingTimeId ? 'Wijzigingen opslaan' : 'Tijd toevoegen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  settingValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  editText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  editContainer: {
    gap: 12,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  saveEditButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  timeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  timeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeCardInfo: {
    flex: 1,
  },
  timeCardTime: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  timeCardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  timeCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeCardButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTimeButton: {
    flexDirection: 'row',
    gap: 6,
  },
  timeCardButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  deleteTimeButtonText: {
    color: colors.error,
  },
  addTimeButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed' as const,
    marginTop: 8,
  },
  addTimeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timePickerColumn: {
    flex: 1,
    gap: 8,
  },
  timePickerButtons: {
    gap: 8,
    alignItems: 'center',
  },
  timeButton: {
    width: '100%',
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeButtonText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  periodButton: {
    marginTop: 20,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: colors.textLight,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic' as const,
  },
  subscriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subscriptionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  subscriptionCardInfo: {
    flex: 1,
  },
  subscriptionCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  subscriptionCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
