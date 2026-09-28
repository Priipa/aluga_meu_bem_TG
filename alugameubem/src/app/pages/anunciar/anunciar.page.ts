import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBack, close } from 'ionicons/icons';
import { selecionarFotos } from '../../core/anuncio-fotos';
import { AnuncioService } from '../../core/anuncio.service';
import { LIMITE_TEXTO, LIMITE_TITULO } from '../../core/anuncio-documento';
import { CATEGORIAS, categoriaValida } from '../../core/categorias';

@Component({
  selector: 'app-anunciar',
  templateUrl: './anunciar.page.html',
  styleUrls: ['./anunciar.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    RouterLink,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule,
  ],
})
export class AnunciarPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly anuncios = inject(AnuncioService);
  private readonly pedidoVisto = signal(this.anuncios.formularioSolicitado());

  readonly categorias = CATEGORIAS;
  readonly publicado = signal(false);
  readonly carregando = signal(false);
  readonly mensagemErro = signal('');
  readonly fotos = signal<FotoSelecionada[]>([]);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', textoLimite(LIMITE_TITULO, true)],
    categoria: ['Casa', [Validators.required, categoriaDaLista]],
    valorDiaria: [30, valorDiariaValido],
    descricao: ['', textoLimite(LIMITE_TEXTO, true)],
    porQueAlugar: ['', textoLimite(LIMITE_TEXTO, true)],
    acompanha: ['', textoLimite(LIMITE_TEXTO, false)],
    condicoes: ['', textoLimite(LIMITE_TEXTO, false)],
  });

  constructor() {
    addIcons({ chevronBack, close });
    effect(() => {
      const pedido = this.anuncios.formularioSolicitado();
      if (pedido === this.pedidoVisto()) {
        return;
      }
      this.pedidoVisto.set(pedido);
      this.exibirFormulario();
    });
  }

  ngOnDestroy(): void {
    this.limparFotos();
  }

  ionViewWillEnter(): void {
    this.exibirFormulario();
  }

  aoSelecionarFotos(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const arquivos = Array.from(entrada.files ?? []);
    entrada.value = '';
    if (!arquivos.length || this.carregando()) {
      return;
    }
    const resultado = selecionarFotos(this.fotos().length, arquivos);
    this.mensagemErro.set(resultado.mensagem);
    if (!resultado.aceitas.length) {
      return;
    }
    this.fotos.update((atuais) => [
      ...atuais,
      ...resultado.aceitas.map((arquivo) => ({
        arquivo,
        preview: URL.createObjectURL(arquivo),
      })),
    ]);
  }

  removerFoto(preview: string): void {
    if (this.carregando()) {
      return;
    }
    const foto = this.fotos().find((item) => item.preview === preview);
    if (!foto) {
      return;
    }
    URL.revokeObjectURL(foto.preview);
    this.fotos.update((atuais) => atuais.filter((item) => item.preview !== preview));
  }

  private limparFotos(): void {
    for (const foto of this.fotos()) {
      URL.revokeObjectURL(foto.preview);
    }
    this.fotos.set([]);
  }

  private exibirFormulario(): void {
    if (!this.publicado()) {
      return;
    }
    this.publicado.set(false);
    this.mensagemErro.set('');
  }

  async publicar(): Promise<void> {
    if (this.carregando()) {
      return;
    }
    this.mensagemErro.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemErro.set('Revise os campos obrigatórios antes de publicar.');
      return;
    }

    const valor = this.form.getRawValue();
    const fotos = this.fotos();
    if (!fotos.length) {
      this.mensagemErro.set('Adicione pelo menos uma foto.');
      return;
    }
    this.carregando.set(true);
    try {
      await this.anuncios.publicar({
        titulo: valor.titulo,
        descricao: valor.descricao,
        categoria: valor.categoria,
        valorDiaria: Number(valor.valorDiaria),
        porQueAlugar: valor.porQueAlugar,
        acompanha: valor.acompanha,
        condicoes: valor.condicoes,
      }, fotos.map((foto) => foto.arquivo));
      this.limparFotos();
      this.form.reset({
        titulo: '',
        categoria: 'Casa',
        valorDiaria: 30,
        descricao: '',
        porQueAlugar: '',
        acompanha: '',
        condicoes: '',
      });
      this.publicado.set(true);
    } catch (erro) {
      this.mensagemErro.set(mensagemDoErro(erro));
    } finally {
      this.carregando.set(false);
    }
  }
}

function textoLimite(maximo: number, obrigatorio: boolean) {
  return (controle: AbstractControl): ValidationErrors | null => {
    const texto = String(controle.value ?? '').trim();
    if (!texto) {
      return obrigatorio ? { required: true } : null;
    }
    return texto.length > maximo ? { maxlength: true } : null;
  };
}

function categoriaDaLista(controle: AbstractControl): ValidationErrors | null {
  return categoriaValida(String(controle.value ?? '')) ? null : { categoria: true };
}

function valorDiariaValido(controle: AbstractControl): ValidationErrors | null {
  const valor = Number(controle.value);
  return Number.isFinite(valor) && valor > 0 ? null : { min: true };
}

interface FotoSelecionada {
  arquivo: File;
  preview: string;
}

function mensagemDoErro(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String((erro as { code: string }).code) : '';
  if (codigo === 'permission-denied') {
    return 'Não foi possível publicar o item.';
  }
  if (erro instanceof Error && erro.message && !codigo) {
    return erro.message;
  }
  return 'Não foi possível publicar o item. Tente novamente.';
}
