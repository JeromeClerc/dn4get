import React from 'react';
import { Search, Filter, EyeOff, Eye, ArrowUpDown, X, Layers } from 'lucide-react';
import { Client, DatabaseInstance, FilterState } from '../../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../lib/utils';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  clients: Client[];
  instances: DatabaseInstance[];
  totalActivitiesCount: number;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  clients,
  instances,
  totalActivitiesCount,
  filteredCount,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.clientId ||
    filters.status ||
    filters.priority ||
    filters.instanceFilter ||
    filters.hideCompleted
  );

  const resetFilters = () => {
    onFilterChange({
      search: '',
      clientId: '',
      status: '',
      priority: '',
      instanceFilter: '',
      hideCompleted: false,
      sortBy: 'created_at_desc',
    });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Ligne principale : Recherche, Tri & Toggle masquage */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Champ de recherche */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Rechercher (titre, client, RDO, variables, note)..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bascule masquer terminées */}
          <button
            onClick={() => onFilterChange({ hideCompleted: !filters.hideCompleted })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filters.hideCompleted
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Masquer les activités au statut Terminé"
          >
            {filters.hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Masquer terminées</span>
          </button>

          {/* Tri multi-critères */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="created_at_desc" className="bg-white dark:bg-slate-900">Plus récentes</option>
              <option value="due_date_asc" className="bg-white dark:bg-slate-900">Échéance la plus proche</option>
              <option value="due_date_desc" className="bg-white dark:bg-slate-900">Échéance la plus lointaine</option>
              <option value="priority_desc" className="bg-white dark:bg-slate-900">Priorité la plus haute</option>
              <option value="title_asc" className="bg-white dark:bg-slate-900">Titre alphabétique</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ligne des filtres détaillés */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtres :</span>
        </div>

        {/* Filtre Client */}
        <select
          value={filters.clientId}
          onChange={(e) => onFilterChange({ clientId: e.target.value })}
          className={`px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
            filters.clientId
              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700 font-semibold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <option value="" className="bg-white dark:bg-slate-900">Tous les clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
              {c.name} {c.code ? `(${c.code})` : ''}
            </option>
          ))}
        </select>

        {/* Filtre Statut */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className={`px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
            filters.status
              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700 font-semibold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <option value="" className="bg-white dark:bg-slate-900">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
            <option key={k} value={k} className="bg-white dark:bg-slate-900">
              {cfg.label}
            </option>
          ))}
        </select>

        {/* Filtre Priorité */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
          className={`px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
            filters.priority
              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700 font-semibold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <option value="" className="bg-white dark:bg-slate-900">Toutes les priorités</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
            <option key={k} value={k} className="bg-white dark:bg-slate-900">
              {cfg.label}
            </option>
          ))}
        </select>

        {/* Filtre Instance */}
        <div className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.instanceFilter}
            onChange={(e) => onFilterChange({ instanceFilter: e.target.value })}
            className={`px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
              filters.instanceFilter
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700 font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <option value="" className="bg-white dark:bg-slate-900">Toutes les instances</option>
            {instances.map((inst) => (
              <option key={inst.code} value={inst.code} className="bg-white dark:bg-slate-900">
                Traitée sur : {inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton reset si filtres actifs */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        )}

        {/* Compteur d'activités */}
        <div className="ml-auto text-slate-400 text-xs">
          <span>{filteredCount}</span> sur <span>{totalActivitiesCount}</span> activité{totalActivitiesCount > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
