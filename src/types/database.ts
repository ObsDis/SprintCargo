export type UserRole = "shipper" | "driver";

export type SubscriptionStatus =
  | "inactive"
  | "trial"
  | "active"
  | "past_due"
  | "cancelled";

export type JobStatus =
  | "draft"
  | "posted"
  | "quoted"
  | "accepted"
  | "driver_en_route_pickup"
  | "at_pickup"
  | "loaded"
  | "in_transit"
  | "at_dropoff"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export type QuoteStatus =
  | "pending"
  | "countered_by_shipper"
  | "countered_by_driver"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn";

export type SizeCategory = "small" | "medium" | "large" | "oversized";

export type DeliverySpeed = "standard" | "same_day" | "rush";

export type NotificationType =
  | "new_job_nearby"
  | "new_quote"
  | "counter_offer"
  | "quote_accepted"
  | "quote_declined"
  | "driver_en_route"
  | "driver_arrived"
  | "loaded"
  | "in_transit"
  | "delivered"
  | "payment_sent"
  | "payment_received"
  | "review_request"
  | "subscription_warning";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
          company_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          stripe_connected_account_id: string | null;
          stripe_connect_onboarding_complete: boolean;
          subscription_status: SubscriptionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          stripe_connected_account_id?: string | null;
          stripe_connect_onboarding_complete?: boolean;
          subscription_status?: SubscriptionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          stripe_connected_account_id?: string | null;
          stripe_connect_onboarding_complete?: boolean;
          subscription_status?: SubscriptionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      driver_profiles: {
        Row: {
          id: string;
          vehicle_year: number | null;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_color: string | null;
          license_plate: string | null;
          vehicle_photo_url: string | null;
          cargo_length_inches: number | null;
          cargo_width_inches: number | null;
          cargo_height_inches: number | null;
          max_weight_lbs: number | null;
          service_radius_miles: number;
          is_available: boolean;
          current_lat: number | null;
          current_lng: number | null;
          last_location_update: string | null;
          rating: number;
          total_deliveries: number;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          vehicle_year?: number | null;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_color?: string | null;
          license_plate?: string | null;
          vehicle_photo_url?: string | null;
          cargo_length_inches?: number | null;
          cargo_width_inches?: number | null;
          cargo_height_inches?: number | null;
          max_weight_lbs?: number | null;
          service_radius_miles?: number;
          is_available?: boolean;
          current_lat?: number | null;
          current_lng?: number | null;
          last_location_update?: string | null;
          rating?: number;
          total_deliveries?: number;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_year?: number | null;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_color?: string | null;
          license_plate?: string | null;
          vehicle_photo_url?: string | null;
          cargo_length_inches?: number | null;
          cargo_width_inches?: number | null;
          cargo_height_inches?: number | null;
          max_weight_lbs?: number | null;
          service_radius_miles?: number;
          is_available?: boolean;
          current_lat?: number | null;
          current_lng?: number | null;
          last_location_update?: string | null;
          rating?: number;
          total_deliveries?: number;
          verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      driver_rate_cards: {
        Row: {
          id: string;
          driver_id: string;
          base_rate: number;
          per_mile_rate: number;
          size_small_surcharge: number;
          size_medium_surcharge: number;
          size_large_surcharge: number;
          size_oversized_surcharge: number;
          weight_under_50_surcharge: number;
          weight_50_to_150_surcharge: number;
          weight_150_to_500_surcharge: number;
          weight_over_500_surcharge: number;
          multi_stop_per_stop_rate: number;
          rush_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          base_rate?: number;
          per_mile_rate?: number;
          size_small_surcharge?: number;
          size_medium_surcharge?: number;
          size_large_surcharge?: number;
          size_oversized_surcharge?: number;
          weight_under_50_surcharge?: number;
          weight_50_to_150_surcharge?: number;
          weight_150_to_500_surcharge?: number;
          weight_over_500_surcharge?: number;
          multi_stop_per_stop_rate?: number;
          rush_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          base_rate?: number;
          per_mile_rate?: number;
          size_small_surcharge?: number;
          size_medium_surcharge?: number;
          size_large_surcharge?: number;
          size_oversized_surcharge?: number;
          weight_under_50_surcharge?: number;
          weight_50_to_150_surcharge?: number;
          weight_150_to_500_surcharge?: number;
          weight_over_500_surcharge?: number;
          multi_stop_per_stop_rate?: number;
          rush_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          shipper_id: string;
          assigned_driver_id: string | null;
          status: JobStatus;
          title: string;
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          pickup_contact_name: string;
          pickup_contact_phone: string;
          pickup_notes: string | null;
          dropoff_address: string;
          dropoff_lat: number;
          dropoff_lng: number;
          dropoff_contact_name: string;
          dropoff_contact_phone: string;
          dropoff_notes: string | null;
          additional_stops: Json | null;
          item_description: string;
          item_photos: string[] | null;
          size_category: SizeCategory;
          estimated_weight_lbs: number | null;
          num_items: number;
          delivery_speed: DeliverySpeed;
          pickup_window_start: string;
          pickup_window_end: string;
          special_instructions: string | null;
          fragile: boolean;
          requires_helpers: boolean;
          estimated_distance_miles: number | null;
          estimated_duration_minutes: number | null;
          estimated_price_low: number | null;
          estimated_price_high: number | null;
          accepted_quote_id: string | null;
          final_price: number | null;
          loading_photos: string[] | null;
          delivery_photos: string[] | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          stripe_payment_intent_id: string | null;
          stripe_transfer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipper_id: string;
          assigned_driver_id?: string | null;
          status?: JobStatus;
          title: string;
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          pickup_contact_name: string;
          pickup_contact_phone: string;
          pickup_notes?: string | null;
          dropoff_address: string;
          dropoff_lat: number;
          dropoff_lng: number;
          dropoff_contact_name: string;
          dropoff_contact_phone: string;
          dropoff_notes?: string | null;
          additional_stops?: Json | null;
          item_description: string;
          item_photos?: string[] | null;
          size_category: SizeCategory;
          estimated_weight_lbs?: number | null;
          num_items?: number;
          delivery_speed?: DeliverySpeed;
          pickup_window_start: string;
          pickup_window_end: string;
          special_instructions?: string | null;
          fragile?: boolean;
          requires_helpers?: boolean;
          estimated_distance_miles?: number | null;
          estimated_duration_minutes?: number | null;
          estimated_price_low?: number | null;
          estimated_price_high?: number | null;
          accepted_quote_id?: string | null;
          final_price?: number | null;
          loading_photos?: string[] | null;
          delivery_photos?: string[] | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shipper_id?: string;
          assigned_driver_id?: string | null;
          status?: JobStatus;
          title?: string;
          pickup_address?: string;
          pickup_lat?: number;
          pickup_lng?: number;
          pickup_contact_name?: string;
          pickup_contact_phone?: string;
          pickup_notes?: string | null;
          dropoff_address?: string;
          dropoff_lat?: number;
          dropoff_lng?: number;
          dropoff_contact_name?: string;
          dropoff_contact_phone?: string;
          dropoff_notes?: string | null;
          additional_stops?: Json | null;
          item_description?: string;
          item_photos?: string[] | null;
          size_category?: SizeCategory;
          estimated_weight_lbs?: number | null;
          num_items?: number;
          delivery_speed?: DeliverySpeed;
          pickup_window_start?: string;
          pickup_window_end?: string;
          special_instructions?: string | null;
          fragile?: boolean;
          requires_helpers?: boolean;
          estimated_distance_miles?: number | null;
          estimated_duration_minutes?: number | null;
          estimated_price_low?: number | null;
          estimated_price_high?: number | null;
          accepted_quote_id?: string | null;
          final_price?: number | null;
          loading_photos?: string[] | null;
          delivery_photos?: string[] | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_quotes: {
        Row: {
          id: string;
          job_id: string;
          driver_id: string;
          amount: number;
          auto_calculated_amount: number | null;
          driver_note: string | null;
          status: QuoteStatus;
          shipper_counter_amount: number | null;
          shipper_counter_note: string | null;
          driver_counter_amount: number | null;
          driver_counter_note: string | null;
          negotiation_round: number;
          estimated_pickup_eta_minutes: number | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          driver_id: string;
          amount: number;
          auto_calculated_amount?: number | null;
          driver_note?: string | null;
          status?: QuoteStatus;
          shipper_counter_amount?: number | null;
          shipper_counter_note?: string | null;
          driver_counter_amount?: number | null;
          driver_counter_note?: string | null;
          negotiation_round?: number;
          estimated_pickup_eta_minutes?: number | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          driver_id?: string;
          amount?: number;
          auto_calculated_amount?: number | null;
          driver_note?: string | null;
          status?: QuoteStatus;
          shipper_counter_amount?: number | null;
          shipper_counter_note?: string | null;
          driver_counter_amount?: number | null;
          driver_counter_note?: string | null;
          negotiation_round?: number;
          estimated_pickup_eta_minutes?: number | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_tracking: {
        Row: {
          id: string;
          job_id: string;
          driver_id: string;
          lat: number;
          lng: number;
          speed_mph: number | null;
          heading: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          driver_id: string;
          lat: number;
          lng: number;
          speed_mph?: number | null;
          heading?: number | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          driver_id?: string;
          lat?: number;
          lng?: number;
          speed_mph?: number | null;
          heading?: number | null;
          recorded_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          job_id: string;
          reviewer_id: string;
          reviewed_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          reviewer_id: string;
          reviewed_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          reviewer_id?: string;
          reviewed_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          subject: string;
          message: string;
          status: SupportTicketStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          subject: string;
          message: string;
          status?: SupportTicketStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          subject?: string;
          message?: string;
          status?: SupportTicketStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          sender_id?: string;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      subscription_status: SubscriptionStatus;
      job_status: JobStatus;
      quote_status: QuoteStatus;
      size_category: SizeCategory;
      delivery_speed: DeliverySpeed;
      notification_type: NotificationType;
      support_ticket_status: SupportTicketStatus;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type DriverProfile = Database["public"]["Tables"]["driver_profiles"]["Row"];
export type DriverProfileInsert = Database["public"]["Tables"]["driver_profiles"]["Insert"];
export type DriverProfileUpdate = Database["public"]["Tables"]["driver_profiles"]["Update"];

export type DriverRateCard = Database["public"]["Tables"]["driver_rate_cards"]["Row"];
export type DriverRateCardInsert = Database["public"]["Tables"]["driver_rate_cards"]["Insert"];
export type DriverRateCardUpdate = Database["public"]["Tables"]["driver_rate_cards"]["Update"];

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];

export type JobQuote = Database["public"]["Tables"]["job_quotes"]["Row"];
export type JobQuoteInsert = Database["public"]["Tables"]["job_quotes"]["Insert"];
export type JobQuoteUpdate = Database["public"]["Tables"]["job_quotes"]["Update"];

export type DeliveryTracking = Database["public"]["Tables"]["delivery_tracking"]["Row"];
export type DeliveryTrackingInsert = Database["public"]["Tables"]["delivery_tracking"]["Insert"];
export type DeliveryTrackingUpdate = Database["public"]["Tables"]["delivery_tracking"]["Update"];

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type SupportTicketInsert = Database["public"]["Tables"]["support_tickets"]["Insert"];
export type SupportTicketUpdate = Database["public"]["Tables"]["support_tickets"]["Update"];

export type SupportMessage = Database["public"]["Tables"]["support_messages"]["Row"];
export type SupportMessageInsert = Database["public"]["Tables"]["support_messages"]["Insert"];
export type SupportMessageUpdate = Database["public"]["Tables"]["support_messages"]["Update"];
