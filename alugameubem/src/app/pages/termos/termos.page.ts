import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { map } from 'rxjs';
import { RascunhoCadastroService } from '../../core/rascunho-cadastro.service';
import { TEXTO_TERMOS_GERAIS, VERSAO_TERMOS_GERAIS } from '../../core/termos';

@Component({
  selector: 'app-termos',
  templateUrl: './termos.page.html',
  styleUrls: ['./termos.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, RouterLink, IonTitle, IonContent],
})
export class TermosPage {
  private readonly rascunhoCadastro = inject(RascunhoCadastroService);
  private readonly rota = inject(ActivatedRoute);
  private readonly origem = toSignal(
    this.rota.queryParamMap.pipe(map((params) => params.get('origem'))),
    { initialValue: this.rota.snapshot.queryParamMap.get('origem') },
  );
  readonly versao = VERSAO_TERMOS_GERAIS;
  readonly texto = TEXTO_TERMOS_GERAIS;
  readonly destinoVoltar = computed(() => {
    const origem = this.origem();
    if (origem === 'perfil') {
      return '/tabs/perfil';
    }
    if (origem === 'cadastro' || this.rascunhoCadastro.existe()) {
      return '/cadastro';
    }
    return '/welcome';
  });

  constructor() {
    addIcons({ chevronBackOutline });
  }
}
