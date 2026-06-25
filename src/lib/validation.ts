export type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  password?: string;
};

export type PasswordRules = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const NAME_RE = /^[\p{L}\s'.-]{3,}$/u;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/** Normaliza teléfono SV a 8 dígitos locales (sin prefijo 503). */
export function normalizeSvPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) return digits;
  if (digits.length === 11 && digits.startsWith("503")) return digits.slice(3);
  return null;
}

export function validateFullName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Nombre completo requerido";
  if (!NAME_RE.test(v)) return "Usa solo letras (mín. 3 caracteres)";
  const words = v.split(/\s+/).filter(Boolean);
  if (words.length < 2) return "Ingresa nombre y apellido";
  if (words.some((w) => w.length < 2)) return "Cada nombre debe tener al menos 2 letras";
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Teléfono requerido";
  const local = normalizeSvPhone(v);
  if (!local) return "Teléfono inválido. Usa 8 dígitos o +503 seguido del número";
  if (!/^[267]\d{7}$/.test(local)) return "Número de El Salvador inválido (debe iniciar con 2, 6 o 7)";
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Email requerido";
  if (!EMAIL_RE.test(v)) return "Email inválido";
  return undefined;
}

export function validateAddress(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Dirección de entrega requerida";
  if (v.length < 12) return "La dirección es muy corta (mín. 12 caracteres)";
  if (!/\p{L}/u.test(v)) return "Incluye el nombre de calle o colonia";
  if (!/\d/.test(v)) return "Incluye número de casa, lote o referencia numérica";
  return undefined;
}

export function getPasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: SPECIAL_RE.test(password),
  };
}

export function validatePassword(password: string, required: boolean): string | undefined {
  if (!required) return undefined;
  const rules = getPasswordRules(password);
  if (!rules.minLength) return "Mínimo 8 caracteres";
  if (!rules.uppercase) return "Debe incluir al menos una mayúscula";
  if (!rules.lowercase) return "Debe incluir al menos una minúscula";
  if (!rules.number) return "Debe incluir al menos un número";
  if (!rules.special) return "Debe incluir al menos un signo (!@#$%…)";
  return undefined;
}

export function validateCheckoutFields(
  fields: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    password: string;
    createAccount: boolean;
  }
): FieldErrors {
  const errors: FieldErrors = {};
  const fullName = validateFullName(fields.fullName);
  const phone = validatePhone(fields.phone);
  const email = validateEmail(fields.email);
  const address = validateAddress(fields.address);
  const password = validatePassword(fields.password, fields.createAccount);

  if (fullName) errors.fullName = fullName;
  if (phone) errors.phone = phone;
  if (email) errors.email = email;
  if (address) errors.address = address;
  if (password) errors.password = password;

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}