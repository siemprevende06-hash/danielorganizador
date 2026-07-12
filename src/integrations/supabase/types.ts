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
      achievements: {
        Row: {
          achievement_description: string | null
          achievement_key: string
          achievement_title: string
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_key: string
          achievement_title: string
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_description?: string | null
          achievement_key?: string
          achievement_title?: string
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      activity_tracking: {
        Row: {
          activity_date: string
          activity_type: string
          bonus_minutes: number | null
          completed: boolean | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: string
          bonus_minutes?: number | null
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          bonus_minutes?: number | null
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      area_goals_config: {
        Row: {
          area_id: string
          created_at: string
          default_exercises_goal: number | null
          default_pages_goal: number | null
          default_time_goal_minutes: number | null
          id: string
          show_exercises_tracking: boolean | null
          show_pages_tracking: boolean | null
          show_time_tracking: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          created_at?: string
          default_exercises_goal?: number | null
          default_pages_goal?: number | null
          default_time_goal_minutes?: number | null
          id?: string
          show_exercises_tracking?: boolean | null
          show_pages_tracking?: boolean | null
          show_time_tracking?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string
          default_exercises_goal?: number | null
          default_pages_goal?: number | null
          default_time_goal_minutes?: number | null
          id?: string
          show_exercises_tracking?: boolean | null
          show_pages_tracking?: boolean | null
          show_time_tracking?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      area_streaks: {
        Row: {
          area_id: string
          created_at: string
          current_streak: number | null
          id: string
          last_completed_date: string | null
          longest_streak: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          created_at?: string
          current_streak?: number | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string
          current_streak?: number | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      block_completions: {
        Row: {
          block_id: string
          completed: boolean | null
          completed_at: string | null
          completion_date: string
          created_at: string | null
          id: string
          tasks_completed: number | null
          tasks_total: number | null
          user_id: string | null
        }
        Insert: {
          block_id: string
          completed?: boolean | null
          completed_at?: string | null
          completion_date?: string
          created_at?: string | null
          id?: string
          tasks_completed?: number | null
          tasks_total?: number | null
          user_id?: string | null
        }
        Update: {
          block_id?: string
          completed?: boolean | null
          completed_at?: string | null
          completion_date?: string
          created_at?: string | null
          id?: string
          tasks_completed?: number | null
          tasks_total?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      boxeo_sesiones: {
        Row: {
          created_at: string
          duracion_minutos: number
          fecha: string
          id: string
          intensidad: string
          notas: string | null
          rounds: number
          tecnicas_practicadas: Json
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duracion_minutos?: number
          fecha?: string
          id?: string
          intensidad?: string
          notas?: string | null
          rounds?: number
          tecnicas_practicadas?: Json
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duracion_minutos?: number
          fecha?: string
          id?: string
          intensidad?: string
          notas?: string | null
          rounds?: number
          tecnicas_practicadas?: Json
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      boxeo_tecnicas: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string | null
          id: string
          nivel_dominio: number
          nivel_requerido: number
          nombre: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nivel_dominio?: number
          nivel_requerido?: number
          nombre: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nivel_dominio?: number
          nivel_requerido?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      challenge_90_days: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          notes: string | null
          start_date: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chess_goals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          starting_elo: number | null
          target_elo: number | null
          target_games_per_month: number | null
          target_minutes_per_day: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          starting_elo?: number | null
          target_elo?: number | null
          target_games_per_month?: number | null
          target_minutes_per_day?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          starting_elo?: number | null
          target_elo?: number | null
          target_games_per_month?: number | null
          target_minutes_per_day?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chess_sessions: {
        Row: {
          created_at: string
          current_elo: number | null
          duration_minutes: number | null
          games_played: number | null
          games_won: number | null
          id: string
          notes: string | null
          platform: string | null
          session_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_elo?: number | null
          duration_minutes?: number | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          notes?: string | null
          platform?: string | null
          session_date?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_elo?: number | null
          duration_minutes?: number | null
          games_played?: number | null
          games_won?: number | null
          id?: string
          notes?: string | null
          platform?: string | null
          session_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      citas: {
        Row: {
          created_at: string
          fecha: string
          id: string
          lugar: string | null
          notas: string | null
          persona: string
          rating: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha?: string
          id?: string
          lugar?: string | null
          notas?: string | null
          persona: string
          rating?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          lugar?: string | null
          notas?: string | null
          persona?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      confidence_steps: {
        Row: {
          area: string
          completed: boolean | null
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          order_index: number | null
          parent_id: string | null
          progress_percentage: number | null
          target_date: string | null
          target_level: number | null
          title: string
          updated_at: string | null
          user_id: string | null
          view_type: string | null
        }
        Insert: {
          area: string
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          order_index?: number | null
          parent_id?: string | null
          progress_percentage?: number | null
          target_date?: string | null
          target_level?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          view_type?: string | null
        }
        Update: {
          area?: string
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          order_index?: number | null
          parent_id?: string | null
          progress_percentage?: number | null
          target_date?: string | null
          target_level?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confidence_steps_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "confidence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_area_stats: {
        Row: {
          area_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string
          exercises_done: number | null
          exercises_goal: number | null
          id: string
          notes: string | null
          pages_done: number | null
          pages_goal: number | null
          stat_date: string
          time_goal_minutes: number | null
          time_spent_minutes: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          exercises_done?: number | null
          exercises_goal?: number | null
          id?: string
          notes?: string | null
          pages_done?: number | null
          pages_goal?: number | null
          stat_date?: string
          time_goal_minutes?: number | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          exercises_done?: number | null
          exercises_goal?: number | null
          id?: string
          notes?: string | null
          pages_done?: number | null
          pages_goal?: number | null
          stat_date?: string
          time_goal_minutes?: number | null
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
          block_assignments: Json | null
          created_at: string
          excluded_blocks: string[] | null
          id: string
          mode: string
          notes: string | null
          plan_date: string
          preset_id: string | null
          routine_type: string | null
          sleep_time: string | null
          updated_at: string
          user_id: string | null
          wake_time: string | null
        }
        Insert: {
          block_assignments?: Json | null
          created_at?: string
          excluded_blocks?: string[] | null
          id?: string
          mode: string
          notes?: string | null
          plan_date: string
          preset_id?: string | null
          routine_type?: string | null
          sleep_time?: string | null
          updated_at?: string
          user_id?: string | null
          wake_time?: string | null
        }
        Update: {
          block_assignments?: Json | null
          created_at?: string
          excluded_blocks?: string[] | null
          id?: string
          mode?: string
          notes?: string | null
          plan_date?: string
          preset_id?: string | null
          routine_type?: string | null
          sleep_time?: string | null
          updated_at?: string
          user_id?: string | null
          wake_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "routine_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reviews: {
        Row: {
          block_ratings: Json | null
          blocks_completed: number | null
          blocks_total: number | null
          created_at: string | null
          focus_minutes: number | null
          habits_completed: number | null
          habits_total: number | null
          id: string
          overall_rating: number | null
          pillar_progress: Json | null
          review_date: string
          secondary_goals_progress: Json | null
          tasks_completed: number | null
          tasks_total: number | null
          tomorrow_plan: string | null
          updated_at: string | null
          user_id: string | null
          what_could_be_better: string | null
          what_went_well: string | null
        }
        Insert: {
          block_ratings?: Json | null
          blocks_completed?: number | null
          blocks_total?: number | null
          created_at?: string | null
          focus_minutes?: number | null
          habits_completed?: number | null
          habits_total?: number | null
          id?: string
          overall_rating?: number | null
          pillar_progress?: Json | null
          review_date?: string
          secondary_goals_progress?: Json | null
          tasks_completed?: number | null
          tasks_total?: number | null
          tomorrow_plan?: string | null
          updated_at?: string | null
          user_id?: string | null
          what_could_be_better?: string | null
          what_went_well?: string | null
        }
        Update: {
          block_ratings?: Json | null
          blocks_completed?: number | null
          blocks_total?: number | null
          created_at?: string | null
          focus_minutes?: number | null
          habits_completed?: number | null
          habits_total?: number | null
          id?: string
          overall_rating?: number | null
          pillar_progress?: Json | null
          review_date?: string
          secondary_goals_progress?: Json | null
          tasks_completed?: number | null
          tasks_total?: number | null
          tomorrow_plan?: string | null
          updated_at?: string | null
          user_id?: string | null
          what_could_be_better?: string | null
          what_went_well?: string | null
        }
        Relationships: []
      }
      daily_systems_tracking: {
        Row: {
          block_completions: Json | null
          completions: Json | null
          count_data: Json | null
          created_at: string | null
          id: string
          meal_photos: Json | null
          sleep_time: string | null
          time_data: Json | null
          tracking_date: string
          updated_at: string | null
          user_id: string | null
          wake_time: string | null
          water_data: Json | null
          work_assignments: Json | null
          workout_duration: number | null
          workout_intensity: string | null
        }
        Insert: {
          block_completions?: Json | null
          completions?: Json | null
          count_data?: Json | null
          created_at?: string | null
          id?: string
          meal_photos?: Json | null
          sleep_time?: string | null
          time_data?: Json | null
          tracking_date?: string
          updated_at?: string | null
          user_id?: string | null
          wake_time?: string | null
          water_data?: Json | null
          work_assignments?: Json | null
          workout_duration?: number | null
          workout_intensity?: string | null
        }
        Update: {
          block_completions?: Json | null
          completions?: Json | null
          count_data?: Json | null
          created_at?: string | null
          id?: string
          meal_photos?: Json | null
          sleep_time?: string | null
          time_data?: Json | null
          tracking_date?: string
          updated_at?: string | null
          user_id?: string | null
          wake_time?: string | null
          water_data?: Json | null
          work_assignments?: Json | null
          workout_duration?: number | null
          workout_intensity?: string | null
        }
        Relationships: []
      }
      distribution_bags: {
        Row: {
          balance: number
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          percentage: number
          updated_at: string
        }
        Insert: {
          balance?: number
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          percentage?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      entrepreneurship_income: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          entrepreneurship_id: string
          id: string
          income_date: string
          income_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          entrepreneurship_id: string
          id?: string
          income_date?: string
          income_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          entrepreneurship_id?: string
          id?: string
          income_date?: string
          income_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrepreneurship_income_entrepreneurship_id_fkey"
            columns: ["entrepreneurship_id"]
            isOneToOne: false
            referencedRelation: "entrepreneurships"
            referencedColumns: ["id"]
          },
        ]
      }
      entrepreneurship_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          entrepreneurship_id: string
          id: string
          routine_block_id: string | null
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
          routine_block_id?: string | null
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
          routine_block_id?: string | null
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
      eventos_sociales: {
        Row: {
          con_quien: Json
          created_at: string
          descripcion: string | null
          fecha: string
          gasto: number
          id: string
          notas: string | null
          rating: number
          tipo: string
          updated_at: string
        }
        Insert: {
          con_quien?: Json
          created_at?: string
          descripcion?: string | null
          fecha?: string
          gasto?: number
          id?: string
          notas?: string | null
          rating?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          con_quien?: Json
          created_at?: string
          descripcion?: string | null
          fecha?: string
          gasto?: number
          id?: string
          notas?: string | null
          rating?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string | null
          current_exercises: number | null
          current_study_hours: number | null
          exam_date: string
          grade: number | null
          id: string
          notes: string | null
          preparation_days: number | null
          status: string | null
          subject_id: string | null
          target_exercises: number | null
          target_study_hours: number | null
          title: string
          topics: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_exercises?: number | null
          current_study_hours?: number | null
          exam_date: string
          grade?: number | null
          id?: string
          notes?: string | null
          preparation_days?: number | null
          status?: string | null
          subject_id?: string | null
          target_exercises?: number | null
          target_study_hours?: number | null
          title: string
          topics?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_exercises?: number | null
          current_study_hours?: number | null
          exam_date?: string
          grade?: number | null
          id?: string
          notes?: string | null
          preparation_days?: number | null
          status?: string | null
          subject_id?: string | null
          target_exercises?: number | null
          target_study_hours?: number | null
          title?: string
          topics?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "university_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          log_date: string
          notes: string | null
          reps_per_set: Json | null
          sets_completed: number | null
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          reps_per_set?: Json | null
          sets_completed?: number | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          reps_per_set?: Json | null
          sets_completed?: number | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          block_id: string | null
          completed: boolean | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          notes: string | null
          start_time: string
          task_area: string | null
          task_id: string | null
          task_ids: Json | null
          task_title: string
          user_id: string | null
        }
        Insert: {
          block_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time: string
          task_area?: string | null
          task_id?: string | null
          task_ids?: Json | null
          task_title: string
          user_id?: string | null
        }
        Update: {
          block_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          start_time?: string
          task_area?: string | null
          task_id?: string | null
          task_ids?: Json | null
          task_title?: string
          user_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          block_id: string
          block_name: string
          contribution_percentage?: number | null
          created_at?: string
          goal_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          block_id?: string
          block_name?: string
          contribution_percentage?: number | null
          created_at?: string
          goal_id?: string
          id?: string
          user_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          goal_id: string
          id?: string
          linked_to_block_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          goal_id?: string
          id?: string
          linked_to_block_id?: string | null
          title?: string
          user_id?: string | null
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
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          progress_percentage: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_date: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      grocery_products: {
        Row: {
          category: string | null
          created_at: string
          current_stock: number
          id: string
          name: string
          notes: string | null
          package_quantity: number
          price: number
          storage_type: string
          unit: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          name: string
          notes?: string | null
          package_quantity?: number
          price?: number
          storage_type?: string
          unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          name?: string
          notes?: string | null
          package_quantity?: number
          price?: number
          storage_type?: string
          unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      habit_history: {
        Row: {
          completed_dates: Json | null
          created_at: string
          current_streak: number | null
          habit_id: string
          id: string
          longest_streak: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_dates?: Json | null
          created_at?: string
          current_streak?: number | null
          habit_id: string
          id?: string
          longest_streak?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_dates?: Json | null
          created_at?: string
          current_streak?: number | null
          habit_id?: string
          id?: string
          longest_streak?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      identity_plan: {
        Row: {
          area_id: string
          area_label: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          point_a: string
          point_b: string
          progress_percentage: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          area_label: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          point_a?: string
          point_b?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          area_label?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          point_a?: string
          point_b?: string
          progress_percentage?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      identity_plan_tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          identity_plan_id: string
          is_primary: boolean
          order_index: number
          parent_task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          identity_plan_id: string
          is_primary?: boolean
          order_index?: number
          parent_task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          identity_plan_id?: string
          is_primary?: boolean
          order_index?: number
          parent_task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_plan_tasks_identity_plan_id_fkey"
            columns: ["identity_plan_id"]
            isOneToOne: false
            referencedRelation: "identity_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_plan_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "identity_plan_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_systems: {
        Row: {
          area_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          linked_system_hint: string | null
          name: string
          sort_order: number
          tasks: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          linked_system_hint?: string | null
          name: string
          sort_order?: number
          tasks?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          linked_system_hint?: string | null
          name?: string
          sort_order?: number
          tasks?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      identity_systems_daily: {
        Row: {
          created_at: string
          id: string
          system_id: string
          task_states: Json
          tracking_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          system_id: string
          task_states?: Json
          tracking_date?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          system_id?: string
          task_states?: Json
          tracking_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_systems_daily_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "identity_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      intimidad_tracking: {
        Row: {
          calidad: number
          created_at: string
          fecha: string
          id: string
          notas: string | null
          posiciones: Json
          updated_at: string
        }
        Insert: {
          calidad?: number
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          posiciones?: Json
          updated_at?: string
        }
        Update: {
          calidad?: number
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          posiciones?: Json
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      language_sessions: {
        Row: {
          block_type: string
          created_at: string | null
          grammar_completed: boolean | null
          grammar_duration: number | null
          id: string
          language: string
          listening_completed: boolean | null
          listening_duration: number | null
          notes: string | null
          reading_completed: boolean | null
          reading_duration: number | null
          session_date: string
          speaking_completed: boolean | null
          speaking_duration: number | null
          total_duration: number | null
          user_id: string | null
          vocabulary_completed: boolean | null
          vocabulary_duration: number | null
        }
        Insert: {
          block_type: string
          created_at?: string | null
          grammar_completed?: boolean | null
          grammar_duration?: number | null
          id?: string
          language: string
          listening_completed?: boolean | null
          listening_duration?: number | null
          notes?: string | null
          reading_completed?: boolean | null
          reading_duration?: number | null
          session_date?: string
          speaking_completed?: boolean | null
          speaking_duration?: number | null
          total_duration?: number | null
          user_id?: string | null
          vocabulary_completed?: boolean | null
          vocabulary_duration?: number | null
        }
        Update: {
          block_type?: string
          created_at?: string | null
          grammar_completed?: boolean | null
          grammar_duration?: number | null
          id?: string
          language?: string
          listening_completed?: boolean | null
          listening_duration?: number | null
          notes?: string | null
          reading_completed?: boolean | null
          reading_duration?: number | null
          session_date?: string
          speaking_completed?: boolean | null
          speaking_duration?: number | null
          total_duration?: number | null
          user_id?: string | null
          vocabulary_completed?: boolean | null
          vocabulary_duration?: number | null
        }
        Relationships: []
      }
      language_settings: {
        Row: {
          ai_conversation_enabled: boolean | null
          created_at: string | null
          current_language: string
          english_level: string | null
          id: string
          italian_level: string | null
          preferred_resources: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_conversation_enabled?: boolean | null
          created_at?: string | null
          current_language?: string
          english_level?: string | null
          id?: string
          italian_level?: string | null
          preferred_resources?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_conversation_enabled?: boolean | null
          created_at?: string | null
          current_language?: string
          english_level?: string | null
          id?: string
          italian_level?: string | null
          preferred_resources?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          loan_date: string
          paid_amount: number | null
          person: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          loan_date?: string
          paid_amount?: number | null
          person: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          loan_date?: string
          paid_amount?: number | null
          person?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_details: {
        Row: {
          ai_response: Json | null
          carbs_grams: number | null
          created_at: string | null
          description: string
          estimated_calories: number | null
          fat_grams: number | null
          id: string
          meal_tracking_id: string | null
          protein_grams: number | null
          user_id: string | null
        }
        Insert: {
          ai_response?: Json | null
          carbs_grams?: number | null
          created_at?: string | null
          description: string
          estimated_calories?: number | null
          fat_grams?: number | null
          id?: string
          meal_tracking_id?: string | null
          protein_grams?: number | null
          user_id?: string | null
        }
        Update: {
          ai_response?: Json | null
          carbs_grams?: number | null
          created_at?: string | null
          description?: string
          estimated_calories?: number | null
          fat_grams?: number | null
          id?: string
          meal_tracking_id?: string | null
          protein_grams?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_details_meal_tracking_id_fkey"
            columns: ["meal_tracking_id"]
            isOneToOne: false
            referencedRelation: "meal_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan: {
        Row: {
          created_at: string
          id: string
          meal_slot: string
          plan_date: string
          recipe_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          meal_slot: string
          plan_date: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meal_slot?: string
          plan_date?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_tracking: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          meal_date: string
          meal_type: string
          notes: string | null
          scheduled_time: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          meal_date?: string
          meal_type: string
          notes?: string | null
          scheduled_time: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          meal_date?: string
          meal_type?: string
          notes?: string | null
          scheduled_time?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mini_habits: {
        Row: {
          created_at: string
          emoji: string
          habit_key: string
          id: string
          label: string
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string
          habit_key: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string
          habit_key?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      monthly_area_goals: {
        Row: {
          area_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string
          current_value: number
          description: string | null
          id: string
          month_end: string
          month_start: string
          priority: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          month_end: string
          month_start: string
          priority?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          month_end?: string
          month_start?: string
          priority?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      music_practice_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          instrument: string
          notes: string | null
          practice_date: string
          song_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          instrument: string
          notes?: string | null
          practice_date?: string
          song_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          instrument?: string
          notes?: string | null
          practice_date?: string
          song_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "music_practice_sessions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "music_repertoire"
            referencedColumns: ["id"]
          },
        ]
      }
      music_repertoire: {
        Row: {
          artist: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          instrument: string
          last_practiced: string | null
          notes: string | null
          practice_minutes: number | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          instrument: string
          last_practiced?: string | null
          notes?: string | null
          practice_minutes?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          instrument?: string
          last_practiced?: string | null
          notes?: string | null
          practice_minutes?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      necesidades: {
        Row: {
          area_referencia: string | null
          created_at: string
          descripcion: string | null
          icono: string | null
          id: string
          necesidad_id: string
          orden: number
          progreso: number
          titulo: string
          updated_at: string
        }
        Insert: {
          area_referencia?: string | null
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          necesidad_id: string
          orden?: number
          progreso?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          area_referencia?: string | null
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          necesidad_id?: string
          orden?: number
          progreso?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      partial_exam_topics: {
        Row: {
          created_at: string | null
          id: string
          partial_exam_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          partial_exam_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          partial_exam_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partial_exam_topics_partial_exam_id_fkey"
            columns: ["partial_exam_id"]
            isOneToOne: false
            referencedRelation: "partial_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_exam_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "subject_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      partial_exams: {
        Row: {
          created_at: string | null
          exam_date: string | null
          grade: number | null
          id: string
          status: string | null
          subject_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          weight_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          grade?: number | null
          id?: string
          status?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          weight_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          grade?: number | null
          id?: string
          status?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          weight_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partial_exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "university_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_modes: {
        Row: {
          active_routine: Json | null
          config: Json
          created_at: string
          description: string | null
          id: string
          is_selected: boolean
          mode_key: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active_routine?: Json | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_selected?: boolean
          mode_key: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active_routine?: Json | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_selected?: boolean
          mode_key?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      periodic_reviews: {
        Row: {
          consistency_data: Json | null
          created_at: string | null
          effort_objectives: Json
          id: string
          lessons_learned: string | null
          next_period_focus: string | null
          overall_effort_score: number | null
          overall_rating: number | null
          overall_result_score: number | null
          period_end: string
          period_start: string
          result_objectives: Json
          review_type: string
          struggles: string | null
          updated_at: string | null
          user_id: string | null
          wins: string | null
        }
        Insert: {
          consistency_data?: Json | null
          created_at?: string | null
          effort_objectives?: Json
          id?: string
          lessons_learned?: string | null
          next_period_focus?: string | null
          overall_effort_score?: number | null
          overall_rating?: number | null
          overall_result_score?: number | null
          period_end: string
          period_start: string
          result_objectives?: Json
          review_type: string
          struggles?: string | null
          updated_at?: string | null
          user_id?: string | null
          wins?: string | null
        }
        Update: {
          consistency_data?: Json | null
          created_at?: string | null
          effort_objectives?: Json
          id?: string
          lessons_learned?: string | null
          next_period_focus?: string | null
          overall_effort_score?: number | null
          overall_rating?: number | null
          overall_result_score?: number | null
          period_end?: string
          period_start?: string
          result_objectives?: Json
          review_type?: string
          struggles?: string | null
          updated_at?: string | null
          user_id?: string | null
          wins?: string | null
        }
        Relationships: []
      }
      physical_goals: {
        Row: {
          created_at: string | null
          gym_days_target: number | null
          id: string
          is_active: boolean | null
          start_date: string
          start_photo_url: string | null
          start_weight: number
          target_date: string | null
          target_photo_url: string | null
          target_weight: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gym_days_target?: number | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          start_photo_url?: string | null
          start_weight: number
          target_date?: string | null
          target_photo_url?: string | null
          target_weight: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gym_days_target?: number | null
          id?: string
          is_active?: boolean | null
          start_date?: string
          start_photo_url?: string | null
          start_weight?: number
          target_date?: string | null
          target_photo_url?: string | null
          target_weight?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      physical_tracking: {
        Row: {
          arm_cm: number | null
          body_fat_percentage: number | null
          chest_cm: number | null
          created_at: string | null
          front_photo_url: string | null
          id: string
          measurement_date: string
          notes: string | null
          side_photo_url: string | null
          user_id: string | null
          waist_cm: number | null
          weight: number
        }
        Insert: {
          arm_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string | null
          front_photo_url?: string | null
          id?: string
          measurement_date?: string
          notes?: string | null
          side_photo_url?: string | null
          user_id?: string | null
          waist_cm?: number | null
          weight: number
        }
        Update: {
          arm_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string | null
          front_photo_url?: string | null
          id?: string
          measurement_date?: string
          notes?: string | null
          side_photo_url?: string | null
          user_id?: string | null
          waist_cm?: number | null
          weight?: number
        }
        Relationships: []
      }
      pillar_covers: {
        Row: {
          cover_url: string | null
          pillar_id: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          pillar_id: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          pillar_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      point_b_metrics: {
        Row: {
          area: string | null
          area_id: string
          created_at: string
          current_value: string | null
          icon: string | null
          id: string
          metric_name: string
          sort_order: number
          target_value: string | null
          unit: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area?: string | null
          area_id: string
          created_at?: string
          current_value?: string | null
          icon?: string | null
          id?: string
          metric_name: string
          sort_order?: number
          target_value?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area?: string | null
          area_id?: string
          created_at?: string
          current_value?: string | null
          icon?: string | null
          id?: string
          metric_name?: string
          sort_order?: number
          target_value?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string | null
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
          user_id: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      punto_partida: {
        Row: {
          area_id: string
          area_type: string
          created_at: string
          hechos: Json
          id: string
          nota: number
          respuestas: Json
          sub_scores: Json
          updated_at: string
        }
        Insert: {
          area_id: string
          area_type?: string
          created_at?: string
          hechos?: Json
          id?: string
          nota?: number
          respuestas?: Json
          sub_scores?: Json
          updated_at?: string
        }
        Update: {
          area_id?: string
          area_type?: string
          created_at?: string
          hechos?: Json
          id?: string
          nota?: number
          respuestas?: Json
          sub_scores?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reading_library: {
        Row: {
          author: string | null
          cover_image_url: string | null
          created_at: string | null
          finish_date: string | null
          genre: string | null
          id: string
          notes: string | null
          pages_read: number | null
          pages_total: number | null
          rating: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          finish_date?: string | null
          genre?: string | null
          id?: string
          notes?: string | null
          pages_read?: number | null
          pages_total?: number | null
          rating?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          finish_date?: string | null
          genre?: string | null
          id?: string
          notes?: string | null
          pages_read?: number | null
          pages_total?: number | null
          rating?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          name: string
          quantity: number | null
          recipe_id: string
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          quantity?: number | null
          recipe_id: string
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          quantity?: number | null
          recipe_id?: string
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          name: string
          photo_url: string | null
          servings: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          name: string
          photo_url?: string | null
          servings?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          name?: string
          photo_url?: string | null
          servings?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          reminder_datetime: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          reminder_datetime: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          reminder_datetime?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rewards_redemptions: {
        Row: {
          costo: number
          created_at: string
          fecha: string
          icono: string | null
          id: string
          nombre: string
          recompensa_id: string
          user_id: string | null
        }
        Insert: {
          costo: number
          created_at?: string
          fecha?: string
          icono?: string | null
          id?: string
          nombre: string
          recompensa_id: string
          user_id?: string | null
        }
        Update: {
          costo?: number
          created_at?: string
          fecha?: string
          icono?: string | null
          id?: string
          nombre?: string
          recompensa_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      routine_blocks: {
        Row: {
          block_id: string
          block_type: string | null
          can_subdivide: boolean | null
          created_at: string
          current_focus: string | null
          default_focus: string | null
          emergency_only: boolean | null
          end_time: string
          id: string
          notes: string | null
          order_index: number | null
          start_time: string
          sub_blocks: Json | null
          tasks: Json | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          block_id: string
          block_type?: string | null
          can_subdivide?: boolean | null
          created_at?: string
          current_focus?: string | null
          default_focus?: string | null
          emergency_only?: boolean | null
          end_time: string
          id?: string
          notes?: string | null
          order_index?: number | null
          start_time: string
          sub_blocks?: Json | null
          tasks?: Json | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          block_id?: string
          block_type?: string | null
          can_subdivide?: boolean | null
          created_at?: string
          current_focus?: string | null
          default_focus?: string | null
          emergency_only?: boolean | null
          end_time?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          start_time?: string
          sub_blocks?: Json | null
          tasks?: Json | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      routine_completions: {
        Row: {
          completed_tasks: Json | null
          completion_date: string
          created_at: string
          id: string
          routine_type: string
          user_id: string | null
        }
        Insert: {
          completed_tasks?: Json | null
          completion_date?: string
          created_at?: string
          id?: string
          routine_type: string
          user_id?: string | null
        }
        Update: {
          completed_tasks?: Json | null
          completion_date?: string
          created_at?: string
          id?: string
          routine_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      routine_presets: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          excluded_block_ids: string[] | null
          icon: string | null
          id: string
          is_default: boolean | null
          modified_blocks: Json | null
          name: string
          sleep_hours: number | null
          sleep_time: string
          updated_at: string | null
          user_id: string | null
          wake_time: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          excluded_block_ids?: string[] | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          modified_blocks?: Json | null
          name: string
          sleep_hours?: number | null
          sleep_time: string
          updated_at?: string | null
          user_id?: string | null
          wake_time: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          excluded_block_ids?: string[] | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          modified_blocks?: Json | null
          name?: string
          sleep_hours?: number | null
          sleep_time?: string
          updated_at?: string | null
          user_id?: string | null
          wake_time?: string
        }
        Relationships: []
      }
      routine_steps: {
        Row: {
          created_at: string
          duration_min: number | null
          group_id: string | null
          group_title: string | null
          id: string
          routine_type: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          group_id?: string | null
          group_title?: string | null
          id?: string
          routine_type: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          group_id?: string | null
          group_title?: string | null
          id?: string
          routine_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      routine_steps_daily: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          step_id: string
          tracking_date: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          step_id: string
          tracking_date?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          step_id?: string
          tracking_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_steps_daily_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "routine_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_objectives: {
        Row: {
          area: string | null
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          max_daily: number | null
          min_daily: number | null
          objective_type: string
          sort_order: number
          sprint_id: string
          status: string
          target_value: number | null
          title: string
          type: string | null
          unit: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          max_daily?: number | null
          min_daily?: number | null
          objective_type: string
          sort_order?: number
          sprint_id: string
          status?: string
          target_value?: number | null
          title: string
          type?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          max_daily?: number | null
          min_daily?: number | null
          objective_type?: string
          sort_order?: number
          sprint_id?: string
          status?: string
          target_value?: number | null
          title?: string
          type?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_objectives_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      strength_goals: {
        Row: {
          created_at: string
          current_reps: number | null
          current_weight_kg: number | null
          exercise_key: string
          exercise_name: string
          id: string
          notes: string | null
          target_reps: number | null
          target_weight_kg: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_reps?: number | null
          current_weight_kg?: number | null
          exercise_key: string
          exercise_name: string
          id?: string
          notes?: string | null
          target_reps?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_reps?: number | null
          current_weight_kg?: number | null
          exercise_key?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          target_reps?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subject_topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_for_final: boolean | null
          order_index: number | null
          subject_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_for_final?: boolean | null
          order_index?: number | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_for_final?: boolean | null
          order_index?: number | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "university_subjects"
            referencedColumns: ["id"]
          },
        ]
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
      system_card_covers: {
        Row: {
          card_id: string
          cover_url: string | null
          updated_at: string
        }
        Insert: {
          card_id: string
          cover_url?: string | null
          updated_at?: string
        }
        Update: {
          card_id?: string
          cover_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_habit_streaks: {
        Row: {
          created_at: string
          current_streak: number
          habit_id: string
          id: string
          last_completed_date: string | null
          longest_streak: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          habit_id: string
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          habit_id?: string
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_overall_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: number
          last_date: string | null
          longest_streak: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: number
          last_date?: string | null
          longest_streak?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: number
          last_date?: string | null
          longest_streak?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          area_id: string | null
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          priority: string | null
          routine_block_id: string | null
          source: string
          source_id: string | null
          start_date: string | null
          status: string
          task_type: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          priority?: string | null
          routine_block_id?: string | null
          source?: string
          source_id?: string | null
          start_date?: string | null
          status?: string
          task_type?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_id?: string | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          priority?: string | null
          routine_block_id?: string | null
          source?: string
          source_id?: string | null
          start_date?: string | null
          status?: string
          task_type?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      text_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          section_key: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          section_key: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          section_key?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          distributed: boolean
          id: string
          loan_id: string | null
          transaction_date: string
          transaction_type: string
          transfer_id: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          distributed?: boolean
          id?: string
          loan_id?: string | null
          transaction_date?: string
          transaction_type: string
          transfer_id?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          distributed?: boolean
          id?: string
          loan_id?: string | null
          transaction_date?: string
          transaction_type?: string
          transfer_id?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      twelve_week_goals: {
        Row: {
          category: string
          connected_blocks: string[] | null
          created_at: string
          current_value: string | null
          description: string | null
          id: string
          month: number | null
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
          month?: number | null
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
          month?: number | null
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
      university_settings: {
        Row: {
          academic_schedule: Json | null
          created_at: string | null
          current_semester: number | null
          current_year: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          academic_schedule?: Json | null
          created_at?: string | null
          current_semester?: number | null
          current_year?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          academic_schedule?: Json | null
          created_at?: string | null
          current_semester?: number | null
          current_year?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      university_subjects: {
        Row: {
          color: string | null
          created_at: string
          credits: number | null
          id: string
          name: string
          professor: string | null
          schedule: string | null
          semester: number | null
          updated_at: string
          user_id: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          credits?: number | null
          id?: string
          name: string
          professor?: string | null
          schedule?: string | null
          semester?: number | null
          updated_at?: string
          user_id?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          credits?: number | null
          id?: string
          name?: string
          professor?: string | null
          schedule?: string | null
          semester?: number | null
          updated_at?: string
          user_id?: string | null
          year?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_adjust_enabled: boolean | null
          created_at: string
          exchange_rate: number | null
          id: string
          morning_end_time: string | null
          punishments_balance: number | null
          rewards_balance: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          auto_adjust_enabled?: boolean | null
          created_at?: string
          exchange_rate?: number | null
          id?: string
          morning_end_time?: string | null
          punishments_balance?: number | null
          rewards_balance?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          auto_adjust_enabled?: boolean | null
          created_at?: string
          exchange_rate?: number | null
          id?: string
          morning_end_time?: string | null
          punishments_balance?: number | null
          rewards_balance?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      valuable_skills: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vision_board_cells: {
        Row: {
          board_type: string
          caption: string | null
          created_at: string
          id: string
          image_url: string | null
          position: number
          updated_at: string
        }
        Insert: {
          board_type: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          position: number
          updated_at?: string
        }
        Update: {
          board_type?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      vision_boards: {
        Row: {
          board_type: string
          cards: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          board_type?: string
          cards?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          board_type?: string
          cards?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_gym_routine: {
        Row: {
          created_at: string
          day_label: string
          day_of_week: number
          exercises: Json | null
          id: string
          is_rest_day: boolean | null
          muscle_groups: string[] | null
          notes: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          day_label: string
          day_of_week: number
          exercises?: Json | null
          id?: string
          is_rest_day?: boolean | null
          muscle_groups?: string[] | null
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          day_label?: string
          day_of_week?: number
          exercises?: Json | null
          id?: string
          is_rest_day?: boolean | null
          muscle_groups?: string[] | null
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_objectives: {
        Row: {
          area: string
          completed: boolean | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string | null
          week_start_date: string
        }
        Insert: {
          area: string
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          week_start_date: string
        }
        Update: {
          area?: string
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          week_start_date?: string
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
      workout_exercises: {
        Row: {
          created_at: string | null
          day_of_week: string
          id: string
          muscle_group: string | null
          name: string
          order_index: number | null
          routine_id: string | null
          target_reps: string | null
          target_sets: number | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          muscle_group?: string | null
          name: string
          order_index?: number | null
          routine_id?: string | null
          target_reps?: string | null
          target_sets?: number | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          muscle_group?: string | null
          name?: string
          order_index?: number | null
          routine_id?: string | null
          target_reps?: string | null
          target_sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "workout_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_routines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tipo: string
          updated_at: string | null
          user_id: string | null
          workout_days: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tipo?: string
          updated_at?: string | null
          user_id?: string | null
          workout_days?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tipo?: string
          updated_at?: string | null
          user_id?: string | null
          workout_days?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recompute_system_habit_streak: {
        Args: { _habit_id: string }
        Returns: undefined
      }
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
