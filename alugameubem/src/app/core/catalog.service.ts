import { Injectable } from '@angular/core';
import { ChatMessage, Item, UserProfile } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly items: Item[] = [
    {
      id: 'camera-dslr',
      title: 'Kit de Câmera',
      pricePerDay: 45,
      deposit: 500,
      categories: ['Eletrônicos', 'Fotografia'],
      rating: 4.9,
      reviewCount: 12,
      image:
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1480365501497-1991692f0ddc?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'DSLR full-frame com lente 24-70mm, ideal para ensaios, eventos e conteúdo profissional.',
        },
        {
          title: 'Por que alugar?',
          body: 'Use equipamento de estúdio sem investir milhares. Perfeito para um fim de semana de fotos.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Corpo, lente, dois cartões SD, bateria extra, alça e bolsa acolchoada.',
        },
      ],
      owner: {
        name: 'Maria F.',
        since: 'Locadora desde 2021',
        avatar: 'https://i.pravatar.cc/120?img=47',
      },
      neighborhood: 'Vila Madalena',
      city: 'São Paulo - SP',
      location: 'São Paulo, SP',
      conditions: [
        'Devolver na embalagem original.',
        'Uso indevido pode gerar cobrança do caução.',
        'Atraso: R$ 50,00 por dia extra.',
      ],
      reviews: [
        {
          name: 'Lucas',
          date: '10/01/2026',
          rating: 5,
          text: 'Câmera impecável e a Maria foi super atenciosa na retirada.',
          avatar: 'https://i.pravatar.cc/120?img=12',
        },
      ],
    },
    {
      id: 'furadeira',
      title: 'Furadeira Elétrica',
      pricePerDay: 15,
      deposit: 150,
      categories: ['Ferramentas', 'Casa'],
      rating: 4.7,
      reviewCount: 31,
      image:
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'Furadeira de impacto com maleta e jogo de brocas para alvenaria e madeira.',
        },
        {
          title: 'Por que alugar?',
          body: 'Para aquela reforma de fim de semana, sem ocupar espaço depois.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Furadeira, maleta, 8 brocas e óculos de proteção.',
        },
      ],
      owner: {
        name: 'Rafael S.',
        since: 'Locador desde 2022',
        avatar: 'https://i.pravatar.cc/120?img=33',
      },
      neighborhood: 'Botafogo',
      city: 'Rio de Janeiro - RJ',
      location: 'Rio de Janeiro, RJ',
      conditions: [
        'Limpar após o uso.',
        'Não usar em concreto armado sem broca adequada.',
        'Devolução até 18h do último dia.',
      ],
      reviews: [
        {
          name: 'Ana',
          date: '02/08/2026',
          rating: 5,
          text: 'Resolveu a instalação das prateleiras em uma tarde.',
          avatar: 'https://i.pravatar.cc/120?img=32',
        },
      ],
    },
    {
      id: 'bike',
      title: 'Bicicleta urbana aro 29',
      pricePerDay: 35,
      deposit: 400,
      categories: ['Esporte', 'Mobilidade'],
      rating: 4.8,
      reviewCount: 18,
      image:
        'https://images.unsplash.com/photo-1485965120184-e07f276d4e81?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1485965120184-e07f276d4e81?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'Bike urbana leve, 21 marchas, ideal para pedaladas na cidade ou no parque.',
        },
        {
          title: 'Por que alugar?',
          body: 'Passeie sem comprar uma bike que ficaria parada o resto do mês.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Capacete, trava U-lock e luzes dianteira e traseira.',
        },
      ],
      owner: {
        name: 'Alana P.',
        since: 'Locadora desde 2021',
        avatar: 'https://i.pravatar.cc/120?img=5',
      },
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo - SP',
      location: 'São Paulo, SP',
      conditions: [
        'Uso de capacete obrigatório.',
        'Não deixar em via pública sem trava.',
        'Atraso: R$ 40,00 por dia extra.',
      ],
      reviews: [
        {
          name: 'Bruno',
          date: '21/07/2026',
          rating: 5,
          text: 'Bike confortável e bem cuidada. Recomendo.',
          avatar: 'https://i.pravatar.cc/120?img=15',
        },
      ],
    },
    {
      id: 'projetor',
      title: 'Projetor Multimídia',
      pricePerDay: 55,
      deposit: 350,
      categories: ['Eletrônicos', 'Eventos'],
      rating: 4.6,
      reviewCount: 9,
      image:
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'Projetor compacto 4K com HDMI, Wi-Fi e tela de até 120 polegadas.',
        },
        {
          title: 'Por que alugar?',
          body: 'Cinema em casa, aniversário ou apresentação sem comprar o aparelho.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Projetor, controle, cabo HDMI e tripé.',
        },
      ],
      owner: {
        name: 'Camila R.',
        since: 'Locadora desde 2023',
        avatar: 'https://i.pravatar.cc/120?img=20',
      },
      neighborhood: 'Moema',
      city: 'São Paulo - SP',
      location: 'São Paulo, SP',
      conditions: [
        'Não cobrir as saídas de ar.',
        'Devolver com todos os cabos.',
        'Caução reembolsável no fim do aluguel.',
      ],
      reviews: [
        {
          name: 'Pedro',
          date: '14/06/2026',
          rating: 4,
          text: 'Imagem nítida. Só achei o ventilador um pouco alto.',
          avatar: 'https://i.pravatar.cc/120?img=8',
        },
      ],
    },
    {
      id: 'barraca',
      title: 'Barraca 4 pessoas',
      pricePerDay: 40,
      deposit: 200,
      categories: ['Esporte', 'Lazer'],
      rating: 4.5,
      reviewCount: 14,
      image:
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'Barraca familiar para 4 pessoas, fácil de montar e com boa ventilação.',
        },
        {
          title: 'Por que alugar?',
          body: 'Ideal para um fim de semana no camping sem comprar equipamento novo.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Barraca, estacas, capa de chuva e sacola de transporte.',
        },
      ],
      owner: {
        name: 'Diego M.',
        since: 'Locador desde 2020',
        avatar: 'https://i.pravatar.cc/120?img=14',
      },
      neighborhood: 'Tijuca',
      city: 'Rio de Janeiro - RJ',
      location: 'Rio de Janeiro, RJ',
      conditions: [
        'Devolver limpa e seca.',
        'Furos são cobrados do caução.',
        'Montagem por conta do locatário.',
      ],
      reviews: [
        {
          name: 'Carla',
          date: '03/07/2026',
          rating: 5,
          text: 'Cabemos em quatro com folga. Super indico.',
          avatar: 'https://i.pravatar.cc/120?img=24',
        },
      ],
    },
    {
      id: 'violao',
      title: 'Violão Acústico',
      pricePerDay: 20,
      deposit: 180,
      categories: ['Música', 'Eventos'],
      rating: 4.8,
      reviewCount: 21,
      image:
        'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'Violão acústico de cordas de aço, afinado e com capa.',
        },
        {
          title: 'Por que alugar?',
          body: 'Para um churrasco, ensaio ou viagem, sem carregar o seu.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Violão, capa, palhetas e afinador.',
        },
      ],
      owner: {
        name: 'Lia T.',
        since: 'Locadora desde 2024',
        avatar: 'https://i.pravatar.cc/120?img=27',
      },
      neighborhood: 'Santa Teresa',
      city: 'Rio de Janeiro - RJ',
      location: 'Rio de Janeiro, RJ',
      conditions: [
        'Não usar palheta de metal.',
        'Devolver na capa.',
        'Atraso: R$ 20,00 por dia extra.',
      ],
      reviews: [
        {
          name: 'Hugo',
          date: '11/05/2026',
          rating: 5,
          text: 'Som bonito e o instrumento bem cuidado.',
          avatar: 'https://i.pravatar.cc/120?img=11',
        },
      ],
    },
    {
      id: 'caixa-som',
      title: 'Caixa de Som Portátil',
      pricePerDay: 30,
      deposit: 150,
      categories: ['Eletrônicos', 'Eventos'],
      rating: 4.4,
      reviewCount: 8,
      image:
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80',
      ],
      description: [
        {
          title: 'O que é?',
          body: 'Caixa Bluetooth à prova d’água, bateria para o dia inteiro.',
        },
        {
          title: 'Por que alugar?',
          body: 'Festa, praia ou obra: volume sem comprar um aparelho extra.',
        },
        {
          title: 'O que vem no kit?',
          body: 'Caixa, cabo USB-C e alça.',
        },
      ],
      owner: {
        name: 'Paulo V.',
        since: 'Locador desde 2023',
        avatar: 'https://i.pravatar.cc/120?img=52',
      },
      neighborhood: 'Copacabana',
      city: 'Rio de Janeiro - RJ',
      location: 'Rio de Janeiro, RJ',
      conditions: [
        'Não molhar a entrada de carga.',
        'Devolver carregada.',
        'Caução reembolsável.',
      ],
      reviews: [
        {
          name: 'Marina',
          date: '28/04/2026',
          rating: 4,
          text: 'Deu conta da praia inteira. Bateria boa.',
          avatar: 'https://i.pravatar.cc/120?img=36',
        },
      ],
    },
  ];

  private readonly chats: Record<string, ChatMessage[]> = {
    'camera-dslr': [
      { fromMe: false, text: 'Oi! A câmera está disponível de sexta a domingo.', time: '10:12' },
      { fromMe: true, text: 'Perfeito. Posso retirar na Vila Madalena?', time: '10:14' },
      { fromMe: false, text: 'Sim, perto da praça. Te mando o ponto no mapa.', time: '10:16' },
    ],
    furadeira: [
      { fromMe: false, text: 'A furadeira está carregada e com as brocas.', time: '09:02' },
    ],
    bike: [
      { fromMe: false, text: 'A bike está com pneus novos. Qual dia você quer?', time: '18:40' },
    ],
    projetor: [
      { fromMe: false, text: 'Posso entregar no fim da tarde.', time: '16:20' },
    ],
    barraca: [
      { fromMe: false, text: 'A barraca está completa, com todas as estacas.', time: '11:05' },
    ],
    violao: [
      { fromMe: false, text: 'Posso emprestar o afinador também.', time: '19:12' },
    ],
    'caixa-som': [
      { fromMe: false, text: 'A caixa está com 100% de bateria.', time: '08:40' },
    ],
  };

  list(): Item[] {
    return this.items;
  }

  find(id: string): Item | undefined {
    return this.items.find((item) => item.id === id);
  }

  search(term: string): Item[] {
    const q = term.trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.categories.some((c) => c.toLowerCase().includes(q)) ||
        item.neighborhood.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
    );
  }

  conversations() {
    return Object.keys(this.chats)
      .map((id) => {
        const item = this.find(id);
        const messages = this.chats[id];
        if (!item || !messages?.length) {
          return null;
        }
        return { item, last: messages[messages.length - 1] };
      })
      .filter((row): row is { item: Item; last: ChatMessage } => row !== null);
  }

  toggleFavorite(id: string): void {
    const next = new Set(this.favoriteIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    localStorage.setItem('amb.favorites', JSON.stringify([...next]));
  }

  isFavorite(id: string): boolean {
    return this.favoriteIds().has(id);
  }

  favorites(): Item[] {
    const ids = this.favoriteIds();
    return this.items.filter((item) => ids.has(item.id));
  }

  private favoriteIds(): Set<string> {
    const raw = localStorage.getItem('amb.favorites');
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  }

  messagesFor(itemId: string): ChatMessage[] {
    return this.chats[itemId] ?? [];
  }

  saveProfile(profile: UserProfile): void {
    localStorage.setItem('amb.profile', JSON.stringify(profile));
    localStorage.setItem('amb.loggedIn', '1');
  }

  profile(): UserProfile | null {
    const raw = localStorage.getItem('amb.profile');
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('amb.loggedIn') === '1';
  }

  logout(): void {
    localStorage.removeItem('amb.loggedIn');
  }
}
