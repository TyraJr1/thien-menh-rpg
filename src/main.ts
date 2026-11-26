import '@fontsource-variable/playfair-display';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import './style.css';
import { art, chapters, landscape } from './chapters/art';
import { loadChapter } from './chapters/load';
import type { Chapter, Interaction } from './chapters/types';
import {
  advance, bossEnraged, chapterReward, combatStep, encounters, enterChapter, equip, finishSideQuest,
  isCharging, newGame, ownedBlades, parseSave, playMove, recover, saveKey, sideAvailable,
  startCombat, stepLimit, useMedicine,
} from './game/state';
import type { GameState, Move } from './game/state';
import type { World } from './game/world';
import { attributes, blades, origins, validName, validOrigin } from './game/character';
import type { Blade } from './game/character';
import { autoQuality, qualities, readQuality, saveQuality } from './game/quality';
import type { Quality, QualityPreference } from './game/quality';
import { playSound, soundOn, toggleAudio } from './game/audio';

const portrait = new URL('./art/portrait.webp', import.meta.url).href;
const app = document.querySelector<HTMLElement>('#app')!;
let saved: GameState | null = null;
let canSave = true;
let brokenSave = false;
try {
  const raw = localStorage.getItem(saveKey);
  saved = parseSave(raw);
  brokenSave = Boolean(raw && !saved);
} catch {
  canSave = false;
}
let state = saved ?? newGame();
let world: World | undefined;
let chapter: Chapter | undefined;
let dialogue: { target: Interaction; lines: string[]; line: number } | undefined;
let loading = false;
let active = false;
let seekingSide = false;
let qualityPreference = readQuality();
let quality: Quality = qualityPreference === 'auto' ? autoQuality() : qualityPreference;
let noticeTimer = 0;

app.innerHTML = `
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="./" aria-label="Thiên Mệnh">
      <span class="seal" aria-hidden="true">天</span>
      <span>Thiên Mệnh<small>Hành trình giang hồ</small></span>
    </a>
    <nav aria-label="Điều hướng">
      <a href="#journey" class="nav-home" aria-current="page">Hành trình</a>
      <button data-action="settings">Thiết lập</button>
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
          <span><span id="stage-edition"></span> <span class="stage-divider">·</span> <span id="quality-label"></span></span>
        </div>
        <div class="viewport">
          <div id="world" class="world" aria-label="Cảnh trò chơi" role="img"></div>
          <span id="nearby-hint" class="nearby-hint" aria-hidden="true">E · Tương tác</span>
          <div id="intro"></div>
          <div id="game-toast" class="game-toast" role="status" hidden></div>
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
        <button class="button quiet side-task" data-action="side" hidden></button>
      </section>
      <section class="card hero-card">
        <div class="card-heading"><span class="card-icon" aria-hidden="true">♧</span><h2>Nhân vật</h2></div>
        <div class="identity"><img src="${portrait}" width="49" height="49" alt=""><div><strong id="hero-name">Lữ Khách</strong><small id="hero-level"></small><small id="technique">Chưa học tâm pháp</small></div></div>
        <div class="stat" id="hp-stat"></div>
        <div class="stat qi" id="qi-stat"></div>
        <div class="stat spirit" id="spirit-stat"></div>
        <button class="button quiet bag-button" data-action="bag" hidden>Túi đồ <span aria-hidden="true">↗</span></button>
      </section>
    </aside>
  </div>
  <footer><span><span class="diamond" aria-hidden="true"></span> Thiên Mệnh</span><span>Khúc dạo &amp; Chương 01</span></footer>
</main>
<dialog id="modal" aria-labelledby="modal-title"></dialog>`;

function byId<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id)! as T;
}

const stage = byId('world');
const intro = byId('intro');
const panel = byId('play-panel');
const controls = byId('controls');
const modal = byId<HTMLDialogElement>('modal');

function announce(message: string) {
  const toast = byId('game-toast');
  window.clearTimeout(noticeTimer);
  toast.textContent = message;
  toast.hidden = false;
  noticeTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
}

function save(next: GameState) {
  state = next;
  brokenSave = false;
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

function currentTarget() {
  return seekingSide ? chapter?.sideQuest : chapter?.scenes[state.step];
}

function refresh() {
  const meta = chapters[state.chapter];
  const target = currentTarget();
  const stats = attributes(state);
  document.documentElement.classList.toggle('playing', active);
  document.documentElement.dataset.quality = quality;
  setText('quality-label', qualities[quality].label);
  setText('location', meta.location);
  setText('stage-edition', meta.edition);
  setText('technique', state.technique === 'compassion' ? 'Tâm pháp Sinh Tức' : state.technique === 'resolve' ? 'Tâm pháp Phá Phong' : 'Chưa học tâm pháp');
  setText('save-indicator', !canSave ? 'Không thể lưu tiến độ' : active ? '●  Đã lưu trên trình duyệt' : '');
  stage.setAttribute('aria-label', target ? `${meta.location} · Mục tiêu: ${target.name}` : meta.location);
  setText('objective', target?.objective ?? (active ? 'Đã hoàn thành chương.' : 'Bắt đầu hành trình để mở nhiệm vụ đầu tiên.'));
  setText('hero-name', state.profile.name);
  setText('hero-level', `Cấp ${stats.level} · ${state.xp} Kinh nghiệm`);
  stat('hp-stat', 'Sinh lực', state.hp, stats.maxHp);
  stat('qi-stat', 'Nội lực', state.qi, stats.maxQi);
  stat('spirit-stat', 'Linh lực', state.spirit, stats.spirit);
  const sideButton = document.querySelector<HTMLButtonElement>('.side-task')!;
  sideButton.hidden = !active || !sideAvailable(state) || Boolean(dialogue) || loading;
  sideButton.textContent = seekingSide ? 'Quay lại nhiệm vụ chính' : 'Việc phụ · Gửi một ánh đèn';
  const bagButton = document.querySelector<HTMLButtonElement>('.bag-button')!;
  bagButton.hidden = !active;
  bagButton.disabled = Boolean(dialogue) || loading;
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
    <img class="opening-bg" src="${landscape(state.chapter, quality)}" alt="" fetchpriority="high">
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
  intro.querySelector('.load-error')!.textContent = error ??
    (brokenSave ? 'Tiến độ cũ bị lỗi. Bạn có thể tạo hành trình mới.' : '');
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
    const portraitUrl = dialogue.target.portrait;
    panel.innerHTML = `<div class="dialogue-card">${portraitUrl ? `<img class="dialogue-portrait" src="${portraitUrl}" alt="">` : ''}
      <div><div class="panel-label"></div><h3></h3><p class="dialogue-line"></p><div class="actions"></div></div></div>`;
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
    const stats = attributes(state);
    panel.innerHTML = `
      <div class="battle-title"><div><div class="panel-label">${bossEnraged(state) ? 'Vô Danh phá thế · ' : 'Giao đấu · '}Lượt ${state.combat.turn}</div><h3>${enemy.name}</h3></div>
      <div>${state.combat.enemyHp} / ${enemy.hp}<progress aria-label="Sinh lực đối thủ" value="${state.combat.enemyHp}" max="${enemy.hp}"></progress></div></div>
      <p class="battle-log" aria-live="polite"></p>
      <p class="battle-resources">Sinh lực ${state.hp}/${stats.maxHp} · Nội lực ${state.qi}/${stats.maxQi} · Linh lực ${state.spirit}/${stats.spirit}</p>
      <div class="actions">${state.hp ? `
        <button class="button quiet" data-action="attack">Trảm kích <small>+1 Nội lực</small></button>
        <button class="button jade" data-action="guard">Thủ thế <small>+${state.technique === 'compassion' ? 4 : 3} Nội lực</small></button>
        <button class="button gold" data-action="skill" ${state.qi < 3 ? 'disabled' : ''}>Kiếm kỹ <small>−3 Nội lực</small></button>
        <button class="button quiet" data-action="focus" ${!state.spirit || state.qi === stats.maxQi ? 'disabled' : ''}>Tĩnh tức <small>+5 Nội · −1 Linh</small></button>
        <button class="button quiet" data-action="heal" ${!state.medicine || state.hp === stats.maxHp ? 'disabled' : ''}>Dùng thuốc <small>×${state.medicine}</small></button>
      ` : '<button class="button gold" data-action="recover">Hồi sức và thử lại</button>'}</div>`;
    panel.querySelector('.battle-log')!.textContent = state.hp
      ? `${state.combat.log} ${isCharging(state.combat.turn) ? 'Đối thủ tụ lực cho đòn nặng.' : bossEnraged(state) ? 'Vô Danh phá thế, trảm kích mạnh hơn.' : 'Đối thủ chuẩn bị trảm kích.'}`
      : 'Bạn kiệt sức. Hồi sức để đấu lại từ đầu với đối thủ này.';
  } else {
    panel.innerHTML = `<div class="panel-label">Hoàn thành</div><h3>${chapter!.title}</h3><p></p>
      <div class="actions">${state.chapter === 'prologue'
        ? '<button class="button gold" data-action="next-chapter">Đến Tàng Phong <span aria-hidden="true">→</span></button>'
        : '<button class="button jade" data-action="share">Chia sẻ hành trình <span aria-hidden="true">↗</span></button>'}</div>`;
    panel.querySelector('p')!.textContent = chapter!.ending;
    if (chapterReward(state)) {
      const reward = document.createElement('p');
      reward.className = 'chapter-reward';
      reward.textContent = 'Đã nhận Kiếm Tàng Phong và 40 Kinh nghiệm. Điều kiện mở Chương 02 đã đạt.';
      panel.querySelector('.actions')!.before(reward);
    }
  }
}

function keyboardFocus(selector = 'button:not([disabled])') {
  const button = panel.querySelector<HTMLElement>(selector);
  if (!button) return;
  button.focus({ preventScroll: true });
  if (button.getBoundingClientRect().bottom > innerHeight - 12) button.scrollIntoView({ block: 'nearest' });
}

function isBlocked() {
  return loading || Boolean(dialogue || state.combat || modal.open) || state.step === stepLimit(state.chapter);
}

function openInteraction() {
  const target = currentTarget();
  if (!target || isBlocked()) return;
  dialogue = { target, lines: target.lines(state), line: 0 };
  playSound('bell');
  refresh();
  keyboardFocus();
}

function syncWorld() {
  world?.setObjective(state.step, Boolean(state.combat), seekingSide);
  refresh();
}

async function begin(position?: number) {
  if (loading) return;
  loading = true;
  renderIntro();
  refresh();
  try {
    await world?.destroy();
    world = undefined;
    stage.replaceChildren();
    const [data, { createWorld }] = await Promise.all([loadChapter(state.chapter), import('./game/world')]);
    chapter = data;
    world = await createWorld(stage, chapter, {
      quality, position, interact: openInteraction, isBlocked,
      onSlow: () => {
        if (qualityPreference !== 'auto' || !active || !world || isBlocked()) return false;
        quality = quality === 'high' ? 'medium' : 'low';
        void begin(world.position());
        return true;
      },
    });
    active = true;
    save(state);
    intro.hidden = true;
    intro.replaceChildren();
    announce(`Đã vào ${chapter.location}.`);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stage.animate([{ opacity: 0.45 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' });
    }
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
  const title = modal.querySelector('h2');
  if (title) title.id = 'modal-title';
  if (!modal.open) modal.showModal();
}

function help() {
  openModal(`<h2>Cách chơi</h2>
    <dl><dt>Di chuyển</dt><dd>Dùng A/D, phím mũi tên hoặc chạm điểm muốn đến.</dd>
    <dt>Tương tác</dt><dd>Đến gần dấu ◆ rồi nhấn E. Bạn cũng có thể chạm mục tiêu hoặc dùng nút Đến mục tiêu.</dd>
    <dt>Giao đấu</dt><dd>Trảm kích để tích Khí. Thủ thế khi địch tụ lực, rồi dùng kiếm kỹ khi có ít nhất 3 Nội lực. Tĩnh tức dùng 1 Linh lực để hồi 5 Nội lực.</dd></dl><button class="button quiet" data-action="settings">Trở về thiết lập</button>`);
}

function settings() {
  const options: QualityPreference[] = ['auto', 'low', 'medium', 'high'];
  openModal(`<h2>Thiết lập</h2>
    <label for="quality-select">Chất lượng đồ họa</label>
    <select id="quality-select">${options.map(key => `<option value="${key}" ${qualityPreference === key ? 'selected' : ''}>${key === 'auto' ? 'Auto' : qualities[key].label}</option>`).join('')}</select>
    <p id="quality-description"></p>
    <div class="actions">
      <button class="button gold" data-action="apply-quality" ${loading ? 'disabled' : ''}>Áp dụng</button>
      <button class="button quiet" data-action="audio" aria-pressed="${soundOn()}">Âm thanh</button>
      <button class="button quiet" data-action="help">Cách chơi</button>
    </div>`);
  showQualityDescription();
}

function showQualityDescription() {
  const selected = byId<HTMLSelectElement>('quality-select').value as QualityPreference;
  const recommended = selected === 'auto' ? autoQuality() : selected;
  const profile = qualities[recommended];
  const detail = recommended === 'low' ? 'Canvas 2D, tắt sương và hạt động.' : recommended === 'medium' ? 'Một lớp sương và ít hạt sáng.' : 'Ba lớp sương và nhiều hạt sáng.';
  setText('quality-description', `${selected === 'auto' ? `Đề xuất ${profile.label}. ` : ''}${profile.width}px · tối đa ${profile.fps} FPS. ${detail}`);
}

function createCharacter(replacing = false) {
  openModal(`<h2>Tạo nhân vật</h2>
    <form id="character-form">
      <div class="creation-profile"><img src="${art.heroDetail}" alt=""><div>
        ${replacing ? '<p>Tiến độ hiện tại sẽ được thay khi bắt đầu.</p>' : ''}
        <label for="character-name">Tên nhân vật</label>
        <input id="character-name" name="heroName" required maxlength="24" value="Lữ Khách" autocomplete="off">
      </div></div>
      <fieldset class="origin-options"><legend>Xuất thân</legend>
        ${Object.entries(origins).map(([id, origin]) => `<label><input type="radio" name="origin" value="${id}" ${id === 'wanderer' ? 'checked' : ''}><span><strong>${origin.name}</strong><small>${origin.description}</small></span></label>`).join('')}
      </fieldset>
      <p id="character-error" role="alert"></p>
      <button class="button gold" type="submit">Bước vào giang hồ <span aria-hidden="true">→</span></button>
    </form>`);
  byId<HTMLInputElement>('character-name').focus();
}

function bag(message = '') {
  const stats = attributes(state);
  openModal(`<h2>Túi đồ</h2>
    <p>Cấp ${stats.level} · ${state.xp} Kinh nghiệm · Trảm kích ${stats.attack} sát thương</p>
    <p class="bag-trust">${state.stance === 'compassion' ? 'Lão Chu tin cậy' : state.stance === 'resolve' ? 'Lão Chu biết ơn' : 'Chưa gặp Lão Chu'}${state.chapter === 'chapter01' && state.step > 0 ? state.sideQuest ? ' · Yên Ly cảm kích' : ' · Yên Ly đồng hành' : ''}</p>
    <ul class="inventory">
      ${ownedBlades(state).map(id => `<li><div><strong>${blades[id].name}</strong><small>+${blades[id].attack} sát thương</small></div>
      ${state.blade === id ? '<span class="equipped">Đang dùng</span>' : `<button class="button quiet" data-action="equip" data-blade="${id}" aria-label="Trang bị ${blades[id].name}" ${state.combat ? 'disabled' : ''}>Trang bị</button>`}</li>`).join('')}
      <li><div><strong>Thuốc hồi sinh lực ×${state.medicine}</strong><small>Hồi tối đa 15 Sinh lực</small></div>
        <button class="button quiet" data-action="use-medicine" ${!state.medicine || state.hp === stats.maxHp || state.combat ? 'disabled' : ''}>Dùng</button></li>
    </ul>
    ${state.combat ? '<p>Trong giao đấu, hãy dùng thuốc từ bảng hành động.</p>' : ''}
    <p id="bag-status" role="status"></p>`);
  setText('bag-status', message);
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
  const before = state;
  const next = seekingSide ? finishSideQuest(state)
    : state.step === combatStep(state.chapter) ? startCombat(state) : advance(state, choice.stance);
  seekingSide = false;
  save(next);
  if (!before.technique && next.technique) { world?.cultivate(); playSound('skill'); }
  if (!before.sideQuest && next.sideQuest) { announce('Đã thắp đèn · +20 Kinh nghiệm, +1 thuốc.'); playSound('reward'); }
  else if (next.medicine > before.medicine) announce('Lão Chu để lại một gói thuốc.');
  else if (ownedBlades(next).length > ownedBlades(before).length && !chapterReward(next)) announce('Nhặt được Kiếm đồng bến đò.');
  if (next.step === stepLimit(next.chapter)) playSound('reward');
  syncWorld();
  if (!panel.hidden) keyboardFocus();
  else controls.querySelector<HTMLButtonElement>('.interact')?.focus({ preventScroll: true });
}

function fight(move: Move) {
  const next = playMove(state, move);
  if (next === state) return;
  const won = next.combat === null;
  world?.strike(move);
  playSound(move === 'attack' ? 'strike' : move === 'skill' ? 'skill' : 'guard');
  save(next);
  if (won) {
    syncWorld();
    const gained = encounters[state.chapter].xp;
    announce(`Thắng trận · +${gained} Kinh nghiệm.`);
    playSound('reward');
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
    case 'start':
      if (loading) break;
      if (saved || active) { playSound('bell'); await begin(); }
      else createCharacter();
      break;
    case 'settings': settings(); break;
    case 'audio':
      toggleAudio();
      button.setAttribute('aria-pressed', String(soundOn()));
      break;
    case 'apply-quality': {
      const preference = byId<HTMLSelectElement>('quality-select').value as QualityPreference;
      const next = preference === 'auto' ? autoQuality() : preference;
      qualityPreference = preference;
      saveQuality(preference);
      modal.close();
      if (quality === next) break;
      quality = next;
      if (active) await begin(world?.position());
      else { renderIntro(); refresh(); }
      break;
    }
    case 'bag': bag(); break;
    case 'equip': {
      const next = equip(state, button.dataset.blade as Blade);
      if (next !== state) {
        save(next);
        refresh();
        bag(`Đã trang bị ${blades[state.blade].name}.`);
        modal.querySelector<HTMLElement>('.close')?.focus();
      }
      break;
    }
    case 'use-medicine':
      if (!state.combat) { save(useMedicine(state)); refresh(); bag('Đã dùng thuốc.'); }
      break;
    case 'side':
      if (!isBlocked() && sideAvailable(state)) { seekingSide = !seekingSide; syncWorld(); }
      break;
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
    case 'heal':
    case 'focus':
      fight(action);
      break;
    case 'recover': save(recover(state)); syncWorld(); break;
    case 'next-chapter': {
      const next = enterChapter(state);
      if (next === state) return;
      chapter = undefined;
      seekingSide = false;
      save(next);
      await begin();
      break;
    }
    case 'reset':
      if (!loading) createCharacter(true);
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

modal.addEventListener('change', event => {
  if (event.target instanceof HTMLSelectElement && event.target.id === 'quality-select') showQualityDescription();
});

modal.addEventListener('submit', async event => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'character-form') return;
  event.preventDefault();
  if (loading) return;
  const form = new FormData(event.target);
  const name = String(form.get('heroName') ?? '').trim();
  const origin = form.get('origin');
  if (!validName(name) || !validOrigin(origin)) {
    setText('character-error', 'Dùng từ 1 đến 24 ký tự gồm chữ, số, dấu cách hoặc dấu nối.');
    return;
  }
  modal.close();
  dialogue = undefined;
  chapter = undefined;
  seekingSide = false;
  save(newGame({ name, origin }));
  playSound('bell');
  await begin();
});

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e' || modal.open) return;
  if (dialogue) panel.querySelector<HTMLButtonElement>('[data-action="line"]')?.click();
  else world?.tryInteract();
});

renderIntro();
refresh();
