// node docs/prototype/make-contact-sheet.mjs <prefix> <out.png>   (prefix: base|boost)
import sharp from 'sharp'; import { readFileSync } from 'node:fs';
const [prefix='base', out='docs/prototype/contact-sheet.png'] = process.argv.slice(2);
const ids=['lion','tiger','cat','cow','elephant','peacock'];
const bgs=[['#29adff'],['#00a152'],['grey']];
const sprite=async(size,id)=>{const j=JSON.parse(readFileSync(`docs/prototype/${prefix}-${size}.json`));const s=j.sprites[id];
 return sharp(`docs/prototype/${prefix}-${size}.png`).extract({left:s.x,top:s.y,width:size,height:size}).toBuffer();};
const rowH=32*4+8, colW=32*4+8, nat=44;
const labelW=0;
const blocks=[]; // each bg block: rows = sizes(24,32), per animal: native + x4
const W=ids.length*colW, H=bgs.length*2*rowH;
const comp=[];
let y=0;
for(const [bg] of bgs){for(const size of [24,32]){
 for(let i=0;i<ids.length;i++){
  let buf=await sprite(size,ids[i]);
  const x0=i*colW+4;
  let nb=buf, big=await sharp(buf).resize(size*4,size*4,{kernel:'nearest'}).toBuffer();
  if(bg==='grey'){nb=await sharp(nb).greyscale().toBuffer();big=await sharp(big).greyscale().toBuffer();}
  comp.push({input:big,left:x0,top:y+4});
 }
 // native copies in a small strip on the right side of each cell is crowded; place native under big if room
 y+=rowH;
}}
// native-size strip: separate bottom section
const natTop=H+4, natH=3*2*40;
let canvasComp=[...comp];
let yy=natTop;
for(const [bg] of bgs){for(const size of [24,32]){
 for(let i=0;i<ids.length;i++){let b=await sprite(size,ids[i]); if(bg==='grey') b=await sharp(b).greyscale().toBuffer();
  canvasComp.push({input:b,left:i*colW+4+ (colW-size)/2|0,top:yy+4});}
 yy+=0; // placeholder
 yy+=0;
}}
// build bands properly: draw backgrounds, then sprites
const bands=[];let by=0;
const bandsSpec=[];
for(const [bg] of bgs){for(const size of [24,32]){bandsSpec.push({bg,size});}}
const bigH=rowH, natBand=40;
const total=bandsSpec.length*(bigH+natBand);
const layers=[];let cy=0;
for(const {bg,size} of bandsSpec){
 layers.push({input:{create:{width:W,height:bigH+natBand,channels:3,background:bg==='grey'?'#808080':bg}},left:0,top:cy});
 for(let i=0;i<ids.length;i++){
  let b=await sprite(size,ids[i]); if(bg==='grey') b=await sharp(b).greyscale().toBuffer();
  const big=await sharp(b).resize(size*4,size*4,{kernel:'nearest'}).toBuffer();
  layers.push({input:big,left:i*colW+4+((colW-8-size*4)/2|0),top:cy+4});
  layers.push({input:b,left:i*colW+4+((colW-8-size)/2|0),top:cy+bigH+4});
 }
 cy+=bigH+natBand;
}
await sharp({create:{width:W,height:total,channels:3,background:'#000'}}).composite(layers).png().toFile(out);
console.log(out,W,total);
