#!/usr/bin/env node
/* Empacota o projeto num único HTML autocontido em dist/.
   Uso: node tools/build.mjs
   O arquivo gerado abre com duplo clique, sem servidor.
   Imagens continuam sendo lidas da pasta assets/ ao lado do HTML. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(raiz,'index.html'),'utf8');
/* Inlina TODA folha de estilo local, não só a styles.css: as fontes moram numa
   folha separada (fontes.css, gerada) e o dist tem de levar as duas. */
const folhas=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
const css=folhas.map(f=>`\n/* ===== ${f} ===== */\n`+readFileSync(resolve(raiz,f),'utf8')).join('\n');

const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const js=scripts.map(p=>`\n/* ===== ${p} ===== */\n`+readFileSync(resolve(raiz,p),'utf8')).join('\n');

/* replacements como função: evita que $&, $' e $` do código sejam
   interpretados como padrões especiais de String.replace */
let saida=html
  .replace(/<link rel="stylesheet" href="[^"]+">\s*/g,'')
  .replace('</head>',()=>`<style>\n${css}\n</style>\n</head>`)
  .replace(/<!-- ORDEM IMPORTA[\s\S]*?<script src="src\/main\.js"><\/script>/,()=>`<script>\n${js}\n</script>`);

const dist=resolve(raiz,'dist');
if(!existsSync(dist))mkdirSync(dist);
writeFileSync(resolve(dist,'vct-manager.html'),saida);
console.log('dist/vct-manager.html gerado —',scripts.length,'módulos,',(saida.length/1024).toFixed(1),'KB');
