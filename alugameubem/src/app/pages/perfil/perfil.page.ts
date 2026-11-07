import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, personOutline } from 'ionicons/icons';
import { AutenticacaoService } from '../../core/autenticacao.service';
import { FotoPerfilService } from '../../core/foto-perfil.service';
import { nomeExibicao } from '../../core/nome-exibicao';
import { PARAGRAFOS_TERMOS_LOCADOR, VERSAO_TERMOS_LOCADOR } from '../../core/termos';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonModal, RouterLink],
})
export class PerfilPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly fotos = inject(FotoPerfilService);
  private readonly router = inject(Router);
  private objetoAvatar: string | null = null;
  private geracaoAvatar = 0;
  readonly perfil = this.autenticacao.perfil;
  readonly avatar = signal<string | null>(null);
  readonly nomeCurto = computed(() => nomeExibicao(this.perfil()?.name ?? '') || 'Visitante');
  readonly ehLocador = this.autenticacao.ehLocador;
  readonly erroSessao = this.autenticacao.erroSessao;
  readonly erroAtivacao = signal('');
  readonly ativando = signal(false);
  readonly modalLocador = signal(false);
  readonly consultaLocador = signal(false);
  readonly aceiteLocador = signal(false);
  readonly paragrafosTermosLocador = PARAGRAFOS_TERMOS_LOCADOR;
  readonly versaoTermosLocador = VERSAO_TERMOS_LOCADOR;

  constructor() {
    addIcons({ personOutline, chevronForwardOutline });
    effect(() => {
      const caminho = this.perfil()?.fotoPerfil ?? null;
      const geracao = ++this.geracaoAvatar;
      void this.mostrarAvatar(caminho, geracao);
    });
  }

  ngOnDestroy(): void {
    this.trocarAvatar(null);
  }

  avatarFalhou(evento: Event): void {
    const imagem = evento.target;
    if (!(imagem instanceof HTMLImageElement) || imagem.src !== this.avatar()) {
      return;
    }
    this.trocarAvatar(null);
  }

  abrirAtivacao(): void {
    if (this.ativando() || this.ehLocador() || this.modalLocador() || this.consultaLocador()) {
      return;
    }

    this.erroAtivacao.set('');
    this.aceiteLocador.set(false);
    this.modalLocador.set(true);
  }

  abrirConsultaLocador(): void {
    if (!this.ehLocador() || this.modalLocador() || this.consultaLocador()) {
      return;
    }

    this.consultaLocador.set(true);
  }

  fecharConsultaLocador(): void {
    this.consultaLocador.set(false);
  }

  definirAceite(evento: Event): void {
    const entrada = evento.target;
    this.aceiteLocador.set(entrada instanceof HTMLInputElement && entrada.checked);
  }

  impedirEnterSemAceite(evento: Event): void {
    if (!this.aceiteLocador()) {
      evento.preventDefault();
    }
  }

  descartarAceiteLocador(): void {
    this.modalLocador.set(false);
    this.aceiteLocador.set(false);
  }

  async concluirAtivacao(): Promise<void> {
    if (!this.aceiteLocador() || this.ativando()) {
      return;
    }

    this.modalLocador.set(false);
    this.ativando.set(true);
    this.erroAtivacao.set('');
    try {
      await this.autenticacao.ativarLocador();
    } catch (erro) {
      this.erroAtivacao.set(this.autenticacao.traduzirErro(erro));
    } finally {
      this.ativando.set(false);
    }
  }

  private async mostrarAvatar(caminho: string | null, geracao: number): Promise<void> {
    if (!caminho) {
      if (geracao === this.geracaoAvatar) {
        this.trocarAvatar(null);
      }
      return;
    }
    try {
      const url = await this.fotos.abrir(caminho);
      if (geracao !== this.geracaoAvatar) {
        URL.revokeObjectURL(url);
        return;
      }
      this.trocarAvatar(url);
    } catch {
      if (geracao === this.geracaoAvatar) {
        this.trocarAvatar(null);
      }
    }
  }

  private trocarAvatar(url: string | null): void {
    if (this.objetoAvatar?.startsWith('blob:') && this.objetoAvatar !== url) {
      URL.revokeObjectURL(this.objetoAvatar);
    }
    this.objetoAvatar = url;
    this.avatar.set(url);
  }

  async logout(): Promise<void> {
    await this.autenticacao.sair();
    await this.router.navigateByUrl('/welcome');
  }
}
