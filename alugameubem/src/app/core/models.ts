export interface Owner {
  name: string;
  since: string;
  avatar: string;
}

export interface Review {
  name: string;
  date: string;
  rating: number;
  text: string;
  avatar: string;
}

export interface DescriptionBlock {
  title: string;
  body: string;
}

export interface Item {
  id: string;
  title: string;
  pricePerDay: number;
  deposit: number;
  categories: string[];
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  description: DescriptionBlock[];
  owner: Owner;
  neighborhood: string;
  city: string;
  location: string;
  conditions: string[];
  reviews: Review[];
}

export interface ChatMessage {
  fromMe: boolean;
  text: string;
  time: string;
}

export interface UserProfile {
  name: string;
  email: string;
  city: string;
  cpf?: string;
  phone?: string;
}
