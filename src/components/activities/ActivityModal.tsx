import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Trash2,
  Calendar,
  Flag,
  User,
  Paperclip,
  Plus,
  UploadCloud,
  FileText,
  Layers,
  Code,
  Shield,
  ExternalLink,
  Pencil,
  Check,
  UserCheck,
  FileCode,
  Sliders,
  Terminal,
  Hash,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import {
  Activity,
  ActivityPriority,
  ActivityStatus,
  Client,
  DatabaseInstance,
  NoteParams,
  StructuredNote,
} from '../../types';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  getDefaultNote,
  normalizeNoteParams,
  triggerConfetti,
} from '../../lib/utils';

// Helper pour convertir une valeur texte en tableau de chaînes
const parseStringToList = (val?: string): string[] => {
  if (!val) return [];
  if (val.includes('\n')) {
    return val.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  if (val.includes(',') && !val.includes('=')) {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const trimmed = val.trim();
  return trimmed ? [trimmed] : [];
};

// Sous-composant pour les champs dynamiques avec ajout par Entrée, modification et suppression
interface DynamicListFieldProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  helperText?: string;
}

const DynamicListField: React.FC<DynamicListFieldProps> = ({
  label,
  icon,
  placeholder,
  items,
  onChange,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddItem();
    }
  };

  const handleDeleteItem = (indexToDelete: number) => {
    onChange(items.filter((_, i) => i !== indexToDelete));
    if (editingIndex === indexToDelete) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > indexToDelete) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditingText(items[idx]);
  };

  const handleSaveEdit = (idx: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setEditingIndex(null);
      return;
    }
    const next = [...items];
    next[idx] = trimmed;
    onChange(next);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveEdit(idx);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancelEdit();
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
      {/* En-tête du champ (sans numéro) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {icon}
          <span>{label}</span>
        </div>
        {items.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            {items.length} {items.length > 1 ? 'éléments' : 'élément'}
          </span>
        )}
      </div>

      {/* Saisie avec validation par touche Entrée ou bouton */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={handleAddItem}
          disabled={!inputValue.trim()}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 transition-all shrink-0 shadow-sm active:scale-95"
          title="Ajouter à la liste (ou Entrée)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {helperText && items.length === 0 && (
        <p className="text-[11px] text-slate-400 italic">{helperText}</p>
      )}

      {/* Liste dynamique qui apparaît dès la première saisie */}
      {items.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-200">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
            >
              {editingIndex === idx ? (
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, idx)}
                    className="flex-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-blue-500 text-slate-900 dark:text-slate-100 focus:outline-none ring-1 ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(idx)}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                    title="Valider la modification (Entrée)"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Annuler (Échap)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <span
                      className="font-mono text-slate-800 dark:text-slate-200 truncate select-all cursor-pointer"
                      title={`${item} (Double-clic pour modifier)`}
                      onDoubleClick={() => handleStartEdit(idx)}
                    >
                      {item}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                      title="Modifier cette ligne"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Supprimer cette ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ActivityModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  instances: DatabaseInstance[];
  onSaveActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  onSaveNote: (activityId: string, note: Partial<StructuredNote>) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
  onUploadAttachment: (activityId: string, file: File) => Promise<void>;
  onToggleInstance: (activityId: string, instanceName: string) => Promise<void>;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  activity,
  isOpen,
  onClose,
  clients,
  instances,
  onSaveActivity,
  onSaveNote,
  onDeleteActivity,
  onUploadAttachment,
  onToggleInstance,
}) => {
  if (!isOpen || !activity) return null;

  // Local states
  const [title, setTitle] = useState(activity.title);
  const [clientId, setClientId] = useState(activity.client_id || '');
  const [status, setStatus] = useState<ActivityStatus>(activity.status);
  const [priority, setPriority] = useState<ActivityPriority>(activity.priority);
  const [dueDate, setDueDate] = useState<string>(
    activity.due_date ? activity.due_date.substring(0, 16) : ''
  );

  // Note structurée & champs dynamiques
  const initialNote = activity.note || getDefaultNote(activity.id);
  const [commentaires, setCommentaires] = useState<string>(() => (initialNote.urls || []).join('\n'));
  const [commentAutoSaveStatus, setCommentAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [usurperList, setUsurperList] = useState<string[]>(() => parseStringToList(initialNote.usurper));
  const [xslLibrariesList, setXslLibrariesList] = useState<string[]>(() => parseStringToList(initialNote.xsl_libraries));

  // PARAMS : liste des entrées enregistrées + champs de saisie d'une nouvelle ligne + édition
  const [paramsList, setParamsList] = useState<NoteParams[]>(() => normalizeNoteParams(initialNote.params));
  const [newParam, setNewParam] = useState<NoteParams>({ portail: '', onglet: '', cellule: '', details: '' });
  const [editingParamIdx, setEditingParamIdx] = useState<number | null>(null);
  const [editingParamData, setEditingParamData] = useState<NoteParams>({
    portail: '',
    onglet: '',
    cellule: '',
    details: '',
  });
  const [isSavingParams, setIsSavingParams] = useState(false);

  const [variablesList, setVariablesList] = useState<string[]>(() => parseStringToList(initialNote.variables));
  const [ewxsladmList, setEwxsladmList] = useState<string[]>(() => parseStringToList(initialNote.ewxsladm));
  const [rdoList, setRdoList] = useState<string[]>(() => parseStringToList(initialNote.rdo));

  const [activeTab, setActiveTab] = useState<'general' | 'note' | 'instances' | 'attachments'>('note');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const commentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(activity.title);
    setClientId(activity.client_id || '');
    setStatus(activity.status);
    setPriority(activity.priority);
    setDueDate(activity.due_date ? activity.due_date.substring(0, 16) : '');

    const note = activity.note || getDefaultNote(activity.id);
    setCommentaires((note.urls || []).join('\n'));
    setCommentAutoSaveStatus('idle');
    setUsurperList(parseStringToList(note.usurper));
    setXslLibrariesList(parseStringToList(note.xsl_libraries));
    setParamsList(normalizeNoteParams(note.params));
    setNewParam({ portail: '', onglet: '', cellule: '', details: '' });
    setEditingParamIdx(null);
    setVariablesList(parseStringToList(note.variables));
    setEwxsladmList(parseStringToList(note.ewxsladm));
    setRdoList(parseStringToList(note.rdo));
  }, [activity.id]);

  // Helper centralisé pour sauvegarder la note en base de données
  const persistNoteToDb = async (overrides?: {
    commentaires?: string;
    usurperList?: string[];
    xslLibrariesList?: string[];
    paramsList?: NoteParams[];
    variablesList?: string[];
    ewxsladmList?: string[];
    rdoList?: string[];
  }) => {
    const nextComments = overrides?.commentaires ?? commentaires;
    await onSaveNote(activity.id, {
      urls: nextComments.trim() ? [nextComments] : [],
      usurper: (overrides?.usurperList ?? usurperList).join('\n'),
      xsl_libraries: (overrides?.xslLibrariesList ?? xslLibrariesList).join('\n'),
      params: overrides?.paramsList ?? paramsList,
      variables: (overrides?.variablesList ?? variablesList).join('\n'),
      ewxsladm: (overrides?.ewxsladmList ?? ewxsladmList).join('\n'),
      rdo: (overrides?.rdoList ?? rdoList).join('\n'),
    });
  };

  // Gestion des PARAMS (Ajout, Édition, Suppression avec sauvegarde immédiate en base)
  const hasNewParamInput = Boolean(
    newParam.portail.trim() ||
      newParam.onglet.trim() ||
      newParam.cellule.trim() ||
      newParam.details.trim()
  );

  const handleAddParam = async () => {
    if (!hasNewParamInput) return;
    const entry: NoteParams = {
      portail: newParam.portail.trim(),
      onglet: newParam.onglet.trim(),
      cellule: newParam.cellule.trim(),
      details: newParam.details.trim(),
    };
    const nextList = [...paramsList, entry];
    setParamsList(nextList);
    // Remettre les champs en état de saisir une nouvelle ligne
    setNewParam({ portail: '', onglet: '', cellule: '', details: '' });

    try {
      setIsSavingParams(true);
      await persistNoteToDb({ paramsList: nextList });
    } catch (e) {
      console.error('Erreur sauvegarde PARAMS:', e);
    } finally {
      setIsSavingParams(false);
    }
  };

  const handleStartEditParam = (idx: number) => {
    setEditingParamIdx(idx);
    setEditingParamData({ ...paramsList[idx] });
  };

  const handleSaveEditParam = async (idx: number) => {
    const updatedEntry: NoteParams = {
      portail: editingParamData.portail.trim(),
      onglet: editingParamData.onglet.trim(),
      cellule: editingParamData.cellule.trim(),
      details: editingParamData.details.trim(),
    };
    const nextList = [...paramsList];
    nextList[idx] = updatedEntry;
    setParamsList(nextList);
    setEditingParamIdx(null);

    try {
      setIsSavingParams(true);
      await persistNoteToDb({ paramsList: nextList });
    } catch (e) {
      console.error('Erreur modification PARAMS:', e);
    } finally {
      setIsSavingParams(false);
    }
  };

  const handleDeleteParam = async (idx: number) => {
    const nextList = paramsList.filter((_, i) => i !== idx);
    setParamsList(nextList);
    if (editingParamIdx === idx) {
      setEditingParamIdx(null);
    } else if (editingParamIdx !== null && editingParamIdx > idx) {
      setEditingParamIdx(editingParamIdx - 1);
    }

    try {
      setIsSavingParams(true);
      await persistNoteToDb({ paramsList: nextList });
    } catch (e) {
      console.error('Erreur suppression PARAMS:', e);
    } finally {
      setIsSavingParams(false);
    }
  };

  // Enregistrement automatique du champ COMMENTAIRES
  const handleCommentairesChange = (val: string) => {
    setCommentaires(val);
    setCommentAutoSaveStatus('saving');

    if (commentDebounceRef.current) {
      clearTimeout(commentDebounceRef.current);
    }

    commentDebounceRef.current = setTimeout(async () => {
      try {
        await persistNoteToDb({ commentaires: val });
        setCommentAutoSaveStatus('saved');
      } catch (e) {
        console.error('Erreur auto-save commentaires:', e);
        setCommentAutoSaveStatus('idle');
      }
    }, 700);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (commentDebounceRef.current) {
        clearTimeout(commentDebounceRef.current);
      }

      // Si des données PARAMS étaient en cours de saisie dans le formulaire, les inclure
      const finalParamsList = hasNewParamInput
        ? [
            ...paramsList,
            {
              portail: newParam.portail.trim(),
              onglet: newParam.onglet.trim(),
              cellule: newParam.cellule.trim(),
              details: newParam.details.trim(),
            },
          ]
        : paramsList;

      // 1. Sauvegarder l'activité
      await onSaveActivity(activity.id, {
        title,
        client_id: clientId || null,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      // 2. Sauvegarder la note structurée complète
      await persistNoteToDb({
        commentaires,
        usurperList,
        xslLibrariesList,
        paramsList: finalParamsList,
        variablesList,
        ewxsladmList,
        rdoList,
      });

      if (status === 'termine' && activity.status !== 'termine') {
        triggerConfetti();
      }

      onClose();
    } catch (e) {
      console.error('Erreur enregistrement activité:', e);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        await onUploadAttachment(activity.id, files[i]);
      }
    } catch (err) {
      console.error('Erreur upload fichier:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const completedSet = new Set((activity.instances || []).map((i) => i.instance_name));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Détails de l'activité
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Édition complète, suivi d'instances et notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Supprimer définitivement cette activité ?')) {
                  onDeleteActivity(activity.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Supprimer l'activité"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Titre Principal de l'activité */}
        <div className="px-5 pt-4 pb-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Libellé / Titre de l'activité (ClickUp)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-base font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="CU-xxxx: Libellé de l'activité"
          />
        </div>

        {/* Navigation par Onglets */}
        <div className="px-5 flex border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto">
          {[
            { id: 'note', label: 'Notes', icon: FileText },
            { id: 'instances', label: 'Instances DB', icon: Layers },
            { id: 'general', label: 'Paramètres Généraux', icon: Shield },
            { id: 'attachments', label: 'Pièces Jointes & Captures', icon: Paperclip },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Corps du Modal selon l'onglet actif */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* ========================================================= */}
          {/* ONGLET 1 : NOTES                                          */}
          {/* ========================================================= */}
          {activeTab === 'note' && (
            <div className="space-y-4">
              {/* Ligne 1 : Usurper & Librairies XSL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Usurper */}
                <DynamicListField
                  label="Usurper"
                  icon={<UserCheck className="w-3.5 h-3.5 text-purple-500" />}
                  placeholder="Ex : jclerc."
                  items={usurperList}
                  onChange={setUsurperList}
                  helperText="Tapez un compte à usurper puis appuyez sur Entrée"
                />

                {/* Librairies XSL */}
                <DynamicListField
                  label="Librairies XSL"
                  icon={<FileCode className="w-3.5 h-3.5 text-indigo-500" />}
                  placeholder="Ex : STYLE.MERGE_PORTAIL_STANDARD."
                  items={xslLibrariesList}
                  onChange={setXslLibrariesList}
                  helperText="Tapez une feuille XSL puis appuyez sur Entrée"
                />
              </div>

              {/* Bloc PARAMS (Portail > Onglet > Cellule > Détails) */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <Code className="w-3.5 h-3.5" />
                    <span>PARAMS (Portail &gt; Onglet &gt; Cellule &gt; Détails)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSavingParams && (
                      <span className="text-[10px] text-slate-400 animate-pulse">
                        Enregistrement...
                      </span>
                    )}
                    {paramsList.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {paramsList.length} {paramsList.length > 1 ? 'lignes' : 'ligne'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Champs de saisie d'une nouvelle ligne PARAMS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Portail</label>
                    <input
                      type="text"
                      value={newParam.portail}
                      onChange={(e) => setNewParam({ ...newParam, portail: e.target.value })}
                      placeholder="Ex : PORTAL3S."
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Onglet</label>
                    <input
                      type="text"
                      value={newParam.onglet}
                      onChange={(e) => setNewParam({ ...newParam, onglet: e.target.value })}
                      placeholder="Ex : Dossier élèves."
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Cellule</label>
                    <input
                      type="text"
                      value={newParam.cellule}
                      onChange={(e) => setNewParam({ ...newParam, cellule: e.target.value })}
                      placeholder="Ex : Cell_Lorem_Ipsum."
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Détails en texte libre
                  </label>
                  <textarea
                    rows={3}
                    value={newParam.details}
                    onChange={(e) => setNewParam({ ...newParam, details: e.target.value })}
                    placeholder="Instructions détaillées, sélecteurs, comportement attendu..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* Bouton Ajouter sous le textarea */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddParam}
                    disabled={!hasNewParamInput || isSavingParams}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                {/* Liste des lignes PARAMS enregistrées en dessous du bouton Ajouter */}
                {paramsList.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                    {paramsList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
                      >
                        {editingParamIdx === idx ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                  Portail
                                </label>
                                <input
                                  type="text"
                                  value={editingParamData.portail}
                                  onChange={(e) =>
                                    setEditingParamData({ ...editingParamData, portail: e.target.value })
                                  }
                                  placeholder="Ex : PORTAL3S."
                                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-blue-500/60 text-slate-900 dark:text-slate-100 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                  Onglet
                                </label>
                                <input
                                  type="text"
                                  value={editingParamData.onglet}
                                  onChange={(e) =>
                                    setEditingParamData({ ...editingParamData, onglet: e.target.value })
                                  }
                                  placeholder="Ex : Dossier élèves."
                                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-blue-500/60 text-slate-900 dark:text-slate-100 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                  Cellule
                                </label>
                                <input
                                  type="text"
                                  value={editingParamData.cellule}
                                  onChange={(e) =>
                                    setEditingParamData({ ...editingParamData, cellule: e.target.value })
                                  }
                                  placeholder="Ex : Cell_Lorem_Ipsum."
                                  className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-blue-500/60 text-slate-900 dark:text-slate-100 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                Détails en texte libre
                              </label>
                              <textarea
                                rows={2}
                                value={editingParamData.details}
                                onChange={(e) =>
                                  setEditingParamData({ ...editingParamData, details: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-blue-500/60 text-slate-900 dark:text-slate-100 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingParamIdx(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditParam(idx)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Valider</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex-1 min-w-0 space-y-1.5 cursor-pointer"
                              onDoubleClick={() => handleStartEditParam(idx)}
                              title="Double-clic pour modifier"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                                {item.portail && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800/60">
                                    Portail : <span className="font-mono">{item.portail}</span>
                                  </span>
                                )}
                                {item.portail && (item.onglet || item.cellule) && (
                                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                {item.onglet && (
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
                                    Onglet : <span className="font-mono">{item.onglet}</span>
                                  </span>
                                )}
                                {item.onglet && item.cellule && (
                                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                {item.cellule && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/60 dark:border-purple-800/60">
                                    Cellule : <span className="font-mono">{item.cellule}</span>
                                  </span>
                                )}
                              </div>
                              {item.details && (
                                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                                  {item.details}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditParam(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                title="Modifier cette ligne"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteParam(idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                title="Supprimer cette ligne"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ligne 2 : Variables & Ewxsladm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Variables */}
                <DynamicListField
                  label="Variables"
                  icon={<Sliders className="w-3.5 h-3.5 text-amber-500" />}
                  placeholder="Ex : NOM_DE_LA_VARIABLE"
                  items={variablesList}
                  onChange={setVariablesList}
                  helperText="Tapez une variable puis appuyez sur Entrée"
                />

                {/* Ewxsladm */}
                <DynamicListField
                  label="Ewxsladm"
                  icon={<Terminal className="w-3.5 h-3.5 text-emerald-500" />}
                  placeholder="Ex : Eqnx.Monitor.Lorem.Ipsum."
                  items={ewxsladmList}
                  onChange={setEwxsladmList}
                  helperText="Tapez une commande admin puis appuyez sur Entrée"
                />
              </div>

              {/* RDO */}
              <DynamicListField
                label="RDO"
                icon={<Hash className="w-3.5 h-3.5 text-rose-500" />}
                placeholder="Ex : aaaammjj - initiales - Lorem ipsum"
                items={rdoList}
                onChange={setRdoList}
                helperText="Tapez une référence RDO puis appuyez sur Entrée"
              />

              {/* COMMENTAIRES (anciennement URLs & Liens utiles) */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>COMMENTAIRES</span>
                  </div>
                  {commentAutoSaveStatus === 'saving' && (
                    <span className="text-[11px] text-slate-400 animate-pulse">
                      Enregistrement auto...
                    </span>
                  )}
                  {commentAutoSaveStatus === 'saved' && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" />
                      Enregistré
                    </span>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={commentaires}
                  onChange={(e) => handleCommentairesChange(e.target.value)}
                  onBlur={() => {
                    if (commentDebounceRef.current) {
                      clearTimeout(commentDebounceRef.current);
                      commentDebounceRef.current = null;
                      persistNoteToDb({ commentaires })
                        .then(() => setCommentAutoSaveStatus('saved'))
                        .catch(() => setCommentAutoSaveStatus('idle'));
                    }
                  }}
                  placeholder="Saisissez vos commentaires, remarques ou liens utiles..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ONGLET 2 : SUIVI CUMULÉ DES INSTANCES                     */}
          {/* ========================================================= */}
          {activeTab === 'instances' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Suivi cumulé des environnements :</p>
                <p>
                  Chaque case cochée enregistre automatiquement la date et l'heure précise à laquelle l'activité a été déployée ou validée sur l'instance correspondante.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {instances.map((inst) => {
                  const isDone = completedSet.has(inst.code);
                  const instData = (activity.instances || []).find((i) => i.instance_name === inst.code);

                  return (
                    <div
                      key={inst.code}
                      onClick={() => onToggleInstance(activity.id, inst.code)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: inst.color }}
                          />
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {inst.name}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>

                      {isDone && instData && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          Validé le {new Date(instData.completed_at).toLocaleString('fr-FR')}
                        </p>
                      )}

                      {!isDone && (
                        <p className="text-[11px] text-slate-400">Non traité sur cette instance</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ONGLET 3 : PARAMÈTRES GÉNÉRAUX                            */}
          {/* ========================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Client associé
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Aucun client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Priorité
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ActivityPriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date d'échéance */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Date et heure d'échéance (Notification)
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ONGLET 4 : PIÈCES JOINTES & CAPTURES D'ÉCRAN              */}
          {/* ========================================================= */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Zone Drag & Drop */}
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40">
                <UploadCloud className="w-10 h-10 text-blue-500 mb-2" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isUploading ? 'Téléversement en cours...' : 'Glisser-déposer des captures ou fichiers ici'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supporte PNG, JPG, PDF, MD, etc. Stocké sur Supabase Storage.
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {/* Liste des pièces jointes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Fichiers attachés ({activity.attachments?.length || 0})
                </h4>

                {(!activity.attachments || activity.attachments.length === 0) && (
                  <p className="text-xs text-slate-400 py-3 text-center">Aucune pièce jointe.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(activity.attachments || []).map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3"
                    >
                      {att.file_type.startsWith('image/') && att.public_url ? (
                        <img
                          src={att.public_url}
                          alt={att.file_name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Paperclip className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {att.file_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(att.file_size / 1024).toFixed(1)} Ko
                        </p>
                        {att.public_url && (
                          <a
                            href={att.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>Ouvrir</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal avec Bouton Sauvegarder */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
