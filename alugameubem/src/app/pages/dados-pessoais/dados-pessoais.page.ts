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
import { chevronBackOutline, personOutline } from 'ionicons/icons';
import { selecionarFotoPerfil } from '../../core/anuncio-fotos';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { FotoPerfilService } from '../../core/foto-perfil.service';
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
  private readonly fotos = inject(FotoPerfilService);
  private readonly fb = inject(FormBuilder);
  private nomeOriginal = '';
  private telefoneOriginal = '';
  private fotoSalva: string | null = null;
  private previewLocal: string | null = null;
  private previewRemota: string | null = null;
  private geracaoPreview = 0;

  readonly perfil = this.autenticacao.perfil;
  readonly preview = signal<string | null>(null);
  readonly arquivoNovo = signal<File | null>(null);
  readonly removerFoto = signal(false);
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
    addIcons({ chevronBackOutline, personOutline });
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

  ngOnDestroy(): void {
    this.revogarPreviewLocal();
    this.revogarPreviewRemota();
  }

  selecionarFoto(evento: Event): void {
    const entrada = evento.target;
    if (!(entrada instanceof HTMLInputElement) || this.carregando()) {
      return;
    }
    const arquivo = entrada.files?.[0];
    entrada.value = '';
    if (!arquivo) {
      return;
    }
    const selecao = selecionarFotoPerfil(arquivo);
    if (!selecao.aceita) {
      this.mensagemErro.set(selecao.mensagem);
      return;
    }
    this.revogarPreviewLocal();
    this.previewLocal = URL.createObjectURL(arquivo);
    this.arquivoNovo.set(arquivo);
    this.removerFoto.set(false);
    this.preview.set(this.previewLocal);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.aviso.set('');
    this.atualizarPodeSalvar();
  }

  retirarFoto(): void {
    if (this.carregando()) {
      return;
    }
    this.revogarPreviewLocal();
    this.revogarPreviewRemota();
    this.arquivoNovo.set(null);
    this.removerFoto.set(true);
    this.geracaoPreview += 1;
    this.preview.set(null);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.aviso.set('');
    this.atualizarPodeSalvar();
  }

  temFoto(): boolean {
    return this.preview() !== null || this.arquivoNovo() !== null || (!!this.fotoSalva && !this.removerFoto());
  }

  previewFalhou(evento: Event): void {
    const imagem = evento.target;
    if (!(imagem instanceof HTMLImageElement) || imagem.src !== this.preview() || this.preview() === this.previewLocal) {
      return;
    }
    this.preview.set(null);
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
    const arquivo = this.arquivoNovo();
    const alterarFoto = arquivo !== null || (this.removerFoto() && !!this.fotoSalva);
    const alterarTexto = nome !== this.nomeOriginal || telefone !== this.telefoneOriginal;
    let textoSalvo = false;
    try {
      let resultado: 'salvo' | 'salvo-sem-auth' = 'salvo';
      if (alterarTexto) {
        resultado = await this.autenticacao.atualizarDadosPessoais({ nome, telefone });
        this.nomeOriginal = nome;
        this.telefoneOriginal = telefone;
        textoSalvo = true;
      }
      if (alterarFoto) {
        await this.fotos.aplicar(arquivo);
        this.fotoSalva = this.autenticacao.perfil()?.fotoPerfil ?? null;
        this.arquivoNovo.set(null);
        this.removerFoto.set(false);
        this.revogarPreviewLocal();
        void this.carregarFotoSalva();
      }
      if (resultado === 'salvo-sem-auth') {
        this.aviso.set(
          'Seus dados foram salvos. Não foi possível atualizar o nome na conta de acesso.',
        );
      } else {
        this.mensagemSucesso.set('Alterações salvas.');
      }
    } catch (erro) {
      if (alterarFoto && textoSalvo) {
        this.mensagemErro.set('Não foi possível atualizar a foto. Os outros dados foram salvos.');
        this.restaurarFotoSeRemocaoFalhou(arquivo);
      } else if (alterarFoto) {
        this.mensagemErro.set(
          this.fotoSalva
            ? 'Não foi possível atualizar a foto. A foto anterior foi mantida.'
            : 'Não foi possível salvar a foto.',
        );
        this.restaurarFotoSeRemocaoFalhou(arquivo);
      } else {
        this.mensagemErro.set(this.autenticacao.traduzirErro(erro));
      }
    } finally {
      this.carregando.set(false);
      this.atualizarPodeSalvar();
    }
  }

  private preencher(): void {
    const perfil = this.autenticacao.perfil();
    this.nomeOriginal = perfil?.name ?? '';
    this.telefoneOriginal = perfil?.phone ?? '';
    this.fotoSalva = perfil?.fotoPerfil ?? null;
    this.arquivoNovo.set(null);
    this.removerFoto.set(false);
    this.revogarPreviewLocal();
    this.form.setValue({
      nome: this.nomeOriginal,
      telefone: this.telefoneOriginal,
    });
    void this.carregarFotoSalva();
    this.atualizarPodeSalvar();
  }

  private async carregarFotoSalva(): Promise<void> {
    const caminho = this.fotoSalva;
    const geracao = ++this.geracaoPreview;
    if (!caminho || this.arquivoNovo() || this.removerFoto()) {
      if (!this.previewLocal) {
        this.preview.set(null);
      }
      return;
    }
    try {
      const url = await this.fotos.abrir(caminho);
      if (geracao !== this.geracaoPreview || this.arquivoNovo() || this.removerFoto()) {
        URL.revokeObjectURL(url);
        return;
      }
      this.revogarPreviewRemota();
      this.previewRemota = url;
      this.preview.set(url);
    } catch {
      if (geracao === this.geracaoPreview && !this.previewLocal) {
        this.preview.set(null);
      }
    }
  }

  private restaurarFotoSeRemocaoFalhou(arquivo: File | null): void {
    if (arquivo || !this.fotoSalva) {
      return;
    }
    this.removerFoto.set(false);
    void this.carregarFotoSalva();
  }

  private houveAlteracao(): boolean {
    const nome = formatarNomeTitulo(this.form.controls.nome.value);
    const fotoNova = this.arquivoNovo() !== null;
    const fotoRemovida = this.removerFoto() && !!this.fotoSalva;
    return nome !== this.nomeOriginal || this.form.controls.telefone.value !== this.telefoneOriginal || fotoNova || fotoRemovida;
  }

  private revogarPreviewLocal(): void {
    if (!this.previewLocal) {
      return;
    }
    if (this.preview() === this.previewLocal) {
      this.preview.set(null);
    }
    URL.revokeObjectURL(this.previewLocal);
    this.previewLocal = null;
  }

  private revogarPreviewRemota(): void {
    if (this.previewRemota?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewRemota);
    }
    this.previewRemota = null;
  }

  private atualizarPodeSalvar(): void {
    this.podeSalvar.set(this.form.valid && this.houveAlteracao() && !this.carregando());
  }
}
