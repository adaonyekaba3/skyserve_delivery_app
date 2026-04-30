'use client';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-hairline'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label ? (
        <span className="text-sm font-medium text-text">{label}</span>
      ) : null}
    </label>
  );
}

export default Switch;
