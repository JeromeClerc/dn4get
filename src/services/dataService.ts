import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Activity, ActivityInstance, Client, DatabaseInstance, NotificationItem, StructuredNote } from '../types';
import { INITIAL_ACTIVITIES, INITIAL_CLIENTS, INITIAL_INSTANCES, INITIAL_NOTIFICATIONS } from './mockData';
import { getDefaultNote, normalizeInstanceCode } from '../lib/utils';

const STORAGE_KEYS = {
  ACTIVITIES: 'dn4get_activities_v1',
  CLIENTS: 'dn4get_clients_v1',
  INSTANCES: 'dn4get_instances_v1',
  NOTIFICATIONS: 'dn4get_notifications_v1',
};

// Initialisation du stockage local si vide
function getLocalItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erreur lecture localStorage:', e);
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new CustomEvent('dn4get_local_sync', { detail: { key } }));
  } catch (e) {
    console.error('Erreur écriture localStorage:', e);
  }
}

export const dataService = {
  // ==========================================
  // CLIENTS
  // ==========================================
  async getClients(): Promise<Client[]> {
    if (!isSupabaseConfigured) {
      return getLocalItem<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async createClient(client: Partial<Client>): Promise<Client> {
    if (!isSupabaseConfigured) {
      const clients = getLocalItem<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
      const newClient: Client = {
        id: 'client-' + Date.now(),
        user_id: 'user-default',
        name: client.name || 'Nouveau Client',
        code: client.code || '',
        color: client.color || '#3b82f6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalItem(STORAGE_KEYS.CLIENTS, [newClient, ...clients]);
      return newClient;
    }
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...client, user_id: user?.user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteClient(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const clients = getLocalItem<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
      setLocalItem(STORAGE_KEYS.CLIENTS, clients.filter((c) => c.id !== id));
      return;
    }
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // INSTANCES
  // ==========================================
  async getInstances(): Promise<DatabaseInstance[]> {
    if (!isSupabaseConfigured) {
      const stored = getLocalItem<DatabaseInstance[]>(STORAGE_KEYS.INSTANCES, INITIAL_INSTANCES);
      // Synchroniser avec les nouvelles instances si nécessaire
      const hasEqnx = stored.some((i) => i.code === 'EQNX' || i.name === 'EQNX');
      if (!hasEqnx || stored.length < INITIAL_INSTANCES.length) {
        setLocalItem(STORAGE_KEYS.INSTANCES, INITIAL_INSTANCES);
        return INITIAL_INSTANCES;
      }
      return stored;
    }
    const { data, error } = await supabase.from('instances').select('*').order('order_index');
    if (error) throw error;
    if (!data || data.length === 0) {
      return INITIAL_INSTANCES;
    }
    return data;
  },

  // ==========================================
  // ACTIVITIES (CORE)
  // ==========================================
  async getActivities(): Promise<Activity[]> {
    if (!isSupabaseConfigured) {
      return getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
    const { data, error } = await supabase
      .from('activities')
      .select('*, client:clients(*), instances:activity_instances(*), note:activity_notes(*), attachments(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createActivity(payload: {
    title: string;
    client_id?: string | null;
    priority?: Activity['priority'];
    status?: Activity['status'];
    due_date?: string | null;
  }): Promise<Activity> {
    const defaultStatus: Activity['status'] = payload.status || 'en_attente';

    if (!isSupabaseConfigured) {
      const activities = getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      const clients = getLocalItem<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
      const targetClient = clients.find((c) => c.id === payload.client_id);

      const id = 'act-' + Date.now();
      const newActivity: Activity = {
        id,
        user_id: 'user-default',
        title: payload.title,
        client_id: payload.client_id || null,
        status: defaultStatus,
        priority: payload.priority || 'normal',
        due_date: payload.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        client: targetClient,
        instances: [],
        note: getDefaultNote(id),
        attachments: [],
      };
      setLocalItem(STORAGE_KEYS.ACTIVITIES, [newActivity, ...activities]);
      return newActivity;
    }

    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          title: payload.title,
          client_id: payload.client_id || null,
          priority: payload.priority || 'normal',
          status: defaultStatus,
          due_date: payload.due_date || null,
          user_id: user?.user?.id,
        },
      ])
      .select('*, client:clients(*), instances:activity_instances(*), note:activity_notes(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    if (!isSupabaseConfigured) {
      const activities = getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      const index = activities.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Activité introuvable');
      
      const updated: Activity = {
        ...activities[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      activities[index] = updated;
      setLocalItem(STORAGE_KEYS.ACTIVITIES, [...activities]);
      return updated;
    }

    const { data, error } = await supabase
      .from('activities')
      .update({
        title: updates.title,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.due_date,
        client_id: updates.client_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, client:clients(*), instances:activity_instances(*), note:activity_notes(*), attachments(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteActivity(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const activities = getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      setLocalItem(STORAGE_KEYS.ACTIVITIES, activities.filter((a) => a.id !== id));
      return;
    }
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // INSTANCES SUIVI CUMULÉ
  // ==========================================
  async toggleInstance(activityId: string, instanceCode: string): Promise<ActivityInstance[] | null> {
    const canonCode = normalizeInstanceCode(instanceCode);

    if (!isSupabaseConfigured) {
      const activities = getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return null;

      const instances = activity.instances || [];
      const existsIndex = instances.findIndex((i) => normalizeInstanceCode(i.instance_name) === canonCode);

      if (existsIndex >= 0) {
        // Supprimer l'instance
        instances.splice(existsIndex, 1);
      } else {
        // Ajouter l'instance avec timestamp
        instances.push({
          id: 'ai-' + Date.now(),
          activity_id: activityId,
          instance_name: canonCode,
          completed_at: new Date().toISOString(),
          metadata: { added_by: 'utilisateur' },
        });
      }

      activity.instances = [...instances];
      activity.updated_at = new Date().toISOString();
      setLocalItem(STORAGE_KEYS.ACTIVITIES, [...activities]);
      return activity.instances;
    }

    // Supabase
    const { data: existingList } = await supabase
      .from('activity_instances')
      .select('id, instance_name')
      .eq('activity_id', activityId);

    const existing = existingList?.find((i) => normalizeInstanceCode(i.instance_name) === canonCode);

    if (existing) {
      await supabase.from('activity_instances').delete().eq('id', existing.id);
    } else {
      await supabase.from('activity_instances').insert([
        {
          activity_id: activityId,
          instance_name: canonCode,
          completed_at: new Date().toISOString(),
          metadata: { user_agent: navigator.userAgent },
        },
      ]);
    }

    const { data: updatedList } = await supabase
      .from('activity_instances')
      .select('*')
      .eq('activity_id', activityId);

    return updatedList || [];
  },

  // ==========================================
  // NOTE STRUCTURÉE
  // ==========================================
  async saveNote(activityId: string, noteData: Partial<StructuredNote>): Promise<StructuredNote> {
    if (!isSupabaseConfigured) {
      const activities = getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      const act = activities.find((a) => a.id === activityId);
      if (!act) throw new Error('Activité introuvable');

      const updatedNote: StructuredNote = {
        ...(act.note || getDefaultNote(activityId)),
        ...noteData,
        activity_id: activityId,
        updated_at: new Date().toISOString(),
      };
      act.note = updatedNote;
      act.updated_at = new Date().toISOString();
      setLocalItem(STORAGE_KEYS.ACTIVITIES, [...activities]);
      return updatedNote;
    }

    const { data, error } = await supabase
      .from('activity_notes')
      .upsert(
        {
          activity_id: activityId,
          urls: noteData.urls || [],
          usurper: noteData.usurper || '',
          xsl_libraries: noteData.xsl_libraries || '',
          params: noteData.params || { portail: '', onglet: '', cellule: '', details: '' },
          variables: noteData.variables || '',
          ewxsladm: noteData.ewxsladm || '',
          rdo: noteData.rdo || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'activity_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  async getNotifications(): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured) {
      return getLocalItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async markNotificationAsRead(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const notifs = getLocalItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      setLocalItem(STORAGE_KEYS.NOTIFICATIONS, updated);
      return;
    }
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllNotificationsAsRead(): Promise<void> {
    if (!isSupabaseConfigured) {
      const notifs = getLocalItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      setLocalItem(
        STORAGE_KEYS.NOTIFICATIONS,
        notifs.map((n) => ({ ...n, is_read: true }))
      );
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.user.id);
    }
  },

  // ==========================================
  // ATTACHMENTS (Storage)
  // ==========================================
  async uploadAttachment(activityId: string, file: File): Promise<any> {
    if (!isSupabaseConfigured) {
      const activities = getLocalItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      const act = activities.find((a) => a.id === activityId);
      if (!act) throw new Error('Activité introuvable');

      // Local preview URL
      const mockAttachment = {
        id: 'att-' + Date.now(),
        activity_id: activityId,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: 'local/' + file.name,
        public_url: URL.createObjectURL(file),
        created_at: new Date().toISOString(),
      };

      act.attachments = [mockAttachment, ...(act.attachments || [])];
      setLocalItem(STORAGE_KEYS.ACTIVITIES, [...activities]);
      return mockAttachment;
    }

    const { data: user } = await supabase.auth.getUser();
    const filePath = `${user?.user?.id}/${activityId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from('attachments').getPublicUrl(filePath);

    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert([
        {
          activity_id: activityId,
          user_id: user?.user?.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          public_url: publicData.publicUrl,
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  // ==========================================
  // TEMPS RÉEL (REALTIME LISTENER)
  // ==========================================
  subscribeToChanges(onChange: () => void): () => void {
    if (!isSupabaseConfigured) {
      const handler = () => onChange();
      window.addEventListener('dn4get_local_sync', handler);
      return () => window.removeEventListener('dn4get_local_sync', handler);
    }

    const channel = supabase
      .channel('public:dn4get_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => onChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_instances' }, () => onChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_notes' }, () => onChange())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => onChange())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
