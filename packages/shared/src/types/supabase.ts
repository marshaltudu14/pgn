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
      daily_attendance: {
        Row: {
          attendance_date: string
          battery_level_at_check_in: number | null
          battery_level_at_check_out: number | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_selfie_url: string | null
          check_in_timestamp: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_method: string | null
          check_out_reason: string | null
          check_out_selfie_url: string | null
          check_out_timestamp: string | null
          created_at: string | null
          device: string | null
          employee_id: string
          id: string
          last_location_update: string | null
          path_data: Json | null
          total_distance_meters: number | null
          total_work_hours: number | null
          updated_at: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attendance_date: string
          battery_level_at_check_in?: number | null
          battery_level_at_check_out?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_selfie_url?: string | null
          check_in_timestamp?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_method?: string | null
          check_out_reason?: string | null
          check_out_selfie_url?: string | null
          check_out_timestamp?: string | null
          created_at?: string | null
          device?: string | null
          employee_id: string
          id?: string
          last_location_update?: string | null
          path_data?: Json | null
          total_distance_meters?: number | null
          total_work_hours?: number | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attendance_date?: string
          battery_level_at_check_in?: number | null
          battery_level_at_check_out?: number | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_selfie_url?: string | null
          check_in_timestamp?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_method?: string | null
          check_out_reason?: string | null
          check_out_selfie_url?: string | null
          check_out_timestamp?: string | null
          created_at?: string | null
          device?: string | null
          employee_id?: string
          id?: string
          last_location_update?: string | null
          path_data?: Json | null
          total_distance_meters?: number | null
          total_work_hours?: number | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          region_id: string | null
          shop_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          region_id?: string | null
          shop_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          region_id?: string | null
          shop_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          }
        ]
      }
      employee_edit_tracking: {
        Row: {
          created_at: string
          edit_count: number
          edit_date: string
          employee_id: string
          id: string
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edit_count?: number
          edit_date?: string
          employee_id: string
          id?: string
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edit_count?: number
          edit_date?: string
          employee_id?: string
          id?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_regions: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          employee_id: string
          region_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          employee_id: string
          region_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          employee_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_regions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_regions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          assigned_cities: Json | null
          can_login: boolean | null
          created_at: string | null
          email: string
          employment_status: string
          employment_status_changed_at: string | null
          employment_status_changed_by: string | null
          first_name: string
          human_readable_user_id: string
          id: string
          last_name: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          assigned_cities?: Json | null
          can_login?: boolean | null
          created_at?: string | null
          email: string
          employment_status?: string
          employment_status_changed_at?: string | null
          employment_status_changed_by?: string | null
          first_name: string
          human_readable_user_id: string
          id: string
          last_name: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          assigned_cities?: Json | null
          can_login?: boolean | null
          created_at?: string | null
          email?: string
          employment_status?: string
          employment_status_changed_at?: string | null
          employment_status_changed_by?: string | null
          first_name?: string
          human_readable_user_id?: string
          id?: string
          last_name?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      farmers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          farm_name: string | null
          id: string
          name: string
          phone: string | null
          region_id: string | null
          retailer_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          farm_name?: string | null
          id?: string
          name: string
          phone?: string | null
          region_id?: string | null
          retailer_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          farm_name?: string | null
          id?: string
          name?: string
          phone?: string | null
          region_id?: string | null
          retailer_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farmers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          }
        ]
      }
      regions: {
        Row: {
          city: string
          city_slug: string
          created_at: string | null
          id: string
          state: string
          state_slug: string
          updated_at: string | null
        }
        Insert: {
          city: string
          city_slug: string
          created_at?: string | null
          id?: string
          state: string
          state_slug: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          city_slug?: string
          created_at?: string | null
          id?: string
          state?: string
          state_slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      retailers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          dealer_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          region_id: string | null
          shop_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          dealer_id?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          region_id?: string | null
          shop_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          dealer_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          region_id?: string | null
          shop_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailers_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          assigned_employee_id: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          progress: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_employee_id: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          progress?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_employee_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          progress?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: { Args: { text_param: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
