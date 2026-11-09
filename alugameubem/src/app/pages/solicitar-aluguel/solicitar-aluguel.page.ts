import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AnuncioService } from '../../core/anuncio.service';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { diasDoPeriodo, hojeIso } from '../../core/locacao';
import { LocacaoService } from '../../core/locacao.service';
import { Anuncio } from '../../core/models';

@Component({
  selector: 'app-solicitar-aluguel',
  templateUrl: './solicitar-aluguel.page.html',
  styleUrls: ['./solicitar-aluguel.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
    FormsModule,
    CurrencyPipe,
  ],
})
export class SolicitarAluguelPage {
  private readonly anuncios = inject(AnuncioService);
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly locacoes = inject(LocacaoService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly hoje = hojeIso();
  readonly anuncio = signal<Anuncio | null>(null);
  readonly estado = signal<'carregando' | 'ok' | 'erro'>('carregando');
  readonly aviso = signal('');
  readonly enviando = signal(false);
  readonly inicioIso = signal(this.hoje);
  readonly fimIso = signal(somarDias(this.hoje, 2));
  readonly mensagem = signal('');

  readonly dias = computed(() => diasDoPeriodo(this.inicioIso(), this.fimIso()));
  readonly total = computed(() => {
    const anuncio = this.anuncio();
    const dias = this.dias();
    return anuncio && dias > 0 ? dias * anuncio.valorDiaria : 0;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.estado.set('carregando');
      this.aviso.set('');
      void this.anuncios.obter(id).then(
        (anuncio) => {
          if (!anuncio) {
            this.aviso.set('Não foi possível abrir este anúncio.');
            this.estado.set('erro');
            return;
          }
          const uid = this.autenticacao.uid();
          if (uid && uid === anuncio.proprietarioId) {
            this.aviso.set('Este anúncio é seu.');
            this.estado.set('erro');
            return;
          }
          this.anuncio.set(anuncio);
          this.estado.set('ok');
        },
        () => {
          this.aviso.set('Não foi possível abrir este anúncio.');
          this.estado.set('erro');
        },
      );
    });
  }

  atualizarInicio(valor: string | null | undefined): void {
    this.inicioIso.set(valor || this.hoje);
  }

  atualizarFim(valor: string | null | undefined): void {
    this.fimIso.set(valor || somarDias(this.hoje, 2));
  }

  async enviar(): Promise<void> {
    const anuncio = this.anuncio();
    if (!anuncio || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.aviso.set('');
    try {
      await this.locacoes.solicitar(anuncio, {
        mensagem: this.mensagem(),
        inicioIso: this.inicioIso(),
        fimIso: this.fimIso(),
      });
      await this.router.navigate(['/tabs/alugueis']);
    } catch (erro) {
      this.aviso.set(mensagemDoErro(erro));
    } finally {
      this.enviando.set(false);
    }
  }
}

function somarDias(iso: string, quantidade: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + quantidade);
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${d}`;
}

function mensagemDoErro(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String((erro as { code: string }).code) : '';
  if (codigo === 'permission-denied') {
    return 'Não foi possível enviar a solicitação.';
  }
  if (erro instanceof Error && erro.message && !codigo) {
    return erro.message;
  }
  return 'Não foi possível enviar a solicitação. Tente novamente.';
}
