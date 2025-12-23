export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      time_slots: {
        Row: {
          id: string
          hour: number
          external_id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id?: string
          hour: number
          external_id: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          hour?: number
          external_id?: string
          display_name?: string
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          name: string
          time_slot_id: string
          reservation_day_of_week: number
          trigger_day_of_week: number
          trigger_time: string
          cron_expression: string
          pg_cron_job_id: number | null
          frequency: "weekly" | "biweekly" | "monthly"
          is_active: boolean
          start_date: string | null
          end_date: string | null
          notify_on_success: boolean
          notify_on_failure: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          time_slot_id: string
          reservation_day_of_week: number
          trigger_day_of_week: number
          trigger_time?: string
          cron_expression: string
          pg_cron_job_id?: number | null
          frequency?: "weekly" | "biweekly" | "monthly"
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          notify_on_success?: boolean
          notify_on_failure?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          time_slot_id?: string
          reservation_day_of_week?: number
          trigger_day_of_week?: number
          trigger_time?: string
          cron_expression?: string
          pg_cron_job_id?: number | null
          frequency?: "weekly" | "biweekly" | "monthly"
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          notify_on_success?: boolean
          notify_on_failure?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      execution_logs: {
        Row: {
          id: string
          schedule_id: string | null
          status: "success" | "error" | "pending"
          message: string | null
          request_payload: Json | null
          response_payload: Json | null
          flow_steps: Json | null
          reservation_date: string | null
          executed_at: string
          duration_ms: number | null
        }
        Insert: {
          id?: string
          schedule_id?: string | null
          status: "success" | "error" | "pending"
          message?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          flow_steps?: Json | null
          reservation_date?: string | null
          executed_at?: string
          duration_ms?: number | null
        }
        Update: {
          id?: string
          schedule_id?: string | null
          status?: "success" | "error" | "pending"
          message?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          flow_steps?: Json | null
          reservation_date?: string | null
          executed_at?: string
          duration_ms?: number | null
        }
      }
      reservations: {
        Row: {
          id: string
          schedule_id: string | null
          execution_log_id: string | null
          time_slot_id: string | null
          reservation_date: string
          status: "confirmed" | "cancelled" | "failed"
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id?: string | null
          execution_log_id?: string | null
          time_slot_id?: string | null
          reservation_date: string
          status?: "confirmed" | "cancelled" | "failed"
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string | null
          execution_log_id?: string | null
          time_slot_id?: string | null
          reservation_date?: string
          status?: "confirmed" | "cancelled" | "failed"
          external_id?: string | null
          created_at?: string
        }
      }
      app_config: {
        Row: {
          id: string
          user_id: string
          key: string
          value: string | null
          ssm_parameter_name: string | null
          last_synced_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key: string
          value?: string | null
          ssm_parameter_name?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key?: string
          value?: string | null
          ssm_parameter_name?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: "email" | "push"
          subject: string | null
          body: string | null
          status: "sent" | "failed" | "pending"
          related_log_id: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "email" | "push"
          subject?: string | null
          body?: string | null
          status?: "sent" | "failed" | "pending"
          related_log_id?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "email" | "push"
          subject?: string | null
          body?: string | null
          status?: "sent" | "failed" | "pending"
          related_log_id?: string | null
          sent_at?: string
        }
      }
    }
    Views: {
      upcoming_reservations: {
        Row: {
          schedule_id: string
          schedule_name: string
          user_id: string
          reservation_day_of_week: number
          time_display: string
          external_id: string
          is_active: boolean
          cron_expression: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          active_schedules: number
          total_executions: number
          successful_executions: number
          failed_executions: number
          success_rate: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
