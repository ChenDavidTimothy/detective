export interface CaseMedia {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'document' | 'audio' | 'video';
  storage_path?: string;
  external_url?: string;
  cover_image_url?: string;
  display_order: number;
} 