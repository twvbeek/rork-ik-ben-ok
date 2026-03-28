import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, KeyboardAvoidingView, Platform, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Plus, X, Trash2, User, CheckCircle2, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import colors from '@/constants/colors';
import type { Contact } from '@/types';
import { trpc } from '@/lib/trpc';

export default function ContactsScreen() {
  const { state, addContact, deleteContact } = useApp();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');

  const generateInviteMutation = trpc.invite.generate.useMutation();

  const handleAddContact = async () => {
    if (!name.trim() || !relation.trim()) {
      Alert.alert('Ontbrekende informatie', 'Voer een naam en relatie in');
      return;
    }

    if (!phone.trim() && !relation.includes('@')) {
      Alert.alert(
        'Contact informatie vereist',
        'Voer een telefoonnummer of e-mailadres in om een uitnodiging te versturen'
      );
      return;
    }

    const contactId = Date.now().toString();
    const userId = state.profile?.id || 'demo-user';

    try {
      const inviteResult = await generateInviteMutation.mutateAsync({
        userId,
        contactId,
        contactName: name.trim(),
        phone: phone.trim() || undefined,
        email: relation.includes('@') ? relation.trim() : undefined,
      });

      const newContact: Contact = {
        id: contactId,
        name: name.trim(),
        relation: relation.trim(),
        phone: phone.trim() || undefined,
        createdAt: new Date().toISOString(),
        inviteToken: inviteResult.inviteToken,
        inviteStatus: 'pending',
        inviteSentAt: new Date().toISOString(),
      };

      addContact(newContact);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const inviteMessage = `Hoi ${name.trim()},\n\n${state.profile?.name || 'Iemand'} heeft je toegevoegd als contact voor de "I'm OK" app. Download de app en accepteer de uitnodiging om meldingen te ontvangen wanneer ze inchecken.\n\nUitnodigingslink:\n${inviteResult.inviteLink}\n\nContacten ontvangen de app gratis!`;
      
      if (Platform.OS === 'web') {
        Alert.alert(
          'Uitnodiging klaar',
          `Deel deze link met ${name.trim()}:\n\n${inviteResult.inviteLink}`,
          [
            {
              text: 'Kopieer Link',
              onPress: () => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(inviteResult.inviteLink);
                  Alert.alert('Gekopieerd', 'De uitnodigingslink is gekopieerd');
                }
              },
            },
            { text: 'OK' },
          ]
        );
      } else {
        await Share.share({
          message: inviteMessage,
          title: "I'm OK App Uitnodiging",
        });
      }

      setName('');
      setRelation('');
      setPhone('');
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to generate invite:', error);
      Alert.alert('Fout', 'Kon geen uitnodiging genereren. Probeer het opnieuw.');
    }
  };

  const handleDeleteContact = (id: string, contactName: string) => {
    Alert.alert(
      'Contact verwijderen',
      `Weet je zeker dat je ${contactName} wilt verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: () => {
            deleteContact(id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mijn contacten</Text>
        <Text style={styles.subtitle}>
          Mensen die je check-in meldingen ontvangen
        </Text>
      </View>

      {state.contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={64} color={colors.textLight} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Nog geen contacten</Text>
          <Text style={styles.emptyText}>
            Voeg familieleden of vrienden toe die je dagelijkse check-in meldingen moeten ontvangen
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {state.contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <User size={24} color={colors.primary} />
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relation}</Text>
                {contact.phone && (
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                )}
                {contact.inviteStatus && (
                  <View style={styles.statusBadge}>
                    {contact.inviteStatus === 'accepted' ? (
                      <>
                        <CheckCircle2 size={12} color={colors.success} />
                        <Text style={styles.statusTextAccepted}>Geaccepteerd</Text>
                      </>
                    ) : contact.inviteStatus === 'pending' ? (
                      <>
                        <Clock size={12} color={colors.secondary} />
                        <Text style={styles.statusTextPending}>In afwachting</Text>
                      </>
                    ) : (
                      <>
                        <X size={12} color={colors.error} />
                        <Text style={styles.statusTextExpired}>Verlopen</Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteContact(contact.id, contact.name)}
              >
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color={colors.surface} strokeWidth={2.5} />
        <Text style={styles.addButtonText}>Contact toevoegen</Text>
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>Contact toevoegen</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Naam *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="bijv. Moeder, Sarah, Jan"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relatie *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="bijv. Moeder, Dochter, Vriend"
                  placeholderTextColor={colors.textLight}
                  value={relation}
                  onChangeText={setRelation}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefoonnummer of e-mail *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Voor uitnodigingslink"
                  placeholderTextColor={colors.textLight}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="default"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.note}>
                * Verplichte velden
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuleren</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!name.trim() || !relation.trim()) && styles.saveButtonDisabled,
                ]}
                onPress={handleAddContact}
                disabled={!name.trim() || !relation.trim()}
              >
                <Text style={styles.saveButtonText}>Contact toevoegen</Text>
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
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  contactRelation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textLight,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
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
  label: {
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
  note: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 32,
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
  cancelButtonText: {
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
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusTextAccepted: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500' as const,
  },
  statusTextPending: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500' as const,
  },
  statusTextExpired: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500' as const,
  },
});
