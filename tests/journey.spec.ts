import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { advance, newGame, saveKey, startCombat } from '../src/game/state';

function action(page: Page, label: string) {
  return page.getByRole('button', { name: label });
}

async function approach(page: Page, name: string) {
  await action(page, 'Đến mục tiêu').click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}


async function createTraveler(page: Page, name = 'Lữ Khách', origin = 'wanderer') {
  await action(page, 'Bắt đầu hành trình').click();
  await expect(page.getByRole('heading', { name: 'Tạo nhân vật' })).toBeVisible();
  await page.getByLabel('Tên nhân vật').fill(name);
  await page.locator(`input[value="${origin}"]`).check();
  await action(page, 'Bước vào giang hồ').click();
  await expect(action(page, 'Đến mục tiêu')).toBeVisible();
}

async function capture(page: Page, name: string) {
  const dir = process.env.JOURNEY_SCREENSHOT_DIR;
  if (!dir) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true, animations: 'disabled' });
}

test('play both chapters and fetch only the current chapter assets @desktop', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('thien-menh.quality', 'high'));
  const requested: string[] = [];
  const errors: string[] = [];
  page.on('request', request => { requested.push(request.url()); });
  page.on('pageerror', error => { errors.push(error.message); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hành trình giang hồ', exact: true })).toBeVisible();
  await expect(page.locator('.opening-bg')).toBeVisible();
  await capture(page, 'main-menu');
  expect(requested.some(url => /\/assets\/engine-/.test(url))).toBe(false);
  await createTraveler(page, 'Mộc Vân');
  await expect(page.locator('#hero-name')).toHaveText('Mộc Vân');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('#world')).toHaveAttribute('data-quality', 'high');
  await capture(page, 'gameplay');
  await expect(action(page, 'Đến mục tiêu')).toBeVisible();
  // Release in the same browser as the frame that enters range. A remote
  // Playwright round trip can be slower than the time it takes to walk past.
  await page.evaluate(() => {
    const world = document.querySelector('#world')!;
    const observer = new MutationObserver(() => {
      if (world.getAttribute('data-near-target') !== 'true') return;
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }));
      observer.disconnect();
    });
    observer.observe(world, { attributes: true, attributeFilter: ['data-near-target'] });
  });
  await page.keyboard.down('ArrowRight');
  await expect(page.locator('#world')).toHaveAttribute('data-near-target', 'true');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Lão Chu', exact: true })).toBeVisible();
  await expect(page.locator('.dialogue-portrait')).toBeVisible();
  await capture(page, 'dialogue');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Đưa dân làng sang bờ an toàn.').click();
  await approach(page, 'Đèn dẫn lối');
  await expect(page.getByText(/Từng chiếc thuyền rời bến/)).toBeVisible();
  await action(page, 'Tiếp theo').click();
  await action(page, 'Đi về phía tiếng động.').click();
  await approach(page, 'Khách áo đen');
  await action(page, 'Rút kiếm.').click();
  await action(page, 'Kiếm kỹ').click();
  await action(page, 'Trảm kích').click();
  await expect(page.getByText(/Đối thủ tụ lực/)).toBeVisible();
  await action(page, 'Trảm kích').click();
  await approach(page, 'Đường lên núi');
  await action(page, 'Rời bến Vân Thủy.').click();
  expect(requested.some(url => /\/assets\/(chapter01|yan)-/.test(url))).toBe(false);

  await action(page, 'Đến Tàng Phong').click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('#world')).toHaveAttribute('data-disposed', '1');
  await approach(page, 'Yên Ly');
  await expect(page.getByText(/Lão Chu đã đưa mọi người qua sông/)).toBeVisible();
  await action(page, 'Tiếp theo').click();
  await action(page, 'Nhận lời.').click();
  await action(page, 'Việc phụ · Gửi một ánh đèn').click();
  await approach(page, 'Đèn trước sơn môn');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Thắp đèn và nhận thuốc.').click();
  await expect(page.locator('#hero-level')).toHaveText('Cấp 2 · 70 Kinh nghiệm');
  await approach(page, 'Bia Khắc Gió');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Đến tọa thiền.').click();
  await approach(page, 'Bồ đoàn đá');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Học Phá Phong.').click();
  await expect(page.getByText('Tâm pháp Phá Phong', { exact: true })).toBeVisible();
  await approach(page, 'Hộ vệ Vô Danh');
  await action(page, 'Nhận lời thách đấu.').click();
  await capture(page, 'combat');
  await action(page, 'Kiếm kỹ').click();
  await action(page, 'Kiếm kỹ').click();
  await expect(action(page, 'Kiếm kỹ')).toBeDisabled();
  await action(page, 'Thủ thế').click();
  await action(page, 'Kiếm kỹ').click();
  await approach(page, 'Yên Ly');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Khép lại chương.').click();
  await expect(page.getByRole('heading', { name: 'Sương trên Tàng Phong' })).toBeVisible();
  await expect(page.getByText(/Điều kiện mở Chương 02 đã đạt/)).toBeVisible();
  await action(page, 'Túi đồ').click();
  await action(page, 'Trang bị Kiếm Tàng Phong').click();
  await expect(page.getByText(/Đã trang bị Kiếm Tàng Phong/)).toBeVisible();
  await action(page, 'Đóng').click();

  requested.length = 0;
  await page.reload();
  await action(page, 'Tiếp tục hành trình').click();
  await expect(page.getByRole('heading', { name: 'Sương trên Tàng Phong' })).toBeVisible();
  expect(requested.some(url => /\/assets\/(prologue|ferryman)-/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});

test('touch controls, persisted alternate choice and QR @mobile', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('thien-menh.save.v1')) localStorage.setItem('thien-menh.save.v1', '{broken');
    if (!localStorage.getItem('thien-menh.quality')) localStorage.setItem('thien-menh.quality', 'medium');
  });
  await page.goto('/');
  await expect(page.getByText(/Tiến độ cũ bị lỗi/)).toBeVisible();
  await createTraveler(page, 'Tiểu Trúc', 'guardian');
  await expect(page.locator('#hp-stat progress')).toHaveAttribute('max', '42');
  await expect(action(page, 'Đến mục tiêu')).toBeVisible();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await canvas.tap({ position: { x: box.width * 375 / 960, y: box.height * 0.7 } });
  await expect(page.getByRole('heading', { name: 'Lão Chu', exact: true })).toBeVisible();
  await action(page, 'Tiếp theo').tap();
  await action(page, 'Giữ ông ở đây. Tôi sẽ dẫn hắn đi.').tap();
  await page.reload();
  await action(page, 'Tiếp tục hành trình').tap();
  await approach(page, 'Đèn dẫn lối');
  await expect(page.getByText(/Lão Chu tắt đèn bên bến/)).toBeVisible();
  await capture(page, 'mobile');
  await action(page, 'Tiếp theo').tap();
  await action(page, 'Đi về phía tiếng động.').tap();
  await action(page, 'Túi đồ').tap();
  await action(page, 'Trang bị Kiếm đồng bến đò').tap();
  await action(page, 'Đóng').tap();
  await approach(page, 'Khách áo đen');
  await action(page, 'Rút kiếm.').tap();
  await action(page, 'Trảm kích').tap();
  await page.reload();
  await action(page, 'Tiếp tục hành trình').tap();
  await expect(page.getByText('Giao đấu · Lượt 2')).toBeVisible();
  await action(page, 'Thiết lập').tap();
  await page.getByLabel('Chất lượng đồ họa').selectOption('low');
  await action(page, 'Áp dụng').tap();
  await expect(page.locator('#world')).toHaveAttribute('data-render-width', '640');
  await expect(page.locator('#world')).toHaveAttribute('data-renderer', 'canvas');
  await expect(page.locator('#world')).toHaveAttribute('data-disposed', '1');
  await expect(page.locator('#world')).toHaveAttribute('data-textures', '4');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByText('Giao đấu · Lượt 2')).toBeVisible();
  const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  expect(noHorizontalScroll).toBe(true);
  await page.getByRole('button', { name: 'Chia sẻ', exact: true }).tap();
  await expect(page.getByRole('dialog').getByRole('img', { name: /Mã QR/ })).toBeVisible();
  await expect(page.getByLabel('Liên kết trò chơi')).toHaveValue('http://127.0.0.1:4174/');
});

test('defeat and retry preserve the encounter @desktop', async ({ page }) => {
  const battle = startCombat(advance(advance(newGame(), 'resolve')));
  const save = { ...battle, hp: 1 };
  await page.addInitScript(({ saveKey, save }) => {
    localStorage.setItem(saveKey, JSON.stringify(save));
    localStorage.setItem('thien-menh.quality', 'low');
  }, { saveKey, save });
  await page.goto('/');
  await action(page, 'Tiếp tục hành trình').click();
  await action(page, 'Thủ thế').click();
  await expect(page.getByText(/Bạn kiệt sức/)).toBeVisible();
  await action(page, 'Hồi sức và thử lại').click();
  await expect(page.locator('#hp-stat progress')).toHaveAttribute('value', '36');
  await approach(page, 'Khách áo đen');
  await action(page, 'Rút kiếm.').click();
  await expect(page.getByText('Giao đấu · Lượt 1')).toBeVisible();
  await expect(page.getByRole('progressbar', {name: 'Sinh lực đối thủ'})).toHaveAttribute('value', '22');
});
