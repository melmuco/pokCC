import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TCGCard {
  id: string;
  name: string;
  number: string;
  set: {
    id: string;
    name: string;
    symbol: string;
  };
  imageUrl: string;
  rarity: string;
  supertype: string;
  hp: number;
  types: string[];
  artist: string;
}

@Injectable()
export class TcgService {
  private readonly logger = new Logger(TcgService.name);
  private readonly baseUrl = 'https://api.pokemontcg.io/v2';

  constructor(private config: ConfigService) {}

  async searchCards(params: { name?: string; setName?: string; cardNumber?: string }): Promise<TCGCard[]> {
    let query = '';

    if (params.cardNumber) {
      query += `number:${params.cardNumber}`;
    }
    if (params.setName) {
      if (query) query += ' ';
      query += `set.name:${params.setName}`;
    }
    if (params.name) {
      if (query) query += ' ';
      query += `name:${params.name}`;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        params: { q: query },
        headers: { 'X-Api-Key': this.config.get<string>('TCG_API_KEY') || '' },
      });

      return response.data.data.map((card: any) => ({
        id: card.id,
        name: card.name,
        number: card.number,
        set: card.set,
        imageUrl: card.images?.large || card.images?.small,
        rarity: card.rarity,
        supertype: card.supertype,
        hp: card.hp,
        types: card.types,
        artist: card.artist,
      }));
    } catch (error) {
      this.logger.error('Error calling TCG API', error);
      return [];
    }
  }

  async getCardByNameAndSet(name: string, setName: string): Promise<TCGCard | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/cards`, {
        params: { q: `name:${name} set.name:${setName}` },
        headers: { 'X-Api-Key': this.config.get<string>('TCG_API_KEY') || '' },
      });

      if (response.data.data.length > 0) {
        const card = response.data.data[0];
        return {
          id: card.id,
          name: card.name,
          number: card.number,
          set: card.set,
          imageUrl: card.images?.large || card.images?.small,
          rarity: card.rarity,
          supertype: card.supertype,
          hp: card.hp,
          types: card.types,
          artist: card.artist,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching card ${name} from set ${setName}`, error);
      return null;
    }
  }
}