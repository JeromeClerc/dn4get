export type ActivityStatus = 'ouvert' | 'en_cours' | 'en_test' | 'bloque' | 'en_attente' | 'termine';
export type ActivityPriority = 'faible' | 'normal' | 'elevee' | 'critique';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInstance {
  id: string;
  user_id: string;
  name: string;
  code: string; // test, integration, dev, form, pre-prod, prod
  color: string;
  order_index: number;
  created_at?: string;
}

export interface ActivityInstance {
  id?: string;
  activity_id: string;
  instance_name: string;
  completed_at: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface NoteParams {
  portail: string;
  onglet: string;
  cellule: string;
  details: string;
}

export interface StructuredNote {
  id?: string;
  activity_id: string;
  urls: string[];
  usurper: string;
  xsl_libraries: string;
  params: NoteParams | NoteParams[];
  variables: string;
  ewxsladm: string;
  rdo: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attachment {
  id: string;
  activity_id: string;
  user_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations jointes
  client?: Client;
  instances?: ActivityInstance[];
  note?: StructuredNote;
  attachments?: Attachment[];
}

export interface NotificationItem {
  id: string;
  user_id: string;
  activity_id?: string;
  type: 'due_date' | 'status_change' | 'instance_update' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  activity?: Activity;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  phone_number?: string;
  phone_notifications_enabled?: boolean;
  email_notifications_enabled?: boolean;
  push_notifications_enabled?: boolean;
}

export interface FilterState {
  search: string;
  clientId: string;
  status: string;
  priority: string;
  instanceFilter: string;
  hideCompleted: boolean;
  sortBy: 'due_date_asc' | 'due_date_desc' | 'created_at_desc' | 'priority_desc' | 'title_asc';
}
