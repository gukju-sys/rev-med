const { chromium } = require(process.env.TASK_NODE_MODULES + '/playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const server = require('node:http').createServer((req,res)=>{
    const file=path.resolve('.'+decodeURIComponent(req.url.split('?')[0]));
    if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(8756,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const results = [];
  for (const width of [1440, 390]) {
    const page = await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    for (const name of ['index','prp-uni','cellmover']) {
      await page.goto('http://127.0.0.1:8756/'+name+'.html',{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(async()=>{await Promise.all([...document.images].map(async img=>{img.loading='eager';try{await img.decode();}catch{}}));});
      const geometry = await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}));
      const missing = geometry.links.filter(h=>!h.startsWith('#')&&!h.includes(':')&&!fs.existsSync(path.resolve(h.split('#')[0].split('?')[0])));
      if (width===390) {
        await page.locator('.nav-toggle').click();
        if(await page.locator('.nav-toggle').getAttribute('aria-expanded')!=='true') throw Error('Mobile menu failed');
        await page.keyboard.press('Escape');
        if(await page.locator('.nav-toggle').getAttribute('aria-expanded')!=='false') throw Error('Escape failed');
      }
      if(name==='index') {
        await page.locator('[data-product="cell"]').click();
        if(await page.locator('[data-tile="cell"]').evaluate(el=>el.classList.contains('is-selected'))!==true) throw Error('Product switch failed');
        await page.locator('[data-product="prp"]').click();
      }
      const revealCount=await page.locator('.motion-reveal').count();
      if(!revealCount)throw Error('Scroll effects not initialized');
      for(const target of await page.locator('.motion-reveal').all()) {
        await target.evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(1000);
      if(await page.locator('.motion-reveal:not(.is-visible)').count())throw Error('Scroll content stayed hidden');
      await page.emulateMedia({reducedMotion:'reduce'});
      const reduced=await page.evaluate(()=>[...document.querySelectorAll('.motion-reveal')].every(el=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).animationName==='none'));
      if(!reduced)throw Error('Reduced motion fallback failed');
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.screenshot({path:'tmp/'+name+'-'+width+'.png',fullPage:true});
      results.push({page:name,width,overflow:geometry.scrollWidth>width,brokenImages:geometry.images,missingLinks:missing,revealCount,reducedMotion:reduced,errors:[...errors]});
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
    await page.close();
  }
  fs.writeFileSync('tmp/design-verification.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
  await browser.close();
  server.close();
})().catch(e=>{console.error(e);process.exit(1)});
