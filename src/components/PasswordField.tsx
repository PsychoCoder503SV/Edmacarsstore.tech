"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
};

export function PasswordField({
  value,
  onChange,
  placeholder = "Contraseña",
  hasError = false,
  autoComplete,
  disabled,
  id,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field-wrap">
      <input
        id={id}
        className={`checkout-input pr-11${hasError ? " checkout-input-error" : ""}`}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={hasError}
      />
      <button
        type="button"
        className="password-field-toggle"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1M7.2 7.2C5.4 8.4 3.9 10.2 2 12c0 0 3.5 7 10 7 1.8 0 3.4-.5 4.8-1.2M14.1 5.2C13.4 5.1 12.7 5 12 5 5.5 5 2 12 2 12c.7 1.4 1.7 2.7 2.9 3.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}