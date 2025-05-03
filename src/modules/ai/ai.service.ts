import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async reformatText(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Reformatează textul următor.' },
          { role: 'user', content: text },
        ],
      });

      if (
        response.choices &&
        response.choices.length > 0 &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        return response.choices[0].message.content.trim();
      }

      return 'Nu s-a putut reformata textul.';
    } catch (error: unknown) {
      // Gestionare explicită a erorilor
      if (error instanceof Error) {
        console.error('Eroare OpenAI:', error.message);
        return `Eroare la procesarea textului: ${error.message}`;
      }
      console.error('Eroare necunoscută:', error);
      return 'Eroare necunoscută la procesarea textului.';
    }
  }
}
