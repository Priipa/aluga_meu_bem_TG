import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';

type CampoCadastro = 'name' | 'email' | 'password' | 'confirmPassword' | 'cpf' | 'phone';

const EMAIL_REGEX = /^[a-z0-9._%+\-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/;

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class CadastroPage {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly carregando = signal(false);
  readonly mensagemErro = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, emailValidoValidator]],
    password: ['', [Validators.required, senhaForteValidator]],
    confirmPassword: ['', [Validators.required, confirmarSenhaValidator]],
    cpf: ['', [Validators.required, cpfValidoValidator]],
    phone: ['', [Validators.required, Validators.minLength(14)]],
  });

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, shieldCheckmarkOutline });
  }

  formatarNome(): void {
    const formatado = formatarNomeTitulo(this.form.controls.name.value);
    this.form.controls.name.setValue(formatado);
  }

  formatarEmail(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.toLowerCase();
    this.form.controls.email.setValue(valor);
  }

  atualizarConfirmacaoSenha(): void {
    this.form.controls.confirmPassword.updateValueAndValidity();
  }

  maskCpf(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    let value = p1;
    if (p2) value = `${p1}.${p2}`;
    if (p3) value = `${p1}.${p2}.${p3}`;
    if (p4) value = `${p1}.${p2}.${p3}-${p4}`;
    this.form.controls.cpf.setValue(value);
  }

  maskPhone(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    const ddd = digits.slice(0, 2);
    const mid = digits.slice(2, 7);
    const end = digits.slice(7, 11);
    let value = digits;
    if (digits.length > 2) value = `(${ddd}) ${mid}`;
    if (digits.length > 7) value = `(${ddd}) ${mid}-${end}`;
    this.form.controls.phone.setValue(value);
  }

  exibirErro(campo: CampoCadastro): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  textoErro(campo: CampoCadastro): string {
    const erros = this.form.controls[campo].errors;
    if (!erros) {
      return '';
    }
    if (erros['required']) {
      return 'Campo obrigatório.';
    }
    if (erros['minlength']) {
      if (campo === 'name') {
        return 'Informe seu nome completo.';
      }
      if (campo === 'phone') {
        return 'Informe um telefone válido.';
      }
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    if (erros['emailInvalido']) {
      return 'Informe um e-mail válido, como email@exemplo.com.';
    }
    if (erros['senhaSemMaiuscula']) {
      return 'A senha deve conter pelo menos uma letra maiúscula.';
    }
    if (erros['senhaSemNumero']) {
      return 'A senha deve conter pelo menos um número.';
    }
    if (erros['senhasDiferentes']) {
      return 'As senhas não coincidem.';
    }
    if (erros['cpfInvalido']) {
      return 'Informe um CPF válido.';
    }
    return 'Campo inválido.';
  }

  async submit(): Promise<void> {
    this.formatarNome();
    this.form.controls.email.setValue(this.form.controls.email.value.trim().toLowerCase());
    this.form.controls.confirmPassword.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Corrija os campos destacados para criar sua conta.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    try {
      const { name, email, password, cpf, phone } = this.form.getRawValue();
      await this.autenticacao.criarConta({
        nome: formatarNomeTitulo(name),
        email: email.trim().toLowerCase(),
        senha: password,
        cpf,
        telefone: phone,
      });
      await this.router.navigateByUrl('/tabs/home');
    } catch (erro) {
      this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
}

function formatarNomeTitulo(valor: string): string {
  return valor
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s'-])(\p{L})/gu, (_match, separador: string, letra: string) => {
      return separador + letra.toLocaleUpperCase('pt-BR');
    });
}

function emailValidoValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim().toLowerCase();
  if (!valor) {
    return null;
  }
  return EMAIL_REGEX.test(valor) ? null : { emailInvalido: true };
}

function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) {
    return null;
  }
  if (valor.length < 6) {
    return { minlength: { requiredLength: 6, actualLength: valor.length } };
  }
  if (!/[A-ZÀ-Ý]/.test(valor)) {
    return { senhaSemMaiuscula: true };
  }
  if (!/\d/.test(valor)) {
    return { senhaSemNumero: true };
  }
  return null;
}

function confirmarSenhaValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.parent?.get('password')?.value;
  const confirmacao = String(control.value ?? '');
  if (!confirmacao) {
    return null;
  }
  return senha === confirmacao ? null : { senhasDiferentes: true };
}

function cpfValidoValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  if (!valor) {
    return null;
  }
  return cpfEhValido(valor) ? null : { cpfInvalido: true };
}

function cpfEhValido(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  const calcularDigito = (tamanho: number): number => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(digitos[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(9) === Number(digitos[9]) && calcularDigito(10) === Number(digitos[10]);
}
