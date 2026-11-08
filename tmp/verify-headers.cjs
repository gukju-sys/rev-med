const {chromium}=require(process.env.TASK_NODE_MODULES+'/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=[];
 for(const width of [1440,1100,390]){
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const file of ['cellmover','index','prp-uni']){
   await page.goto(pathToFileURL(path.resolve(file+'.html')).href,{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]));
   const result=await page.evaluate(()=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}};
    const header=rect(document.querySelector('.site-header')),logo=rect(document.querySelector('.logo')),cta=rect(document.querySelector('.header-cta')),toggle=rect(document.querySelector('.nav-toggle'));
    const badge=document.querySelector('.kakao-talk');
    return {header,logo,cta,toggle,badgeVisible:getComputedStyle(badge).display!=='none',overflow:document.documentElement.scrollWidth>innerWidth};
   });
   if(result.overflow||!result.badgeVisible||result.logo.right>result.cta.x||(width===390&&result.cta.right>result.toggle.x))throw Error('Header layout failed '+file+' '+width);
   results.push({file,width,...result});
   if(file==='index')await page.screenshot({path:'tmp/header-'+width+'.png',clip:{x:0,y:0,width,height:result.header.height}});
  }
  const sizes=results.filter(r=>r.width===width).map(r=>r.header.height);
  if(new Set(sizes).size!==1)throw Error('Header heights differ: '+sizes);
  await page.close();
 }
 console.log(JSON.stringify(results.map(r=>({file:r.file,width:r.width,height:r.header.height,buttonWidth:r.cta.width,overflow:r.overflow})),null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
