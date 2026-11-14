import type { ReactNode } from "react";
import { ChevronDown, Copy, Plus, Trash2, ChevronUp } from "lucide-react";
import { removeAt, setAt } from "@/lib/hybridListOps";
import type { HybridGuideData } from "@/types/hybridGuide";

export interface HybridStageSectionProps {
  guide: HybridGuideData;
  onChange: (guide: HybridGuideData) => void;
}

export const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}

export function TextField({ label, value, onChange, placeholder, type = "text", hint }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}

export function TextAreaField({ label, value, onChange, rows = 3, hint }: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y`}
      />
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

interface EditorSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function EditorSection({ title, description, defaultOpen = false, children }: EditorSectionProps) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}

interface AddButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function AddButton({ label, onClick, disabled }: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

const iconButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30";

interface ItemActionsProps {
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
  onDuplicate?: () => void;
  duplicateDisabled?: boolean;
  onRemove: () => void;
  removeDisabled?: boolean;
}

export function ItemActions({
  isFirst,
  isLast,
  onMove,
  onDuplicate,
  duplicateDisabled,
  onRemove,
  removeDisabled,
}: ItemActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Mover para cima" title="Mover para cima" disabled={isFirst} onClick={() => onMove(-1)} className={iconButtonClass}>
        <ChevronUp className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Mover para baixo" title="Mover para baixo" disabled={isLast} onClick={() => onMove(1)} className={iconButtonClass}>
        <ChevronDown className="h-4 w-4" />
      </button>
      {onDuplicate && (
        <button type="button" aria-label="Duplicar" title="Duplicar" disabled={duplicateDisabled} onClick={onDuplicate} className={iconButtonClass}>
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" aria-label="Excluir" title="Excluir" disabled={removeDisabled} onClick={onRemove} className={`${iconButtonClass} hover:text-red-600`}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface StringListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  min?: number;
  max?: number;
  addLabel: string;
}

export function StringListEditor({ label, items, onChange, min = 0, max = 10, addLabel }: StringListEditorProps) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => onChange(setAt(items, i, e.target.value))}
            className={inputClass}
          />
          <button
            type="button"
            aria-label="Remover item"
            title="Remover item"
            disabled={items.length <= min}
            onClick={() => onChange(removeAt(items, i))}
            className={`${iconButtonClass} hover:text-red-600`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <AddButton label={addLabel} disabled={items.length >= max} onClick={() => onChange([...items, ""])} />
    </div>
  );
}
