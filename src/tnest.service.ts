import { Injectable } from '@nestjs/common';

@Injectable()
export class TnestService {
  greet(name: string): string {
    return `Hello, ${name}!`;
  }
}
