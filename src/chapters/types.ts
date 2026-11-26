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
  portrait?: string;
  lines: (state: GameState) => string[];
  choices: Choice[];
}

export interface Chapter {
  id: ChapterId;
  edition: string;
  title: string;
  location: string;
  sideQuest?: Interaction;
  scenes: Interaction[];
  ending: string;
}
