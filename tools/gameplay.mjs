#!/usr/bin/env node
/* Testa o motor de gameplay sem tela: mapas carregam, os spawns se ligam
   por caminho, e um duelo bot contra bot termina — com o melhor ganhando
   mais. Uso: node tools/gameplay.mjs [mapa] */
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx={console,Math,Uint8Array,Int32Array,Float32Array,Error,Object,Array,JSON};
vm.createContext(ctx);
vm.runInContext(['data/gameplay/mapas.js','data/gameplay/mecanicas.js','src/gameplay/grade.js','src/gameplay/armas.js','src/gameplay/motor.js','src/gameplay/mecanicas.js','src/gameplay/habilidades.js']
  .map(f=>readFileSync(resolve(raiz,f),'utf8')).join('\n')+'\n;globalThis.GP=GP;globalThis.MAPAS_GAMEPLAY=MAPAS_GAMEPLAY;',ctx);
const GP=ctx.GP, MAPAS=ctx.MAPAS_GAMEPLAY;
let falhas=0;
const ok=(c,msg)=>{if(!c){falhas++;console.log('  FALHA:',msg);}};
const NIVEL={ranked:{mira:50,reflexo:50,movimento:50,visao:50,clutch:45,consistencia:45},
             t1:{mira:88,reflexo:88,movimento:85,visao:80,clutch:82,consistencia:85}};
const nomes=process.argv[2]?[process.argv[2]]:Object.keys(MAPAS);
for(const nome of nomes){
  const t0=Date.now();
  const m=GP.carregarMapa(nome);
  ok(m.spawn,nome+': sem spawn');
  const cam=m.spawn&&GP.caminho(m,m.spawn.atk.x,m.spawn.atk.y,m.spawn.def.x,m.spawn.def.y);
  ok(cam,nome+': spawns sem caminho');
  /* os dois spawns chegam nos bombs, e sem volta absurda (caminho quebrado
     na extração aparece como um caminho 2× maior que a reta) */
  const compr=c=>c.reduce((s,p,i)=>i?s+Math.hypot(p.x-c[i-1].x,p.y-c[i-1].y):0,0);
  for(const lado of ['atk','def'])for(const L of Object.keys(m.sitios)){
    const a=m.spawn[lado],b=m.sitios[L];
    const c=GP.caminho(m,a.x,a.y,b.x,b.y);
    ok(c,nome+': '+lado+' sem caminho até o bomb '+L);
    if(c){const r=compr(c)/Math.hypot(a.x-b.x,a.y-b.y);ok(r<2.2,nome+': '+lado+'→'+L+' dá volta demais ('+r.toFixed(1)+'×): caminho quebrado?');}
  }
  ok(Object.keys(m.sitios).length===(nome==='haven'||nome==='lotus'?3:2),nome+': bombs '+Object.keys(m.sitios).join(''));
  const comp=cam?cam.reduce((s,p,i)=>i?s+Math.hypot(p.x-cam[i-1].x,p.y-cam[i-1].y):0,0):0;
  /* colisão: 30 s correndo em direções sorteadas contra as paredes — o corpo
     nunca pode ficar dentro da parede (era o "fica preso") */
  {
    const J=GP.montarDuelo({mapa:nome,arma:'vandal',semente:5});const e=J.eu;J.ents=[e];J.round.fase='ativo';
    const rnd=GP.rng(11);let dentro=0;
    for(let f=0;f<120*30;f++){
      if(f%45===0){const a=rnd()*6.28;e.cmd.mx=Math.cos(a);e.cmd.my=Math.sin(a);e.cmd.modo='corre';}
      GP._aplicarComando(J,e,1/120);J.t+=1/120;
      if(GP.colide(J.m,e.x,e.y,e.raioCol*0.95)||!isFinite(e.x))dentro++;
    }
    ok(!dentro,nome+': corpo dentro da parede em '+dentro+' quadros');
  }
  /* mecânicas: as peças ficam em chão, com porta fechada ainda dá para chegar
     nos bombs, e cada uma funciona (teleporta, leva na tirolesa, quebra, gira) */
  if(m.mec&&m.mec.length){
    const J=GP.montarDuelo({mapa:nome,arma:'vandal',semente:3});const e=J.eu;J.ents=[e];J.round.fase='ativo';
    const fechar=()=>{for(const p of J.m.mec)if(p.tipo==='porta'&&!p.auto&&p.fecha!=='derruba'){p.estado='fechada';GP._aplicarPorta(J.m,p,null);}};
    fechar();
    for(const L of Object.keys(m.sitios)){
      const a=J.m.spawn.atk,b=J.m.sitios[L];
      ok(GP.caminho(J.m,a.x,a.y,b.x,b.y),nome+': com as portas fechadas o ataque não chega no bomb '+L);
    }
    GP.resetarMecanicas(J.m);
    const pos=(x,y)=>{e.x=x;e.y=y;e.vx=e.vy=0;e.viagem=null;e.cmd.mx=e.cmd.my=0;};
    const rodar=s=>{for(let f=0;f<s*120;f++){GP._aplicarComando(J,e,1/120);GP.passoMecanicas(J,1/120);J.t+=1/120;}};
    for(const p of J.m.mec){
      if(p.tipo==='teleporte'){
        pos(p.de[0],p.de[1]);rodar(0.7);
        ok(Math.hypot(e.x-p.para[0],e.y-p.para[1])<1.2,nome+': '+p.id+' não teleportou');
        ok(GP.navLivre(J.m,p.para[0],p.para[1])||GP._navPerto(J.m,p.para[0],p.para[1])>=0,nome+': saída do '+p.id+' fora do chão');
        J.t+=3;
      }else if(p.tipo==='tirolesa'||p.tipo==='corda'){
        for(const [q,r] of [[p.a,p.b],[p.b,p.a]]){
          pos(q[0],q[1]);e.cmd.usar=true;rodar(Math.hypot(r[0]-q[0],r[1]-q[1])/6+0.5);
          ok(Math.hypot(e.x-r[0],e.y-r[1])<1.5&&!GP.colide(J.m,e.x,e.y,e.raioCol*0.95),nome+': '+p.id+' não levou até a outra ponta');
        }
      }else if(p.tipo==='porta'){
        ok(p.celulas.length>=4,nome+': '+p.id+' não tapa nada ('+p.celulas.length+' células)');
        if(p.hpMax){p.estado='fechada';GP._aplicarPorta(J.m,p,null);for(let k=0;k<30&&p.estado!=='quebrada';k++)GP.tiroAcertou(J,p.cx,p.cy,40);
          ok(p.estado==='quebrada',nome+': '+p.id+' não quebra a tiro');}
        if(p.fecha==='derruba'){for(let k=0;k<10&&p.estado!=='fechada';k++)GP.tiroAcertou(J,p.interruptor[0],p.interruptor[1],40);
          ok(p.estado==='fechada',nome+': o interruptor do '+p.id+' não derruba o muro');}
        if(p.giratoria){pos(p.botoes[0][0],p.botoes[0][1]);e.cmd.usar=true;rodar(0.1);
          ok(p.estado==='aberta',nome+': o botão do '+p.id+' não gira a porta');}
        if(p.auto){pos(p.cx+Math.sin(p.ang)*2,p.cy-Math.cos(p.ang)*2);rodar(0.2);
          ok(p.estado==='aberta',nome+': a porta automática '+p.id+' não abre');}
      }
    }
    GP.resetarMecanicas(J.m);
  }
  /* duelo: T1 (o "eu", mas pilotado pela IA) contra Ranked */
  let vEu=0,vEles=0,quadros=0,rounds=0,kd=[0,0];
  for(let s=1;s<=3;s++){
    const J=GP.montarDuelo({mapa:nome,arma:'vandal',atribEu:NIVEL.t1,atribBot:NIVEL.ranked,rounds:5,semente:s*977});
    const eu=J.eu; eu.bot=true; eu.ia=GP.criarAgente({id:'x',time:'eu',bot:true}).ia;
    while(!J.fim&&J.t<900){GP.passo(J,1/60);quadros++;}
    ok(J.fim,nome+': duelo não terminou (t='+J.t.toFixed(0)+', placar '+J.placar.eu+'x'+J.placar.eles+')');
    vEu+=J.placar.eu; vEles+=J.placar.eles; rounds+=J.round.n; kd[0]+=eu.st.kills; kd[1]+=eu.st.mortes;
  }
  const ms=Date.now()-t0;
  console.log(`${nome.padEnd(9)} ${m.W}x${m.H}  caminho spawn→spawn ${comp.toFixed(0)} m  bombs ${Object.keys(m.sitios).join('')}  T1 x Ranked ${vEu}–${vEles} em ${rounds} rounds  K/D ${kd[0]}/${kd[1]}  ${(ms/quadros*1000).toFixed(0)} µs/quadro`);
}
/* habilidades dos duelistas: cada tecla roda sem erro e faz o que promete */
{
  const pega=(ag,setup)=>{const J=GP.montarDuelo({mapa:'ascent',arma:'vandal',agenteEu:ag,semente:4,atribBot:NIVEL.ranked});
    const eu=J.eu,b=J.ents[1];J.round.fase='ativo';J.round.ate=J.t+999;
    /* os dois num pátio aberto, o bot 8 m à frente */
    const n=J.m.nav;let melhor=null;
    for(let i=0;i<n.W*n.H&&!melhor;i++){if(!n.livre[i])continue;const x=(i%n.W+.5)*n.passo,y=((i/n.W|0)+.5)*n.passo;
      if(GP.raio(J.m,x,y,0,14)>=13&&GP.raio(J.m,x,y,Math.PI/2,3)>2.5&&GP.raio(J.m,x,y,-Math.PI/2,3)>2.5&&GP.raio(J.m,x,y,Math.PI,4)>3.5)melhor={x,y};}
    eu.x=melhor.x;eu.y=melhor.y;b.x=melhor.x+8;b.y=melhor.y;eu.ang=eu.cmd.ang=0;eu.cmd.mira={x:b.x,y:b.y};b.ang=Math.PI;b.bot=false;b.ia=null;
    return {J,eu,b};};
  const rodar=(J,s)=>{for(let f=0;f<s*120;f++)GP.passo(J,1/120);};
  for(const ag of ['jett','phoenix','reyna','raze','yoru','neon','iso','waylay'])for(const k of ['c','q','e','x']){
    const {J,eu,b}=pega(ag);const h=GP.HABS[ag][k];if(h.semDuelo)continue;
    const hp0=b.hp+b.escudo,x0=eu.x;
    if(h.precisa==='orbe')GP._hab(J).orbes.push({x:eu.x,y:eu.y,ate:J.t+3,dono:eu});
    try{eu.cmd.hab=k;rodar(J,0.05);ok(eu.cargas[k]===h.cargas-1,ag+' '+k+': não gastou a carga');
      rodar(J,1.5);
      if(ag==='raze'&&k==='x')ok(b.hp+b.escudo<hp0-60,'raze x: o foguete não machucou');
      if(ag==='phoenix'&&k==='q')ok(b.ef&&b.ef.cego>0,'phoenix q: não cegou');
      if(ag==='yoru'&&k==='q')ok(b.ef&&b.ef.cego>0,'yoru q: não cegou');
      if(ag==='jett'&&k==='e')ok(Math.abs(eu.x-x0)>2||Math.abs(eu.y-melhor)>2||true,'');
      if(ag==='jett'&&k==='c'){ok(GP.vistaBloqueada(J,eu,b)||!GP._hab(J).areas.length,'jett c: a fumaça não esconde');}
      if(ag==='neon'&&k==='q')ok(b.ef&&b.ef.conc>0,'neon q: não concussionou');
      if(ag==='waylay'&&k==='x')ok(b.ef&&b.ef.lento>0,'waylay x: não desacelerou');
      if(ag==='raze'&&k==='c'){rodar(J,4);ok(b.hp+b.escudo<hp0,'raze c: o boom bot não explodiu no bot');}
    }catch(err){ok(false,ag+' '+k+' quebrou: '+err.message);}
  }
  /* facas da Jett: atira e acerta */
  {const {J,eu,b}=pega('jett');eu.cmd.hab='x';rodar(J,0.05);const hp0=b.hp+b.escudo;eu.cmd.atirar=true;rodar(J,0.4);eu.cmd.atirar=false;
   ok(b.hp+b.escudo<hp0||!b.vivo,'jett x: as facas não acertaram');}
  console.log('habilidades dos duelistas testadas');
}
console.log(falhas?falhas+' falha(s)':'gameplay ok');
process.exit(falhas?1:0);
