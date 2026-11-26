import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

function action(page: Page, label: string) {
  return page.getByRole('button', { name: label });
}

async function approach(page: Page, name: string) {
  await action(page, 'Đến mục tiêu').click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}

test('play both chapters and fetch only the current chapter assets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const requested: string[] = [];
  const errors: string[] = [];
  page.on('request', request => { requested.push(request.url()); });
  page.on('pageerror', error => { errors.push(error.message); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hành trình giang hồ', exact: true })).toBeVisible();
  if (process.env.JOURNEY_SCREENSHOT) await page.screenshot({ path: process.env.JOURNEY_SCREENSHOT });
  expect(requested.some(url => /\/assets\/engine-/.test(url))).toBe(false);
  await action(page, 'Bắt đầu hành trình').click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(action(page, 'Đến mục tiêu')).toBeVisible();
  await page.keyboard.down('ArrowRight');
  await expect(async () => {
    await page.keyboard.press('e');
    await expect(page.getByRole('heading', { name: 'Lão Chu', exact: true })).toBeVisible({ timeout: 250 });
  }).toPass();
  await page.keyboard.up('ArrowRight');
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
  await approach(page, 'Yên Ly');
  await expect(page.getByText(/Lão Chu đã đưa mọi người qua sông/)).toBeVisible();
  await action(page, 'Tiếp theo').click();
  await action(page, 'Nhận lời.').click();
  await approach(page, 'Bia Khắc Gió');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Đến tọa thiền.').click();
  await approach(page, 'Bồ đoàn đá');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Học Phá Phong.').click();
  await expect(page.getByText('Tâm pháp Phá Phong', { exact: true })).toBeVisible();
  await approach(page, 'Hộ vệ Vô Danh');
  await action(page, 'Nhận lời thách đấu.').click();
  await action(page, 'Kiếm kỹ').click();
  await action(page, 'Kiếm kỹ').click();
  await expect(action(page, 'Kiếm kỹ')).toBeDisabled();
  await action(page, 'Thủ thế').click();
  await action(page, 'Kiếm kỹ').click();
  await approach(page, 'Yên Ly');
  await action(page, 'Tiếp theo').click();
  await action(page, 'Khép lại chương.').click();
  await expect(page.getByRole('heading', { name: 'Sương trên Tàng Phong' })).toBeVisible();

  requested.length = 0;
  await page.reload();
  await action(page, 'Tiếp tục hành trình').click();
  await expect(page.getByRole('heading', { name: 'Sương trên Tàng Phong' })).toBeVisible();
  expect(requested.some(url => /\/assets\/(prologue|ferryman)-/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});

test('touch controls, persisted alternate choice and QR', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await action(page, 'Bắt đầu hành trình').tap();
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
  const noHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  expect(noHorizontalScroll).toBe(true);
  await page.getByRole('button', { name: 'Chia sẻ', exact: true }).tap();
  await expect(page.getByRole('dialog').getByRole('img', { name: /Mã QR/ })).toBeVisible();
  await expect(page.getByLabel('Liên kết trò chơi')).toHaveValue('http://127.0.0.1:4174/');
});
