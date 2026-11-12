/* Copia o jogo (index.html, gameplay.html, src, data, assets) para desktop/web, que é o que
   vai dentro do app. O jogo continua um site estático: o Electron só abre o
   index.html numa janela própria. LISTA.md e LEIAME.md ficam de fora. */
import {cpSync,rmSync,existsSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
const aqui=dirname(fileURLToPath(import.meta.url));
const raiz=resolve(aqui,'..');
const web=resolve(aqui,'web');
if(existsSync(web))rmSync(web,{recursive:true,force:true});
const fora=new Set(['LISTA.md','LEIAME.md']);
/* das imagens do modo jogador só vai o que já foi preparado (assets/gameplay/pronto);
   os originais enviados ficam de fora do app */
const original=f=>{const r=f.replace(/\\/g,'/');return r.includes('/assets/gameplay/')&&!r.includes('/assets/gameplay/pronto')&&/\.(png|jpe?g|webp)$/i.test(r);};
for(const p of ['index.html','gameplay.html','src','data','assets'])
  cpSync(resolve(raiz,p),resolve(web,p),{recursive:true,filter:f=>!fora.has(basename(f))&&!original(f)});
console.log('jogo copiado para desktop/web');
