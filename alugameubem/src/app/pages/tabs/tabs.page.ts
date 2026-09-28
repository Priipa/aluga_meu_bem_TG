import { Component, inject } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, chatbubbleOutline, heartOutline, home, person } from 'ionicons/icons';
import { AnuncioService } from '../../core/anuncio.service';
import { AutenticacaoService } from '../../core/autenticacao.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly anuncios = inject(AnuncioService);
  readonly ehLocador = this.autenticacao.ehLocador;

  reabrirAnuncio(): void {
    this.anuncios.solicitarFormulario();
  }

  constructor() {
    addIcons({ home, chatbubbleOutline, addCircleOutline, heartOutline, person });
  }
}
