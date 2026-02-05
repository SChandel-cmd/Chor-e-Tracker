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
          email: string | null;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted";
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted";
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: "pending" | "accepted";
          created_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
      };
      household_invites: {
        Row: {
          id: string;
          household_id: string;
          inviter_id: string;
          invitee_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          inviter_id: string;
          invitee_id: string;
          status: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          inviter_id?: string;
          invitee_id?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
      };
      chore_templates: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: string;
          points: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: string;
          points: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          type?: string;
          points?: number;
          created_by?: string;
          created_at?: string;
        };
      };
      chore_entries: {
        Row: {
          id: string;
          household_id: string;
          chore_id: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          chore_id: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          chore_id?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      chore_entry_participants: {
        Row: {
          entry_id: string;
          user_id: string;
          points_earned: number;
        };
        Insert: {
          entry_id: string;
          user_id: string;
          points_earned: number;
        };
        Update: {
          entry_id?: string;
          user_id?: string;
          points_earned?: number;
        };
      };
    };
    Functions: {
      create_household: {
        Args: { p_name: string };
        Returns: string;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type FriendRequest = Database["public"]["Tables"]["friend_requests"]["Row"];
export type Household = Database["public"]["Tables"]["households"]["Row"];
export type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];
export type HouseholdInvite = Database["public"]["Tables"]["household_invites"]["Row"];
export type ChoreTemplate = Database["public"]["Tables"]["chore_templates"]["Row"];
export type ChoreEntry = Database["public"]["Tables"]["chore_entries"]["Row"];
export type ChoreEntryParticipant = Database["public"]["Tables"]["chore_entry_participants"]["Row"];
