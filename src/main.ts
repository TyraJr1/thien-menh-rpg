import '@fontsource-variable/playfair-display';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import './style.css';
import { art, chapters } from './chapters/art';
import { loadChapter } from './chapters/load';
import type { Chapter, Interaction } from './chapters/types';
import {
  advance, combatStep, encounters, enterChapter, isCharging, maxHp, maxQi,
  newGame, parseSave, playMove, recover, saveKey, startCombat, stepLimit,
} from './game/state';
import type { GameState, Move } from './game/state';
import type { World } from './game/world';

const portrait = new URL('./art/portrait.webp', import.meta.url).href;
const app = document.querySelector<HTMLElement>('#app')!;
let saved: GameState | null = null;
let canSave = true;
try {
  saved = parseSave(localStorage.getItem(saveKey));
} catch {
  canSave = false;
}
let state = saved ?? newGame();
let world: World | undefined;
let chapter: Chapter | undefined;
let dialogue: { target: Interaction; lines: string[]; line: number } | undefined;
let loading = false;
let active = false;

app.innerHTML = `
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="./" aria-label="Thiên Mệnh">
      <span class="seal" aria-hidden="true">天</span>
      <span>Thiên Mệnh<small>Hành trình giang hồ</small></span>
    </a>
    <nav aria-label="Điều hướng">
      <a href="#journey" class="nav-home" aria-current="page">Hành trình</a>
      <button class="nav-help" data-action="help">Cách chơi</button>
    </nav>
    <button class="button quiet share" data-action="share"><span aria-hidden="true">↗</span> Chia sẻ</button>
  </div>
</header>
<main id="journey" class="shell">
  <div class="masthead">
    <div>
      <div class="eyebrow"><span class="diamond" aria-hidden="true"></span> Kiếm hiệp nhập vai</div>
      <h1>Hành trình giang hồ</h1>
    </div>
    <button class="button quiet restart" data-action="reset" hidden>Chơi lại</button>
  </div>
  <div class="layout">
    <section class="game-col" aria-label="Trò chơi">
      <div class="frame">
        <div class="stage-header">
          <div><span class="signal" aria-hidden="true"></span><span id="location"></span></div>
          <span id="stage-edition"></span>
        </div>
        <div class="viewport">
          <div id="world" class="world" aria-label="Cảnh trò chơi" role="img"></div>
          <div id="intro"></div>
        </div>
        <div id="play-panel" class="play-panel" hidden></div>
        <div id="controls" class="controls" hidden>
          <button class="button quiet direction" data-action="left" aria-label="Di chuyển trái">←</button>
          <button class="button quiet direction" data-action="right" aria-label="Di chuyển phải">→</button>
          <button class="button jade interact" data-action="approach">Đến mục tiêu <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div class="game-foot">
        <span><kbd>A</kbd> <kbd>D</kbd> Di chuyển <span class="key-sep"></span> <kbd>E</kbd> Tương tác</span>
        <span id="save-indicator"></span>
      </div>
    </section>
    <aside aria-label="Thông tin hành trình">
      <section class="card chapter-card">
        <div class="card-heading"><span class="card-icon" aria-hidden="true">◇</span><h2>Hành trình</h2></div>
        <div id="chapter-list" class="chapter-list"></div>
      </section>
      <section class="card">
        <div class="card-heading"><span class="card-icon" aria-hidden="true">✧</span><h2>Nhiệm vụ</h2></div>
        <p id="objective"></p>
      </section>
      <section class="card hero-card">
        <div class="card-heading"><span class="card-icon" aria-hidden="true">♧</span><h2>Nhân vật</h2></div>
        <div class="identity"><img src="${portrait}" width="49" height="49" alt=""><div><strong>Lữ Khách</strong><small id="technique">Chưa học tâm pháp</small></div></div>
        <div class="stat" id="hp-stat"></div>
        <div class="stat qi" id="qi-stat"></div>
      </section>
    </aside>
  </div>
  <footer><span><span class="diamond" aria-hidden="true"></span> Thiên Mệnh</span><span>Khúc dạo &amp; Chương 01</span></footer>
</main>
<dialog id="modal"></dialog>
<div class="sr-only" id="announcement" role="status"></div>`;

function byId<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id)! as T;
}

const stage = byId('world');
const intro = byId('intro');
const panel = byId('play-panel');
const controls = byId('controls');
const modal = byId<HTMLDialogElement>('modal');

function announce(message: string) {
  byId('announcement').textContent = message;
}

function save(next: GameState) {
  state = next;
  try {
    localStorage.setItem(saveKey, JSON.stringify(state));
    saved = state;
    canSave = true;
  } catch {
    canSave = false;
  }
}

function setText(id: string, text: string) {
  byId(id).textContent = text;
}

function stat(id: string, name: string, value: number, max: number) {
  byId(id).innerHTML = `<div><span>${name}</span><span>${value} / ${max}</span></div><progress aria-label="${name}" value="${value}" max="${max}"></progress>`;
}

function refresh() {
  const meta = chapters[state.chapter];
  const target = chapter?.scenes[state.step];
  setText('location', meta.location);
  setText('stage-edition', meta.edition);
  setText('technique', state.technique === 'compassion' ? 'Tâm pháp Sinh Tức' : state.technique === 'resolve' ? 'Tâm pháp Phá Phong' : 'Chưa học tâm pháp');
  setText('save-indicator', !canSave ? 'Không thể lưu tiến độ' : active ? '●  Đã lưu trên trình duyệt' : '');
  stage.setAttribute('aria-label', target ? `${meta.location} · Mục tiêu: ${target.name}` : meta.location);
  setText('objective', target?.objective ?? (active ? 'Đã hoàn thành chương.' : 'Bắt đầu hành trình để mở nhiệm vụ đầu tiên.'));
  stat('hp-stat', 'Sinh lực', state.hp, maxHp);
  stat('qi-stat', 'Khí', state.qi, maxQi);
  document.querySelector<HTMLButtonElement>('.restart')!.hidden = !saved && !active;
  byId('chapter-list').innerHTML = `
    <div class="chapter-entry ${state.chapter === 'prologue' ? 'current' : ''}" ${state.chapter === 'prologue' ? 'aria-current="step"' : ''}>
      <span class="chapter-num" aria-hidden="true">${state.chapter === 'chapter01' ? '✓' : '序'}</span>
      <span><small>Khúc dạo</small><strong>Đêm ở bến Vân Thủy</strong></span>
      <span class="chapter-state" aria-hidden="true">◆</span>
    </div>
    <div class="chapter-entry ${state.chapter === 'chapter01' ? 'current' : ''}" ${state.chapter === 'chapter01' ? 'aria-current="step"' : ''}>
      <span class="chapter-num" aria-hidden="true">01</span>
      <span><small>Chương 01</small><strong>Sương trên Tàng Phong</strong></span>
      <span class="chapter-state" aria-hidden="true">${state.chapter === 'chapter01' ? '◆' : '○'}</span>
    </div>`;
  renderPanel();
}

function renderIntro(error?: string) {
  const meta = chapters[state.chapter];
  intro.hidden = false;
  intro.innerHTML = `
    <img class="opening-bg" src="${art[state.chapter]}" alt="" fetchpriority="high">
    <div class="opening-wash"></div>
    <div class="opening-content">
      <span class="eyebrow"><span class="diamond" aria-hidden="true"></span> ${meta.edition}</span>
      <h2>${state.chapter === 'prologue' ? 'Thiên Mệnh' : meta.title}</h2>
      <p>${state.chapter === 'prologue' ? 'Đêm ở bến Vân Thủy' : meta.location}</p>
      <button class="button gold" data-action="start" ${loading ? 'disabled' : ''}>
        ${loading ? 'Đang tải cảnh…' : error ? 'Thử tải lại' : saved ? 'Tiếp tục hành trình' : 'Bắt đầu hành trình'}
        <span aria-hidden="true">→</span>
      </button>
      <div class="load-error" role="status"></div>
    </div>`;
  intro.querySelector('.load-error')!.textContent = error ?? '';
}

function renderPanel() {
  controls.hidden = !active || loading || Boolean(dialogue || state.combat) || state.step === stepLimit(state.chapter);
  panel.hidden = !active || loading || !(dialogue || state.combat || state.step === stepLimit(state.chapter));
  if (panel.hidden) {
    panel.replaceChildren();
    return;
  }
  if (dialogue) {
    const more = dialogue.line < dialogue.lines.length - 1;
    panel.innerHTML = `<div class="panel-label"></div><h3></h3><p class="dialogue-line"></p><div class="actions"></div>`;
    panel.querySelector('.panel-label')!.textContent = dialogue.target.label;
    panel.querySelector('h3')!.textContent = dialogue.target.name;
    panel.querySelector('.dialogue-line')!.textContent = dialogue.lines[dialogue.line];
    const actions = panel.querySelector('.actions')!;
    if (more) {
      actions.innerHTML = '<button class="button gold" data-action="line">Tiếp theo <span aria-hidden="true">→</span></button>';
    } else {
      dialogue.target.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'button jade';
        button.dataset.action = `choice-${index}`;
        button.textContent = choice.text;
        actions.append(button);
      });
    }
  } else if (state.combat) {
    const enemy = encounters[state.chapter];
    panel.innerHTML = `
      <div class="battle-title"><div><div class="panel-label">Giao đấu · Lượt ${state.combat.turn}</div><h3>${enemy.name}</h3></div>
      <div>${state.combat.enemyHp} / ${enemy.hp}<progress aria-label="Sinh lực đối thủ" value="${state.combat.enemyHp}" max="${enemy.hp}"></progress></div></div>
      <p class="battle-log" aria-live="polite"></p>
      <div class="actions">${state.hp ? `
        <button class="button quiet" data-action="attack">Trảm kích <small>+1 Khí</small></button>
        <button class="button jade" data-action="guard">Thủ thế <small>+${state.technique === 'compassion' ? 4 : 3} Khí</small></button>
        <button class="button gold" data-action="skill" ${state.qi < 3 ? 'disabled' : ''}>Kiếm kỹ <small>−3 Khí</small></button>
      ` : '<button class="button gold" data-action="recover">Hồi sức và thử lại</button>'}</div>`;
    panel.querySelector('.battle-log')!.textContent = state.hp
      ? `${state.combat.log} ${isCharging(state.combat.turn) ? 'Đối thủ tụ lực cho đòn nặng.' : 'Đối thủ chuẩn bị trảm kích.'}`
      : 'Bạn kiệt sức. Hồi sức để đấu lại từ đầu với đối thủ này.';
  } else {
    panel.innerHTML = `<div class="panel-label">Hoàn thành</div><h3>${chapter!.title}</h3><p></p>
      <div class="actions">${state.chapter === 'prologue'
        ? '<button class="button gold" data-action="next-chapter">Đến Tàng Phong <span aria-hidden="true">→</span></button>'
        : '<button class="button jade" data-action="share">Chia sẻ hành trình <span aria-hidden="true">↗</span></button>'}</div>`;
    panel.querySelector('p')!.textContent = chapter!.ending;
  }
}

function keyboardFocus(selector = 'button:not([disabled])') {
  panel.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
}

function isBlocked() {
  return loading || Boolean(dialogue || state.combat || modal.open) || state.step === stepLimit(state.chapter);
}

function openInteraction() {
  const target = chapter?.scenes[state.step];
  if (!target || isBlocked()) return;
  dialogue = { target, lines: target.lines(state), line: 0 };
  renderPanel();
  keyboardFocus();
}

function syncWorld() {
  world?.setObjective(state.step, Boolean(state.combat));
  refresh();
}

async function begin() {
  if (loading) return;
  loading = true;
  renderIntro();
  refresh();
  try {
    world?.destroy();
    world = undefined;
    stage.replaceChildren();
    const [data, { createWorld }] = await Promise.all([loadChapter(state.chapter), import('./game/world')]);
    chapter = data;
    world = await createWorld(stage, chapter, openInteraction, isBlocked);
    active = true;
    save(state);
    intro.hidden = true;
    intro.replaceChildren();
    announce(`Đã vào ${chapter.location}.`);
  } catch (error) {
    console.error(error);
    active = false;
    loading = false;
    renderIntro('Không thể tải cảnh. Kiểm tra kết nối rồi thử lại.');
  } finally {
    loading = false;
    syncWorld();
    if (active && !panel.hidden) keyboardFocus();
  }
}

function openModal(content: string) {
  modal.innerHTML = `<div class="modal-top"><span class="seal" aria-hidden="true">天</span><button class="button quiet close" data-action="close" aria-label="Đóng">×</button></div>${content}`;
  if (!modal.open) modal.showModal();
}

function help() {
  openModal(`<h2>Cách chơi</h2>
    <dl><dt>Di chuyển</dt><dd>Dùng A/D, phím mũi tên hoặc chạm điểm muốn đến.</dd>
    <dt>Tương tác</dt><dd>Đến gần dấu ◆ rồi nhấn E. Bạn cũng có thể chạm mục tiêu hoặc dùng nút Đến mục tiêu.</dd>
    <dt>Giao đấu</dt><dd>Trảm kích để tích Khí. Thủ thế khi địch tụ lực, rồi dùng kiếm kỹ khi có ít nhất 3 Khí.</dd></dl>`);
}

async function share() {
  openModal(`<h2>Chia sẻ hành trình</h2><p>Gửi liên kết hoặc quét mã QR để mở game.</p>
    <div id="qr" aria-live="polite">Đang tạo mã QR…</div>
    <label for="share-url">Liên kết trò chơi</label>
    <div class="share-field"><input id="share-url" type="url" readonly><button class="button gold" data-action="copy">Sao chép</button></div>
    <p id="copy-status" role="status"></p>`);
  const url = new URL(import.meta.env.BASE_URL, location.origin).href;
  byId<HTMLInputElement>('share-url').value = url;
  const output = byId('qr');
  try {
    const { toDataURL } = await import('qrcode');
    const img = new Image(176, 176);
    img.alt = 'Mã QR mở liên kết trò chơi';
    img.src = await toDataURL(url, { width: 176, margin: 2 });
    output.replaceChildren(img);
  } catch {
    output.textContent = 'Không thể tạo mã QR. Bạn có thể sao chép liên kết bên dưới.';
  }
}

function choose(index: number) {
  if (!dialogue || dialogue.line !== dialogue.lines.length - 1) return;
  const choice = dialogue.target.choices[index];
  if (!choice) return;
  dialogue = undefined;
  const next = state.step === combatStep(state.chapter) ? startCombat(state) : advance(state, choice.stance);
  save(next);
  syncWorld();
  if (!panel.hidden) keyboardFocus();
  else controls.querySelector<HTMLButtonElement>('.interact')?.focus({ preventScroll: true });
}

function fight(move: Move) {
  const next = playMove(state, move);
  if (next === state) return;
  const won = next.combat === null;
  world?.strike(move);
  save(next);
  if (won) {
    syncWorld();
    announce('Thắng trận.');
    controls.querySelector<HTMLButtonElement>('.interact')?.focus({ preventScroll: true });
  } else {
    refresh();
    keyboardFocus(next.hp ? `[data-action="${move}"]:not([disabled]), [data-action="attack"]` : '[data-action="recover"]');
  }
}

document.addEventListener('click', async event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('button[data-action]');
  const action = button?.dataset.action;
  if (!action || button.disabled) return;
  switch (action) {
    case 'start': await begin(); break;
    case 'help': help(); break;
    case 'share': await share(); break;
    case 'close': modal.close(); break;
    case 'left': world?.nudge(-1); break;
    case 'right': world?.nudge(1); break;
    case 'approach': world?.approach(); break;
    case 'line':
      if (dialogue && dialogue.line < dialogue.lines.length - 1) {
        dialogue.line++;
        renderPanel();
        keyboardFocus();
      }
      break;
    case 'attack':
    case 'guard':
    case 'skill':
      fight(action);
      break;
    case 'recover': save(recover(state)); syncWorld(); break;
    case 'next-chapter': {
      const next = enterChapter(state);
      if (next === state) return;
      chapter = undefined;
      save(next);
      await begin();
      break;
    }
    case 'reset':
      openModal('<h2>Chơi lại từ đầu?</h2><p>Tiến độ trên trình duyệt này sẽ được thay bằng một hành trình mới.</p><button class="button gold" data-action="confirm-reset">Bắt đầu lại</button>');
      break;
    case 'confirm-reset':
      if (loading) return;
      modal.close();
      dialogue = undefined;
      chapter = undefined;
      save(newGame());
      await begin();
      break;
    case 'copy': {
      const field = byId<HTMLInputElement>('share-url');
      const status = byId('copy-status');
      try {
        await navigator.clipboard.writeText(field.value);
        status.textContent = 'Đã sao chép liên kết.';
      } catch {
        field.select();
        status.textContent = 'Hãy sao chép liên kết đã chọn.';
      }
      break;
    }
    default:
      if (action.startsWith('choice-')) choose(Number(action.slice(7)));
  }
});

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e' || modal.open) return;
  if (dialogue) panel.querySelector<HTMLButtonElement>('[data-action="line"]')?.click();
  else world?.tryInteract();
});

renderIntro();
refresh();
