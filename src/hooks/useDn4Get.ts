import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Activity, ActivityPriority, ActivityStatus, FilterState, StructuredNote } from '../types';

export function useDn4Get(filters?: FilterState) {
  const queryClient = useQueryClient();

  // Écouteur de modifications temps réel (Supabase ou LocalStorage)
  useEffect(() => {
    const unsubscribe = dataService.subscribeToChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Récupération des activités
  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: () => dataService.getActivities(),
  });

  // Récupération des clients
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => dataService.getClients(),
  });

  // Récupération des instances
  const instancesQuery = useQuery({
    queryKey: ['instances'],
    queryFn: () => dataService.getInstances(),
  });

  // Récupération des notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dataService.getNotifications(),
  });

  // Filtrage et tri côté client des activités
  const filteredActivities = (activitiesQuery.data || []).filter((act) => {
    if (!filters) return true;

    // Masquer les activités terminées si demandé
    if (filters.hideCompleted && act.status === 'termine') {
      return false;
    }

    // Filtre texte (titre, client, rdo, usurper, params)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchClient = act.client?.name.toLowerCase().includes(q) || act.client?.code?.toLowerCase().includes(q);
      const matchRdo = act.note?.rdo?.toLowerCase().includes(q);
      const matchUsurper = act.note?.usurper?.toLowerCase().includes(q);
      const matchParams =
        act.note?.params?.portail?.toLowerCase().includes(q) ||
        act.note?.params?.cellule?.toLowerCase().includes(q) ||
        act.note?.params?.details?.toLowerCase().includes(q);

      if (!matchTitle && !matchClient && !matchRdo && !matchUsurper && !matchParams) {
        return false;
      }
    }

    // Filtre client
    if (filters.clientId && act.client_id !== filters.clientId) {
      return false;
    }

    // Filtre statut
    if (filters.status && act.status !== filters.status) {
      return false;
    }

    // Filtre priorité
    if (filters.priority && act.priority !== filters.priority) {
      return false;
    }

    // Filtre instance traitée
    if (filters.instanceFilter) {
      const hasInstance = act.instances?.some((i) => i.instance_name === filters.instanceFilter);
      if (!hasInstance) return false;
    }

    return true;
  });

  // Tri
  filteredActivities.sort((a, b) => {
    const sortBy = filters?.sortBy || 'created_at_desc';

    if (sortBy === 'due_date_asc') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortBy === 'due_date_desc') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    }
    if (sortBy === 'priority_desc') {
      const pWeights: Record<ActivityPriority, number> = { critique: 4, elevee: 3, normal: 2, faible: 1 };
      return pWeights[b.priority] - pWeights[a.priority];
    }
    if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title);
    }
    // Par défaut : created_at_desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Mutations
  const createActivityMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      client_id?: string | null;
      priority?: ActivityPriority;
      status?: ActivityStatus;
      due_date?: string | null;
    }) => dataService.createActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Activity> }) =>
      dataService.updateActivity(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const toggleInstanceMutation = useMutation({
    mutationFn: ({ activityId, instanceName }: { activityId: string; instanceName: string }) =>
      dataService.toggleInstance(activityId, instanceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: ({ activityId, note }: { activityId: string; note: Partial<StructuredNote> }) =>
      dataService.saveNote(activityId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (newClient: { name: string; code?: string; color?: string }) =>
      dataService.createClient(newClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => dataService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ activityId, file }: { activityId: string; file: File }) =>
      dataService.uploadAttachment(activityId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: (id: string) => dataService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: () => dataService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    activities: filteredActivities,
    allActivities: activitiesQuery.data || [],
    isLoading: activitiesQuery.isLoading,
    clients: clientsQuery.data || [],
    instances: instancesQuery.data || [],
    notifications: notificationsQuery.data || [],
    unreadNotificationsCount: (notificationsQuery.data || []).filter((n) => !n.is_read).length,
    createActivity: createActivityMutation.mutateAsync,
    updateActivity: updateActivityMutation.mutateAsync,
    deleteActivity: deleteActivityMutation.mutateAsync,
    toggleInstance: toggleInstanceMutation.mutateAsync,
    saveNote: saveNoteMutation.mutateAsync,
    createClient: createClientMutation.mutateAsync,
    deleteClient: deleteClientMutation.mutateAsync,
    uploadAttachment: uploadAttachmentMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutateAsync,
    markAllNotificationsRead: markAllNotificationsReadMutation.mutateAsync,
  };
}
