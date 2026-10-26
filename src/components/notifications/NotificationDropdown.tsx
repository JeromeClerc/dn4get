import React from 'react';
import { Bell, Check, Clock, ExternalLink, X } from 'lucide-react';
import { NotificationItem } from '../../types';
import { formatDateTimeFr } from '../../lib/utils';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity?: (activityId: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onSelectActivity,
  onMarkRead,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose} />

      <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                Tout marquer lu
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Aucune notification pour le moment.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) onMarkRead(notif.id);
                  if (notif.activity_id && onSelectActivity) {
                    onSelectActivity(notif.activity_id);
                    onClose();
                  }
                }}
                className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                  notif.is_read
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-80'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                <div className="mt-0.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'due_date'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDateTimeFr(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {notif.message}
                  </p>
                  {notif.activity_id && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                      <span>Voir l'activité</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
