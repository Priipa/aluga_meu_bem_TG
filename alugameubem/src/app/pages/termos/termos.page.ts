import { Component, inject } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { RascunhoCadastroService } from '../../core/rascunho-cadastro.service';
import { TEXTO_TERMOS_GERAIS, VERSAO_TERMOS_GERAIS } from '../../core/termos';

@Component({
  selector: 'app-termos',
  templateUrl: './termos.page.html',
  styleUrls: ['./termos.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent],
})
export class TermosPage {
  private readonly rascunhoCadastro = inject(RascunhoCadastroService);
  readonly versao = VERSAO_TERMOS_GERAIS;
  readonly texto = TEXTO_TERMOS_GERAIS;
  readonly destinoVoltar = this.rascunhoCadastro.existe() ? '/cadastro' : '/welcome';
}
