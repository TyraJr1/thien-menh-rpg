import type { ChapterId, GameState, Stance } from '../game/state';

export interface Choice {
  text: string;
  stance?: Stance;
}

export interface Interaction {
  x: number;
  name: string;
  label: string;
  objective: string;
  sprite?: string;
  lines: (state: GameState) => string[];
  choices: Choice[];
}

export interface Chapter {
  id: ChapterId;
  edition: string;
  title: string;
  location: string;
  background: string;
  scenes: Interaction[];
  ending: string;
}
