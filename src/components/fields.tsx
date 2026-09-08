import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const labelId = useId();
  const hintId = useId();
  const control =
    isValidElement(children) &&
    typeof children.type === 'string' &&
    ['input', 'textarea', 'select'].includes(children.type)
      ? cloneElement(
          children as ReactElement<{ 'aria-labelledby'?: string; 'aria-describedby'?: string }>,
          {
            'aria-labelledby': labelId,
            'aria-describedby': hint ? hintId : undefined,
          },
        )
      : children;
  return (
    <div className="field">
      <span className="field-label" id={labelId}>
        {label}
      </span>
      {control}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  maxLength,
  required = false,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'url' | 'datetime-local' | 'email' | 'password';
  maxLength?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea
          aria-label={label}
          aria-description={hint}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          rows={4}
        />
      ) : (
        <input
          type={type}
          aria-label={label}
          aria-description={hint}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          step={type === 'datetime-local' ? '0.001' : undefined}
        />
      )}
    </Field>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 2147483647,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        required
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      />
    </Field>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
export function Section({
  title,
  children,
  description,
}: {
  title: string;
  children: ReactNode;
  description?: string;
}) {
  const id = useId();
  return (
    <section className="panel form-section" aria-labelledby={id}>
      <div className="section-title">
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
}
