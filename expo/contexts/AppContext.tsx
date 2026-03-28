import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { AppState, Contact, UserProfile, CheckInSchedule, CheckInRecord, CheckInTime, SubscriptionStatus } from '@/types';

const STORAGE_KEY = 'imok_app_state';

const DEFAULT_SCHEDULE: CheckInSchedule = {
  times: [
    {
      id: '1',
      hour: 9,
      minute: 0,
      enabled: true,
      label: 'Morning check-in',
    },
  ],
  reminderMinutes: 15,
  alertMinutes: 30,
};

const DEFAULT_STATE: AppState = {
  profile: null,
  contacts: [],
  schedule: DEFAULT_SCHEDULE,
  todayCheckIns: [],
  checkInHistory: [],
  hasCompletedOnboarding: false,
  subscription: {
    isActive: false,
    isTrialing: true,
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  userRole: 'checkin',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (!parsed.subscription) {
          parsed.subscription = {
            isActive: false,
            isTrialing: true,
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
        
        if (parsed.schedule && !Array.isArray(parsed.schedule.times)) {
          const oldSchedule = parsed.schedule;
          parsed.schedule = {
            times: [
              {
                id: '1',
                hour: oldSchedule.hour || 9,
                minute: oldSchedule.minute || 0,
                enabled: oldSchedule.enabled !== false,
                label: 'Morning check-in',
              },
            ],
            reminderMinutes: oldSchedule.reminderMinutes || 15,
            alertMinutes: oldSchedule.alertMinutes || 30,
          };
        }
        
        if (parsed.todayCheckIn) {
          parsed.todayCheckIns = [parsed.todayCheckIn];
          delete parsed.todayCheckIn;
        }
        
        if (!parsed.todayCheckIns) {
          parsed.todayCheckIns = [];
        }
        
        const today = new Date().toISOString().split('T')[0];
        parsed.todayCheckIns = parsed.todayCheckIns.filter(
          (c: CheckInRecord) => c.date === today
        );
        
        setState(parsed);
      }
    } catch (error) {
      console.error('Failed to load app state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (newState: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  };

  const completeOnboarding = useCallback((profile: UserProfile) => {
    const newState: AppState = {
      ...state,
      profile,
      hasCompletedOnboarding: true,
    };
    saveState(newState);
  }, [state]);

  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    if (!state.profile) return;
    const newState: AppState = {
      ...state,
      profile: { ...state.profile, ...profile },
    };
    saveState(newState);
  }, [state]);

  const addContact = useCallback((contact: Contact) => {
    const newState: AppState = {
      ...state,
      contacts: [...state.contacts, contact],
    };
    saveState(newState);
  }, [state]);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    const newState: AppState = {
      ...state,
      contacts: state.contacts.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    };
    saveState(newState);
  }, [state]);

  const deleteContact = useCallback((id: string) => {
    const newState: AppState = {
      ...state,
      contacts: state.contacts.filter(c => c.id !== id),
    };
    saveState(newState);
  }, [state]);

  const updateSchedule = useCallback((schedule: Partial<CheckInSchedule>) => {
    const newState: AppState = {
      ...state,
      schedule: { ...state.schedule, ...schedule },
    };
    saveState(newState);
  }, [state]);

  const addCheckInTime = useCallback((time: CheckInTime) => {
    const newState: AppState = {
      ...state,
      schedule: {
        ...state.schedule,
        times: [...state.schedule.times, time],
      },
    };
    saveState(newState);
  }, [state]);

  const updateCheckInTime = useCallback((id: string, updates: Partial<CheckInTime>) => {
    const newState: AppState = {
      ...state,
      schedule: {
        ...state.schedule,
        times: state.schedule.times.map(t => 
          t.id === id ? { ...t, ...updates } : t
        ),
      },
    };
    saveState(newState);
  }, [state]);

  const deleteCheckInTime = useCallback((id: string) => {
    const newState: AppState = {
      ...state,
      schedule: {
        ...state.schedule,
        times: state.schedule.times.filter(t => t.id !== id),
      },
    };
    saveState(newState);
  }, [state]);

  const checkIn = useCallback((scheduleTimeId?: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const record: CheckInRecord = {
      id: now.getTime().toString(),
      timestamp: now.toISOString(),
      status: 'checked_in' as const,
      date: today,
      scheduleTimeId,
    };

    const newState: AppState = {
      ...state,
      todayCheckIns: [...state.todayCheckIns, record],
      checkInHistory: [record, ...state.checkInHistory.slice(0, 29)],
    };
    saveState(newState);
  }, [state]);

  const resetTodayCheckIn = useCallback(() => {
    const newState: AppState = {
      ...state,
      todayCheckIns: [],
    };
    saveState(newState);
  }, [state]);

  const getTodayStatus = useCallback((scheduleTimeId?: string) => {
    if (scheduleTimeId) {
      const checkIn = state.todayCheckIns.find(c => c.scheduleTimeId === scheduleTimeId);
      return checkIn ? checkIn.status : 'pending';
    }
    return state.todayCheckIns.length > 0 ? 'checked_in' : 'pending';
  }, [state.todayCheckIns]);

  const updateSubscription = useCallback((subscription: SubscriptionStatus) => {
    const newState: AppState = {
      ...state,
      subscription,
    };
    saveState(newState);
  }, [state]);

  const hasActiveSubscription = useCallback(() => {
    if (state.userRole === 'receiver') return true;
    
    const sub = state.subscription;
    if (sub.isActive) return true;
    if (sub.isTrialing && sub.trialEndsAt) {
      return new Date(sub.trialEndsAt) > new Date();
    }
    return false;
  }, [state.subscription, state.userRole]);

  return useMemo(() => ({
    state,
    isLoading,
    completeOnboarding,
    updateProfile,
    addContact,
    updateContact,
    deleteContact,
    updateSchedule,
    addCheckInTime,
    updateCheckInTime,
    deleteCheckInTime,
    checkIn,
    resetTodayCheckIn,
    getTodayStatus,
    updateSubscription,
    hasActiveSubscription,
  }), [state, isLoading, completeOnboarding, updateProfile, addContact, updateContact, deleteContact, updateSchedule, addCheckInTime, updateCheckInTime, deleteCheckInTime, checkIn, resetTodayCheckIn, getTodayStatus, updateSubscription, hasActiveSubscription]);
});
