import { chromium, devices } from 'playwright';
import { readdir, stat } from 'node:fs/promises';
const origin=new URL(process.env.TM3D_BENCHMARK_URL??'http://127.0.0.1:4191/');
const target=new URL(origin);
target.searchParams.set('renderer','webgl');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??'/usr/bin/chromium'});
const total=async path=>{
  const all=await readdir(path,{withFileTypes:true});
  const sizes=await Promise.all(all.map(e=>e.isDirectory()?total(path+'/'+e.name):stat(path+'/'+e.name).then(s=>s.size)));
  return sizes.reduce((sum,x)=>sum+x,0);
};
const resources=page=>page.evaluate(()=>{
  const entries=[...performance.getEntriesByType('navigation'),...performance.getEntriesByType('resource')];
  return {bytes:entries.reduce((sum,x)=>sum+x.transferSize,0), files:entries.length,
    origins:[...new Set(entries.map(x=>new URL(x.name).origin))],
    models:entries.filter(x=>x.name.endsWith('.glb')).map(x=>new URL(x.name).pathname)};
});
try{
  const runs=[];
  for(const kind of ['desktop','mobile']){
    const context=await browser.newContext(kind==='mobile'?devices['Pixel 7']:{viewport:{width:1440,height:900}});
    const page=await context.newPage();
    await page.addInitScript(kind=>localStorage.setItem('thien-menh.3d.quality','battery'),kind);
    const start=performance.now();
    await page.goto(target.href);
    await page.waitForFunction(()=>Number(document.getElementById('game').dataset.fps)>0);
    const menuMs=Math.round(performance.now()-start),menu=await resources(page),open=performance.now();
    await page.getByRole('button',{name:'Bước vào giang hồ',exact:true}).click();
    await page.locator('#hud').waitFor();
    const enterMs=Math.round(performance.now()-open);
    await page.waitForTimeout(1000);
    const world=await resources(page),device=await page.locator('#world3d').evaluate(c=>{
      const gl=c.getContext('webgl2'),e=gl?.getExtension('WEBGL_debug_renderer_info');
      return {width:c.width,height:c.height,gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null};
    });
    const fps=[];
    for(let i=0;i<5;i++){await page.waitForTimeout(1150);fps.push(Number(await page.locator('#game').getAttribute('data-fps')));}
    runs.push({kind,menuMs,enterMs,menu,world,device,fps,median:[...fps].sort((a,b)=>a-b)[2]});
    await context.close();
  }
  const page=await browser.newPage();
  await page.goto(origin.href);
  await page.locator('#game[data-ready=true]').waitFor();
  const autoRenderer=await page.locator('#game').getAttribute('data-engine');
  console.log(JSON.stringify({chrome:browser.version(),buildBytes:await total('dist'),autoRenderer,runs},null,2));
}finally{
  await browser.close();
}
