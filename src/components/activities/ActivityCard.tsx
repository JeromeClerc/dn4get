import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
  Edit3,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Activity, DatabaseInstance, ActivityStatus } from '../../types';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  getDueDateStatus,
  formatDateShortFr,
  formatDateTimeFr,
  triggerConfetti,
  normalizeInstanceCode,
  getInstanceInfo,
} from '../../lib/utils';

interface ActivityCardProps {
  activity: Activity;
  instances: DatabaseInstance[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ActivityStatus) => void;
  onToggleInstance: (activityId: string, instanceName: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  instances,
  onEdit,
  onDelete,
  onUpdateStatus,
  onToggleInstance,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusCfg = STATUS_CONFIG[activity.status];
  const priorityCfg = PRIORITY_CONFIG[activity.priority];
  const dueStatus = getDueDateStatus(activity.due_date);

  const completedInstances = activity.instances || [];
  const completedCodes = new Set(
    completedInstances.map((i) => normalizeInstanceCode(i.instance_name))
  );

  // Instances disponibles à ajouter (non encore assignées)
  const availableInstances = instances.filter(
    (inst) => !completedCodes.has(normalizeInstanceCode(inst.code))
  );

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: ActivityStatus = activity.status === 'termine' ? 'en_attente' : 'termine';
    if (nextStatus === 'termine') {
      triggerConfetti();
    }
    onUpdateStatus(activity.id, nextStatus);
  };

  return (
    <div
      onClick={() => onEdit(activity)}
      className={`group relative w-full bg-white dark:bg-slate-900 rounded-xl border transition-all duration-150 p-3 sm:px-4 sm:py-2.5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-3.5 ${
        activity.status === 'termine'
          ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80 bg-slate-50/50 dark:bg-slate-900/40'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* 1. CLIENT */}
      <div className="w-full lg:w-36 shrink-0 flex items-center">
        {activity.client ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide truncate max-w-full"
            style={{
              backgroundColor: `${activity.client.color}15`,
              color: activity.client.color,
              border: `1px solid ${activity.client.color}35`,
            }}
            title={`${activity.client.name} ${activity.client.code ? `[${activity.client.code}]` : ''}`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activity.client.color }}
            />
            <span className="truncate">{activity.client.name}</span>
            {activity.client.code && (
              <span className="opacity-70 font-mono text-[10px] shrink-0">
                [{activity.client.code}]
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
            Sans client
          </span>
        )}
      </div>

      {/* 2. LIBELLÉ */}
      <div className="flex-1 min-w-[200px] flex items-center gap-2.5">
        <button
          onClick={handleQuickComplete}
          className={`shrink-0 transition-transform active:scale-90 ${
            activity.status === 'termine'
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500'
          }`}
          title={activity.status === 'termine' ? 'Marquer non terminée' : 'Marquer comme terminée'}
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span
          className={`font-semibold text-sm leading-snug break-words flex-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
            activity.status === 'termine'
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-slate-100'
          }`}
          title={activity.title}
        >
          {activity.title}
        </span>

        {/* Badges discrets complémentaires */}
        {activity.note?.rdo && (
          <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
            RDO: {activity.note.rdo}
          </span>
        )}
        {activity.attachments && activity.attachments.length > 0 && (
          <span className="hidden xl:inline-flex items-center gap-0.5 text-[10px] text-slate-400 shrink-0">
            <Paperclip className="w-3 h-3 text-blue-500" />
            {activity.attachments.length}
          </span>
        )}
      </div>

      {/* 3. STATUT */}
      <div
        className="w-full sm:w-auto lg:w-32 shrink-0 flex items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={activity.status}
          onChange={(e) => {
            const val = e.target.value as ActivityStatus;
            if (val === 'termine') triggerConfetti();
            onUpdateStatus(activity.id, val);
          }}
          className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-colors ${statusCfg.bgLight} ${statusCfg.bgDark} ${statusCfg.color} ${statusCfg.border}`}
        >
          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
            <option
              key={k}
              value={k}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. URGENCE (PRIORITÉ) */}
      <div className="w-full sm:w-auto lg:w-28 shrink-0 flex items-center">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityCfg.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
          {priorityCfg.label}
        </span>
      </div>

      {/* 5. INSTANCES (Mode Tags avec bouton d'ajout) */}
      <div
        className="w-full sm:w-auto lg:w-56 xl:w-64 shrink-0 flex items-center flex-wrap gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tags d'instances déjà assignées */}
        {completedInstances.map((ci) => {
          const info = getInstanceInfo(ci.instance_name);
          return (
            <span
              key={ci.instance_name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm transition-all group/tag"
              style={{
                backgroundColor: `${info.color}18`,
                color: info.color,
                border: `1px solid ${info.color}55`,
              }}
              title={`${info.name} : Validé le ${formatDateTimeFr(ci.completed_at)} (cliquer pour retirer)`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
              <span>{info.name}</span>
              <button
                type="button"
                onClick={() => onToggleInstance(activity.id, info.code)}
                className="ml-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5 text-current transition-colors"
                title="Retirer cette instance"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}

        {/* Bouton pour ajouter une instance façon tag */}
        {availableInstances.length > 0 && (
          <div className="relative inline-block" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40"
              title="Ajouter une instance"
            >
              <Plus className="w-3 h-3" />
              <span>Instance</span>
            </button>

            {showAddMenu && (
              <div className="absolute left-0 mt-1 z-30 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Ajouter une instance
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {availableInstances.map((inst) => {
                    const info = getInstanceInfo(inst.code);
                    return (
                      <button
                        key={inst.code}
                        type="button"
                        onClick={() => {
                          onToggleInstance(activity.id, inst.code);
                          setShowAddMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                        <span className="font-semibold">{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. ÉCHÉANCE */}
      <div className="w-full sm:w-auto lg:w-32 shrink-0 flex items-center">
        {activity.due_date ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
              dueStatus.isOverdue
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                : dueStatus.isToday
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
            title={`Échéance : ${formatDateShortFr(activity.due_date)}`}
          >
            {dueStatus.isOverdue ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : (
              <Calendar className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{formatDateShortFr(activity.due_date)}</span>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
        )}
      </div>

      {/* 7. MODIFIER */}
      <div
        className="w-auto lg:w-9 shrink-0 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(activity)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          title="Modifier l'activité et sa note structurée"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* 8. SUPPRIMER */}
      <div
        className="w-auto lg:w-9 shrink-0 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            if (confirm('Voulez-vous vraiment supprimer cette activité ?')) {
              onDelete(activity.id);
            }
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
