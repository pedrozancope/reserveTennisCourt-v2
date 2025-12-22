export interface TimeSlot {
  id: string
  hour: number
  externalId: string
  displayName: string
  createdAt: string
}

export interface Schedule {
  id: string
  name: string
  timeSlotId: string
  timeSlot?: TimeSlot
  reservationDayOfWeek: number // 0-6 (dom-sáb)
  triggerDayOfWeek: number // 0-6 (dom-sáb)
  triggerTime: string // '00:01:00'
  cronExpression: string
  awsRuleArn?: string
  awsRuleName?: string
  frequency: "weekly" | "biweekly" | "monthly"
  isActive: boolean
  startDate?: string
  endDate?: string
  notifyOnSuccess: boolean
  notifyOnFailure: boolean
  createdAt: string
  updatedAt: string
}

export interface ExecutionLog {
  id: string
  scheduleId?: string
  schedule?: Schedule
  status: "success" | "error" | "pending"
  message?: string
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
  reservationDate?: string
  executedAt: string
  durationMs?: number
}

export interface Reservation {
  id: string
  scheduleId?: string
  schedule?: Schedule
  executionLogId?: string
  executionLog?: ExecutionLog
  timeSlotId?: string
  timeSlot?: TimeSlot
  reservationDate: string
  status: "confirmed" | "cancelled" | "failed"
  externalId?: string
  createdAt: string
}

export interface AppConfig {
  id: string
  key: string
  value?: string
  ssmParameterName?: string
  lastSyncedAt?: string
  updatedAt: string
}

export interface Notification {
  id: string
  type: "email" | "push"
  subject?: string
  body?: string
  status: "sent" | "failed" | "pending"
  relatedLogId?: string
  sentAt: string
}

// Form types
export interface ScheduleFormData {
  name: string
  timeSlotHour: number
  reservationDayOfWeek: number
  frequency: "weekly" | "biweekly" | "monthly"
  notifyOnSuccess: boolean
  notifyOnFailure: boolean
  startDate?: string
  endDate?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Dashboard stats
export interface DashboardStats {
  activeSchedules: number
  successRate: number
  nextReservation?: {
    date: string
    time: string
    scheduleName: string
  }
  tokenStatus: "valid" | "expiring" | "expired" | "unknown"
}
