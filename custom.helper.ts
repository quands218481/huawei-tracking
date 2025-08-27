// custom.helper.ts
import { Injectable } from '@nestjs/common';
import * as hbs from 'hbs';

@Injectable()
export class CustomHelperService {
  register(): void {
    hbs.registerHelper('convert', function(number: number) {
      // Thực hiện các hành động logic ở đây
      return number.toLocaleString()
    });
  }
}