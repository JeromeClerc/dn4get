import React from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
  Edit3,
  Server,
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
  const statusCfg = STATUS_CONFIG[activity.status];
  const priorityCfg = PRIORITY_CONFIG[activity.priority];
  const dueStatus = getDueDateStatus(activity.due_date);

  const completedInstances = activity.instances || [];
  const completedCodes = new Set(completedInstances.map((i) => i.instance_name));

  const hasNote = Boolean(
    activity.note &&
    (activity.note.urls?.length ||
      activity.note.rdo ||
      activity.note.usurper ||
      activity.note.xsl_libraries ||
      activity.note.variables ||
      activity.note.params?.details)
  );

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: ActivityStatus = activity.status === 'termine' ? 'ouvert' : 'termine';
    if (nextStatus === 'termine') {
      triggerConfetti();
    }
    onUpdateStatus(activity.id, nextStatus);
  };

  return (
    <div
      onClick={() => onEdit(activity)}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 ${
        activity.status === 'termine'
          ? 'border-slate-200/60 dark:border-slate-800/60 opacity-80 bg-slate-50/50 dark:bg-slate-900/40'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Barre supérieure : Client, Statut, Priorité & Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Client & Priorité */}
        <div className="flex flex-wrap items-center gap-2">
          {activity.client ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide"
              style={{
                backgroundColor: `${activity.client.color}18`,
                color: activity.client.color,
                border: `1px solid ${activity.client.color}35`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activity.client.color }}
              />
              {activity.client.name}
              {activity.client.code && (
                <span className="opacity-75 font-mono text-[10px]">[{activity.client.code}]</span>
              )}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
              Sans client
            </span>
          )}

          {/* Badge Priorité */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${priorityCfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
            {priorityCfg.label}
          </span>
        </div>

        {/* Sélecteur de statut & Actions rapides */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Quick status dropdown */}
          <select
            value={activity.status}
            onChange={(e) => {
              const val = e.target.value as ActivityStatus;
              if (val === 'termine') triggerConfetti();
              onUpdateStatus(activity.id, val);
            }}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${statusCfg.bgLight} ${statusCfg.bgDark} ${statusCfg.color} ${statusCfg.border}`}
          >
            {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
              <option key={k} value={k} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Bouton édition */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(activity);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            title="Modifier l'activité et sa note structurée"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Bouton suppression */}
          <button
            onClick={(e) => {
              e.stopPropagation();
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

      {/* Titre de l'activité (ClickUp label) */}
      <div className="flex items-start gap-2.5 mb-3">
        <button
          onClick={handleQuickComplete}
          className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
            activity.status === 'termine'
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-slate-300 dark:text-slate-700 hover:text-slate-400 dark:hover:text-slate-500'
          }`}
          title={activity.status === 'termine' ? 'Marquer non terminée' : 'Marquer comme terminée'}
        >
          <CheckCircle className="w-5 h-5" />
        </button>

        <h3
          className={`font-semibold text-sm sm:text-base leading-snug break-words ${
            activity.status === 'termine'
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {activity.title}
        </h3>
      </div>

      {/* Suivi cumulé des instances cibles (Test, Intégration, Dev, Form, Pré-prod, Prod) */}
      <div className="mb-3.5 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Server className="w-3 h-3 text-blue-500" />
            <span>Instances cumulées :</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {completedCodes.size} / {instances.length} traitée{completedCodes.size > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {instances.map((inst) => {
            const isCompleted = completedCodes.has(inst.code);
            const instData = completedInstances.find((i) => i.instance_name === inst.code);

            return (
              <button
                key={inst.code}
                onClick={() => onToggleInstance(activity.id, inst.code)}
                title={
                  isCompleted && instData
                    ? `${inst.name} : Validé le ${formatDateTimeFr(instData.completed_at)}`
                    : `Cliquer pour marquer ${inst.name} comme fait`
                }
                className={`group/chip relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/30 dark:bg-emerald-600'
                    : 'bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCompleted ? 'bg-white animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{inst.name}</span>
                {isCompleted && (
                  <CheckCircle className="w-3 h-3 text-emerald-100" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges d'information métier (Note, RDO, URLs, Pièces jointes) */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
        {activity.note?.rdo && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono text-[11px] font-semibold">
            RDO: {activity.note.rdo}
          </span>
        )}

        {activity.note?.params?.cellule && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-[11px]">
            {activity.note.params.cellule}
          </span>
        )}

        {activity.note?.urls && activity.note.urls.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
            <ExternalLink className="w-3 h-3" />
            {activity.note.urls.length} lien{activity.note.urls.length > 1 ? 's' : ''}
          </span>
        )}

        {activity.attachments && activity.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
            <Paperclip className="w-3 h-3 text-blue-500" />
            {activity.attachments.length} PJ
          </span>
        )}

        {hasNote && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
            <FileText className="w-3 h-3 text-emerald-500" />
            Note structurée
          </span>
        )}
      </div>

      {/* Pied de carte : Date d'échéance et alerte */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {activity.due_date ? (
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-medium ${
              dueStatus.isOverdue
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold animate-pulse'
                : dueStatus.isToday
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {dueStatus.isOverdue ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>Échéance : {formatDateShortFr(activity.due_date)}</span>
            {dueStatus.text && <span className="text-[11px]">({dueStatus.text})</span>}
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">Aucune échéance</span>
        )}

        <span className="text-[10px] text-slate-400">
          Créée le {formatDateShortFr(activity.created_at)}
        </span>
      </div>
    </div>
  );
};
