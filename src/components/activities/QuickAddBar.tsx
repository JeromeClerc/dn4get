import React, { useState } from 'react';
import { Plus, Sparkles, Calendar, Flag, User } from 'lucide-react';
import { ActivityPriority, ActivityStatus, Client } from '../../types';

interface QuickAddBarProps {
  clients: Client[];
  onAddActivity: (data: {
    title: string;
    client_id?: string | null;
    priority?: ActivityPriority;
    status?: ActivityStatus;
    due_date?: string | null;
  }) => Promise<void>;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ clients, onAddActivity }) => {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [priority, setPriority] = useState<ActivityPriority>('normal');
  const [dueDate, setDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddActivity({
        title: title.trim(),
        client_id: clientId || (clients.length > 0 ? clients[0].id : null),
        priority,
        status: 'ouvert',
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      // Réinitialiser
      setTitle('');
      setDueDate('');
      setShowOptions(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-blue-500 pl-1 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse text-blue-500" />
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Saisie rapide style ClickUp (ex: CU-4821: Déploiement patch XML)... et tapez Entrée"
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            autoFocus
          />

          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
              showOptions || clientId || dueDate || priority !== 'normal'
                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800'
                : 'text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Options de création rapide"
          >
            Options
          </button>

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer</span>
          </button>
        </div>

        {/* Options dépliables */}
        {showOptions && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
            {/* Sélecteur de client */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">Client par défaut</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
                    {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélecteur de priorité */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Flag className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActivityPriority)}
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="faible" className="bg-white dark:bg-slate-900">Priorité Faible</option>
                <option value="normal" className="bg-white dark:bg-slate-900">Priorité Normale</option>
                <option value="elevee" className="bg-white dark:bg-slate-900">Priorité Élevée</option>
                <option value="critique" className="bg-white dark:bg-slate-900">Priorité Critique</option>
              </select>
            </div>

            {/* Sélecteur de date d'échéance */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
