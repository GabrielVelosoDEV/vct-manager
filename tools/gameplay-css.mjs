#!/usr/bin/env node
/* Gera src/gameplay/gameplay-embutido.css a partir de src/gameplay/gameplay.css.
   A gameplay tem estilos de página inteira (:root, *, html, body, h1, button…)
   que quebrariam o VCT Manager. Quando ela abre por cima do manager (modo
   jogador, dia de jogo), tudo dela mora dentro de #gpCamada: aqui cada regra
   é presa a essa camada. Fonte única: mexa só no gameplay.css; o build roda
   este gerador. Uso: node tools/gameplay-css.mjs */
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CAMADA = '#gpCamada';

/* separa a lista de seletores pelas vírgulas de fora dos parênteses */
function partes(sel) {
  const out = []; let nivel = 0, atual = '';
  for (const c of sel) {
    if (c === '(') nivel++; if (c === ')') nivel--;
    if (c === ',' && nivel === 0) { out.push(atual.trim()); atual = ''; } else atual += c;
  }
  if (atual.trim()) out.push(atual.trim());
  return out;
}
function prender(sel) {
  const lista = [];
  for (const s of partes(sel)) {
    if (s === ':root' || s === 'body') { lista.push(CAMADA); continue; }
    if (s === 'html') continue;
    if (s === '*') { lista.push(CAMADA, CAMADA + ' *'); continue; }
    if (s.startsWith('body.')) { const resto = s.slice(4); const i = resto.search(/[\s>+~]/); lista.push(i < 0 ? CAMADA + resto : CAMADA + resto.slice(0, i) + resto.slice(i)); continue; }
    if (s.startsWith('body ')) { lista.push(CAMADA + s.slice(4)); continue; }
    lista.push(CAMADA + ' ' + s);
  }
  return lista.join(',');
}
/* percorre o CSS bloco a bloco (com @media aninhado) */
function transformar(css) {
  let i = 0, out = '';
  const n = css.length;
  while (i < n) {
    if (css.startsWith('/*', i)) { const f = css.indexOf('*/', i + 2); i = f < 0 ? n : f + 2; continue; }
    const ab = css.indexOf('{', i);
    if (ab < 0) break;
    const cabeca = css.slice(i, ab).trim();
    /* acha o fecho deste bloco */
    let nivel = 1, j = ab + 1;
    while (j < n && nivel) { if (css[j] === '{') nivel++; else if (css[j] === '}') nivel--; j++; }
    const corpo = css.slice(ab + 1, j - 1);
    if (cabeca.startsWith('@media') || cabeca.startsWith('@supports')) out += `${cabeca}{${transformar(corpo)}}\n`;
    else if (cabeca.startsWith('@')) out += `${cabeca}{${corpo}}\n`;
    else if (cabeca) {
      const sel = prender(cabeca);
      if (sel) out += `${sel}{${corpo.trim()}}\n`;
    }
    i = j;
  }
  return out;
}
const fonte = readFileSync(resolve(raiz, 'src/gameplay/gameplay.css'), 'utf8');
const camada = `${CAMADA}{position:fixed;inset:0;z-index:9000;overflow:hidden}\n`;
const saida = '/* GERADO por tools/gameplay-css.mjs a partir de gameplay.css — não edite à mão */\n' + camada + transformar(fonte);
writeFileSync(resolve(raiz, 'src/gameplay/gameplay-embutido.css'), saida);
console.log('src/gameplay/gameplay-embutido.css gerado —', saida.split('\n').length, 'linhas');
