import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';
import { CatalogoService } from '../../core/catalogo.service';
import { ChatMessage } from '../../core/models';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    FormsModule,
  ],
})
export class ChatPage {
  private readonly catalogo = inject(CatalogoService);
  readonly id = input.required<string>();
  readonly item = computed(() => this.catalogo.find(this.id()));
  readonly messages = signal<ChatMessage[]>([]);
  draft = '';

  constructor() {
    addIcons({ send });
    effect(() => {
      this.messages.set([...this.catalogo.mensagensDe(this.id())]);
    });
  }

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text) {
      return;
    }
    this.messages.update((list) => [...list, { fromMe: true, text, time: 'agora' }]);
    this.draft = '';
  }
}
