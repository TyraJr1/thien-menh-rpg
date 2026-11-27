import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const stage = (page: Page) => page.locator('#game');
const value = async (page: Page,key: string) => Number(await stage(page).getAttribute('data-'+key));
const button = (page: Page,name: string) => page.getByRole('button',{name,exact:true});
async function enter(page:Page,again=false){
  await button(page,again?'Tiếp tục hành trình':'Bước vào giang hồ').click();
  await expect(stage(page)).toHaveAttribute('data-mode','play');
}
async function shot(page:Page,name:string){
  const path=process.env.TM3D_SHOTS;
  if(!path)return;
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${path}/${name}.png`,animations:'disabled'});
}

test('WebGL 2, NPC close-up, story branch and timed sword contact survive save/load @desktop',async({page})=>{
  const urls:string[]=[];
  const errors:string[]=[];
  page.on('request',route=>urls.push(route.url()));
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('thien-menh.3d.quality','medium'));
  await page.goto('/?renderer=webgl');
  await expect(stage(page)).toHaveAttribute('data-engine','WebGL 2');
  await expect(stage(page)).toHaveAttribute('data-clips',/Idle, Walk, Run, Jump, Land/);
  await expect.poll(()=>value(page,'fps')).toBeGreaterThan(0);
  expect(urls.some(url=>url.includes('wanderer-')&&url.endsWith('.glb'))).toBe(true);
  expect(urls.some(url=>url.includes('ferryman-')&&url.endsWith('.glb'))).toBe(false);
  await shot(page,'main-menu');
  await enter(page);
  expect(urls.some(url=>url.includes('ferryman-')&&url.endsWith('.glb'))).toBe(true);
  expect(urls.some(url=>/\/assets\/engine-/.test(url))).toBe(false);
  await shot(page,'exploration');
  expect(await page.locator('#world3d').evaluate(c=>c.clientWidth===innerWidth&&c.clientHeight===innerHeight&&document.documentElement.scrollHeight===innerHeight)).toBe(true);

  const floor=await value(page,'y');
  await page.keyboard.press('Space');
  await expect(stage(page)).toHaveAttribute('data-grounded','false');
  await expect.poll(()=>value(page,'y')).toBeGreaterThan(floor+.25);
  await expect(stage(page)).toHaveAttribute('data-grounded','true');
  await expect.poll(()=>value(page,'y')).toBeCloseTo(floor,2);

  await page.keyboard.down('KeyW');
  await expect(stage(page)).toHaveAttribute('data-clip','Run');
  await expect(button(page,'Trò chuyện với Lão Chu')).toBeVisible();
  await page.keyboard.up('KeyW');
  await shot(page,'npc-interaction');
  await page.keyboard.press('KeyF');
  await expect(page.getByRole('dialog',{name:'Lão Chu'})).toBeVisible();
  await expect(page.locator('#hud')).toBeHidden();
  await page.waitForTimeout(420);
  await shot(page,'dialogue');
  await button(page,'Bỏ qua lời thoại').click();
  await button(page,'Đưa dân làng sang bờ an toàn.').click();
  await expect(page.locator('#objective')).toContainText('đèn đá');
  await button(page,'Túi đồ').click();
  await expect(page.getByText('Mộc Ấn',{exact:true})).toBeVisible();
  await button(page,'Đóng').click();

  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('KeyW');
  await expect(button(page,'Xem đèn đá')).toBeVisible();
  await page.keyboard.up('KeyW');
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.press('KeyF');
  await expect(page.getByText(/Từng chiếc thuyền rời bến/)).toBeVisible();
  await button(page,'Bỏ qua lời thoại').click();
  await button(page,'Đi về phía tiếng động.').click();

  await page.keyboard.down('KeyW');
  await expect.poll(()=>value(page,'z')).toBeGreaterThan(29.85);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyQ');
  await expect(stage(page)).toHaveAttribute('data-clip','Slash');
  await shot(page,'sword-practice');
  await expect(stage(page)).toHaveAttribute('data-hits','1');
  await expect(stage(page)).toHaveAttribute('data-clip','Idle');
  await page.keyboard.press('KeyE');
  await expect(stage(page)).toHaveAttribute('data-hits','2');
  await expect(stage(page)).toHaveAttribute('data-clip','Idle');
  await page.keyboard.press('KeyQ');
  await expect(page.locator('#objective')).toContainText('Đã tìm đường');
  await page.reload();
  await enter(page,true);
  await expect(page.locator('#objective')).toContainText('Đã tìm đường');
  await button(page,'Tạm dừng').click();
  await button(page,'Về màn chính').click();
  await expect(stage(page)).toHaveAttribute('data-disposals','1');
  await expect(button(page,'Tiếp tục hành trình')).toBeEnabled();
  await expect(page.locator('#world3d')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('touch drive and camera simultaneously, graphics preset, jump @mobile',async({page,context})=>{
  await page.addInitScript(()=>localStorage.setItem('thien-menh.3d.quality','battery'));
  await page.goto('/?renderer=webgl');
  await enter(page);
  const pad=(await page.locator('#stick').boundingBox())!;
  const aim={x:198,y:378,id:2};
  const drive={x:pad.x+pad.width/2,y:pad.y+pad.height*.17,id:1};
  const cdp=await context.newCDPSession(page),z=await value(page,'z');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[drive,aim]});
  await expect.poll(()=>value(page,'z')).toBeGreaterThan(z+.40);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[drive,{...aim,x:271,y:398}]});
  await expect.poll(()=>value(page,'yaw')).toBeLessThan(-.20);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>value(page,'speed')).toBeLessThan(.3);
  await button(page,'Nhảy').tap();
  await expect(stage(page)).toHaveAttribute('data-grounded','false');
  await expect(stage(page)).toHaveAttribute('data-grounded','true');
  await button(page,'Cài đặt').tap();
  await page.getByLabel('Chất lượng đồ họa').selectOption('low');
  await expect(stage(page)).toHaveAttribute('data-quality','low');
  await expect(page.locator('#render-info')).toContainText('74%');
  await button(page,'Đóng').tap();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight)).toBe(true);
  await shot(page,'mobile');
});

test('fullscreen is opt-in, and mouse drag rotates and zooms camera @desktop',async({page})=>{
  await page.goto('/?renderer=webgl');
  expect(await page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(false);
  await button(page,'Toàn màn hình').click();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true);
  await page.evaluate(()=>document.exitFullscreen());
  await enter(page);
  await page.mouse.move(500,355);await page.mouse.down();await page.mouse.move(611,390,{steps:4});await page.mouse.up();
  await expect.poll(()=>value(page,'yaw')).toBeLessThan(-.38);
  const before=await value(page,'clearance');
  await page.mouse.wheel(0,167);
  await expect.poll(()=>value(page,'clearance')).toBeGreaterThan(before+.5);
});
