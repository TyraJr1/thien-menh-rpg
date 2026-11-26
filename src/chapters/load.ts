import type { ChapterId } from '../game/state';

const loaders = {
  prologue: () => import('./prologue'),
  chapter01: () => import('./chapter01'),
};

export async function loadChapter(id: ChapterId) {
  return (await loaders[id]()).chapter;
}
