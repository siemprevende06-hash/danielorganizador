export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_plan_tasks: {
        Row: {
          created_at: string
          daily_plan_id: string
          id: string
          order_index: number
          task_id: string
        }
        Insert: {
          created_at?: string
          daily_plan_id: string
          id?: string
          order_index?: number
          task_id: string
        }
        Update: {
          created_at?: string
          daily_plan_id?: string
          id?: string
          order_index?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plan_tasks_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          created_at: string
          id: string
          mode: string
          notes: string | null
          plan_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mode: string
          notes?: string | null
          plan_date: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          notes?: string | null
          plan_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      entrepreneurship_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          entrepreneurship_id: string
          id: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          entrepreneurship_id: string
          id?: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          entrepreneurship_id?: string
          id?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrepreneurship_tasks_entrepreneurship_id_fkey"
            columns: ["entrepreneurship_id"]
            isOneToOne: false
            referencedRelation: "entrepreneurships"
            referencedColumns: ["id"]
          },
        ]
      }
      entrepreneurships: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      goal_block_connections: {
        Row: {
          block_id: string
          block_name: string
          contribution_percentage: number | null
          created_at: string
          goal_id: string
          id: string
          user_id: string
        }
        Insert: {
          block_id: string
          block_name: string
          contribution_percentage?: number | null
          created_at?: string
          goal_id: string
          id?: string
          user_id: string
        }
        Update: {
          block_id?: string
          block_name?: string
          contribution_percentage?: number | null
          created_at?: string
          goal_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_block_connections_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          due_date: string | null
          goal_id: string
          id: string
          linked_to_block_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          goal_id: string
          id?: string
          linked_to_block_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          goal_id?: string
          id?: string
          linked_to_block_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          area_id: string | null
          created_at: string
          description: string | null
          id: string
          progress_percentage: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "entrepreneurship_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          area_id: string | null
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          routine_block_id: string | null
          source: string
          source_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          routine_block_id?: string | null
          source?: string
          source_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          routine_block_id?: string | null
          source?: string
          source_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      twelve_week_goals: {
        Row: {
          category: string
          connected_blocks: string[] | null
          created_at: string
          current_value: string | null
          description: string | null
          id: string
          progress_percentage: number | null
          quarter: number
          status: string
          target_value: string | null
          title: string
          updated_at: string
          user_id: string | null
          weekly_actions: Json | null
          year: number
        }
        Insert: {
          category: string
          connected_blocks?: string[] | null
          created_at?: string
          current_value?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          quarter: number
          status?: string
          target_value?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          weekly_actions?: Json | null
          year?: number
        }
        Update: {
          category?: string
          connected_blocks?: string[] | null
          created_at?: string
          current_value?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          quarter?: number
          status?: string
          target_value?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          weekly_actions?: Json | null
          year?: number
        }
        Relationships: []
      }
      university_subjects: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_adjust_enabled: boolean | null
          created_at: string
          id: string
          morning_end_time: string | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          auto_adjust_enabled?: boolean | null
          created_at?: string
          id?: string
          morning_end_time?: string | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          auto_adjust_enabled?: boolean | null
          created_at?: string
          id?: string
          morning_end_time?: string | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          completion_status: Json | null
          created_at: string
          daily_tasks: Json | null
          goal_id: string | null
          id: string
          notes: string | null
          quarter: number
          updated_at: string
          user_id: string | null
          week_number: number
          year: number
        }
        Insert: {
          completion_status?: Json | null
          created_at?: string
          daily_tasks?: Json | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          quarter: number
          updated_at?: string
          user_id?: string | null
          week_number: number
          year?: number
        }
        Update: {
          completion_status?: Json | null
          created_at?: string
          daily_tasks?: Json | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          quarter?: number
          updated_at?: string
          user_id?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "twelve_week_goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_status: "active" | "completed" | "paused" | "abandoned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      goal_status: ["active", "completed", "paused", "abandoned"],
    },
  },
} as const
