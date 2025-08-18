export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          subscription_tier: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      designs: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          canvas_data: any
          thumbnail_url: string | null
          is_public: boolean
          is_template: boolean
          dimensions: any
          tags: string[]
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          canvas_data?: any
          thumbnail_url?: string | null
          is_public?: boolean
          is_template?: boolean
          dimensions?: any
          tags?: string[]
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          canvas_data?: any
          thumbnail_url?: string | null
          is_public?: boolean
          is_template?: boolean
          dimensions?: any
          tags?: string[]
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      canvas_actions: {
        Row: {
          id: string
          user_id: string
          design_id: string
          action_type: string
          action_data: any
          object_type: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          design_id: string
          action_type: string
          action_data: any
          object_type?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          design_id?: string
          action_type?: string
          action_data?: any
          object_type?: string | null
          timestamp?: string
        }
      }
      claude_analysis: {
        Row: {
          id: string
          image_url: string
          analysis_type: string
          claude_response: any
          fabric_objects: any | null
          model_used: string
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          image_url: string
          analysis_type: string
          claude_response: any
          fabric_objects?: any | null
          model_used: string
          tokens_used: number
          created_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          analysis_type?: string
          claude_response?: any
          fabric_objects?: any | null
          model_used?: string
          tokens_used?: number
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preference_type: string
          preference_data: any
          confidence_score: number
          usage_count: number
          embedding: number[] | null
          last_used: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_type: string
          preference_data: any
          confidence_score?: number
          usage_count?: number
          embedding?: number[] | null
          last_used?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_type?: string
          preference_data?: any
          confidence_score?: number
          usage_count?: number
          embedding?: number[] | null
          last_used?: string
          created_at?: string
        }
      }
      design_predictions: {
        Row: {
          id: string
          design_id: string
          engagement_score: number | null
          click_probability: number | null
          conversion_estimate: number | null
          accessibility_score: number | null
          suggestions: any
          created_at: string
        }
        Insert: {
          id?: string
          design_id: string
          engagement_score?: number | null
          click_probability?: number | null
          conversion_estimate?: number | null
          accessibility_score?: number | null
          suggestions?: any
          created_at?: string
        }
        Update: {
          id?: string
          design_id?: string
          engagement_score?: number | null
          click_probability?: number | null
          conversion_estimate?: number | null
          accessibility_score?: number | null
          suggestions?: any
          created_at?: string
        }
      }
    }
  }
}