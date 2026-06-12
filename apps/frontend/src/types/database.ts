export type PlanKey = 'free' | 'starter' | 'growth' | 'agency';
export type ProjectStatus =
  | 'draft'
  | 'uploaded'
  | 'queued'
  | 'transcribing'
  | 'planning'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type AssetStatus = 'uploading' | 'uploaded' | 'processing' | 'ready' | 'failed';
export type VariantStatus = 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';

export type Profile = {
  user_id: string;
  email: string | null;
  plan: PlanKey;
  shop_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  preset: string;
  platform: string;
  output_format: string;
  language: string;
  instructions: string;
  variants_count: number;
  settings: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type UserCredits = {
  user_id: string;
  balance: number;
  reserved: number;
  monthly_allowance: number;
  monthly_exports_used: number;
  monthly_exports_reset_at: string | null;
};

export type VideoVariant = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  preset: string;
  marketing_angle: string | null;
  hook_text: string | null;
  status: VariantStatus;
  export_path: string | null;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  edit_plan: Record<string, unknown>;
  render_metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
