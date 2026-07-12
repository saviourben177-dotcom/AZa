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
      business_tools: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          tool_type: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          tool_type?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          tool_type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_tools_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tools_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_documents: {
        Row: {
          created_at: string
          doc_type: string
          error_message: string | null
          extracted_data: Json | null
          id: string
          status: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          status?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          status?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_profiles: {
        Row: {
          certifications: Json
          created_at: string
          education: Json
          experience: Json
          generated_at: string | null
          generated_content: string | null
          id: string
          photo_storage_path: string | null
          skills: string[]
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certifications?: Json
          created_at?: string
          education?: Json
          experience?: Json
          generated_at?: string | null
          generated_content?: string | null
          id?: string
          photo_storage_path?: string | null
          skills?: string[]
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certifications?: Json
          created_at?: string
          education?: Json
          experience?: Json
          generated_at?: string | null
          generated_content?: string | null
          id?: string
          photo_storage_path?: string | null
          skills?: string[]
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_tailorings: {
        Row: {
          content: string
          created_at: string
          id: string
          match_score: number | null
          opportunity_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_score?: number | null
          opportunity_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_score?: number | null
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_tailorings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_tailorings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_tailorings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_opportunities: {
        Row: {
          dismissed_at: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          idea_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          idea_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          idea_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_roles: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          role_name: string
          slots_filled: number
          slots_needed: number
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          role_name: string
          slots_filled?: number
          slots_needed?: number
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          role_name?: string
          slots_filled?: number
          slots_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "idea_roles_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_upvotes: {
        Row: {
          created_at: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_upvotes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          category: string | null
          comments_count: number
          created_at: string
          description: string
          id: string
          looking_for_collaborators: boolean
          stage: string
          tags: string[]
          title: string
          updated_at: string
          upvotes_count: number
          user_id: string
          visibility: string
        }
        Insert: {
          category?: string | null
          comments_count?: number
          created_at?: string
          description: string
          id?: string
          looking_for_collaborators?: boolean
          stage?: string
          tags?: string[]
          title: string
          updated_at?: string
          upvotes_count?: number
          user_id: string
          visibility?: string
        }
        Update: {
          category?: string | null
          comments_count?: number
          created_at?: string
          description?: string
          id?: string
          looking_for_collaborators?: boolean
          stage?: string
          tags?: string[]
          title?: string
          updated_at?: string
          upvotes_count?: number
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incubators: {
        Row: {
          application_url: string | null
          created_at: string
          created_by: string | null
          curator_verified: boolean
          deadline: string | null
          description: string | null
          focus_area: string | null
          id: string
          location: string | null
          name: string
          remote: boolean
        }
        Insert: {
          application_url?: string | null
          created_at?: string
          created_by?: string | null
          curator_verified?: boolean
          deadline?: string | null
          description?: string | null
          focus_area?: string | null
          id?: string
          location?: string | null
          name: string
          remote?: boolean
        }
        Update: {
          application_url?: string | null
          created_at?: string
          created_by?: string | null
          curator_verified?: boolean
          deadline?: string | null
          description?: string | null
          focus_area?: string | null
          id?: string
          location?: string | null
          name?: string
          remote?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "incubators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          message: string
          portfolio_url: string | null
          requester_id: string
          responded_at: string | null
          role_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          message: string
          portfolio_url?: string | null
          requester_id: string
          responded_at?: string | null
          role_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          message?: string
          portfolio_url?: string | null
          requester_id?: string
          responded_at?: string | null
          role_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "idea_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          listing_type: Database["public"]["Enums"]["marketplace_listing_type"]
          location: string | null
          price_kobo: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          listing_type?: Database["public"]["Enums"]["marketplace_listing_type"]
          location?: string | null
          price_kobo?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          listing_type?: Database["public"]["Enums"]["marketplace_listing_type"]
          location?: string | null
          price_kobo?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          join_request_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          join_request_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          join_request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_join_request_id_fkey"
            columns: ["join_request_id"]
            isOneToOne: false
            referencedRelation: "join_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link_path: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link_path?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link_path?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          applicants_count: number | null
          apply_url: string
          category: Database["public"]["Enums"]["opportunity_category"]
          created_at: string
          created_by: string | null
          curator_verified: boolean
          deadline: string | null
          description: string
          eligibility: string | null
          experience_required: string | null
          id: string
          job_type: string | null
          level: string | null
          location: string | null
          logo_url: string | null
          max_age: number | null
          min_age: number | null
          org: string
          paid: boolean | null
          region: string | null
          relevant_status: Database["public"]["Enums"]["employment_status"][]
          remote: boolean
          salary_range: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          applicants_count?: number | null
          apply_url: string
          category: Database["public"]["Enums"]["opportunity_category"]
          created_at?: string
          created_by?: string | null
          curator_verified?: boolean
          deadline?: string | null
          description: string
          eligibility?: string | null
          experience_required?: string | null
          id?: string
          job_type?: string | null
          level?: string | null
          location?: string | null
          logo_url?: string | null
          max_age?: number | null
          min_age?: number | null
          org: string
          paid?: boolean | null
          region?: string | null
          relevant_status?: Database["public"]["Enums"]["employment_status"][]
          remote?: boolean
          salary_range?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          applicants_count?: number | null
          apply_url?: string
          category?: Database["public"]["Enums"]["opportunity_category"]
          created_at?: string
          created_by?: string | null
          curator_verified?: boolean
          deadline?: string | null
          description?: string
          eligibility?: string | null
          experience_required?: string | null
          id?: string
          job_type?: string | null
          level?: string | null
          location?: string | null
          logo_url?: string | null
          max_age?: number | null
          min_age?: number | null
          org?: string
          paid?: boolean | null
          region?: string | null
          relevant_status?: Database["public"]["Enums"]["employment_status"][]
          remote?: boolean
          salary_range?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          id: string
          last_updated_at: string
          last_updated_by: string | null
          price_kobo: number
          product_name: string
          unit: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          price_kobo: number
          product_name: string
          unit?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          price_kobo?: number
          product_name?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_notes: string | null
          age: number | null
          avatar_url: string | null
          business_description: string | null
          created_at: string
          disability_or_health_note: string | null
          exact_location: string | null
          field_of_interest: string | null
          freelance_skill: string | null
          full_name: string | null
          has_seen_app_guide: boolean
          highest_qualification: string | null
          id: string
          industry: string | null
          is_currently_learning: boolean | null
          job_title: string | null
          learning_context: string[]
          onboarding_completed: boolean
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          show_business_hub: boolean
          skilled_or_unskilled: string | null
          status: Database["public"]["Enums"]["employment_status"][]
          status_other: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          age?: number | null
          avatar_url?: string | null
          business_description?: string | null
          created_at?: string
          disability_or_health_note?: string | null
          exact_location?: string | null
          field_of_interest?: string | null
          freelance_skill?: string | null
          full_name?: string | null
          has_seen_app_guide?: boolean
          highest_qualification?: string | null
          id: string
          industry?: string | null
          is_currently_learning?: boolean | null
          job_title?: string | null
          learning_context?: string[]
          onboarding_completed?: boolean
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_business_hub?: boolean
          skilled_or_unskilled?: string | null
          status?: Database["public"]["Enums"]["employment_status"][]
          status_other?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          age?: number | null
          avatar_url?: string | null
          business_description?: string | null
          created_at?: string
          disability_or_health_note?: string | null
          exact_location?: string | null
          field_of_interest?: string | null
          freelance_skill?: string | null
          full_name?: string | null
          has_seen_app_guide?: boolean
          highest_qualification?: string | null
          id?: string
          industry?: string | null
          is_currently_learning?: boolean | null
          job_title?: string | null
          learning_context?: string[]
          onboarding_completed?: boolean
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          show_business_hub?: boolean
          skilled_or_unskilled?: string | null
          status?: Database["public"]["Enums"]["employment_status"][]
          status_other?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_businesses: {
        Row: {
          business_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_ideas: {
        Row: {
          idea_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          idea_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          idea_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_opportunities: {
        Row: {
          opportunity_id: string
          saved_at: string
          status: Database["public"]["Enums"]["application_status"]
          status_updated_at: string
          user_id: string
        }
        Insert: {
          opportunity_id: string
          saved_at?: string
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          user_id: string
        }
        Update: {
          opportunity_id?: string
          saved_at?: string
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_opportunities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_resources: {
        Row: {
          resource_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          resource_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          resource_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "skill_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_resources: {
        Row: {
          created_at: string
          created_by: string | null
          curator_verified: boolean
          duration_hours: number | null
          id: string
          is_free: boolean
          level: Database["public"]["Enums"]["skill_level"]
          provider: string | null
          rating: number | null
          resource_type: string
          skill_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          curator_verified?: boolean
          duration_hours?: number | null
          id?: string
          is_free?: boolean
          level?: Database["public"]["Enums"]["skill_level"]
          provider?: string | null
          rating?: number | null
          resource_type?: string
          skill_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          curator_verified?: boolean
          duration_hours?: number | null
          id?: string
          is_free?: boolean
          level?: Database["public"]["Enums"]["skill_level"]
          provider?: string | null
          rating?: number | null
          resource_type?: string
          skill_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_resources_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          added_at: string
          level: Database["public"]["Enums"]["skill_level"]
          progress_percent: number
          skill_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          level?: Database["public"]["Enums"]["skill_level"]
          progress_percent?: number
          skill_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          level?: Database["public"]["Enums"]["skill_level"]
          progress_percent?: number
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_own_account: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_curator_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      application_status:
        | "saved"
        | "applied"
        | "interviewing"
        | "rejected"
        | "accepted"
      employment_status:
        | "student"
        | "employed"
        | "self_employed"
        | "unemployed"
        | "freelancer"
        | "other"
      marketplace_listing_type: "sell" | "buy" | "collaborate" | "service"
      notification_type:
        | "join_request_received"
        | "join_request_accepted"
        | "join_request_declined"
        | "new_message"
        | "deadline_reminder"
        | "opportunity_match"
        | "idea_upvote"
        | "system"
      opportunity_category:
        | "scholarship"
        | "grant"
        | "hackathon"
        | "fellowship"
        | "internship"
        | "competition"
        | "job_gig"
      product_category: "food" | "fuel_energy" | "building_materials"
      skill_level: "beginner" | "intermediate" | "advanced"
      user_role: "user" | "curator" | "admin"
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
      application_status: [
        "saved",
        "applied",
        "interviewing",
        "rejected",
        "accepted",
      ],
      employment_status: [
        "student",
        "employed",
        "self_employed",
        "unemployed",
        "freelancer",
        "other",
      ],
      marketplace_listing_type: ["sell", "buy", "collaborate", "service"],
      notification_type: [
        "join_request_received",
        "join_request_accepted",
        "join_request_declined",
        "new_message",
        "deadline_reminder",
        "opportunity_match",
        "idea_upvote",
        "system",
      ],
      opportunity_category: [
        "scholarship",
        "grant",
        "hackathon",
        "fellowship",
        "internship",
        "competition",
        "job_gig",
      ],
      product_category: ["food", "fuel_energy", "building_materials"],
      skill_level: ["beginner", "intermediate", "advanced"],
      user_role: ["user", "curator", "admin"],
    },
  },
} as const
