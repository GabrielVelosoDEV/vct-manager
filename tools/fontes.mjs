#!/usr/bin/env node
/* Gera src/ui/fontes.css com as três fontes embutidas em base64.
   Uso: npm install && node tools/fontes.mjs

   Por que base64 e não um arquivo .woff2 ao lado: carregar fonte por
   `file://` esbarra na política de origem do navegador — o Chrome trata cada
   arquivo local como origem opaca e recusa a fonte. Uma `data:` URI não tem
   origem, então funciona tanto no index.html aberto com duplo clique quanto no
   dist empacotado.

   As três são SIL Open Font License 1.1, que permite embutir e redistribuir
   desde que o aviso de copyright vá junto — por isso o cabeçalho do CSS
   gerado e o arquivo LICENSES-FONTES.md. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mod=p=>resolve(raiz,'node_modules',p);

/* Só os pesos que o styles.css realmente usa. Cada peso extra são ~24 KB. */
const FACES=[
  ['Inter',400,'@fontsource/inter/files/inter-latin-400-normal.woff2'],
  ['Inter',500,'@fontsource/inter/files/inter-latin-500-normal.woff2'],
  ['Inter',600,'@fontsource/inter/files/inter-latin-600-normal.woff2'],
  ['Inter',700,'@fontsource/inter/files/inter-latin-700-normal.woff2'],
  ['Bebas Neue',400,'@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2'],
  ['JetBrains Mono',400,'@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'],
  ['JetBrains Mono',700,'@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2'],
];
const PACOTES=['@fontsource/inter','@fontsource/bebas-neue','@fontsource/jetbrains-mono'];

const faltando=FACES.filter(f=>!existsSync(mod(f[2])));
if(faltando.length){
  console.error('Faltam arquivos de fonte. Rode `npm install` antes.\n'+
    faltando.map(f=>'  '+f[2]).join('\n'));
  process.exit(1);
}

const licencas=PACOTES.map(p=>{
  const l=resolve(raiz,'node_modules',p,'LICENSE');
  return existsSync(l)?`### ${p}\n\n\`\`\`\n${readFileSync(l,'utf8').trim()}\n\`\`\`\n`:'';
}).join('\n');

let css=`/* ============================================================
   FONTES EMBUTIDAS — gerado por tools/fontes.mjs, não edite à mão
   ------------------------------------------------------------
   Inter, Bebas Neue e JetBrains Mono, subconjunto latino, em
   base64. Antes vinham do Google Fonts: sem rede, o jogo caía na
   fonte de sistema e o desenho inteiro mudava de proporção.

   As três estão sob SIL Open Font License 1.1. O texto completo
   das licenças está em LICENSES-FONTES.md, na raiz do projeto.
   ============================================================ */
`;
let bytes=0;
for(const[fam,peso,arq]of FACES){
  const buf=readFileSync(mod(arq));
  bytes+=buf.length;
  css+=`@font-face{font-family:'${fam}';font-style:normal;font-weight:${peso};font-display:swap;`
     +`src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}\n`;
}
writeFileSync(resolve(raiz,'src/ui/fontes.css'),css);
writeFileSync(resolve(raiz,'LICENSES-FONTES.md'),
  `# Licenças das fontes embutidas\n\nO jogo embute Inter, Bebas Neue e JetBrains Mono em\n`+
  `\`src/ui/fontes.css\`, para funcionar sem rede. As três estão sob SIL Open Font\n`+
  `License 1.1, que permite embutir e redistribuir desde que estes avisos\n`+
  `acompanhem o software.\n\n${licencas}`);
console.log(`src/ui/fontes.css gerado — ${FACES.length} variantes, `+
  `${(bytes/1024).toFixed(0)} KB de fonte, ${(css.length/1024).toFixed(0)} KB de CSS`);
