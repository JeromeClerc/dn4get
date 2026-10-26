import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useDn4Get } from './hooks/useDn4Get';
import { Header } from './components/layout/Header';
import { QuickAddBar } from './components/activities/QuickAddBar';
import { FilterBar } from './components/activities/FilterBar';
import { ActivityCard } from './components/activities/ActivityCard';
import { ActivityModal } from './components/activities/ActivityModal';
import { ClientManagerModal } from './components/clients/ClientManagerModal';
import { PwaPrompt } from './components/layout/PwaPrompt';
import { Activity, FilterState } from './types';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Inbox,
  Activity as ActivityIcon,
  HelpCircle,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 secondes
      refetchOnWindowFocus: false,
    },
  },
});

function MainDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    clientId: '',
    status: '',
    priority: '',
    instanceFilter: '',
    hideCompleted: false,
    sortBy: 'created_at_desc',
  });

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [triggerInstallFn, setTriggerInstallFn] = useState<(() => void) | undefined>();

  const {
    activities,
    allActivities,
    isLoading,
    clients,
    instances,
    notifications,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleInstance,
    saveNote,
    createClient,
    deleteClient,
    uploadAttachment,
    markNotificationRead,
    markAllNotificationsRead,
  } = useDn4Get(filters);

  // Statistiques rapides
  const openCount = allActivities.filter((a) => a.status === 'ouvert' || a.status === 'en_cours').length;
  const blockedCount = allActivities.filter((a) => a.status === 'bloque').length;
  const completedCount = allActivities.filter((a) => a.status === 'termine').length;

  const todayStr = new Date().toISOString().substring(0, 10);
  const dueTodayCount = allActivities.filter(
    (a) => a.due_date && a.due_date.substring(0, 10) === todayStr && a.status !== 'termine'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Header Supérieur */}
      <Header
        notifications={notifications}
        onSelectActivity={(actId) => {
          const act = allActivities.find((a) => a.id === actId);
          if (act) setSelectedActivity(act);
        }}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onOpenClientManager={() => setIsClientModalOpen(true)}
        canInstallPwa={canInstallPwa}
        onTriggerPwaInstall={triggerInstallFn}
      />

      {/* Conteneur Principal */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI / Cartes Synthèse */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <ActivityIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {openCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">En cours / Ouvertes</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {dueTodayCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Échéance aujourd'hui</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {blockedCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bloquées</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {completedCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Terminées</p>
            </div>
          </div>
        </div>

        {/* Barre de saisie rapide (Style ClickUp) */}
        <QuickAddBar
          clients={clients}
          onAddActivity={async (data) => {
            await createActivity(data);
          }}
        />

        {/* Barre de filtres et tri */}
        <FilterBar
          filters={filters}
          onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
          clients={clients}
          instances={instances}
          totalActivitiesCount={allActivities.length}
          filteredCount={activities.length}
        />

        {/* Liste des Activités */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Chargement de vos activités...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                Aucune activité trouvée
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Tapez un texte dans le champ de saisie rapide ci-dessus ou modifiez vos critères de filtre.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-2">
              {/* Entête des colonnes sur grand écran */}
              <div className="hidden lg:flex items-center gap-3.5 px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                <div className="w-36 shrink-0">Client</div>
                <div className="flex-1 min-w-[200px]">Libellé</div>
                <div className="w-32 shrink-0">Statut</div>
                <div className="w-28 shrink-0">Urgence</div>
                <div className="w-56 xl:w-64 shrink-0">Instances</div>
                <div className="w-32 shrink-0">Échéance</div>
                <div className="w-9 shrink-0 text-center">Éditer</div>
                <div className="w-9 shrink-0 text-center">Suppr.</div>
              </div>

              {/* Lignes d'activités pleine largeur */}
              <div className="flex flex-col gap-2 w-full">
                {activities.map((act) => (
                  <ActivityCard
                    key={act.id}
                    activity={act}
                    instances={instances}
                    onEdit={(activityToEdit) => setSelectedActivity(activityToEdit)}
                    onDelete={(id) => deleteActivity(id)}
                    onUpdateStatus={(id, status) => updateActivity({ id, updates: { status } })}
                    onToggleInstance={(actId, instCode) =>
                      toggleInstance({ activityId: actId, instanceName: instCode })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Dn4Get v1.0.0</span>
            <span>•</span>
            <span>Do Not Forget - Suivi d'activités & instances DB</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Synchronisation temps réel</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modal d'édition complète */}
      <ActivityModal
        activity={selectedActivity}
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        clients={clients}
        instances={instances}
        onSaveActivity={async (id, updates) => {
          await updateActivity({ id, updates });
        }}
        onSaveNote={async (actId, noteUpdates) => {
          await saveNote({ activityId: actId, note: noteUpdates });
        }}
        onDeleteActivity={async (id) => {
          await deleteActivity(id);
        }}
        onToggleInstance={async (actId, instName) => {
          await toggleInstance({ activityId: actId, instanceName: instName });
        }}
        onUploadAttachment={async (actId, file) => {
          await uploadAttachment({ activityId: actId, file });
        }}
      />

      {/* Modal de gestion des clients */}
      <ClientManagerModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clients={clients}
        onCreateClient={createClient}
        onDeleteClient={deleteClient}
      />

      {/* Invite d'installation PWA */}
      <PwaPrompt
        onCanInstallChange={(canInstall, triggerFn) => {
          setCanInstallPwa(canInstall);
          setTriggerInstallFn(() => triggerFn);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MainDashboard />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
