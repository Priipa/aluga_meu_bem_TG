import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { formatarNomeTitulo } from '../../core/nome';
import { mascararTelefone, telefoneMascaradoValidator } from '../../core/telefone';

@Component({
  selector: 'app-dados-pessoais',
  templateUrl: './dados-pessoais.page.html',
  styleUrls: ['./dados-pessoais.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    RouterLink,
    ReactiveFormsModule,
  ],
})
export class DadosPessoaisPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly fb = inject(FormBuilder);
  private nomeOriginal = '';
  private telefoneOriginal = '';

  readonly perfil = this.autenticacao.perfil;
  readonly carregando = signal(false);
  readonly podeSalvar = signal(false);
  readonly mensagemErro = signal('');
  readonly mensagemSucesso = signal('');
  readonly aviso = signal('');

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    telefone: ['', [Validators.required, telefoneMascaradoValidator]],
  });

  constructor() {
    addIcons({ chevronBackOutline });
    this.preencher();
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.mensagemSucesso.set('');
      this.aviso.set('');
      this.atualizarPodeSalvar();
    });
  }

  ionViewWillEnter(): void {
    this.preencher();
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.aviso.set('');
  }

  formatarNome(): void {
    this.form.controls.nome.setValue(formatarNomeTitulo(this.form.controls.nome.value));
  }

  mascararTelefone(evento: Event): void {
    const entrada = evento.target;
    if (!(entrada instanceof HTMLInputElement)) {
      return;
    }
    this.form.controls.telefone.setValue(mascararTelefone(entrada.value));
  }

  textoErro(campo: 'nome' | 'telefone'): string {
    const erros = this.form.controls[campo].errors;
    if (!erros) {
      return '';
    }
    if (erros['required']) {
      return 'Campo obrigatório.';
    }
    if (erros['minlength']) {
      return 'Informe seu nome completo.';
    }
    if (erros['maxlength']) {
      return 'Informe um nome com no máximo 80 caracteres.';
    }
    if (erros['telefoneInvalido']) {
      return 'Informe um telefone válido.';
    }
    return 'Campo inválido.';
  }

  exibirErro(campo: 'nome' | 'telefone'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  async salvar(): Promise<void> {
    if (this.carregando()) {
      return;
    }
    this.formatarNome();
    this.atualizarPodeSalvar();
    if (!this.podeSalvar()) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.aviso.set('');
    const nome = formatarNomeTitulo(this.form.controls.nome.value);
    const telefone = this.form.controls.telefone.value;
    try {
      const resultado = await this.autenticacao.atualizarDadosPessoais({ nome, telefone });
      this.nomeOriginal = nome;
      this.telefoneOriginal = telefone;
      if (resultado === 'salvo-sem-auth') {
        this.aviso.set(
          'Seus dados foram salvos. Não foi possível atualizar o nome na conta de acesso.',
        );
      } else {
        this.mensagemSucesso.set('Alterações salvas.');
      }
    } catch (erro) {
      this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.carregando.set(false);
      this.atualizarPodeSalvar();
    }
  }

  private preencher(): void {
    const perfil = this.autenticacao.perfil();
    this.nomeOriginal = perfil?.name ?? '';
    this.telefoneOriginal = perfil?.phone ?? '';
    this.form.setValue({
      nome: this.nomeOriginal,
      telefone: this.telefoneOriginal,
    });
    this.atualizarPodeSalvar();
  }

  private houveAlteracao(): boolean {
    const nome = formatarNomeTitulo(this.form.controls.nome.value);
    return nome !== this.nomeOriginal || this.form.controls.telefone.value !== this.telefoneOriginal;
  }

  private atualizarPodeSalvar(): void {
    this.podeSalvar.set(this.form.valid && this.houveAlteracao() && !this.carregando());
  }
}
