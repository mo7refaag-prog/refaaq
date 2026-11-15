export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'member';
export type TransactionType = 'bank_transfer' | 'cash';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type ExpenseCategory = 'aid' | 'asset_purchase' | 'other';
export type AssetStatus = 'available' | 'borrowed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          phone: string | null;
          pin_code?: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          phone?: string | null;
          pin_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          phone?: string | null;
          pin_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: TransactionType;
          receipt_image_url: string | null;
          reference_number: string | null;
          status: TransactionStatus;
          payment_month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount?: number;
          type?: TransactionType;
          receipt_image_url?: string | null;
          reference_number?: string | null;
          status?: TransactionStatus;
          payment_month: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: TransactionType;
          receipt_image_url?: string | null;
          reference_number?: string | null;
          status?: TransactionStatus;
          payment_month?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          amount: number;
          category: ExpenseCategory;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          amount: number;
          category?: ExpenseCategory;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          amount?: number;
          category?: ExpenseCategory;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          name: string;
          quantity: number;
          status: AssetStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          quantity?: number;
          status?: AssetStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          quantity?: number;
          status?: AssetStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_fund_summary: {
        Args: { target_month?: string };
        Returns: {
          total_income: number;
          total_expenses: number;
          balance: number;
          total_members: number;
          paid_members_count: number;
          unpaid_members_count: number;
          current_month: string;
        };
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      expense_category: ExpenseCategory;
      asset_status: AssetStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Asset = Database['public']['Tables']['assets']['Row'];
export type FundSummary = Database['public']['Functions']['get_fund_summary']['Returns'];

export interface TransactionWithProfile extends Transaction {
  profiles?: Profile | null;
}
