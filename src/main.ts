import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Đăng ký partials & helpers (nếu cần)
  hbs.registerPartials(join(__dirname, '..', 'views', 'partials'));
  hbs.registerHelper('uppercase', (s: string) => (s ?? '').toUpperCase());
  hbs.registerHelper('or', (a, b) => a || b);
  hbs.registerHelper('not', (v) => !v);
  hbs.registerHelper('and', (a, b) => !!(a && b));
  hbs.registerHelper('eq', (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase());
  hbs.registerHelper('json', v => { try { return JSON.stringify(v ?? []); } catch { return '[]'; } });
  /** category trong schema là string[] */
  hbs.registerHelper('inArray', (arr: any, val: any) => {
    if (!val) return true;                // không chọn -> pass
    if (!Array.isArray(arr)) return false;
    return arr.map(x => String(x).toLowerCase()).includes(String(val).toLowerCase());
  });
  hbs.registerHelper('formatDate', (ts) => {
    if (ts == null || ts === '') return '—';
    const n = Number(ts);
    // đoán giây vs milli
    const ms = n < 1e12 ? n * 1000 : n;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return '—';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  hbs.registerHelper('breaklines', (text) => {
    if (!text) return '';
    const escaped = hbs.Utils.escapeExpression(text);
    return new hbs.SafeString(escaped.replace(/\r?\n/g, '<br/>'));
  });

  hbs.registerHelper('inc', (v) => Number(v) + 1);
  hbs.registerHelper('formatNumber', (n: any) => {
    const num = Number(n ?? 0);
    return Number.isFinite(num) ? num.toLocaleString('vi-VN') : String(n ?? '');
  });

  /** releaseDate là epoch milliseconds */
  hbs.registerHelper('formatEpoch', (ms: any) => {
    const n = Number(ms);
    if (!Number.isFinite(n)) return '';
    const d = new Date(n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  });
  app.enableCors();

  await app.listen(process.env.PORT || 3002);
}
bootstrap();
