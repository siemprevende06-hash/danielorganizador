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
          created_at: string
          excluded_blocks: string[] | null
          id: string
          mode: string
          notes: string | null
          plan_date: string
          preset_id: string | null
          sleep_time: string | null
          updated_at: string
          user_id: string | null
          wake_time: string | null
        }
        Insert: {
          created_at?: string
          excluded_blocks?: string[] | null
          id?: string
          mode: string
          notes?: string | null
          plan_date: string
          preset_id?: string | null
          sleep_time?: string | null
          updated_at?: string
          user_id?: string | null
          wake_time?: string | null
        }
        Update: {
          created_at?: string
          excluded_blocks?: string[] | null
          id?: string
          mode?: string
          notes?: string | null
          plan_date?: string
          preset_id?: string | null
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
      music_repertoire: {
        Row: {
          artist: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          instrument: string
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
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
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
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
