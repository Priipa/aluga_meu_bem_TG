import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { chevronBackOutline, eyeOffOutline, eyeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { CondominioService } from '../../core/condominio.service';
import { CondominioOpcao } from '../../core/models';
import { RascunhoCadastroService } from '../../core/rascunho-cadastro.service';
import { VERSAO_TERMOS_GERAIS } from '../../core/termos';

type CampoEtapa1 = 'name' | 'email' | 'password' | 'confirmPassword' | 'cpf' | 'phone';
type CampoEtapa2 = 'condominioId' | 'bloco' | 'apartamento' | 'aceitaTermos';
type CampoCadastro = CampoEtapa1 | CampoEtapa2;

const CAMPOS_ETAPA_1: CampoEtapa1[] = [
  'name',
  'email',
  'password',
  'confirmPassword',
  'cpf',
  'phone',
];

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
export class CadastroPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly condominiosApi = inject(CondominioService);
  private readonly rascunhoCadastro = inject(RascunhoCadastroService);
  private readonly router = inject(Router);

  readonly versaoTermos = VERSAO_TERMOS_GERAIS;
  readonly etapa = signal<1 | 2>(1);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly carregando = signal(false);
  readonly carregandoCondominios = signal(false);
  readonly mensagemErro = signal('');
  readonly condominios = signal<CondominioOpcao[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, emailValidoValidator]],
    password: ['', [Validators.required, senhaForteValidator]],
    confirmPassword: ['', [Validators.required, confirmarSenhaValidator]],
    cpf: ['', [Validators.required, cpfValidoValidator]],
    phone: ['', [Validators.required, Validators.minLength(14)]],
    condominioId: ['', [Validators.required]],
    bloco: ['', [textoUnidadeValidator(40)]],
    apartamento: ['', [textoUnidadeValidator(20)]],
    aceitaTermos: [false, [Validators.requiredTrue]],
  });

  constructor() {
    addIcons({ chevronBackOutline, eyeOutline, eyeOffOutline, shieldCheckmarkOutline });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.limparAvisoCamposSeCorrigido();
    });
  }

  ngOnInit(): void {
    const rascunho = this.rascunhoCadastro.ler();
    if (!rascunho) {
      return;
    }
    this.condominios.set(rascunho.condominios);
    this.form.patchValue(rascunho.valores);
    this.etapa.set(rascunho.etapa);
  }

  guardarRascunho(): void {
    this.rascunhoCadastro.salvar({
      etapa: this.etapa(),
      valores: { ...this.form.getRawValue() },
      condominios: [...this.condominios()],
    });
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

  formatarUnidade(campo: 'bloco' | 'apartamento'): void {
    const formatado = normalizarTextoCurto(this.form.controls[campo].value);
    this.form.controls[campo].setValue(formatado);
  }

  rotuloCondominio(condominio: CondominioOpcao): string {
    const local = [condominio.cidade, condominio.bairro].filter(Boolean).join(' — ');
    return local ? `${condominio.nome} — ${local}` : condominio.nome;
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
    if (erros['required'] || erros['requiredTrue']) {
      if (campo === 'aceitaTermos') {
        return 'É necessário aceitar os Termos de Uso.';
      }
      if (campo === 'condominioId') {
        return 'Selecione um condomínio.';
      }
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
    if (erros['maxlength']) {
      return campo === 'bloco'
        ? 'Informe um bloco ou torre mais curto.'
        : 'Informe um apartamento mais curto.';
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

  async onSubmit(): Promise<void> {
    if (this.etapa() === 1) {
      await this.avancar();
      return;
    }
    await this.criarConta();
  }

  async avancar(): Promise<void> {
    this.formatarNome();
    this.form.controls.email.setValue(this.form.controls.email.value.trim().toLowerCase());
    this.form.controls.confirmPassword.updateValueAndValidity();

    const etapa1Invalida = CAMPOS_ETAPA_1.some((campo) => this.form.controls[campo].invalid);
    if (etapa1Invalida) {
      for (const campo of CAMPOS_ETAPA_1) {
        this.form.controls[campo].markAsTouched();
      }
      this.mensagemErro.set('Corrija os campos destacados para continuar.');
      return;
    }

    this.mensagemErro.set('');
    this.etapa.set(2);
    await this.carregarCondominios();
  }

  voltar(): void {
    this.mensagemErro.set('');
    this.etapa.set(1);
  }

  private limparAvisoCamposSeCorrigido(): void {
    const aviso = this.mensagemErro();
    if (aviso === 'Corrija os campos destacados para continuar.') {
      const etapa1Valida = CAMPOS_ETAPA_1.every((campo) => this.form.controls[campo].valid);
      if (etapa1Valida) {
        this.mensagemErro.set('');
      }
      return;
    }
    if (aviso === 'Corrija os campos destacados para criar sua conta.' && this.form.valid) {
      this.mensagemErro.set('');
    }
  }

  async criarConta(): Promise<void> {
    this.formatarNome();
    this.form.controls.email.setValue(this.form.controls.email.value.trim().toLowerCase());
    this.formatarUnidade('bloco');
    this.formatarUnidade('apartamento');
    this.form.controls.confirmPassword.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Corrija os campos destacados para criar sua conta.');
      return;
    }

    if (!this.condominios().some((item) => item.id === this.form.controls.condominioId.value)) {
      this.form.controls.condominioId.markAsTouched();
      this.mensagemErro.set('Selecione um condomínio da lista.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');

    try {
      const dados = this.form.getRawValue();
      await this.autenticacao.criarConta({
        nome: formatarNomeTitulo(dados.name),
        email: dados.email.trim().toLowerCase(),
        senha: dados.password,
        cpf: dados.cpf,
        telefone: dados.phone,
        condominioId: dados.condominioId,
        bloco: normalizarTextoCurto(dados.bloco),
        apartamento: normalizarTextoCurto(dados.apartamento),
      });
      this.rascunhoCadastro.limpar();
      await this.router.navigateByUrl('/tabs/home');
    } catch (erro) {
      this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }

  private async carregarCondominios(): Promise<void> {
    this.carregandoCondominios.set(true);
    try {
      const lista = await this.condominiosApi.listarAtivos();
      this.condominios.set(lista);
      if (lista.length === 0) {
        this.mensagemErro.set('Nenhum condomínio disponível no momento.');
      }
    } catch (erro) {
      this.condominios.set([]);
      this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.carregandoCondominios.set(false);
    }
  }
}

function normalizarTextoCurto(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

function textoUnidadeValidator(maximo: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = normalizarTextoCurto(String(control.value ?? ''));
    if (!valor) {
      return { required: true };
    }
    if (valor.length > maximo) {
      return { maxlength: { requiredLength: maximo, actualLength: valor.length } };
    }
    return null;
  };
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
