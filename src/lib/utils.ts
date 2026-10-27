import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';
import { ActivityPriority, ActivityStatus, NoteParams, StructuredNote } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; color: string; bgLight: string; bgDark: string; border: string; iconColor: string }
> = {
  ouvert: {
    label: 'Ouvert',
    color: 'text-blue-700 dark:text-blue-300',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500',
  },
  en_cours: {
    label: 'En cours',
    color: 'text-amber-700 dark:text-amber-300',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-500',
  },
  bloque: {
    label: 'Bloqué',
    color: 'text-rose-700 dark:text-rose-300',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-500',
  },
  en_attente: {
    label: 'En attente',
    color: 'text-purple-700 dark:text-purple-300',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950/60',
    border: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-500',
  },
  termine: {
    label: 'Terminé',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-500',
  },
};

export const PRIORITY_CONFIG: Record<
  ActivityPriority,
  { label: string; color: string; badge: string; dot: string }
> = {
  faible: {
    label: 'Faible',
    color: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  normal: {
    label: 'Normale',
    color: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  elevee: {
    label: 'Élevée',
    color: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  critique: {
    label: 'Critique',
    color: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse',
    dot: 'bg-red-600',
  },
};

export interface InstanceDefinition {
  code: string;
  name: string;
  color: string;
  order_index: number;
}

export const INSTANCE_DEFINITIONS: InstanceDefinition[] = [
  { code: 'DEV', name: 'DEV', color: '#0284c7', order_index: 1 },
  { code: 'TEST', name: 'TEST', color: '#6366f1', order_index: 2 },
  { code: 'QA', name: 'QA', color: '#0d9488', order_index: 3 },
  { code: 'INT', name: 'INT', color: '#2563eb', order_index: 4 },
  { code: 'REC', name: 'REC', color: '#9333ea', order_index: 5 },
  { code: 'FORM', name: 'FORM', color: '#16a34a', order_index: 6 },
  { code: 'EQNX', name: 'EQNX', color: '#ea580c', order_index: 7 },
  { code: 'PPROD', name: 'PPROD', color: '#d97706', order_index: 8 },
  { code: 'PROD', name: 'PROD', color: '#e11d48', order_index: 9 },
];

export function getInstanceInfo(code: string): InstanceDefinition {
  const found = INSTANCE_DEFINITIONS.find((i) => i.code === code);
  if (found) return found;
  return {
    code,
    name: code,
    color: '#64748b',
    order_index: 99,
  };
}

export const DEFAULT_INSTANCES = INSTANCE_DEFINITIONS;

export function getDefaultNote(activityId: string): StructuredNote {
  return {
    activity_id: activityId,
    urls: [],
    usurper: '',
    xsl_libraries: '',
    params: {
      portail: '',
      onglet: '',
      cellule: '',
      details: '',
    },
    variables: '',
    ewxsladm: '',
    rdo: '',
  };
}

export function formatDateTimeFr(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShortFr(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function getDueDateStatus(dueDateStr?: string | null): {
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isUpcoming: boolean;
  text: string;
} {
  if (!dueDateStr) {
    return { isOverdue: false, isToday: false, isTomorrow: false, isUpcoming: false, text: '' };
  }

  const due = new Date(dueDateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffDays = Math.round((dueDayStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      isUpcoming: false,
      text: `En retard de ${Math.abs(diffDays)} j`,
    };
  } else if (diffDays === 0) {
    return {
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      isUpcoming: false,
      text: "Aujourd'hui",
    };
  } else if (diffDays === 1) {
    return {
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      isUpcoming: false,
      text: 'Demain',
    };
  } else {
    return {
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isUpcoming: true,
      text: `Dans ${diffDays} j`,
    };
  }
}

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'],
    });
  } catch (e) {
    // Ignore confetti failure on minimal environments
  }
}
