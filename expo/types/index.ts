export interface UserProfile {
  id: string;
  name: string;
  photo?: string;
  timezone: string;
  customMessage?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone?: string;
  email?: string;
  createdAt: string;
  inviteToken?: string;
  inviteStatus?: 'pending' | 'accepted' | 'expired';
  inviteSentAt?: string;
  deviceToken?: string;
  userId?: string;
}

export interface CheckInTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  label?: string;
}

export interface CheckInSchedule {
  times: CheckInTime[];
  reminderMinutes: number;
  alertMinutes: number;
}

export interface CheckInRecord {
  id: string;
  timestamp: string;
  status: 'checked_in' | 'missed' | 'reminded';
  date: string;
  scheduleTimeId?: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isTrialing: boolean;
  trialEndsAt?: string;
  subscribedAt?: string;
}

export interface AppState {
  profile: UserProfile | null;
  contacts: Contact[];
  schedule: CheckInSchedule;
  todayCheckIns: CheckInRecord[];
  checkInHistory: CheckInRecord[];
  hasCompletedOnboarding: boolean;
  subscription: SubscriptionStatus;
  userRole?: 'checkin' | 'receiver';
  linkedToUser?: string;
}
