import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Igual a telefoneMascarado nas Firestore Rules: "(00) 00000-000" ou "(00) 00000-0000". */
const TELEFONE_MASCARADO = /^\([0-9]{2}\) [0-9]{5}-[0-9]{3,4}$/;

export function mascararTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  const ddd = digits.slice(0, 2);
  const meio = digits.slice(2, 7);
  const fim = digits.slice(7, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 7) {
    return `(${ddd}) ${meio}`;
  }
  return `(${ddd}) ${meio}-${fim}`;
}

export function telefoneMascaradoValido(valor: string): boolean {
  return TELEFONE_MASCARADO.test(valor);
}

export function telefoneMascaradoValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) {
    return null;
  }
  return telefoneMascaradoValido(valor) ? null : { telefoneInvalido: true };
}
