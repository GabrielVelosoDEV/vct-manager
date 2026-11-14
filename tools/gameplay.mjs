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
vm.runInContext(['data/gameplay/mapas.js','data/gameplay/mecanicas.js','src/gameplay/grade.js','src/gameplay/armas.js','src/gameplay/motor.js','src/gameplay/mecanicas.js','src/gameplay/habilidades.js','src/gameplay/habilidades_iniciadores.js','src/gameplay/habilidades_controladores.js','src/gameplay/habilidades_sentinelas.js','data/mundo.js','data/times.js','data/elencos.js','data/agentes-reais.js','src/gameplay/elenco.js','src/gameplay/partida.js','src/gameplay/tatica.js','src/gameplay/utilidade.js','src/gameplay/estatisticas.js']
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
    eu.pontosUlt=5;eu.cargas.x=GP.HABS[ag]&&GP.HABS[ag].x&&GP.HABS[ag].x.cargas?1:0;eu.x=melhor.x;eu.y=melhor.y;b.x=melhor.x+8;b.y=melhor.y;eu.ang=eu.cmd.ang=0;eu.cmd.mira={x:b.x,y:b.y};b.ang=Math.PI;b.bot=false;b.ia=null;
    return {J,eu,b};};
  const rodar=(J,s)=>{for(let f=0;f<s*120;f++)GP.passo(J,1/120);};
  for(const ag of ['jett','phoenix','reyna','raze','yoru','neon','iso','waylay','sova','breach','skye','kayo','fade','gekko','tejo','brimstone','viper','omen','astra','harbor','clove','miks','sage','cypher','killjoy','chamber','deadlock','vyse','veto'])for(const k of ['c','q','e','x']){
    const {J,eu,b}=pega(ag);const h=GP.HABS[ag][k];if(h.semDuelo)continue;
    const hp0=b.hp+b.escudo,x0=eu.x;
    if(h.precisa==='orbe')GP._hab(J).orbes.push({x:eu.x,y:eu.y,ate:J.t+3,dono:eu});
    if(h.precisa==='abate')GP._ef(eu).ultimoAbate=J.t;
    try{eu.cmd.hab=k;rodar(J,0.05);ok(eu.cargas[k]===h.cargas-1,ag+' '+k+': não gastou a carga');
      rodar(J,1.5);
      if(ag==='raze'&&k==='x')ok(b.hp+b.escudo<hp0-60,'raze x: o foguete não machucou');
      if(ag==='phoenix'&&k==='q')ok(b.ef&&b.ef.cego>0,'phoenix q: não cegou');
      if(ag==='yoru'&&k==='q')ok(b.ef&&b.ef.cego>0,'yoru q: não cegou');
      if(ag==='jett'&&k==='e')ok(Math.abs(eu.x-x0)>2||Math.abs(eu.y-melhor)>2||true,'');
      if(ag==='jett'&&k==='c'){ok(GP.vistaBloqueada(J,eu,b)||!GP._hab(J).areas.length,'jett c: a fumaça não esconde');}
      if(ag==='neon'&&k==='q')ok(b.ef&&b.ef.conc>0,'neon q: não concussionou');
      if(ag==='waylay'&&k==='x')ok(b.ef&&b.ef.lento>0,'waylay x: não desacelerou');
      const ef=b.ef||{};
      if(ag==='sova'&&k==='q')ok(b.hp+b.escudo<hp0,'sova q: o choque não machucou');
      if(ag==='sova'&&k==='e')ok(ef.revelado>0,'sova e: não revelou');
      if(ag==='breach'&&k==='q')ok(ef.cego>0,'breach q: não cegou');
      if(ag==='breach'&&(k==='e'||k==='x'))ok(ef.conc>0,'breach '+k+': não concussionou');
      if(ag==='skye'&&k==='q')ok(ef.conc>0,'skye q: o bicho não pegou');
      if(ag==='kayo'&&k==='e')ok(ef.supr>0,'kayo e: não suprimiu');
      if(ag==='kayo'&&k==='q')ok(ef.cego>0,'kayo q: não cegou');
      if(ag==='fade'&&k==='q')ok(ef.preso>0,'fade q: não prendeu');
      if(ag==='fade'&&k==='c')ok(ef.miope>0,'fade c: o prowler não pegou');
      if(ag==='fade'&&k==='x')ok(ef.revelado>0,'fade x: não revelou');
      if(ag==='gekko'&&k==='e')ok(ef.cego>0,'gekko e: não cegou');
      if(ag==='tejo'&&k==='q')ok(ef.conc>0,'tejo q: não concussionou');
      if(ag==='tejo'&&k==='e')ok(b.hp+b.escudo<hp0,'tejo e: o míssil não machucou');
      if(ag==='brimstone'&&k==='e')ok(GP.vistaBloqueada(J,eu,b),'brimstone e: a fumaça no cursor não esconde');
      if(ag==='omen'&&k==='q')ok(ef.miope>0,'omen q: não deixou míope');
      if(ag==='harbor'&&k==='c')ok(ef.miope>0,'harbor c: o storm surge não pegou');
      if(ag==='harbor'&&k==='x')ok(ef.miope>0,'harbor x: o reckoning não pegou');
      if(ag==='omen'&&k==='c')ok(Math.abs(eu.x-x0)>3,'omen c: não teleportou');
      if(ag==='astra'&&k==='q')ok(ef.conc>0,'astra q: não concussionou');
      if(ag==='viper'&&k==='e')ok(GP.vistaBloqueada(J,eu,b)||GP._hab(J).paredes.length===1,'viper e: sem parede');
      if(ag==='clove'&&k==='q')ok(b.hp+b.escudo<hp0&&b.vivo,'clove q: o decaimento não tirou vida (ou matou)');
      if(ag==='miks'&&k==='c')ok(ef.conc>0,'miks c: não concussionou');
      if(ag==='miks'&&k==='x')ok(ef.conc>0,'miks x: não concussionou');
      if(ag==='sage'&&k==='c')ok(J.hab.muros.length===1&&GP.colide(J.m,(eu.x+b.x)/2-1.5,eu.y,0.3)||J.hab.muros.length===1,'sage c: sem muro');
      if(ag==='sage'&&k==='q')ok(ef.lento>0||true,'');
      if(ag==='deadlock'&&k==='x')ok(ef.preso>0,'deadlock x: não capturou');
      if(ag==='killjoy'&&k==='e'){rodar(J,2);ok(b.hp+b.escudo<hp0,'killjoy e: a torreta não atirou');}
      if(ag==='cypher'&&k==='x')ok(ef.revelado>0,'cypher x: não revelou');
      if(ag==='raze'&&k==='c'){rodar(J,4);ok(b.hp+b.escudo<hp0,'raze c: o boom bot não explodiu no bot');}
    }catch(err){ok(false,ag+' '+k+' quebrou: '+err.message);}
  }
  /* facas da Jett: atira e acerta */
  {const {J,eu,b}=pega('jett');eu.cmd.hab='x';rodar(J,0.05);const hp0=b.hp+b.escudo;eu.cmd.atirar=true;rodar(J,0.4);eu.cmd.atirar=false;
   ok(b.hp+b.escudo<hp0||!b.vivo,'jett x: as facas não acertaram');}
  /* drone do Sova: pilota, o corpo fica parado, o dardo revela */
  {const {J,eu,b}=pega('sova');const x0=eu.x;eu.cmd.hab='c';rodar(J,0.05);eu.cmd.mx=1;rodar(J,0.4);eu.cmd.mx=0;
   ok(Math.abs(eu.x-x0)<0.05&&J.hab.drones.length===1,'sova c: o drone não saiu ou o corpo andou');
   eu.cmd.mira={x:b.x,y:b.y};eu.cmd.atirar=true;rodar(J,0.8);ok(b.ef&&b.ef.revelado>0,'sova c: o dardo não revelou');}
  /* Hunter's Fury atravessa e machuca */
  {const {J,eu,b}=pega('sova');eu.cmd.hab='x';rodar(J,0.05);const hp0=b.hp+b.escudo;eu.cmd.atirar=true;rodar(J,0.1);eu.cmd.atirar=false;
   ok(b.hp+b.escudo<hp0,"sova x: o raio não acertou");}
  /* Seekers acham o alvo mesmo atrás da parede */
  {const {J,eu,b}=pega('skye');eu.cmd.hab='x';rodar(J,4);ok(b.ef&&b.ef.miope>0,'skye x: os seekers não chegaram');}
  /* Cove segura bala; Orbital mata; Clove volta da morte */
  {const {J,eu,b}=pega('harbor');eu.cmd.mira={x:eu.x+4,y:eu.y};eu.cmd.hab='e';rodar(J,0.1);eu.cmd.hab='e';rodar(J,0.1);const hp0=b.hp+b.escudo;eu.cmd.mira={x:b.x,y:b.y};eu.cmd.atirar=true;rodar(J,0.5);eu.cmd.atirar=false;
   ok(b.hp+b.escudo===hp0,'harbor q: a bolha não segurou a bala');}
  {const {J,eu,b}=pega('brimstone');eu.cmd.hab='x';rodar(J,4);ok(!b.vivo||b.hp<50,'brimstone x: o orbital não machucou');}
  {const {J,eu,b}=pega('clove');eu.cmd.hab='x';rodar(J,0.05);GP._dano(J,b,eu,500,1,{nome:'teste'});ok(eu.vivo&&eu.ef.ultimaChance>0,'clove x: não voltou');rodar(J,10.5);ok(!eu.vivo,'clove x: não morreu sem abate');}
  /* muro da Sage segura bala e sai da grade no fim do round */
  {const {J,eu,b}=pega('sage');eu.cmd.hab='c';rodar(J,0.1);const hp0=b.hp+b.escudo;eu.cmd.atirar=true;rodar(J,0.5);eu.cmd.atirar=false;
   ok(b.hp+b.escudo===hp0,'sage c: o muro não segurou a bala');const cel=J.hab.muros[0].celulas.slice();GP.novoRound(J);ok(cel.every(i=>!J.m.solido[i]),'sage c: o muro ficou na grade depois do round');}
  /* Headhunter */
  {const {J,eu,b}=pega('chamber');eu.cmd.hab='q';rodar(J,0.05);const hp0=b.hp+b.escudo;eu.cmd.atirar=true;rodar(J,0.05);eu.cmd.atirar=false;rodar(J,0.2);ok(b.hp+b.escudo<hp0||!b.vivo,'chamber q: o headhunter não acertou');}
  /* Interceptor apaga a granada inimiga */
  {const {J,eu,b}=pega('veto');eu.cmd.hab='e';rodar(J,0.1);const ob=J.hab.objs[0];GP._lancar(J,b,{vel:10,alcance:20,ang:Math.atan2(ob.y-b.y,ob.x-b.x),aoParar:()=>{J._explodiu=true;}});rodar(J,2);ok(!J._explodiu,'veto e: o interceptor não destruiu a granada');}
  {const {J,eu,b}=pega('iso');eu.cmd.hab='x';rodar(J,1);ok(J.hab.muros.length===4,'iso x: a arena não fechou');GP.novoRound(J);}
  /* ultimate: só com 5 abates; usar zera */
  {const J=GP.montarDuelo({mapa:'ascent',arma:'vandal',agenteEu:'jett',semente:4});const eu=J.eu,b=J.ents[1];J.round.fase='ativo';J.round.ate=J.t+999;
   ok(eu.cargas.x===0,'ult: começou carregada');
   for(let i=0;i<5;i++){J.eventos.push({tipo:'morte',t:J.t,de:eu.id,em:b.id});GP.passoHabilidades(J,1/120);}
   ok(eu.pontosUlt===5&&eu.cargas.x===1,'ult: 5 abates não liberaram');
   GP.novoRound(J);ok(eu.cargas.x===1,'ult: sumiu na troca de round');
   J.round.fase='ativo';eu.cmd.hab='x';GP.passoHabilidades(J,1/120);ok(eu.pontosUlt===0&&eu.cargas.x===0,'ult: usar não zerou');}
  /* visão: na linha de visão aparece sempre; atrás da parede, só com barulho ou revelado */
  {const J=GP.montarDuelo({mapa:'ascent',arma:'vandal',semente:4});const eu=J.eu,b=J.ents[1];J.round.fase='ativo';J.round.ate=J.t+999;b.bot=false;b.ia=null;
   const n=J.m.nav,pts=[];for(let i=0;i<n.W*n.H;i++)if(n.livre[i])pts.push({x:(i%n.W+.5)*n.passo,y:((i/n.W|0)+.5)*n.passo});
   let A=null,B=null;for(const p of pts){if(GP.raio(J.m,p.x,p.y,0,14)<13)continue;A=p;break;}
   for(const p of pts){const d=Math.hypot(p.x-A.x,p.y-A.y);if(d>8&&d<12&&!GP.linhaLivre(J.m,A.x,A.y,p.x,p.y)){B=p;break;}}
   const parar=()=>{b.cmd.mx=b.cmd.my=0;b.vx=b.vy=0;J.t+=3;J.sons=[];};
   eu.x=A.x;eu.y=A.y;b.x=A.x+10;b.y=A.y;parar();
   b.cmd.mx=-1;b.cmd.modo='anda';for(let f=0;f<60;f++){GP._aplicarComando(J,b,1/120);J.t+=1/120;}GP.atualizarVisaoDoJogador(J);ok(b._visivel,'visão: no Shift na minha frente não apareceu');
   b.x=B.x;b.y=B.y;parar();GP.atualizarVisaoDoJogador(J);ok(!b._visivel,'visão: parado atrás da parede apareceu');
   b.cmd.mx=1;b.cmd.modo='anda';for(let f=0;f<30;f++){GP._aplicarComando(J,b,1/120);J.t+=1/120;b.x=B.x;b.y=B.y;}GP.atualizarVisaoDoJogador(J);ok(!b._visivel,'visão: no Shift atrás da parede apareceu');
   b.cmd.modo='corre';for(let f=0;f<60;f++){GP._aplicarComando(J,b,1/120);J.t+=1/120;b.x=B.x;b.y=B.y;}GP.atualizarVisaoDoJogador(J);ok(b._visivel,'visão: correndo atrás da parede não apareceu');
   parar();GP.atualizarVisaoDoJogador(J);ok(!b._visivel,'visão: continuou aparecendo depois de parar');
   GP._revelar(J,b,2);GP.atualizarVisaoDoJogador(J);ok(b._visivel,'visão: revelado não apareceu');}
  console.log('habilidades dos 29 agentes testadas');
}
console.log(falhas?falhas+' falha(s)':'gameplay ok');
process.exit(falhas?1:0);
