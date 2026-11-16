import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Check,
  FolderKanban,
  GraduationCap,
  Loader2,
  Plus,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  blockDurationMinutes,
  clearBlockFocus,
  getBlockStudy,
  getBlockWork,
  setBlockStudy,
  setBlockWork,
  type BlockWorkKind,
  type SpeedBlockLike,
  type SpeedPlan,
} from "@/lib/speedPlan";
import type { StudySubject, StudyTopic } from "@/hooks/useStudySubjects";

export interface FocusOwner {
  id: string;
  name: string;
  items: { id: string; title: string }[];
}

interface CreatedOwner {
  id: string;
  name: string;
}

interface CreatedItem {
  id: string;
  title: string;
}

interface Props {
  block: SpeedBlockLike;
  plan: SpeedPlan;
  onChange: (next: SpeedPlan) => void;
  /** Universidad */
  subjects: StudySubject[];
  subjectsLoading?: boolean;
  onCreateSubject: (name: string) => Promise<StudySubject | null>;
  onCreateTopic: (subjectId: string, title: string) => Promise<StudyTopic | null>;
  /** Emprendimiento */
  ventures: FocusOwner[];
  venturesLoading?: boolean;
  onCreateVenture: (name: string) => Promise<CreatedOwner | null>;
  onCreateVentureTask: (ventureId: string, title: string) => Promise<CreatedItem | null>;
  /** Proyectos */
  projects: FocusOwner[];
  projectsLoading?: boolean;
  onCreateProject: (name: string) => Promise<CreatedOwner | null>;
  onCreateProjectTask: (projectId: string, title: string) => Promise<CreatedItem | null>;
}

type FocusKind = "universidad" | BlockWorkKind;

const KIND_ORDER: FocusKind[] = ["universidad", "emprendimiento", "proyectos"];

const KIND_META: Record<FocusKind, {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  panel: string;
  hint: string;
  ownerLabel: string;
  itemLabel: string;
}> = {
  universidad: {
    label: "Universidad",
    icon: GraduationCap,
    iconClass: "text-sky-500",
    panel: "border-sky-300/60 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20",
    hint: "Elige la asignatura y el tema que estudiarás en este bloque.",
    ownerLabel: "Asignatura",
    itemLabel: "Tema",
  },
  emprendimiento: {
    label: "Emprendimiento",
    icon: Briefcase,
    iconClass: "text-purple-500",
    panel: "border-purple-300/60 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/20",
    hint: "Elige el emprendimiento y la tarea en la que avanzarás.",
    ownerLabel: "Emprendimiento",
    itemLabel: "Tarea",
  },
  proyectos: {
    label: "Proyectos",
    icon: FolderKanban,
    iconClass: "text-emerald-500",
    panel: "border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    hint: "Elige el proyecto y la tarea que completarás.",
    ownerLabel: "Proyecto",
    itemLabel: "Tarea",
  },
};

function withCurrent(
  options: { id: string; label: string }[],
  currentId: string | null | undefined,
  currentLabel: string | null | undefined,
): { id: string; label: string }[] {
  if (!currentId) return options;
  if (options.some(option => option.id === currentId)) return options;
  return [...options, { id: currentId, label: currentLabel || "…" }];
}

interface PickerRowProps {
  value: string;
  options: { id: string; label: string }[];
  placeholder: string;
  emptyLabel: string;
  onChange: (id: string, label?: string) => void;
  onCreate?: (name: string) => Promise<{ id: string; label: string } | null>;
  createPlaceholder?: string;
  createTitle?: string;
  disabled?: boolean;
}

/** Select compacto con opción de crear un elemento nuevo al vuelo. */
function PickerRow({
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
  onCreate,
  createPlaceholder,
  createTitle,
  disabled,
}: PickerRowProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!onCreate || !trimmed || busy) return;
    setBusy(true);
    try {
      const created = await onCreate(trimmed);
      if (!created) {
        toast.error(`No se pudo crear ${createTitle ?? "el elemento"}`);
        return;
      }
      setName("");
      setCreating(false);
      onChange(created.id, created.label);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Select value={value} onValueChange={next => onChange(next)} disabled={disabled}>
          <SelectTrigger className="h-6 flex-1 text-[10px]">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">{emptyLabel}</SelectItem>
            {options.map(option => (
              <SelectItem key={option.id} value={option.id} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onCreate && (
          <button
            type="button"
            onClick={() => setCreating(current => !current)}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
              creating && "border-primary/50 bg-primary/10 text-primary",
            )}
            title={`Crear ${createTitle ?? "nuevo"}`}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-1">
          <Input
            value={name}
            onChange={event => setName(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") void submit();
              if (event.key === "Escape") setCreating(false);
            }}
            placeholder={createPlaceholder ?? "Nuevo"}
            autoFocus
            className="h-6 flex-1 text-[10px]"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !name.trim()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-emerald-400/60 text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
            title="Guardar"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Selector de enfoque de un bloque: asignatura/tema (Universidad),
 * emprendimiento/tarea o proyecto/tarea. Se guarda dentro del plan del día.
 */
export function BlockFocusControl({
  block,
  plan,
  onChange,
  subjects,
  subjectsLoading = false,
  onCreateSubject,
  onCreateTopic,
  ventures,
  venturesLoading = false,
  onCreateVenture,
  onCreateVentureTask,
  projects,
  projectsLoading = false,
  onCreateProject,
  onCreateProjectTask,
}: Props) {
  const study = getBlockStudy(plan, block.id);
  const work = getBlockWork(plan, block.id);

  const derivedKind: FocusKind | null = study
    ? "universidad"
    : work?.kind ?? null;
  const [kind, setKind] = useState<FocusKind>(derivedKind ?? "universidad");

  useEffect(() => {
    if (derivedKind) setKind(derivedKind);
  }, [derivedKind]);

  const meta = KIND_META[kind];
  const KindIcon = meta.icon;

  const subject = study ? subjects.find(candidate => candidate.id === study.subjectId) ?? null : null;
  const venture = work?.kind === "emprendimiento"
    ? ventures.find(candidate => candidate.id === work.ownerId) ?? null
    : null;
  const project = work?.kind === "proyectos"
    ? projects.find(candidate => candidate.id === work.ownerId) ?? null
    : null;

  const ownerOptions = kind === "universidad"
    ? subjects.map(candidate => ({ id: candidate.id, label: candidate.name }))
    : kind === "emprendimiento"
      ? ventures.map(candidate => ({ id: candidate.id, label: candidate.name }))
      : projects.map(candidate => ({ id: candidate.id, label: candidate.name }));

  const itemOptions: { id: string; label: string }[] = kind === "universidad"
    ? (subject?.topics ?? []).map(topic => ({ id: topic.id, label: topic.title }))
    : ((kind === "emprendimiento" ? venture : project)?.items ?? []).map(item => ({ id: item.id, label: item.title }));

  const hasFocus = Boolean(study || work);

  const handleOwnerChange = (id: string, label?: string) => {
    if (id === "none") {
      if (kind === "universidad") onChange(setBlockStudy(plan, block.id, null));
      else onChange(setBlockWork(plan, block.id, null));
      return;
    }

    if (kind === "universidad") {
      const name = label ?? subjects.find(candidate => candidate.id === id)?.name ?? "";
      onChange(setBlockStudy(plan, block.id, {
        subjectId: id,
        subjectName: name,
        topicId: null,
        topicTitle: null,
      }));
      return;
    }

    const name = label
      ?? (kind === "emprendimiento" ? ventures : projects).find(candidate => candidate.id === id)?.name
      ?? "";
    onChange(setBlockWork(plan, block.id, {
      kind,
      ownerId: id,
      ownerName: name,
      itemId: null,
      itemTitle: null,
    }));
  };

  const handleItemChange = (id: string, label?: string) => {
    if (kind === "universidad") {
      if (!study) return;
      if (id === "none") {
        onChange(setBlockStudy(plan, block.id, {
          subjectId: study.subjectId,
          subjectName: study.subjectName,
          topicId: null,
          topicTitle: null,
        }));
        return;
      }
      const topic = subject?.topics.find(candidate => candidate.id === id);
      onChange(setBlockStudy(plan, block.id, {
        subjectId: study.subjectId,
        subjectName: study.subjectName,
        topicId: id,
        topicTitle: label ?? topic?.title ?? "",
      }));
      return;
    }

    if (!work) return;
    if (id === "none") {
      onChange(setBlockWork(plan, block.id, { ...work, itemId: null, itemTitle: null }));
      return;
    }
    const item = (kind === "emprendimiento" ? venture : project)?.items.find(candidate => candidate.id === id);
    onChange(setBlockWork(plan, block.id, {
      ...work,
      itemId: id,
      itemTitle: label ?? item?.title ?? "",
    }));
  };

  const createOwner = async (name: string): Promise<{ id: string; label: string } | null> => {
    if (kind === "universidad") {
      const created = await onCreateSubject(name);
      return created ? { id: created.id, label: created.name } : null;
    }
    const created = kind === "emprendimiento" ? await onCreateVenture(name) : await onCreateProject(name);
    return created ? { id: created.id, label: created.name } : null;
  };

  const createItem = async (name: string): Promise<{ id: string; label: string } | null> => {
    if (kind === "universidad") {
      if (!study) return null;
      const created = await onCreateTopic(study.subjectId, name);
      return created ? { id: created.id, label: created.title } : null;
    }
    if (!work) return null;
    const created = kind === "emprendimiento"
      ? await onCreateVentureTask(work.ownerId, name)
      : await onCreateProjectTask(work.ownerId, name);
    return created ? { id: created.id, label: created.title } : null;
  };

  const panelClass = meta.panel;
  const loading = kind === "universidad" ? subjectsLoading : kind === "emprendimiento" ? venturesLoading : projectsLoading;

  let body: ReactNode = null;
  if (kind === "universidad") {
    body = (
      <>
        <PickerRow
          value={study?.subjectId ?? "none"}
          options={withCurrent(ownerOptions, study?.subjectId, study?.subjectName)}
          placeholder="Asignatura"
          emptyLabel="Sin asignatura"
          onChange={handleOwnerChange}
          onCreate={createOwner}
          createPlaceholder="Nueva asignatura"
          createTitle="asignatura"
          disabled={loading && ownerOptions.length === 0}
        />
        {study && (
          <PickerRow
            value={study.topicId ?? "none"}
            options={withCurrent(itemOptions, study.topicId, study.topicTitle)}
            placeholder="Tema"
            emptyLabel="Sin tema"
            onChange={handleItemChange}
            onCreate={createItem}
            createPlaceholder="Nuevo tema"
            createTitle="tema"
          />
        )}
      </>
    );
  } else {
    const owner = kind === "emprendimiento" ? venture : project;
    const ownerId = work?.ownerId;
    body = (
      <>
        <PickerRow
          value={work && work.kind === kind ? work.ownerId : "none"}
          options={withCurrent(ownerOptions, work?.kind === kind ? ownerId : null, work?.ownerName)}
          placeholder={meta.ownerLabel}
          emptyLabel={`Sin ${meta.ownerLabel.toLowerCase()}`}
          onChange={handleOwnerChange}
          onCreate={createOwner}
          createPlaceholder={`Nuevo ${meta.ownerLabel.toLowerCase()}`}
          createTitle={meta.ownerLabel.toLowerCase()}
          disabled={loading && ownerOptions.length === 0}
        />
        {work && work.kind === kind && (
          <PickerRow
            value={work.itemId ?? "none"}
            options={withCurrent(itemOptions, work.itemId, work.itemTitle)}
            placeholder={meta.itemLabel}
            emptyLabel={`Sin ${meta.itemLabel.toLowerCase()}`}
            onChange={handleItemChange}
            onCreate={createItem}
            createPlaceholder={`Nueva ${meta.itemLabel.toLowerCase()}`}
            createTitle={meta.itemLabel.toLowerCase()}
            disabled={!owner}
          />
        )}
      </>
    );
  }

  return (
    <div className={cn("mt-1.5 space-y-1 rounded-xl border border-dashed p-1.5", panelClass)}>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Target className="h-3 w-3" /> Enfoque
        </span>
        <Badge variant="outline" className="h-4 shrink-0 px-1 text-[8px] tabular-nums">
          {blockDurationMinutes(block)}′
        </Badge>
        {hasFocus && (
          <button
            type="button"
            onClick={() => onChange(clearBlockFocus(plan, block.id))}
            className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive/10"
            title="Quitar el enfoque del bloque"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>

      <div className="flex gap-0.5 rounded-lg bg-muted p-0.5" role="tablist" aria-label="Tipo de enfoque">
        {KIND_ORDER.map(option => {
          const optionMeta = KIND_META[option];
          const OptionIcon = optionMeta.icon;
          const active = kind === option;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKind(option)}
              className={cn(
                "flex flex-1 items-center justify-center gap-0.5 rounded-md px-0.5 py-0.5 text-[8px] font-semibold transition-all",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              title={optionMeta.label}
            >
              <OptionIcon className={cn("h-2.5 w-2.5", active ? optionMeta.iconClass : "")} />
              <span className="truncate">{optionMeta.label}</span>
            </button>
          );
        })}
      </div>

      <div key={kind} className="space-y-1">
        {body}
      </div>

      <p className="flex items-center gap-1 text-[8px] leading-tight text-muted-foreground">
        <KindIcon className={cn("h-2.5 w-2.5 shrink-0", meta.iconClass)} />
        {hasFocus ? "Se guarda con el plan del día." : meta.hint}
      </p>
    </div>
  );
}
