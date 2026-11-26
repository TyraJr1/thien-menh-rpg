import type { Quality } from '../game/quality';
import type { ChapterId } from '../game/state';

const backgrounds = {
  prologue: {
    low: new URL('../art/prologue-low.webp', import.meta.url).href,
    medium: new URL('../art/prologue-medium.webp', import.meta.url).href,
    high: new URL('../art/prologue.webp', import.meta.url).href,
  },
  chapter01: {
    low: new URL('../art/chapter01-low.webp', import.meta.url).href,
    medium: new URL('../art/chapter01-medium.webp', import.meta.url).href,
    high: new URL('../art/chapter01.webp', import.meta.url).href,
  },
};

export function landscape(chapter: ChapterId, quality: Quality) {
  return backgrounds[chapter][quality];
}

export const art = {
  hero: new URL('../art/hero.webp', import.meta.url).href,
  heroDetail: new URL('../art/hero-detail.webp', import.meta.url).href,
  bamboo: new URL('../art/bamboo-front.webp', import.meta.url).href,
};

export const chapters = {
  prologue: { edition: 'Khúc dạo', title: 'Đêm ở bến Vân Thủy', location: 'Bến Vân Thủy' },
  chapter01: { edition: 'Chương 01', title: 'Sương trên Tàng Phong', location: 'Sơn môn Tàng Phong' },
};
