import Phaser from 'phaser';
import type { Chapter, Interaction } from '../chapters/types';
import { art, landscape } from '../chapters/art';
import { qualities } from './quality';
import type { Quality } from './quality';
import type { Move } from './state';

const width = 960;
const height = 540;
const floor = 451;
const reach = 62;

export interface World {
  setObjective(step: number, combat: boolean, side?: boolean): void;
  nudge(direction: number): void;
  approach(): void;
  tryInteract(): void;
  strike(move: Move): void;
  cultivate(): void;
  position(): number;
  destroy(): Promise<void>;
}

interface WorldOptions {
  quality: Quality;
  position?: number;
  interact: () => void;
  isBlocked: () => boolean;
  onSlow: () => boolean;
}

function radial(scene: Phaser.Scene, key: string, color: string) {
  const texture = scene.textures.createCanvas(key, 64, 64)!;
  const gradient = texture.context.createRadialGradient(32, 32, 1, 32, 32, 30);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  texture.context.fillStyle = gradient;
  texture.context.fillRect(0, 0, 64, 64);
  texture.refresh();
}

export function createWorld(parent: HTMLElement, chapter: Chapter, options: WorldOptions): Promise<World> {
  const { quality, interact, isBlocked } = options;
  const profile = qualities[quality];
  const zoom = profile.width / width;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = [...new Set(chapter.scenes.flatMap(scene => scene.sprite ? [scene.sprite] : []))];

  return new Promise((resolve, reject) => {
    let hadAssetError = false;
    let game: Phaser.Game;
    const destroy = () => new Promise<void>(done => {
      const release = game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer
        ? game.renderer.gl?.getExtension('WEBGL_lose_context') : undefined;
      game.events.once(Phaser.Core.Events.DESTROY, () => {
        parent.dataset.disposed = String(Number(parent.dataset.disposed ?? 0) + 1);
        delete parent.dataset.fps;
        delete parent.dataset.nearTarget;
        queueMicrotask(() => { release?.loseContext(); done(); });
      });
      game.destroy(true);
    });

    class JourneyScene extends Phaser.Scene {
      backdrop!: Phaser.GameObjects.Image;
      foreground?: Phaser.GameObjects.Image;
      fog: Phaser.GameObjects.Image[] = [];
      embers: Phaser.GameObjects.Image[] = [];
      hero!: Phaser.GameObjects.Image;
      shadow!: Phaser.GameObjects.Ellipse;
      marker!: Phaser.GameObjects.Container;
      slash!: Phaser.GameObjects.Arc;
      aura!: Phaser.GameObjects.Ellipse;
      targetVisual?: Phaser.GameObjects.Image;
      keys?: Record<'left' | 'right' | 'a' | 'd', Phaser.Input.Keyboard.Key>;
      target?: Interaction;
      destination = options.position ?? 155;
      clickingTarget = false;
      usingKeyboard = false;
      combat = false;
      frameStart = 0;
      poseEnds = 0;
      nearTarget = false;
      frames = 0;
      slowSamples = 0;
      adjusted = false;

      preload() {
        this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => { hadAssetError = true; });
        this.load.image('landscape', landscape(chapter.id, quality));
        this.load.image('traveler', art.hero);
        if (quality !== 'low') this.load.image('bamboo', art.bamboo);
        for (const url of sprites) this.load.image(url, url);
      }

      create() {
        if (hadAssetError) {
          queueMicrotask(() => {
            void destroy().then(() => reject(new Error('Không tải được tranh hoặc nhân vật.')));
          });
          return;
        }
        this.cameras.main.setZoom(zoom).centerOn(width / 2, height / 2);
        this.backdrop = this.add.image(width / 2, height - 4, 'landscape').setOrigin(0.5, 1);
        this.backdrop.setScale(Math.max((width + 46) / this.backdrop.width, height / this.backdrop.height));
        if (quality !== 'low') this.createAtmosphere();
        this.shadow = this.add.ellipse(this.destination, floor - 1, 70, 13, 0x0c100e, 0.52).setDepth(2);
        this.hero = this.add.image(this.destination, floor, 'traveler').setOrigin(0.5, 1).setDepth(4);
        this.hero.setScale(153 / this.hero.height);
        const ring = this.add.circle(0, 0, 14, 0x152520, 0.94).setStrokeStyle(1, 0xe5c58a);
        const symbol = this.add.rectangle(0, 0, 7, 7, 0xf0d5a1).setAngle(45);
        this.marker = this.add.container(0, 0, [ring, symbol]).setDepth(7);
        this.slash = this.add.arc(0, 0, 58, -101, 65, false, 0xeec99a, 0)
          .setStrokeStyle(5, 0xe9d0a4).setDepth(6).setVisible(false);
        this.aura = this.add.ellipse(0, 0, 60, 125, 0x8fd5bd, 0.34).setDepth(6).setVisible(false);
        this.keys = this.input.keyboard?.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' }) as typeof this.keys;
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          const x = pointer.x / zoom;
          if (isBlocked() || pointer.y / zoom < 180) return;
          if (this.target && Math.abs(x - this.target.x) < 62) {
            this.approach();
            return;
          }
          this.clickingTarget = false;
          this.destination = Phaser.Math.Clamp(x, 56, 900);
        });

        parent.dataset.quality = quality;
        parent.dataset.renderer = game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas';
        parent.dataset.renderWidth = String(profile.width);
        parent.dataset.textures = String(this.textures.getTextureKeys().length);
        resolve({
          setObjective: (step, combat, side) => this.setObjective(step, combat, side),
          nudge: direction => {
            if (isBlocked()) return;
            this.clickingTarget = false;
            this.usingKeyboard = false;
            this.destination = Phaser.Math.Clamp(this.destination + direction * 118, 56, 900);
          },
          approach: () => this.approach(),
          tryInteract: () => this.tryInteract(),
          strike: move => this.strike(move),
          cultivate: () => this.glow(this.hero.x, 0xb2e2a5, 490),
          position: () => this.hero.x,
          destroy,
        });
      }

      createAtmosphere() {
        this.foreground = this.add.image(width / 2, height / 2, 'bamboo').setDepth(8).setAlpha(0.85);
        radial(this, 'mist', 'rgba(164,219,198,0.34)');
        radial(this, 'lantern', 'rgba(255,175,86,0.8)');
        this.add.image(chapter.id === 'prologue' ? 926 : 780, 222, 'lantern')
          .setDisplaySize(95, 112).setDepth(1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.48);
        for (let i = 0; i < profile.fog; i++) {
          this.fog.push(this.add.image(250 + i * 279, 365 + i * 29, 'mist')
            .setDisplaySize(580, 108 + i * 18).setDepth(i % 2 ? 5 : 1).setAlpha(0.75));
        }
        if (!reducedMotion) {
          for (let i = 0; i < profile.particles; i++) {
            this.embers.push(this.add.image(0, 0, 'lantern').setDisplaySize(8, 8).setDepth(5));
          }
        }
      }

      setObjective(step: number, combat: boolean, side = false) {
        this.target = side ? chapter.sideQuest : chapter.scenes[step];
        this.combat = combat;
        this.clickingTarget = false;
        this.targetVisual?.destroy();
        this.targetVisual = undefined;
        this.marker.setVisible(Boolean(this.target) && !combat);
        this.updateProximity();
        if (!this.target) return;
        const { x, sprite } = this.target;
        if (sprite) {
          this.targetVisual = this.add.image(x, floor, sprite).setOrigin(0.5, 1).setDepth(3);
          this.targetVisual.setScale(147 / this.targetVisual.height);
        }
        this.marker.setPosition(x, sprite ? floor - 171 : floor - 58);
        if (combat || Math.abs(this.hero.x - x) < 18) {
          this.hero.setPosition(x - (combat ? 105 : 62), floor).setFlipX(false);
          this.shadow.setX(this.hero.x);
          this.destination = this.hero.x;
        }
      }

      updateProximity() {
        const near = Boolean(this.target && !isBlocked() && Math.abs(this.target.x - this.hero.x) <= reach);
        if (near !== this.nearTarget) {
          this.nearTarget = near;
          parent.dataset.nearTarget = String(near);
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
        this.usingKeyboard = false;
      }

      glow(x: number, color: number, duration: number) {
        this.tweens.killTweensOf(this.aura);
        this.aura.setPosition(x, floor - 58).setFillStyle(color, 0.34).setScale(0.76).setAlpha(1).setVisible(true);
        this.tweens.add({ targets: this.aura, alpha: 0, scale: reducedMotion ? 0.76 : 1.3, duration,
          onComplete: () => { this.aura.setVisible(false); } });
      }

      strike(move: Move) {
        if (!this.combat) return;
        if (move === 'guard' || move === 'heal' || move === 'focus' || reducedMotion) {
          this.glow(this.hero.x, 0x8cd4b9, 220);
          return;
        }
        const skill = move === 'skill';
        this.poseEnds = this.time.now + (skill ? 330 : 200);
        const x = this.targetVisual?.x ?? this.hero.x;
        this.tweens.killTweensOf(this.slash);
        this.slash.setPosition(x - 18, floor - 72).setAngle(-45).setAlpha(1).setScale(skill ? 1.32 : 0.84).setVisible(true);
        this.slash.setStrokeStyle(skill ? 9 : 5, skill ? 0xece4a5 : 0xffd0a5);
        this.tweens.add({ targets: this.slash, alpha: 0, angle: 95, duration: skill ? 380 : 200,
          onComplete: () => { this.slash.setVisible(false); } });
      }

      update(time: number, delta: number) {
        if (!this.frameStart) this.frameStart = time;
        this.frames++;
        if (time - this.frameStart >= 1000) {
          const fps = this.frames * 1000 / (time - this.frameStart);
          parent.dataset.fps = fps.toFixed(1);
          this.frames = 0;
          this.frameStart = time;
          this.slowSamples = document.hidden || fps >= profile.fps * 0.65 ? 0 : this.slowSamples + 1;
          if (quality !== 'low' && !this.adjusted && this.slowSamples >= 3 && !isBlocked()) {
            this.adjusted = options.onSlow();
          }
        }
        const parallax = reducedMotion ? 0 : width / 2 - this.hero.x;
        this.backdrop.x = width / 2 + parallax * 0.042;
        if (this.foreground) this.foreground.x = width / 2 + parallax * 0.10;
        if (!reducedMotion) {
          this.fog.forEach((fog, i) => { fog.x = 250 + i * 279 + parallax * 0.067 + Math.sin(time / 4700 + i) * 42; });
          this.embers.forEach((ember, i) => {
            ember.setPosition((i * 137 + time * 0.017) % width, 250 + (i * 47 % 155) + Math.sin(time / 1300 + i) * 18);
            ember.setAlpha(0.16 + (1 + Math.sin(i + time / 950)) * 0.20);
          });
        }
        this.updateProximity();
        if (isBlocked()) {
          const pose = !reducedMotion && time < this.poseEnds
            ? Math.sin(Math.PI * (this.poseEnds - time) / 330) * 0.14 : 0;
          this.hero.setY(floor - pose * 25).setRotation(pose);
          return;
        }
        const left = this.keys?.left.isDown || this.keys?.a.isDown;
        const right = this.keys?.right.isDown || this.keys?.d.isDown;
        const keyboard = Number(Boolean(right)) - Number(Boolean(left));
        if (keyboard) {
          this.clickingTarget = false;
          this.destination = Phaser.Math.Clamp(this.hero.x + keyboard * 100, 56, 900);
        } else if (this.usingKeyboard) {
          this.destination = this.hero.x;
        }
        this.usingKeyboard = Boolean(keyboard);
        const distance = this.destination - this.hero.x;
        const moving = Math.abs(distance) > 0.5;
        if (moving) {
          const direction = Math.sign(distance);
          this.hero.x += direction * Math.min(Math.abs(distance), 0.30 * Math.min(delta, 55));
          this.hero.setFlipX(direction < 0);
          this.shadow.setX(this.hero.x);
        }
        const stride = moving && !reducedMotion ? Math.sin(time / 62) : 0;
        this.hero.setY(floor + stride * 3).setRotation(stride * 0.024);
        if (this.clickingTarget && this.target && Math.abs(this.target.x - this.hero.x) <= reach) {
          this.clickingTarget = false;
          this.tryInteract();
        }
      }
    }

    game = new Phaser.Game({
      type: quality === 'low' ? Phaser.CANVAS : Phaser.AUTO,
      parent,
      width: profile.width,
      height: Math.round(profile.width * height / width),
      backgroundColor: '#111c1a',
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: quality !== 'low', powerPreference: 'low-power' },
      input: { keyboard: { capture: [] }, gamepad: false },
      fps: { target: profile.fps, limit: profile.fps, smoothStep: false },
      audio: { noAudio: true },
      scene: JourneyScene,
    });
  });
}
