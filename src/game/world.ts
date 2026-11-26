import Phaser from 'phaser';
import type { Chapter, Interaction } from '../chapters/types';
import { art } from '../chapters/art';
import type { Move } from './state';

const width = 960;
const height = 540;
const floor = 451;
const reach = 62;

export interface World {
  setObjective(step: number, combat: boolean): void;
  nudge(direction: number): void;
  approach(): void;
  tryInteract(): void;
  strike(move: Move): void;
  destroy(): void;
}

export function createWorld(
  parent: HTMLElement, chapter: Chapter, interact: () => void, isBlocked: () => boolean,
): Promise<World> {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = [...new Set(chapter.scenes.flatMap(scene => scene.sprite ? [scene.sprite] : []))];

  return new Promise((resolve, reject) => {
    let hadAssetError = false;
    let game: Phaser.Game;

    class JourneyScene extends Phaser.Scene {
      backdrop!: Phaser.GameObjects.Image;
      hero!: Phaser.GameObjects.Image;
      shadow!: Phaser.GameObjects.Ellipse;
      marker!: Phaser.GameObjects.Container;
      targetVisual?: Phaser.GameObjects.Image;
      keys?: Record<'left' | 'right' | 'a' | 'd', Phaser.Input.Keyboard.Key>;
      target?: Interaction;
      destination = 155;
      direction = 1;
      clickingTarget = false;
      combat = false;

      preload() {
        this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => { hadAssetError = true; });
        this.load.image('landscape', chapter.background);
        this.load.image('traveler', art.hero);
        for (const url of sprites) this.load.image(url, url);
      }

      create() {
        if (hadAssetError) {
          queueMicrotask(() => {
            game.destroy(true);
            reject(new Error('Không tải được tranh hoặc nhân vật.'));
          });
          return;
        }

        this.backdrop = this.add.image(width / 2, height - 4, 'landscape').setOrigin(0.5, 1);
        this.backdrop.setScale(Math.max((width + 46) / this.backdrop.width, height / this.backdrop.height));
        this.add.rectangle(width / 2, height - 7, width, 14, 0x0c100e, 0.23).setDepth(6);
        this.shadow = this.add.ellipse(155, floor - 1, 70, 13, 0x0c100e, 0.52).setDepth(2);
        this.hero = this.add.image(155, floor, 'traveler').setOrigin(0.5, 1).setDepth(4);
        this.hero.setScale(153 / this.hero.height);
        const ring = this.add.circle(0, 0, 14, 0x152520, 0.94).setStrokeStyle(1, 0xe5c58a);
        const symbol = this.add.text(0, -1, '◆', { fontFamily: 'sans-serif', fontSize: '13px', color: '#f0d5a1' }).setOrigin(0.5);
        this.marker = this.add.container(0, 0, [ring, symbol]).setDepth(5);
        this.keys = this.input.keyboard?.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' }) as typeof this.keys;
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (isBlocked() || pointer.y < 180) return;
          if (this.target && Math.abs(pointer.x - this.target.x) < 62) {
            this.approach();
            return;
          }
          this.clickingTarget = false;
          this.destination = Phaser.Math.Clamp(pointer.x, 56, 900);
        });

        resolve({
          setObjective: (step, combat) => this.setObjective(step, combat),
          nudge: direction => {
            if (isBlocked()) return;
            this.clickingTarget = false;
            this.destination = Phaser.Math.Clamp(this.destination + direction * 118, 56, 900);
          },
          approach: () => this.approach(),
          tryInteract: () => this.tryInteract(),
          strike: move => this.strike(move),
          destroy: () => game.destroy(true),
        });
      }

      setObjective(step: number, combat: boolean) {
        this.target = chapter.scenes[step];
        this.combat = combat;
        this.clickingTarget = false;
        this.targetVisual?.destroy();
        this.targetVisual = undefined;
        this.marker.setVisible(Boolean(this.target) && !combat);
        if (!this.target) return;
        const { x, sprite } = this.target;
        if (sprite) {
          this.targetVisual = this.add.image(x, floor, sprite).setOrigin(0.5, 1).setDepth(3);
          this.targetVisual.setScale(147 / this.targetVisual.height);
        }
        this.marker.setPosition(x, sprite ? floor - 171 : floor - 58);
        if (combat) {
          this.hero.setPosition(x - 105, floor).setFlipX(false);
          this.shadow.setX(this.hero.x);
          this.destination = this.hero.x;
        } else if (Math.abs(this.hero.x - x) < 18) {
          this.hero.setX(x - 62);
          this.shadow.setX(this.hero.x);
          this.destination = this.hero.x;
        }
      }

      tryInteract() {
        if (this.target && !isBlocked() && Math.abs(this.target.x - this.hero.x) <= reach) {
          this.destination = this.hero.x;
          interact();
        }
      }

      approach() {
        if (!this.target || isBlocked()) return;
        this.tryInteract();
        if (isBlocked()) return;
        this.destination = this.target.x + (this.hero.x <= this.target.x ? -44 : 44);
        this.clickingTarget = true;
      }

      strike(move: Move) {
        if (reducedMotion || !this.combat) return;
        const color = move === 'guard' ? 0x78c6b5 : 0xffd191;
        const x = move === 'guard' ? this.hero.x : (this.targetVisual?.x ?? this.hero.x);
        const pulse = this.add.ellipse(x, floor - 62, 38, 114, color, 0.42).setDepth(5);
        this.tweens.add({
          targets: pulse, alpha: 0, scaleX: 2.8, scaleY: 0.8, duration: 220,
          onComplete: () => { pulse.destroy(); },
        });
      }

      update(time: number, delta: number) {
        if (isBlocked()) return;
        const left = this.keys?.left.isDown || this.keys?.a.isDown;
        const right = this.keys?.right.isDown || this.keys?.d.isDown;
        const keyboard = Number(Boolean(right)) - Number(Boolean(left));
        if (keyboard) {
          this.clickingTarget = false;
          this.destination = Phaser.Math.Clamp(this.hero.x + keyboard * 100, 56, 900);
        } else if (left || right) {
          this.destination = this.hero.x;
        }
        const distance = this.destination - this.hero.x;
        const moving = Math.abs(distance) > 0.5;
        if (moving) {
          this.direction = Math.sign(distance);
          this.hero.x += this.direction * Math.min(Math.abs(distance), 0.30 * Math.min(delta, 50));
          this.hero.setFlipX(this.direction < 0);
          this.shadow.setX(this.hero.x);
        }
        this.hero.y = floor + (moving && !reducedMotion ? Math.sin(time / 66) * 2 : 0);
        this.backdrop.x = width / 2 + (reducedMotion ? 0 : (width / 2 - this.hero.x) * 0.046);
        if (this.clickingTarget && this.target && Math.abs(this.target.x - this.hero.x) <= reach) {
          this.clickingTarget = false;
          this.tryInteract();
        }
      }
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      backgroundColor: '#111c1a',
      transparent: false,
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, powerPreference: 'low-power' },
      input: { keyboard: { capture: [] }, gamepad: false },
      fps: { target: 30, limit: 30, smoothStep: false },
      audio: { noAudio: true },
      scene: JourneyScene,
    });
  });
}
