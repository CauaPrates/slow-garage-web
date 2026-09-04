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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["attachment_entity_type"]
          file_size_bytes: number
          id: string
          mime_type: string
          original_filename: string
          storage_path: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["attachment_entity_type"]
          file_size_bytes: number
          id?: string
          mime_type: string
          original_filename: string
          storage_path: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["attachment_entity_type"]
          file_size_bytes?: number
          id?: string
          mime_type?: string
          original_filename?: string
          storage_path?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "attachments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          amount: number | null
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          expires_on: string | null
          file_size_bytes: number
          id: string
          issued_on: string | null
          mime_type: string
          notes: string | null
          storage_path: string
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          file_size_bytes: number
          id?: string
          issued_on?: string | null
          mime_type: string
          notes?: string | null
          storage_path: string
          title: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          file_size_bytes?: number
          id?: string
          issued_on?: string | null
          mime_type?: string
          notes?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          occurred_on: string
          odometer_km: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          updated_at: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          occurred_on?: string
          odometer_km?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          updated_at?: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          occurred_on?: string
          odometer_km?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          updated_at?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      financings: {
        Row: {
          created_at: string
          financed_amount: number | null
          id: string
          installment_amount: number | null
          installment_count: number | null
          installments_paid: number
          installments_remaining: number | null
          interest_rate_monthly: number | null
          outstanding_balance: number | null
          started_on: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          financed_amount?: number | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          installments_paid?: number
          installments_remaining?: number | null
          interest_rate_monthly?: number | null
          outstanding_balance?: number | null
          started_on?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          financed_amount?: number | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          installments_paid?: number
          installments_remaining?: number | null
          interest_rate_monthly?: number | null
          outstanding_balance?: number | null
          started_on?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "financings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          created_at: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          is_full_tank: boolean
          liters: number
          missed_previous_fill: boolean
          notes: string | null
          occurred_on: string
          odometer_km: number | null
          price_per_liter: number | null
          station: string | null
          total_amount: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          is_full_tank?: boolean
          liters: number
          missed_previous_fill?: boolean
          notes?: string | null
          occurred_on?: string
          odometer_km?: number | null
          price_per_liter?: number | null
          station?: string | null
          total_amount: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          is_full_tank?: boolean
          liters?: number
          missed_previous_fill?: boolean
          notes?: string | null
          occurred_on?: string
          odometer_km?: number | null
          price_per_liter?: number | null
          station?: string | null
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          diagnosis: string | null
          id: string
          odometer_km: number | null
          priority: Database["public"]["Enums"]["priority_level"]
          reported_on: string
          resolution: string | null
          resolved_on: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          id?: string
          odometer_km?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reported_on?: string
          resolution?: string | null
          resolved_on?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          id?: string
          odometer_km?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reported_on?: string
          resolution?: string | null
          resolved_on?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "issues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          interval_km: number | null
          interval_months: number | null
          is_active: boolean
          last_service_date: string | null
          last_service_odometer_km: number | null
          name: string
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean
          last_service_date?: string | null
          last_service_odometer_km?: number | null
          name: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean
          last_service_date?: string | null
          last_service_odometer_km?: number | null
          name?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "maintenance_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          maintenance_item_id: string | null
          name: string
          notes: string | null
          odometer_km: number | null
          performed_on: string
          updated_at: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_item_id?: string | null
          name: string
          notes?: string | null
          odometer_km?: number | null
          performed_on?: string
          updated_at?: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_item_id?: string | null
          name?: string
          notes?: string | null
          odometer_km?: number | null
          performed_on?: string
          updated_at?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_status"
            referencedColumns: ["maintenance_item_id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string | null
          created_at: string
          id: string
          occurred_on: string
          odometer_km: number | null
          title: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          occurred_on?: string
          odometer_km?: number | null
          title?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          occurred_on?: string
          odometer_km?: number | null
          title?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "notes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          amount: number | null
          created_at: string
          due_on: string | null
          id: string
          kind: Database["public"]["Enums"]["obligation_kind"]
          label: string
          notes: string | null
          paid_on: string | null
          provider: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          due_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["obligation_kind"]
          label: string
          notes?: string | null
          paid_on?: string | null
          provider?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          due_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["obligation_kind"]
          label?: string
          notes?: string | null
          paid_on?: string | null
          provider?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "obligations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferred_units: Database["public"]["Enums"]["unit_system"]
          theme: Database["public"]["Enums"]["theme_preference"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferred_units?: Database["public"]["Enums"]["unit_system"]
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_units?: Database["public"]["Enums"]["unit_system"]
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
        }
        Relationships: []
      }
      project_items: {
        Row: {
          actual_cost: number | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          external_url: string | null
          id: string
          name: string
          notes: string | null
          occurred_on: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["project_item_status"]
          updated_at: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          external_url?: string | null
          id?: string
          name: string
          notes?: string | null
          occurred_on?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["project_item_status"]
          updated_at?: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          actual_cost?: number | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          external_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          occurred_on?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["project_item_status"]
          updated_at?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "project_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          completed_on: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          started_on: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_date: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          budget?: number | null
          completed_on?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          budget?: number | null
          completed_on?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "projects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          caption: string | null
          category: Database["public"]["Enums"]["vehicle_photo_category"]
          created_at: string
          id: string
          sort_order: number
          storage_path: string
          taken_at: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          caption?: string | null
          category?: Database["public"]["Enums"]["vehicle_photo_category"]
          created_at?: string
          id?: string
          sort_order?: number
          storage_path: string
          taken_at?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          caption?: string | null
          category?: Database["public"]["Enums"]["vehicle_photo_category"]
          created_at?: string
          id?: string
          sort_order?: number
          storage_path?: string
          taken_at?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          current_odometer_km: number | null
          engine_description: string | null
          engine_displacement_cc: number | null
          estimated_current_value: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          horsepower: number | null
          id: string
          make: string
          model: string
          model_year: number | null
          notes: string | null
          plate: string | null
          primary_photo_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          status: Database["public"]["Enums"]["vehicle_status"]
          torque_nm: number | null
          transmission: Database["public"]["Enums"]["transmission"]
          trim: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          current_odometer_km?: number | null
          engine_description?: string | null
          engine_displacement_cc?: number | null
          estimated_current_value?: number | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          horsepower?: number | null
          id?: string
          make: string
          model: string
          model_year?: number | null
          notes?: string | null
          plate?: string | null
          primary_photo_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          torque_nm?: number | null
          transmission?: Database["public"]["Enums"]["transmission"]
          trim?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          current_odometer_km?: number | null
          engine_description?: string | null
          engine_displacement_cc?: number | null
          estimated_current_value?: number | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          horsepower?: number | null
          id?: string
          make?: string
          model?: string
          model_year?: number | null
          notes?: string | null
          plate?: string | null
          primary_photo_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          torque_nm?: number | null
          transmission?: Database["public"]["Enums"]["transmission"]
          trim?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_primary_photo_id_fkey"
            columns: ["primary_photo_id"]
            isOneToOne: false
            referencedRelation: "vehicle_photos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      fuel_log_metrics: {
        Row: {
          cost_per_km: number | null
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string | null
          is_full_tank: boolean | null
          km_per_liter: number | null
          km_since_previous: number | null
          liters: number | null
          missed_previous_fill: boolean | null
          notes: string | null
          occurred_on: string | null
          odometer_km: number | null
          price_per_liter: number | null
          station: string | null
          total_amount: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_status: {
        Row: {
          is_active: boolean | null
          last_service_date: string | null
          last_service_odometer_km: number | null
          maintenance_item_id: string | null
          name: string | null
          next_service_date: string | null
          next_service_odometer_km: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          status: Database["public"]["Enums"]["maintenance_status_level"] | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "maintenance_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_progress: {
        Row: {
          budget: number | null
          completed_items: number | null
          pct_budget_used: number | null
          pct_items_completed: number | null
          project_id: string | null
          total_actual: number | null
          total_estimated: number | null
          total_items: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "projects_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_alerts: {
        Row: {
          alert_type: string | null
          due_odometer_km: number | null
          due_on: string | null
          severity: Database["public"]["Enums"]["alert_severity"] | null
          source_id: string | null
          source_table: string | null
          title: string | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      vehicle_expenses_by_category: {
        Row: {
          category_label: string | null
          category_slug: string | null
          expense_count: number | null
          total_amount: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_expenses_by_month: {
        Row: {
          month: string | null
          total_amount: number | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      vehicle_financial_summary: {
        Row: {
          cost_per_km: number | null
          current_month_spend: number | null
          current_year_spend: number | null
          purchase_price: number | null
          total_expenses: number | null
          total_fuel: number | null
          total_invested: number | null
          total_maintenance: number | null
          total_project_items: number | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      vehicle_fuel_summary: {
        Row: {
          avg_km_per_liter: number | null
          avg_price_per_liter: number | null
          best_km_per_liter: number | null
          total_liters: number | null
          vehicle_id: string | null
          worst_km_per_liter: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financial_summary"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_timeline: {
        Row: {
          amount: number | null
          category_slug: string | null
          description: string | null
          event_type: string | null
          metadata: Json | null
          occurred_on: string | null
          odometer_km: number | null
          source_id: string | null
          source_table: string | null
          title: string | null
          vehicle_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_vehicle_dashboard: { Args: { p_vehicle_id: string }; Returns: Json }
      owns_vehicle: { Args: { p_vehicle_id: string }; Returns: boolean }
      search_vehicle: {
        Args: { p_query: string; p_vehicle_id: string }
        Returns: {
          occurred_on: string
          rank: number
          snippet: string
          source_id: string
          source_table: string
          title: string
        }[]
      }
    }
    Enums: {
      alert_severity: "warning" | "critical"
      attachment_entity_type:
        | "expense"
        | "fuel_log"
        | "maintenance_record"
        | "issue"
        | "project_item"
        | "note"
      document_type:
        | "invoice"
        | "receipt"
        | "quote"
        | "report"
        | "insurance"
        | "registration"
        | "other"
      fuel_type:
        | "gasoline"
        | "ethanol"
        | "flex"
        | "diesel"
        | "electric"
        | "hybrid"
        | "other"
      issue_status:
        | "open"
        | "investigating"
        | "waiting_part"
        | "in_repair"
        | "resolved"
        | "dismissed"
      maintenance_status_level: "overdue" | "due_soon" | "ok" | "planned"
      obligation_kind:
        | "insurance"
        | "ipva"
        | "licensing"
        | "inspection"
        | "other"
      payment_method:
        | "cash"
        | "debit_card"
        | "credit_card"
        | "pix"
        | "bank_transfer"
        | "other"
      priority_level: "low" | "medium" | "high"
      project_item_status:
        | "wishlist"
        | "planned"
        | "purchased"
        | "installed"
        | "cancelled"
      project_status:
        | "idea"
        | "planned"
        | "in_progress"
        | "paused"
        | "completed"
        | "cancelled"
      theme_preference: "dark" | "light" | "system"
      transmission: "manual" | "automatic" | "cvt" | "other"
      unit_system: "metric" | "imperial"
      vehicle_photo_category:
        | "exterior"
        | "interior"
        | "engine"
        | "wheels"
        | "mods"
        | "before_after"
        | "other"
      vehicle_status: "active" | "project" | "stored" | "sold"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      alert_severity: ["warning", "critical"],
      attachment_entity_type: [
        "expense",
        "fuel_log",
        "maintenance_record",
        "issue",
        "project_item",
        "note",
      ],
      document_type: [
        "invoice",
        "receipt",
        "quote",
        "report",
        "insurance",
        "registration",
        "other",
      ],
      fuel_type: [
        "gasoline",
        "ethanol",
        "flex",
        "diesel",
        "electric",
        "hybrid",
        "other",
      ],
      issue_status: [
        "open",
        "investigating",
        "waiting_part",
        "in_repair",
        "resolved",
        "dismissed",
      ],
      maintenance_status_level: ["overdue", "due_soon", "ok", "planned"],
      obligation_kind: [
        "insurance",
        "ipva",
        "licensing",
        "inspection",
        "other",
      ],
      payment_method: [
        "cash",
        "debit_card",
        "credit_card",
        "pix",
        "bank_transfer",
        "other",
      ],
      priority_level: ["low", "medium", "high"],
      project_item_status: [
        "wishlist",
        "planned",
        "purchased",
        "installed",
        "cancelled",
      ],
      project_status: [
        "idea",
        "planned",
        "in_progress",
        "paused",
        "completed",
        "cancelled",
      ],
      theme_preference: ["dark", "light", "system"],
      transmission: ["manual", "automatic", "cvt", "other"],
      unit_system: ["metric", "imperial"],
      vehicle_photo_category: [
        "exterior",
        "interior",
        "engine",
        "wheels",
        "mods",
        "before_after",
        "other",
      ],
      vehicle_status: ["active", "project", "stored", "sold"],
    },
  },
} as const
