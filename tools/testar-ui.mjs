#!/usr/bin/env node
/* Teste de fumaça da INTERFACE, fora do navegador.
   Uso: node tools/build.mjs && node tools/testar-ui.mjs   (ou npm run testar-ui)

   Carrega dist/vct-manager.html num DOM de verdade (jsdom), deixa o boot rodar
   e então percorre os dois shells: o menu principal e o HUD do jogo. Renderiza
   todas as telas, todas as abas do Editor, e clica nos handlers.

   Serve para pegar erro de runtime de UI — função que não existe, seletor nulo,
   handler quebrado — sem depender de abrir o arquivo no navegador. O motor tem
   tools/verificar.mjs; este arquivo cobre o outro lado. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
let JSDOM,VirtualConsole;
try{({JSDOM,VirtualConsole}=await import('jsdom'));}
catch(e){
  console.error('Este teste precisa do jsdom (só ele, e só para testar):\n  npm install\n'+
    'O jogo em si continua sem dependência: index.html abre com duplo clique.');
  process.exit(1);
}

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const alvo=resolve(raiz,'dist/vct-manager.html');
if(!existsSync(alvo)){console.error('Rode node tools/build.mjs antes.');process.exit(1);}

const erros=[];
const vc=new VirtualConsole();
vc.on('jsdomError',e=>erros.push('jsdomError: '+(e&&e.message)));
vc.on('error',(...a)=>erros.push('console.error: '+a.join(' ')));

const dom=new JSDOM(readFileSync(alvo,'utf8'),{
  runScripts:'dangerously', pretendToBeVisual:true, url:'https://local.test/',
  virtualConsole:vc
});
const w=dom.window;
w.addEventListener('error',e=>erros.push('window.error: '+(e.message||e.error)));
w.addEventListener('unhandledrejection',e=>erros.push('rejeição: '+(e.reason&&e.reason.message)));

/* --- o que o jsdom não implementa e a UI usa --- */
w.alert=()=>{};
w.confirm=()=>true;
w.URL.createObjectURL=()=>'blob:stub';
w.URL.revokeObjectURL=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
w.HTMLCanvasElement.prototype.toDataURL=()=>'data:image/png;base64,iVBORw0KGgo=';
/* <a download>.click() é navegação para o jsdom; no navegador é só baixar */
w.HTMLAnchorElement.prototype.click=function(){this.dataset.baixou='1';};
Object.defineProperty(w.Image.prototype,'src',{
  set(v){this._src=v;setTimeout(()=>this.onload&&this.onload(),0);},
  get(){return this._src;}
});

/* `let G` e `const Imgs` no topo de um script clássico ficam no escopo lexical
   global, não em window — de fora só dá para alcançá-los por eval no próprio
   escopo. A ponte expõe o que o teste precisa ler e escrever. */
w.eval(`window.__t={
  get G(){return G;}, set G(v){G=v;},
  get modo(){return modo;}, set modo(v){modo=v;},
  get tela(){return tela;}, set tela(v){tela=v;},
  get telaMenu(){return telaMenu;}, set telaMenu(v){telaMenu=v;},
  get edAba(){return edAba;}, set edAba(v){edAba=v;},
  get edTime(){return edTime;}, set edTime(v){edTime=v;},
  get hist(){return hist;}, get histPos(){return histPos;},
  get edFiltro(){return edFiltro;}, get mFiltro(){return mFiltro;},
  get ED_ABAS(){return ED_ABAS;}, get NAV(){return NAV;},
  get MAP_POOL(){return MAP_POOL;}, get ATTRS(){return ATTRS;},
  get Imgs(){return Imgs;}, get ASSETS(){return ASSETS;}, get Prefs(){return Prefs;},
  get CARGOS(){return CARGOS;}, get Rostos(){return Rostos;}, get mercAba(){return mercAba;}, set mercAba(v){mercAba=v;},
  get listaRuns(){return listaRuns;},
  get FAIXAS(){return FAIXAS;}, get over(){return over;}, get overStaff(){return overStaff;},
  get agentesDe(){return agentesDe;}, get potencialDe(){return potencialDe;},
  get padronizarBase(){return padronizarBase;}, get gerarElencosJS(){return gerarElencosJS;},
  get VAGAS(){return VAGAS;}, get marca(){return marca;}, get listaMarcas(){return listaMarcas;},
  get atribuirPatrocinios(){return atribuirPatrocinios;}, get receitaAnual(){return receitaAnual;},
  get receitaPatrocinio(){return receitaPatrocinio;}, get aporteLiga(){return aporteLiga;},
  get atualizarTorcida(){return atualizarTorcida;}, get curvaPremio(){return curvaPremio;},
  get premiosDoStage(){return premiosDoStage;}, get edPatrocinioTrocar(){return edPatrocinioTrocar;},
  get edMarcaCriar(){return edMarcaCriar;}, get edMarcaRemover(){return edMarcaRemover;},
  get MAX_CLUBES_POR_MARCA(){return MAX_CLUBES_POR_MARCA;},
  get remarcarReais(){return remarcarReais;}, get quantosReais(){return quantosReais;},
  get legadoDe(){return legadoDe;}, get rivaisDe(){return rivaisDe;},
  get confronto(){return confronto;}, get confrontosDe(){return confrontosDe;},
  get registrarConfronto(){return registrarConfronto;}, get HISTORIA_REAL(){return HISTORIA_REAL;},
  get acharClubePorNome(){return acharClubePorNome;}, get PRESTIGIO_T2(){return PRESTIGIO_T2;},
  get nomeLiga(){return nomeLiga;}, get paisDoClube(){return paisDoClube;},
  get edAplicarPaises(){return edAplicarPaises;}, get edListarPaises(){return edListarPaises;},
  get gerarClubesJS(){return gerarClubesJS;}, get POP_PAIS(){return POP_PAIS;},
  get parsearVlr(){return parsearVlr;},
  get narrarMapa(){return narrarMapa;}, get narrarFimDeMapa(){return narrarFimDeMapa;},
  get narrarRound(){return narrarRound;}, get partidaAoVivo(){return partidaAoVivo;},
  get avPular(){return avPular;}, get avFechar(){return avFechar;}, get simMapa(){return simMapa;},
  get PAPEIS(){return PAPEIS;}, get criarManager(){return criarManager;},
  get montarMetas(){return montarMetas;}, get avaliarTemporada(){return avaliarTemporada;},
  get souTreinador(){return souTreinador;}, get situacaoManager(){return situacaoManager;},
  get ofertasDeEmprego(){return ofertasDeEmprego;}, get assumirClube(){return assumirClube;},
  get posicaoNaLiga(){return posicaoNaLiga;}, get modalVeredito(){return modalVeredito;},
  get afinidadeDe(){return afinidadeDe;}, get afinidadeElenco(){return afinidadeElenco;},
  get mapasDe(){return mapasDe;}, get evoluirAfinidade(){return evoluirAfinidade;},
  get afinidadeInicial(){return afinidadeInicial;}, get forcaTime(){return forcaTime;},
  get popularidadeDoClube(){return popularidadeDoClube;}, get torcidaInicial(){return torcidaInicial;},
  get ano(){return G.ano;},
  get overComo(){return overComo;}, get custoDeFuncao(){return custoDeFuncao;},
  get funcoesElegiveis(){return funcoesElegiveis;}, get melhorSecundaria(){return melhorSecundaria;},
  get CUSTO_MAX_SECUNDARIA(){return CUSTO_MAX_SECUNDARIA;}, get autoEscalar(){return autoEscalar;},
  get funcoesDescobertas(){return funcoesDescobertas;}, get notaEscalacao(){return notaEscalacao;},
  get edAplicarJogador(){return edAplicarJogador;}, get ROLE_W(){return ROLE_W;},
  get salarioPedido(){return salarioPedido;}, get detalharPedido(){return detalharPedido;},
  get pedidoDeVenda(){return pedidoDeVenda;}, get avaliarProposta(){return avaliarProposta;},
  get recusasDuras(){return recusasDuras;}, get regiaoNatal(){return regiaoNatal;},
  get nivelDoClube(){return nivelDoClube;}, get posicaoNoElenco(){return posicaoNoElenco;},
  get mercadoTransferencias(){return mercadoTransferencias;}, get folgaSalarial(){return folgaSalarial;},
  get receitaAnual2(){return receitaAnual;},
  get RUN_VERSAO(){return RUN_VERSAO;}, get empacotarRun(){return empacotarRun;},
  get desempacotarRun(){return desempacotarRun;}, get migrarRun(){return migrarRun;},
  get nivelStaff(){return nivelStaff;}, get atualizarComissao(){return atualizarComissao;},
  get semente(){return _s;}, set semente(v){_s=v;},
  get NIVEL_NEUTRO(){return NIVEL_NEUTRO;}, get overStaff2(){return overStaff;},
  get membroDe(){return membroDe;}, get pesoComissao(){return pesoComissao;},
  get custeioAnual(){return custeioAnual;}, get receitaLivre(){return receitaLivre;},
  get tetoFolhaDe(){return tetoFolhaDe;}, get folhaAnual(){return folhaAnual;},
  get investirEstrutura(){return investirEstrutura;}, get custoUpgrade(){return custoUpgrade;},
  get ESTRUTURA_MAX(){return ESTRUTURA_MAX;}, get ajustarFolha(){return ajustarFolha;},
  get TETO_FOLHA(){return TETO_FOLHA;}, get TETO_FOLHA_MAX(){return TETO_FOLHA_MAX;},
  get ELENCO_MIN(){return ELENCO_MIN;}, get ELENCO_MAX(){return ELENCO_MAX;},
  get contratar(){return contratar;}, get liberar(){return liberar;},
  get reporElenco(){return reporElenco;}, get anunciarJogador(){return anunciarJogador;},
  get retirarAnuncio(){return retirarAnuncio;}, get gerarPropostas(){return gerarPropostas;},
  get aceitarProposta(){return aceitarProposta;}, get recusarProposta(){return recusarProposta;},
  get resolverEmprestimos(){return resolverEmprestimos;}, get emprestadosDe(){return emprestadosDe;},
  get custoEmprestimosDe(){return custoEmprestimosDe;}, get executarEmprestimo(){return executarEmprestimo;},
  get pedidoDeVenda2(){return pedidoDeVenda;}, get montarEmprestimo(){return montarEmprestimo;},
  get semana(){return semana;},
  get avancar(){return avancar;}, get acharStage(){return acharStage;},
  get ordenarGrupo(){return ordenarGrupo;}, get melhorDoTorneio(){return melhorDoTorneio;},
  get resumoMVP(){return resumoMVP;}, get faseDE(){return faseDE;},
  get blocoDaSemana(){return blocoDaSemana;}, get proximoBloco(){return proximoBloco;},
  get rotuloSemana(){return rotuloSemana;}, get rotuloPeriodo(){return rotuloPeriodo;},
  get SEMANAS_ANO(){return SEMANAS_ANO;}, get TEMPORADA(){return TEMPORADA;},
  get sortearGrupos(){return sortearGrupos;}, get nomeStage(){return nomeStage;},
  get nomeTitulo(){return nomeTitulo;}, get prepararRodada(){return prepararRodada;},
  get proximoConfronto(){return proximoConfronto;}, get montarCalendario(){return montarCalendario;},
  get fimDeTemporada(){return fimDeTemporada;}, get forcaTime2(){return forcaTime;},
  get demitirManager(){return demitirManager;}, get overAlvoPeso(){return overAlvoPeso;},
  get edApagar(){return edApagar;}, get edCriarJogador(){return edCriarJogador;},
  get esquecerJogador(){return esquecerJogador;},
  get IDADE_NOVO_MIN(){return IDADE_NOVO_MIN;}, get IDADE_NOVO_MAX(){return IDADE_NOVO_MAX;},
  get fimDeTemporada2(){return fimDeTemporada;},
  get metaInicial(){return metaInicial;}, get forcaMeta(){return forcaMeta;},
  get aplicarPatch(){return aplicarPatch;}, get topoDoMeta(){return topoDoMeta;},
  get nomesDeAgentes(){return nomesDeAgentes;}, get faixaMeta(){return faixaMeta;},
  get patchDaSemana(){return patchDaSemana;}, get SEMANAS_PATCH(){return SEMANAS_PATCH;},
  get compDe(){return compDe;}, get agenteDe(){return agenteDe;},
  get definirAgente(){return definirAgente;}, get aplicarPreset(){return aplicarPreset;},
  get pesoComp(){return pesoComp;}, get surpresaDaComp(){return surpresaDaComp;},
  get compEscalada(){return compEscalada;}, get limparComps(){return limparComps;},
  get compIA(){return compIA;}, get PRESETS_COMP(){return PRESETS_COMP;},
  get valorDoAgente(){return valorDoAgente;}, get pendorDoMapa(){return pendorDoMapa;},
  get nivelScout(){return nivelScout;}, get relatorioScout(){return relatorioScout;},
  get resumoScout(){return resumoScout;}, get SCOUT_MAX(){return SCOUT_MAX;},
  get taticaIA(){return taticaIA;}, get proximoAdversarioDe(){return proximoAdversarioDe;},
  get iniciarVeto(){return iniciarVeto;}, get vetoEscolher(){return vetoEscolher;},
  get vetoMinhaVez(){return vetoMinhaVez;}, get vetoRestantes(){return vetoRestantes;},
  get vetoResultado(){return vetoResultado;}, get vetoAvancarAteMim(){return vetoAvancarAteMim;},
  get vetoAutomatico(){return vetoAutomatico;}, get roteiroVeto(){return roteiroVeto;},
  get compromissoDaSemana(){return compromissoDaSemana;},
  get abrirPrePartida(){return abrirPrePartida;}, get PP(){return PP;}, get ppPintar(){return ppPintar;},
  get ppFechar(){return ppFechar;}, get avancar(){return avancar;},
  get abrirMapa(){return abrirMapa;}, get passoRound(){return passoRound;},
  get fecharMapa(){return fecharMapa;}, get pedirTempo(){return pedirTempo;},
  get podePedirTempo(){return podePedirTempo;}, get TEMPOS_POR_MAPA(){return TEMPOS_POR_MAPA;},
  get abrirSerie(){return abrirSerie;}, get fecharSerie(){return fecharSerie;},
  get serieAbrirMapa(){return serieAbrirMapa;}, get serieFecharMapa(){return serieFecharMapa;},
  get simMapa(){return simMapa;}, get simPartida(){return simPartida;},
  get conversarCom(){return conversarCom;}, get insatisfeitos(){return insatisfeitos;},
  get podeConversar(){return podeConversar;}, get opcoesDeConversa(){return opcoesDeConversa;},
  get cobrarPromessas(){return cobrarPromessas;}, get estaCobrado(){return estaCobrado;},
  get motivoDeInsatisfacao(){return motivoDeInsatisfacao;},
  get vantagemTatica(){return vantagemTatica;}, get perfilAgressivo(){return perfilAgressivo;},
  get viesLado(){return viesLado;}, get MAPA_ATK(){return MAPA_ATK;},
  get pesoAgressividade(){return pesoAgressividade;}, get pesoFoco(){return pesoFoco;},
  get POOL_2026(){return POOL_2026;}, get AGENT_PICK_2026(){return AGENT_PICK_2026;},
  get planoDe(){return planoDe;}, get planoDoJogador(){return planoDoJogador;},
  get definirPlano(){return definirPlano;}, get limparPlano(){return limparPlano;},
  get definirMapaTreino(){return definirMapaTreino;}, get aplicarTreinoSemanal(){return aplicarTreinoSemanal;},
  get planoIA(){return planoIA;}, get nivelAgente(){return nivelAgente;},
  get tetoAgente(){return tetoAgente;}, get treinarAgente(){return treinarAgente;},
  get enferrujarAgentes(){return enferrujarAgentes;}, get semearAgentes(){return semearAgentes;},
  get funcaoConhece(){return funcaoConhece;}, get funcaoDoAgente(){return funcaoDoAgente;},
  get TREINO_TIPOS(){return TREINO_TIPOS;}, get AGENTS(){return AGENTS;},
  get mapaAtivo(){return mapaAtivo;}, get poolInicial(){return poolInicial;},
  get rotacionarMapas(){return rotacionarMapas;}, get MAPAS_ATIVOS(){return MAPAS_ATIVOS;},
  get esquecerMapas(){return esquecerMapas;}, get desenvolver(){return desenvolver;},
  get normalizarPool(){return normalizarPool;}, get mapaDaSemanaIA(){return mapaDaSemanaIA;},
  get afinidadeElenco2(){return afinidadeElenco;}
}`);
const t=w.__t;

const espera=ms=>new Promise(r=>setTimeout(r,ms));
/* Acham um stage já resolvido de cada formato, para os casos não dependerem
   de qual torneio por acaso está em andamento quando eles rodam. */
const acharGrupoRodado=()=>{
  for(const b of w.__t.G.calendario)for(const s of b.stages)
    if(s.tipo==='grupos'&&s.feito)return s;
  return null;
};
const acharDERodada=()=>{
  for(const b of w.__t.G.calendario)for(const s of b.stages)
    if(s.tipo==='de'&&s.feito&&s.campeao)return s;
  return null;
};
const passos=[];
let falhas=0;
const teste=async(nome,fn)=>{
  const antes=erros.length;
  try{
    await fn();
    const novos=erros.slice(antes);
    if(novos.length){falhas++;passos.push(['X',nome,novos.join(' | ')]);}
    else passos.push(['ok',nome,'']);
  }catch(e){falhas++;passos.push(['X',nome,e.message]);}
};

await espera(80);   /* deixa o DOMContentLoaded e o boot terminarem */

const $=s=>w.document.querySelector(s);
const $$=s=>[...w.document.querySelectorAll(s)];
const disparar=(el,tipo)=>el.dispatchEvent(new w.Event(tipo,{bubbles:true}));
const clicar=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
/* O jogo pergunta pela própria janela, não por confirm(): responde a ela. */
const responder=async(sim=true)=>{
  await espera(0);
  const b=w.document.querySelector(sim?'#dlgSim':'#dlgNao');
  if(!b)throw new Error('o diálogo do jogo não abriu');
  clicar(b);
  await espera(10);
};
const corpo=()=>$('#menuCorpo')||$('#view');

/* ============================================================
   SHELL DO MENU
   ============================================================ */
await teste('boot cai no menu principal',async()=>{
  if(!w.G&&!t.G)throw new Error('G não existe depois do boot');
  if(t.modo!=='menu')throw new Error('modo deveria ser menu, veio '+t.modo);
  if(!w.document.body.classList.contains('modo-menu'))throw new Error('body sem a classe modo-menu');
  if(!$('#shellMenu').innerHTML.trim())throw new Error('shell do menu vazio');
  if(!$('#mnNovo'))throw new Error('item Novo jogo não apareceu');
  if(Object.keys(t.G.times).length!==80)throw new Error('esperado 80 times');
});

await teste('menu mostra mosaico de escudos e rodapé de estado',async()=>{
  if($$('.menu-mosaico img').length<20)throw new Error('mosaico com poucos escudos');
  if(!$('.menu-pe').textContent.includes('Armazenamento'))throw new Error('rodapé sem armazenamento');
});

await teste('Novo jogo gera mundo e cai no Banco de dados',async()=>{
  clicar($('#mnNovo'));
  if(!$('#nmGerar'))throw new Error('modal de novo mundo não abriu');
  $('#nmSeed').value='4242';
  clicar($('#nmGerar'));
  await espera(10);
  if(t.telaMenu!=='banco')throw new Error('não foi para o banco de dados');
  if(t.G.seed!==4242)throw new Error('semente não aplicou');
  if(!$('#menuCorpo'))throw new Error('corpo do menu não montou');
  if(!$('#menuComecar'))throw new Error('sem botão de escolher clube na pré-run');
});

await teste('abas do Banco de dados renderizam dentro do menu',async()=>{
  for(const [k] of t.ED_ABAS){
    t.edAba=k;w.render();
    if(!$('#menuCorpo').innerHTML.trim())throw new Error('aba '+k+' vazia no shell do menu');
  }
  t.edAba='times';w.render();
});

await teste('handlers do Editor funcionam no shell do menu',async()=>{
  const sel=$$('[data-edmover]')[0];
  if(!sel)throw new Error('nenhum select de mover');
  const pid=sel.dataset.edmover;
  const destino=Object.values(t.G.times).find(x=>x.id!==w.P(pid).timeId&&x.elenco.length<9);
  sel.value=destino.id;disparar(sel,'change');
  if(w.P(pid).timeId!==destino.id)throw new Error('mover não funcionou fora do HUD');
});

await teste('Partidas salvas, Configurações e Créditos abrem',async()=>{
  for(const [id,dest] of [['mnRuns','runs'],['mnConfig','config'],['mnCreditos','creditos']]){
    t.telaMenu='menu';w.render();
    clicar($('#'+id));
    if(t.telaMenu!==dest)throw new Error(id+' não navegou');
    if(!$('#menuCorpo').innerHTML.trim())throw new Error(dest+' renderizou vazio');
  }
});

await teste('interruptor de configuração grava a preferência',async()=>{
  t.telaMenu='config';w.render();
  const sw=$('[data-pref="autosave"]');
  if(!sw)throw new Error('interruptor não encontrado');
  const antes=t.Prefs.get('autosave');
  clicar(sw);
  if(t.Prefs.get('autosave')===antes)throw new Error('preferência não mudou');
  if(w.localStorage.getItem('vct_prefs_v1')===null)throw new Error('preferência não persistiu');
  clicar($('[data-pref="autosave"]'));
});

await teste('créditos trazem o aviso de marca',async()=>{
  t.telaMenu='creditos';w.render();
  const txt=$('#menuCorpo').textContent;
  if(!/Riot Games/.test(txt))throw new Error('sem aviso de marca');
  if(!/sem qualquer vínculo/.test(txt))throw new Error('sem ressalva de não afiliação');
});

/* ============================================================
   ENTRADA NO JOGO
   ============================================================ */
await teste('base quebrada barra a seleção de clube',async()=>{
  const alvoT=Object.values(t.G.times)[0];
  const guardado=alvoT.elenco.slice();
  alvoT.elenco=guardado.slice(0,3);
  w.telaNovoJogo();
  if(!$('#modal').innerHTML.includes('erro'))throw new Error('deixou abrir com a base quebrada');
  alvoT.elenco=guardado;w.edRemendarEscalacao(alvoT);
  $('#modal').innerHTML='';
});

await teste('escolher clube entra no HUD',async()=>{
  t.telaMenu='banco';w.render();
  clicar($('#menuComecar'));
  const pick=$$('[data-pick]')[0];
  if(!pick)throw new Error('lista de clubes não abriu');
  clicar(pick);
  await espera(10);
  if(t.modo!=='jogo')throw new Error('não entrou no modo jogo');
  if(!w.document.body.classList.contains('modo-jogo'))throw new Error('body sem a classe modo-jogo');
  if(!t.G.meuTime)throw new Error('clube não foi assumido');
  if(!$('#side').innerHTML.trim())throw new Error('sidebar vazia');
  if(!$('#top').innerHTML.trim())throw new Error('topbar vazia');
  if(!$('#view').innerHTML.trim())throw new Error('conteúdo vazio');
});

/* ============================================================
   HUD
   ============================================================ */
await teste('sidebar tem os grupos, ícones e o item ativo',async()=>{
  if($$('#side a').length!==t.NAV.length)throw new Error('sidebar com '+$$('#side a').length+' itens, esperado '+t.NAV.length);
  if(!$$('#side a svg').length)throw new Error('sidebar sem ícones');
  if($$('.side-grp').length<4)throw new Error('sidebar sem os grupos');
  if(!$('#side a.on'))throw new Error('nenhum item marcado como ativo');
  if(!$('.side-org').textContent.trim())throw new Error('bloco da organização vazio');
});

await teste('topbar mostra temporada, semana, agenda, caixa e ações',async()=>{
  const txt=$('#top').textContent;
  for(const p of ['Temporada','Semana','Agenda','Caixa'])
    if(!txt.includes(p))throw new Error('topbar sem '+p);
  /* A data é o ponto: sem ela "semana 12" não diz nada sobre onde você está
     no ano, e planejar continua impossível. */
  /* Duas formas: "16–22 mar" quando a semana cabe num mês só, e
     "29 dez – 4 jan" quando ela atravessa a virada. */
  if(!/\d+\s*[–-]\s*\d+\s+[a-zç]{3}|\d+\s+[a-zç]{3}\s*[–-]\s*\d+\s+[a-zç]{3}/.test(txt))
    throw new Error('topbar sem a data da semana: '+txt.slice(0,200));
  for(const id of ['#btnSave','#btnNext','#btnFim'])
    if(!$(id))throw new Error('topbar sem '+id);
  if(!$('.top-titulo').textContent.trim())throw new Error('topbar sem título de tela');
});

await teste('todas as telas do HUD renderizam',async()=>{
  for(const [k,rot] of t.NAV){
    t.tela=k;w.render();
    if(!$('#view').innerHTML.trim())throw new Error('tela '+k+' vazia');
    if($('.top-titulo').textContent.trim()!==rot)throw new Error('título errado em '+k);
  }
  t.tela='inicio';w.render();
});

await teste('Central traz a faixa do circuito com o bloco atual',async()=>{
  t.tela='inicio';w.render();
  if(!$$('.tl-item').length)throw new Error('faixa do circuito não apareceu');
  if(!$('.tl-item.on'))throw new Error('bloco atual não destacado');
});

await teste('clicar na sidebar navega e alimenta o histórico',async()=>{
  const antes=t.hist.length;
  clicar($$('#side a').find(a=>a.dataset.t==='elenco'));
  if(t.tela!=='elenco')throw new Error('não navegou para elenco');
  if(t.hist.length<=antes)throw new Error('histórico não cresceu');
  clicar($('#hVolta'));
  if(t.tela==='elenco')throw new Error('seta de voltar não funcionou');
  clicar($('#hFrente'));
  if(t.tela!=='elenco')throw new Error('seta de avançar não funcionou');
});

await teste('medidores e radar aparecem na ficha do jogador',async()=>{
  t.tela='elenco';w.render();
  const linha=$$('#view .jrow')[0];
  if(!linha)throw new Error('nenhuma linha de jogador');
  clicar(linha);
  if(!$('#modal .gauge'))throw new Error('sem medidores circulares');
  if(!$('#modal .radar'))throw new Error('sem radar de perfil');
  if($$('#modal .gauge svg circle').length<6)throw new Error('medidores sem arco');
  if(!$('#modal .badge'))throw new Error('sem badges de estado');
  $('#modal').innerHTML='';
});

await teste('Avançar resolve rodada e atualiza a topbar',async()=>{
  t.tela='inicio';w.render();
  t.Prefs.set('modalPartida',false);t.Prefs.set('resumoRodada',false);
  const faseAntes=$('#top').textContent;
  clicar($('#btnNext'));
  await espera(10);
  if($('#top').textContent===faseAntes&&t.G.bloco===0)throw new Error('nada mudou ao avançar');
});

await teste('avanço rápido para até o próximo compromisso',async()=>{
  const blocoAntes=t.G.bloco,anoAntes=t.G.ano;
  clicar($('#btnFim'));
  await espera(10);
  if(t.G.bloco===blocoAntes&&t.G.ano===anoAntes&&!$('#modal').innerHTML)
    { /* pode ter parado numa partida minha na mesma rodada — só não pode quebrar */ }
  if(!$('#view').innerHTML.trim())throw new Error('tela quebrou depois do avanço rápido');
  $('#modal').innerHTML='';
});

await teste('Banco de dados dentro do jogo usa a mesma tela',async()=>{
  t.tela='editor';w.render();
  if(!$$('#view .tabs button').length)throw new Error('abas do editor não apareceram no HUD');
  if(!$('#view').textContent.includes('Banco de dados'))throw new Error('título do editor ausente');
});

await teste('Configurações abrem dentro do jogo',async()=>{
  t.tela='config';w.render();
  if(!$('[data-pref]'))throw new Error('sem interruptores no HUD');
  if(!$('#view').textContent.includes('Armazenamento'))throw new Error('sem bloco de armazenamento');
});

await teste('voltar ao menu e retomar a partida',async()=>{
  t.tela='inicio';w.render();
  clicar($('#btnMenu'));
  if(t.modo!=='menu')throw new Error('não voltou ao menu');
  if(!$('#mnContinuar'))throw new Error('menu sem Continuar');
  if($('#mnContinuar').disabled)throw new Error('Continuar deveria estar ativo com partida em andamento');
  clicar($('#mnContinuar'));
  await espera(10);
  if(t.modo!=='jogo')throw new Error('Continuar não voltou para o jogo');
});

/* ============================================================
   EDITOR — regressões das funções de base
   ============================================================ */
await teste('mandar jogador para Sem clube e vê-lo no Mercado',async()=>{
  t.tela='editor';t.edAba='times';w.render();
  const b=$$('[data-edlivre]')[0];
  const pid=b.dataset.edlivre;
  clicar(b);
  if(w.P(pid).timeId!==null)throw new Error('continua com clube');
  t.tela='mercado';t.mFiltro.so='livres';w.render();
  if(!$('#view').innerHTML.includes(w.P(pid).nome))throw new Error('não apareceu no Mercado');
  t.mFiltro.so='todos';
});

await teste('ficha editável salva atributos, over e renome',async()=>{
  t.tela='editor';t.edAba='times';w.render();
  const b=$$('[data-edp]')[0];
  const pid=b.dataset.edp;
  clicar(b);
  if(!$('#edjSalvar'))throw new Error('modal de edição não abriu');
  $('#edjNome').value='TesteNick';
  $('#edjIdade').value='24';
  const at=$('[data-atn="mira"]');at.value='91';disparar(at,'input');
  if($('#edjOver').textContent==='')throw new Error('over ao vivo não atualizou');
  $('#edjAlvo').value='86';clicar($('#edjAplicarAlvo'));
  clicar($('#edjSalvar'));
  await espera(10);
  const p=w.P(pid);
  if(p.nome!=='TesteNick')throw new Error('renome não aplicou');
  if(w.over(p)!==86)throw new Error('over alvo não aplicou: '+w.over(p));
});

await teste('editar time aplica identidade, staff e mapa',async()=>{
  t.tela='editor';t.edAba='times';w.render();
  const alvoT=t.G.times[t.edTime];
  $('#edNome').value='Clube Teste';$('#edTag').value='TST';
  $('#edPrest').value='77';$('#edCaixa').value='1234000';
  $$('[data-edstaff]')[0].value='5';$$('[data-edmap]')[0].value='7';
  clicar($('#edSalvarT'));
  await espera(10);
  if(alvoT.tag!=='TST')throw new Error('tag não aplicou');
  if(alvoT.caixa!==1234000)throw new Error('caixa não aplicou');
  if(alvoT.staff.tecnico!==5)throw new Error('staff não aplicou');
  if(alvoT.mapPref[t.MAP_POOL[0]]!==7)throw new Error('afinidade não aplicou');
});

await teste('upload de escudo entra no pacote e vira o src',async()=>{
  const alvoT=t.G.times[t.edTime];
  const arq=new w.File([new Uint8Array([1,2,3])],'x.png',{type:'image/png'});
  const uri=await t.Imgs.doArquivo(arq);
  await t.Imgs.gravar(t.Imgs.chaveTime(alvoT.tag),uri);
  if(!t.ASSETS.logo(alvoT).startsWith('data:image/'))throw new Error('ASSETS.logo não usou o pacote');
  t.edAba='imagens';w.render();
  if(!$$('.imgcard').length)throw new Error('aba Imagens não listou');
  clicar($('#edImgLimpar'));
  await responder();
  if(t.Imgs.quantos()!==0)throw new Error('limpar não esvaziou');
});

await teste('importador aceita clube e LIVRE',async()=>{
  t.edAba='io';w.render();
  const alvoT=Object.values(t.G.times)[0];
  $('#impTxt').value=alvoT.tag+' | ImportadoUm | Duelista | 84 | 90 | 21 | BR\nLIVRE | ImportadoLivre | Sentinela | 80\nLIXO';
  $('#impModo').value='adicionar';
  clicar($('#impGo'));
  const um=Object.values(t.G.jogadores).find(p=>p.nome==='ImportadoUm');
  const livre=Object.values(t.G.jogadores).find(p=>p.nome==='ImportadoLivre');
  if(!um||um.timeId!==alvoT.id)throw new Error('não importou para o clube');
  if(!livre||livre.timeId!==null)throw new Error('LIVRE não ficou sem clube');
});

await teste('Validação acusa e conserta elenco curto',async()=>{
  const alvoT=Object.values(t.G.times).find(x=>x.elenco.length>=6);
  while(alvoT.elenco.length>3)w.edApagar(alvoT.elenco[alvoT.elenco.length-1]);
  t.edAba='validar';w.render();
  if(w.edValidar().ok)throw new Error('deveria acusar elenco curto');
  clicar($('#edFixCurtos'));
  await espera(10);
  if(!w.edValidar().ok)throw new Error('não fechou a base: '+w.edValidar().erros[0]);
});

await teste('simular uma temporada com a base editada',async()=>{
  t.Prefs.set('modalPartida',false);t.Prefs.set('resumoRodada',false);
  for(let i=0;i<40;i++)w.avancar();
  t.tela='inicio';w.render();
  t.tela='comp';w.render();
  t.tela='stats';w.render();
  if(!$('#view').innerHTML.trim())throw new Error('telas quebraram depois de simular');
});


/* ============================================================
   CATÁLOGO: TORNEIOS, AGENTES E PAÍSES
   ============================================================ */
await teste('aba Torneios lista o catálogo por escopo',async()=>{
  t.tela='editor';t.edAba='torneios';w.render();
  const n=Object.keys(t.G.torneios).length;
  if(n!==43)throw new Error('catálogo com '+n+' torneios, esperado 43');
  if($$('[data-tnome]').length!==n)throw new Error('nem todo torneio virou linha');
  if(!$$('[data-tarte]').length)throw new Error('sem campo de arte');
  if(!$('#view').textContent.includes('Internacional'))throw new Error('sem o grupo internacional');
});

await teste('renomear torneio vale na hora, inclusive no stage em curso',async()=>{
  t.tela='editor';t.edAba='torneios';w.render();
  const campo=$('[data-tnome="champions"]');
  campo.value='Copa do Mundo VCT';
  clicar($('#edSalvarTor'));
  await espera(10);
  if(t.G.torneios.champions.nome!=='Copa do Mundo VCT')throw new Error('nome não salvou');
  if(w.nomeStage({torneioId:'champions',nome:'antigo'})!=='Copa do Mundo VCT')
    throw new Error('stage não leu o catálogo');
});

await teste('prêmio editado muda a premiação do stage',async()=>{
  t.tela='editor';t.edAba='torneios';w.render();
  $('[data-tpremio="champions"]').value='2000000';
  clicar($('#edSalvarTor'));
  await espera(10);
  const p=w.premiosDoStage({torneioId:'champions'});
  if(p[0]!==2000000)throw new Error('campeão deveria levar 2M, veio '+p[0]);
  if(!(p[1]>0&&p[1]<p[0]))throw new Error('curva das demais colocações quebrou');
  const zero=w.premiosDoStage({torneioId:'stage1_AMER'});
  if(zero.length)throw new Error('fase sem premiação não pode pagar');
});

await teste('arte de torneio entra no pacote no formato certo',async()=>{
  const arq=new w.File([new Uint8Array([1,2,3])],'x.png',{type:'image/png'});
  const [lg,al]=t.Imgs.formatoDaChave(t.Imgs.chaveTorneio('champions'));
  if(lg!==256||al!==256)throw new Error('formato de arte errado: '+lg+'x'+al);
  const uri=await t.Imgs.doArquivo(arq,lg,al);
  await t.Imgs.gravar(t.Imgs.chaveTorneio('champions'),uri);
  if(!t.ASSETS.arte(t.G.torneios.champions).startsWith('data:image/'))
    throw new Error('ASSETS.arte não usou o pacote');
  t.edAba='torneios';w.render();
  if(!$('[data-edimgdel]'))throw new Error('sem botão de remover a arte');
});

await teste('aba Agentes lista, adiciona, move de função e remove',async()=>{
  t.tela='editor';t.edAba='agentes';w.render();
  const antes=w.todosAgentes().length;
  if(!$$('.agcard').length)throw new Error('nenhum card de agente');
  $('#agNovo').value='Testinha';
  $('#agNovoRole').value='Duelista';
  clicar($('#agAdd'));
  await espera(10);
  if(w.todosAgentes().length!==antes+1)throw new Error('não adicionou');
  if(!w.agentesDe('Duelista').includes('Testinha'))throw new Error('não entrou em Duelista');
  const sel=$('[data-agrole="Testinha"]');
  sel.value='Sentinela';disparar(sel,'change');
  await espera(10);
  if(!w.agentesDe('Sentinela').includes('Testinha'))throw new Error('não mudou de função');
  if(w.agentesDe('Duelista').includes('Testinha'))throw new Error('ficou nas duas funções');
  clicar($('[data-agdel="Testinha"]'));
  await responder();
  if(w.todosAgentes().some(a=>a.nome==='Testinha'))throw new Error('não removeu');
});

await teste('função não pode ficar sem nenhum agente',async()=>{
  const restantes=w.agentesDe('Flex').slice();
  restantes.slice(0,-1).forEach(a=>w.edRemoverAgente('Flex',a));
  const r=w.edRemoverAgente('Flex',w.agentesDe('Flex')[0]);
  if(r.ok)throw new Error('deixou esvaziar a função');
  if(!w.agentesDe('Flex').length)throw new Error('Flex ficou vazia');
});

await teste('retrato de agente usa proporção 4:5',async()=>{
  const [lg,al]=t.Imgs.formatoDaChave(t.Imgs.chaveAgente('Jett'));
  if(lg!==256||al!==320)throw new Error('formato de agente errado: '+lg+'x'+al);
});

await teste('seletor de país mostra bandeira, nome e sigla',async()=>{
  t.tela='elenco';w.render();
  const linha=$$('#view .jrow')[0];
  const pid=linha.dataset.p;
  clicar(linha);
  $('#modal').innerHTML='';
  w.modalEditarJogador(pid);
  const sel=$('#edjPais');
  if(!sel||sel.tagName!=='SELECT')throw new Error('país ainda é campo de texto');
  if(sel.options.length<90)throw new Error('lista de países curta: '+sel.options.length);
  const br=[...sel.options].find(o=>o.value==='BR');
  if(!br)throw new Error('BR não está na lista');
  if(!/Brasil/.test(br.textContent))throw new Error('sem o nome do país');
  if(!/BR/.test(br.textContent))throw new Error('sem a sigla');
  if(!/\u{1F1E7}\u{1F1F7}/u.test(br.textContent))throw new Error('sem a bandeira');
  sel.value='JP';
  clicar($('#edjSalvar'));
  await espera(10);
  if(w.P(pid).pais!=='JP')throw new Error('país não salvou');
  $('#modal').innerHTML='';
});

await teste('país fora da lista não some do select',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  p.pais='XX';
  const html=w.selectPais('','XX');
  if(!html.includes('fora da lista'))throw new Error('código desconhecido sumiria do select');
  p.pais='BR';
});


/* ============================================================
   COMISSÃO TÉCNICA
   ============================================================ */
await teste('mundo nasce com comissão completa em todo clube',async()=>{
  const n=Object.keys(t.G.staff).length;
  if(n<400)throw new Error('só '+n+' membros de comissão');
  const vagas=Object.values(t.G.times).filter(x=>t.CARGOS.some(c=>!w.membroDe(x,c.id)));
  if(vagas.length)throw new Error(vagas.length+' clubes com vaga aberta no início');
  const um=Object.values(t.G.staff)[0];
  for(const campo of ['nome','cargo','idade','pais','at','pot','salario','valor'])
    if(um[campo]===undefined)throw new Error('membro sem campo '+campo);
});

await teste('t.staff é derivado de quem ocupa a vaga',async()=>{
  const time=t.G.times[t.G.meuTime];
  const m=w.membroDe(time,'tecnico');
  /* Rebaixa primeiro: o coach deste clube pode já ser um dos promovidos a 99
     na criação do mundo, e aí não teria para onde subir. Testar as duas
     direções também prova mais do que testar só uma. */
  const piso=t.FAIXAS.comissao[2][0];
  for(const k in m.at)m.at[k]=piso;
  w.atualizarComissao(time);
  const baixo=time.staff.tecnico;
  if(Math.abs(baixo-1)>0.1)throw new Error('over no piso deveria dar nível 1, deu '+baixo);
  m.at.tecnica=99;m.at.visao=99;m.at.gestao=99;m.at.disciplina=99;
  w.atualizarComissao(time);
  if(time.staff.tecnico<=baixo)throw new Error('nível não subiu com o over');
  if(Math.abs(time.staff.tecnico-5)>0.1)throw new Error('over 99 deveria dar nível 5, deu '+time.staff.tecnico);
  const r=w.liberarStaff(m.id);
  if(!r.ok)throw new Error(r.erro);
  if(time.staff.tecnico!==1)throw new Error('vaga aberta deveria valer nível 1, deu '+time.staff.tecnico);
  w.moverStaff(m.id,time.id,'tecnico');
});

await teste('aba Comissão lista os cinco cargos e a folha',async()=>{
  t.tela='editor';t.edAba='comissao';w.render();
  if($$('[data-comissao]').length!==t.CARGOS.length)
    throw new Error('esperava '+t.CARGOS.length+' seletores de cargo');
  if(!$('#view').textContent.includes('folha da comissão'))throw new Error('sem a folha');
  if(!$$('[data-contratarstaff]').length)throw new Error('sem lista de comissão livre');
});

await teste('trocar o ocupante pelo select move o membro',async()=>{
  t.tela='editor';t.edAba='comissao';w.render();
  const sel=$('[data-comissao="analista"]');
  const opcoes=[...sel.options].filter(o=>o.value&&o.value!==sel.value);
  if(!opcoes.length)throw new Error('sem outro candidato para analista');
  const novo=opcoes[opcoes.length-1].value;
  sel.value=novo;disparar(sel,'change');
  await espera(10);
  const time=t.G.times[t.edTime];
  if(time.comissao.analista!==novo)throw new Error('vaga não trocou de ocupante');
  if(t.G.staff[novo].timeId!==time.id)throw new Error('membro não passou a ser do clube');
});

await teste('criar membro para um cargo preenche a vaga',async()=>{
  t.tela='editor';t.edAba='comissao';w.render();
  const time=t.G.times[t.edTime];
  const antes=Object.keys(t.G.staff).length;
  w.liberarStaff(w.membroDe(time,'fisio').id);
  w.render();
  clicar($('[data-edstaffnovo="fisio"]'));
  await espera(10);
  if(Object.keys(t.G.staff).length<=antes)throw new Error('não criou ninguém');
  if(!w.membroDe(time,'fisio'))throw new Error('vaga continua aberta');
});

await teste('ficha editável da comissão salva e recalcula o nível',async()=>{
  const time=t.G.times[t.edTime];
  const m=w.membroDe(time,'mental');
  w.modalEditarStaff(m.id);
  if(!$('#edsSalvar'))throw new Error('modal não abriu');
  $('#edsNome').value='Coach Teste';
  const at=$('[data-satn="gestao"]');at.value='95';disparar(at,'input');
  if($('#edsOver').textContent==='')throw new Error('over ao vivo não atualizou');
  if(!$('#edsNivel').textContent.includes('/'))throw new Error('nível ao vivo não apareceu');
  clicar($('#edsSalvar'));
  await espera(10);
  if(m.nome!=='Coach Teste')throw new Error('renome não salvou');
  if(m.at.gestao!==95)throw new Error('atributo não salvou');
  if(Math.abs(time.staff.mental-w.nivelDe(m))>0.01)throw new Error('nível do clube não acompanhou');
});

await teste('Táticas mostra a comissão em vez de botão de upgrade',async()=>{
  t.tela='taticas';w.render();
  const txt=$('#view').textContent;
  if(!txt.includes('Comissão técnica'))throw new Error('sem o bloco da comissão');
  if($('[data-up="staff.tecnico"]'))throw new Error('botão antigo de melhorar staff ainda existe');
  if(!$('[data-fichastaff]'))throw new Error('sem atalho para a ficha');
  if(!$('[data-up="estrutura.gh"]'))throw new Error('upgrade de estrutura sumiu junto');
});

await teste('Mercado tem aba de comissão com a sua e a dos outros',async()=>{
  t.tela='mercado';t.mercAba='comissao';w.render();
  if(!$$('[data-propstaff]').length)throw new Error('sem botões de propor');
  if(!$('#view').textContent.includes('Sua comissão hoje'))throw new Error('sem o bloco da sua comissão');
  if(!$$('[data-dispstaff]').length)throw new Error('sem opção de dispensar');
});

await teste('proposta baixa é recusada e a justa contrata',async()=>{
  t.tela='mercado';t.mercAba='comissao';w.render();
  const time=t.G.times[t.G.meuTime];
  time.caixa=9000000;
  const alvo=Object.values(t.G.staff).find(m=>m.timeId&&m.timeId!==time.id);
  w.modalPropostaStaff(alvo.id);
  $('#psTaxa').value='0';$('#psSal').value='100';
  clicar($('#psEnviar'));
  if(!$('#psFeed').textContent.trim())throw new Error('proposta ridícula passou sem justificativa');
  if(alvo.timeId===time.id)throw new Error('contratou com proposta baixa');
  const caixaAntes=time.caixa;
  $('#psTaxa').value=String(w.pedidoStaff(alvo));
  $('#psSal').value=String(w.salarioPedidoStaff(alvo,time));
  $('#psAnos').value='3';
  clicar($('#psEnviar'));
  await espera(10);
  if(alvo.timeId!==time.id)throw new Error('proposta justa não fechou: '+$('#psFeed').textContent);
  if(time.caixa>=caixaAntes)throw new Error('a taxa não saiu do caixa');
  $('#modal').innerHTML='';
});

await teste('comissão evolui e envelhece na virada de temporada',async()=>{
  const m=Object.values(t.G.staff).find(x=>x.timeId);
  const idadeAntes=m.idade,histAntes=m.hist.length;
  const overAntes=w.overStaff(m);
  m.temp.v=20;m.temp.d=2;m.temp.titulos=1;
  w.evoluirStaff();
  const vivo=t.G.staff[m.id];
  if(!vivo){ /* pode ter se aposentado; refaz com outro */ return; }
  if(vivo.idade!==idadeAntes+1)throw new Error('não envelheceu');
  if(vivo.hist.length!==histAntes+1)throw new Error('não registrou a temporada');
  if(w.overStaff(vivo)<overAntes)throw new Error('campanha excelente não deveria baixar o over');
  if(w.overStaff(vivo)>vivo.pot)throw new Error('over passou do potencial');
});

await teste('retrato de comissão entra no pacote em 4:5',async()=>{
  const m=Object.values(t.G.staff)[0];
  const [lg,al]=t.Imgs.formatoDaChave(t.Imgs.chaveStaff(m.nome));
  if(lg!==256||al!==320)throw new Error('formato errado: '+lg+'x'+al);
  const arq=new w.File([new Uint8Array([1,2,3])],'x.png',{type:'image/png'});
  const uri=await t.Imgs.doArquivo(arq,lg,al);
  await t.Imgs.gravar(t.Imgs.chaveStaff(m.nome),uri);
  if(!t.ASSETS.staff(m).startsWith('data:image/'))throw new Error('ASSETS.staff não usou o pacote');
  await t.Imgs.apagar(t.Imgs.chaveStaff(m.nome));
});

await teste('validação acusa comissão inconsistente',async()=>{
  const time=Object.values(t.G.times)[0];
  const guardado=time.comissao.tecnico;
  time.comissao.tecnico='s99999';
  if(w.edValidar().ok)throw new Error('deixou passar ocupante inexistente');
  time.comissao.tecnico=guardado;
  if(!w.edValidar().ok)throw new Error('base deveria voltar a ficar válida: '+w.edValidar().erros[0]);
});


/* ============================================================
   PACOTE DE ROSTOS
   ============================================================ */
await teste('sem pacote montado o jogo cai no monograma',async()=>{
  t.Rostos.usar(null);
  if(t.Rostos.pronto())throw new Error('deveria estar sem pacote');
  const p=Object.values(t.G.jogadores)[0];
  if(t.Rostos.caminho(p))throw new Error('devolveu caminho sem pacote');
  t.tela='elenco';w.render();
  if(!$('#view').innerHTML.includes('data:image/svg'))throw new Error('sem monograma de reserva');
});

await teste('com pacote, o rosto é determinístico e cai no balde certo',async()=>{
  t.Rostos.usar({versao:1,dir:'assets/rostos/',ext:'webp',
    baldes:{AMER_jovem_m:20,AMER_veterano_m:10,AMER_veterano_f:6,EMEA_jovem_m:20,
            PAC_jovem_m:20,CN_jovem_m:20}});
  t.Prefs.set('rostosGerados','todos');
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.G.times[x.timeId].regiao==='AMER'&&x.idade<28);
  const c1=t.Rostos.caminho(p),c2=t.Rostos.caminho(p);
  if(!c1)throw new Error('não devolveu caminho');
  if(c1!==c2)throw new Error('não é determinístico');
  if(!c1.includes('AMER_jovem_m'))throw new Error('balde errado: '+c1);
  const n=parseInt(c1.match(/(\d{4})\.webp/)[1]);
  if(n<0||n>=20)throw new Error('índice fora do balde: '+n);
});

await teste('balde ausente cai num que existe em vez de quebrar',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.G.times[x.timeId].regiao==='EMEA');
  p.idade=45;p.genero='f';            /* EMEA_veterano_f não está no manifesto */
  const c=t.Rostos.caminho(p);
  if(!c)throw new Error('devolveu nulo em vez de cair para outro balde');
  if(!c.startsWith('assets/rostos/'))throw new Error('caminho estranho: '+c);
});

await teste('a preferência decide quem recebe rosto gerado',async()=>{
  const real=Object.values(t.G.jogadores).find(x=>x.real);
  const fic=Object.values(t.G.jogadores).find(x=>!x.real);
  if(!real)throw new Error('nenhum jogador marcado como real na base');
  t.Prefs.set('rostosGerados','ficticios');
  if(t.Rostos.caminho(real))throw new Error('jogador real recebeu rosto sintético no padrão');
  if(!t.Rostos.caminho(fic))throw new Error('fictício não recebeu rosto');
  t.Prefs.set('rostosGerados','todos');
  if(!t.Rostos.caminho(real))throw new Error('modo todos não cobriu o real');
  t.Prefs.set('rostosGerados','nenhum');
  if(t.Rostos.caminho(fic))throw new Error('modo nenhum ainda devolveu rosto');
  t.Prefs.set('rostosGerados','ficticios');
});

await teste('foto enviada ganha do rosto gerado',async()=>{
  t.Prefs.set('rostosGerados','todos');
  const p=Object.values(t.G.jogadores).find(x=>!x.real);
  const arq=new w.File([new Uint8Array([1,2,3])],'x.png',{type:'image/png'});
  const uri=await t.Imgs.doArquivo(arq,256,256);
  await t.Imgs.gravar(t.Imgs.chaveJog(p.nome),uri);
  const html=w.retrato(p,30);
  if(!html.includes('data:image/png'))throw new Error('a foto enviada não venceu');
  if(html.includes('assets/rostos/'))throw new Error('ainda tentou o rosto gerado');
  await t.Imgs.apagar(t.Imgs.chaveJog(p.nome));
  const html2=w.retrato(p,30);
  if(!html2.includes('assets/rostos/'))throw new Error('sem a foto, devia cair no gerado');
  t.Prefs.set('rostosGerados','ficticios');
});

await teste('comissão usa o mesmo pacote, por gênero e idade',async()=>{
  t.Prefs.set('rostosGerados','todos');
  const m=Object.values(t.G.staff).find(x=>x.timeId);
  m.genero='m';m.idade=45;
  const c=t.Rostos.caminho(m);
  if(!c)throw new Error('comissão sem rosto');
  if(!c.includes('_veterano_m'))throw new Error('faixa ou gênero errado: '+c);
  if(!w.retratoStaff(m,40).includes('assets/rostos/'))throw new Error('retratoStaff não usou o pacote');
  t.Prefs.set('rostosGerados','ficticios');
  t.Rostos.usar(null);
});


/* ============================================================
   PADRONIZAÇÃO (faixas, potencial, agentes, exportação)
   ============================================================ */
await teste('padronizar a base coloca cada divisão na sua faixa',async()=>{
  t.padronizarBase();
  for(const id in t.G.times){
    const time=t.G.times[id];
    const[lo,hi]=t.FAIXAS.jogador[time.tier];
    for(const pid of time.elenco){
      const o=t.over(t.G.jogadores[pid]);
      if(o<lo||o>hi)throw new Error(`jogador ${o} fora de ${lo}–${hi} no Tier ${time.tier}`);
    }
    const[sl,sh]=t.FAIXAS.comissao[time.tier];
    for(const c of t.CARGOS){
      const m=t.G.staff[time.comissao[c.id]];if(!m)continue;
      const o=t.overStaff(m);
      if(o<sl||o>sh)throw new Error(`comissão ${o} fora de ${sl}–${sh} no Tier ${time.tier}`);
    }
  }
});

await teste('99 é raro: no máximo dois na comissão do mundo inteiro',async()=>{
  t.padronizarBase();
  let n=0;
  for(const id in t.G.staff)if(t.overStaff(t.G.staff[id])>=99)n++;
  if(n>2)throw new Error(n+' membros com 99');
});

await teste('todo jogador fica com exatamente três agentes da função',async()=>{
  t.padronizarBase();
  for(const id in t.G.jogadores){
    const p=t.G.jogadores[id];
    const ag=p.agentes||[];
    const cat=t.agentesDe(p.role);
    /* o Editor deixa remover agentes de uma função; quando o catálogo tem
       menos de três, o jogador leva os que existem em vez de quebrar */
    const esperado=Math.min(3,cat.length);
    if(ag.length!==esperado)throw new Error(p.nome+' com '+ag.length+' agentes, esperado '+esperado);
    if(new Set(ag).size!==ag.length)throw new Error(p.nome+' com agente repetido');
    for(const a of ag)if(!cat.includes(a))throw new Error(p.nome+': '+a+' não é de '+p.role);
  }
});

await teste('jovem tem mais potencial que veterano no mesmo over',async()=>{
  const jovem=t.potencialDe(75,17,2), velho=t.potencialDe(75,29,2);
  if(!(jovem>velho))throw new Error(`jovem ${jovem} não supera veterano ${velho}`);
  const t1=t.potencialDe(85,20,1), t2=t.potencialDe(85,20,2);
  if(!(t2>t1))throw new Error(`Tier 2 (${t2}) devia ter mais espaço que Tier 1 (${t1})`);
});

await teste('padronizar não reescreve over de Tier 1 já ajustado',async()=>{
  const antes=new Map();
  for(const id in t.G.times){
    const time=t.G.times[id];if(time.tier!==1)continue;
    for(const pid of time.elenco){const o=t.over(t.G.jogadores[pid]);if(o>=80)antes.set(pid,o);}
  }
  t.padronizarBase();
  for(const[pid,o]of antes)
    if(t.over(t.G.jogadores[pid])!==o)
      throw new Error('over de Tier 1 foi reescrito: '+t.G.jogadores[pid].nome);
});

await teste('elencos.js gerado é JS válido e reabre com os mesmos números',async()=>{
  const js=t.gerarElencosJS();
  const esperado=new Map();
  for(const id in t.G.jogadores){const p=t.G.jogadores[id];
    if(p.real)esperado.set(p.nome,t.over(p));}
  const ctx={};
  w.eval('window.__lidos=(function(){'+js+';return ELENCOS_REAIS;})()');
  const lidos=w.window.__lidos;
  let n=0;
  for(const tag in lidos)for(const linha of lidos[tag]){
    /* LIVRE pode levar o potencial como sexto campo */
    if(linha.length!==5&&!(tag==='LIVRE'&&linha.length===6))throw new Error(tag+': linha incompleta');
    if(esperado.get(linha[0])!==linha[2])
      throw new Error(linha[0]+': exportou '+linha[2]+', na base é '+esperado.get(linha[0]));
    n++;
  }
  if(n!==esperado.size)throw new Error(`exportou ${n} de ${esperado.size}`);
});

await teste('o botão Padronizar existe na aba Importar/Exportar e roda',async()=>{
  t.tela='editor';t.edAba='io';w.render();
  const b=$('#edPadronizar');
  if(!b)throw new Error('botão não está na tela');
  b.click();
  const feed=$('#edPadFeed');
  if(!feed||!feed.innerHTML.includes('padronizada'))throw new Error('sem confirmação na tela');
});


/* ============================================================
   ECONOMIA: PATROCÍNIO, TORCIDA E PREMIAÇÃO
   ============================================================ */
await teste('todo clube tem as três vagas preenchidas',async()=>{
  for(const id in t.G.times){
    const time=t.G.times[id];
    for(const v of t.VAGAS)
      if(!time.patrocinios||!time.patrocinios[v.id])
        throw new Error(time.tag+' sem '+v.id);
  }
});

await teste('a vaga de máster é exclusiva no mundo inteiro',async()=>{
  const vistos=new Map();
  for(const id in t.G.times){
    const mid=t.G.times[id].patrocinios.master;
    if(vistos.has(mid))throw new Error(t.marca(mid).nome+' é máster de dois clubes');
    vistos.set(mid,id);
  }
});

await teste('máster nunca é menor que secundário nem que fornecedor',async()=>{
  for(const id in t.G.times){
    const p=t.G.times[id].patrocinios;
    const n=k=>{const mk=t.marca(p[k]);return mk?mk.nivel:0;};
    if(n('master')<n('secundario')||n('secundario')<n('fornecedor'))
      throw new Error(t.G.times[id].tag+': níveis fora de ordem '+n('master')+'/'+n('secundario')+'/'+n('fornecedor'));
  }
});

await teste('marca não excede o limite de clubes nas vagas repetíveis',async()=>{
  for(const v of t.VAGAS){
    if(v.exclusiva)continue;
    const uso={};
    for(const id in t.G.times){
      const mid=t.G.times[id].patrocinios[v.id];
      uso[mid]=(uso[mid]||0)+1;
      if(uso[mid]>t.MAX_CLUBES_POR_MARCA)
        throw new Error(t.marca(mid).nome+' em '+uso[mid]+' clubes na vaga '+v.id);
    }
  }
});

await teste('o nome da marca combina com o setor',async()=>{
  const par={Telecom:['Telecom','Mobile'],Bebida:['Beverage'],Hardware:['Tech'],
             Automotivo:['Motors'],Alimentos:['Foods'],Vestuário:['Wear'],
             Energético:['Energy'],Banco:['Bank'],Nuvem:['Cloud'],Áudio:['Audio'],
             Periféricos:['Gear'],Software:['Systems'],Snacks:['Chips'],
             Seguros:['Seguros'],Tecnologia:['Labs']};
  for(const mk of t.listaMarcas()){
    const esperados=par[mk.setor];
    if(!esperados)continue;
    if(!esperados.some(suf=>mk.nome.includes(suf)))
      throw new Error(mk.nome+' está marcada como '+mk.setor);
  }
});

await teste('Tier 1 recebe aporte de liga bem maior que Tier 2',async()=>{
  /* Com o MESMO clube nas duas divisões. Comparar dois clubes quaisquer não
     mede a régua: um rebaixado recente ainda tem a torcida do Tier 1, e o
     aporte dele passa por cima do de um clube pequeno da elite — o que está
     certo, e não é o que este caso quer dizer. */
  const x=Object.values(t.G.times)[0];
  const tier=x.tier, torcida=x.torcida;
  try{
    x.tier=1;const a=t.aporteLiga(x);
    x.tier=2;const b=t.aporteLiga(x);
    if(!(a>b*1.8))throw new Error('mesma torcida, aporte T1 '+a+' vs T2 '+b);
    /* A parcela FIXA é onde mora a diferença de divisão — é ela que sustenta
       o lanterna da elite. A parte por torcida separa menos de propósito:
       público é público em qualquer divisão. */
    x.torcida=0;
    x.tier=1;const fa=t.aporteLiga(x);
    x.tier=2;const fb=t.aporteLiga(x);
    if(!(fa>fb*2.5))throw new Error('a parcela fixa quase não separa as divisões: '+fa+' vs '+fb);
  }finally{x.tier=tier;x.torcida=torcida;}
});

await teste('torcida sobe com campanha boa e cai com campanha ruim',async()=>{
  const time=t.G.times[t.G.meuTime];
  /* isola o efeito da campanha: título também mexe na torcida, e este clube
     pode ter ganho um na simulação de um teste anterior */
  const titulos=time.titulos;time.titulos=[];
  try{
    time.torcida=50;time.temporada={v:18,d:2,mv:0,md:0,pts:0};
    const subiu=t.atualizarTorcida(time);
    time.torcida=50;time.temporada={v:2,d:18,mv:0,md:0,pts:0};
    const caiu=t.atualizarTorcida(time);
    if(!(subiu>50))throw new Error('campanha de 18-2 não subiu a torcida: '+subiu);
    if(!(caiu<50))throw new Error('campanha de 2-18 não baixou a torcida: '+caiu);
  }finally{time.titulos=titulos;}
});

await teste('título sozinho engorda a torcida',async()=>{
  const time=t.G.times[t.G.meuTime];
  const titulos=time.titulos;
  try{
    time.temporada={v:10,d:10,mv:0,md:0,pts:0};
    time.titulos=[];time.torcida=50;
    const sem=t.atualizarTorcida(time);
    time.titulos=[t.ano+' · Champions'];time.torcida=50;
    const com=t.atualizarTorcida(time);
    if(!(com>sem))throw new Error('campeão ('+com+') não superou o sem título ('+sem+')');
  }finally{time.titulos=titulos;}
});

await teste('a receita acompanha a torcida',async()=>{
  const time=t.G.times[t.G.meuTime];
  time.torcida=20;const pobre=t.receitaAnual(time);
  time.torcida=90;const rico=t.receitaAnual(time);
  if(!(rico>pobre))throw new Error('torcida 90 rendeu '+rico+' contra '+pobre+' com torcida 20');
});

await teste('a premiação chega ao último colocado',async()=>{
  const c=t.curvaPremio('champions',16);
  if(c.length!==16)throw new Error('curva com '+c.length+' posições');
  if(!(c[15]>0))throw new Error('o 16º não recebe nada');
  for(let i=1;i<c.length;i++)
    if(c[i]>c[i-1])throw new Error('a curva sobe da posição '+i+' para '+(i+1));
  if(!(c[0]>c[15]*10))throw new Error('campeão devia levar muito mais que o último');
});

await teste('trocar patrocinador respeita a exclusividade do máster',async()=>{
  const times=Object.values(t.G.times);
  const a=times[0], b=times.find(x=>x.id!==a.id);
  const mid=a.patrocinios.master;
  const r=t.edPatrocinioTrocar(b.id,'master',mid);
  if(r.ok)throw new Error('deixou dois clubes com o mesmo máster');
  const livre=t.listaMarcas().find(mk=>!times.some(x=>x.patrocinios.master===mk.id));
  if(livre){
    const ok=t.edPatrocinioTrocar(b.id,'master',livre.id);
    if(!ok.ok)throw new Error('recusou uma marca livre: '+ok.erro);
  }
});

await teste('remover marca do catálogo abre as vagas que ela ocupava',async()=>{
  const nova=t.edMarcaCriar('Teste Motors',3);
  if(!nova.ok)throw new Error(nova.erro);
  const time=t.G.times[t.G.meuTime];
  t.edPatrocinioTrocar(time.id,'fornecedor',nova.id);
  const r=t.edMarcaRemover(nova.id);
  if(!r.ok)throw new Error(r.erro);
  if(time.patrocinios.fornecedor===nova.id)throw new Error('a vaga ficou apontando para marca apagada');
});

await teste('aba Patrocinadores lista as vagas e o catálogo',async()=>{
  t.atribuirPatrocinios();
  t.tela='editor';t.edAba='patrocinadores';w.render();
  if($$('[data-patroc]').length!==t.VAGAS.length)
    throw new Error('esperava '+t.VAGAS.length+' seletores de vaga');
  if(!$$('[data-mknome]').length)throw new Error('catálogo não apareceu');
  if(!$('#edRedistribuir'))throw new Error('sem botão de redistribuir');
});


/* ============================================================
   FUNÇÃO SECUNDÁRIA E ESCALAÇÃO POR FORÇA
   ============================================================ */
await teste('mira ruim não vira Duelista',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const guardado={...p.at},roleAntes=p.role,role2Antes=p.role2;
  try{
    /* perfil de controlador extremo: utilidade e visão altas, mira no chão */
    Object.assign(p.at,{mira:38,reflexo:40,mov:45,util:92,visao:90,clutch:70,consist:75});
    p.role='Controlador';
    if(t.funcoesElegiveis(p).includes('Duelista'))
      throw new Error('aceitou Duelista com mira 38 (custo '+t.custoDeFuncao(p,'Duelista')+')');
    const r=t.edAplicarJogador(p.id,{role2:'Duelista'});
    if(r.ok)throw new Error('o Editor deixou forçar Duelista à mão');
  }finally{Object.assign(p.at,guardado);p.role=roleAntes;p.role2=role2Antes;}
});

await teste('mira boa alcança Duelista como secundária',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const guardado={...p.at},roleAntes=p.role;
  try{
    Object.assign(p.at,{mira:92,reflexo:90,mov:88,util:70,visao:74,clutch:80,consist:78});
    p.role='Iniciador';
    if(!t.funcoesElegiveis(p).includes('Duelista'))
      throw new Error('recusou Duelista com mira 92 (custo '+t.custoDeFuncao(p,'Duelista')+')');
  }finally{Object.assign(p.at,guardado);p.role=roleAntes;}
});

await teste('a escalação prefere força quando a diferença de over compensa',async()=>{
  /* o caso que motivou o item: um Duelista muito melhor no banco porque a
     cobertura de função vinha primeiro */
  const time=t.G.times[t.G.meuTime];
  const ids=time.elenco.slice();
  const base=[['Duelista',92],['Duelista',90],['Duelista',88],['Duelista',86],
              ['Duelista',84],['Controlador',62],['Sentinela',60]];
  const perfis=ids.map((_,i)=>base[i]||['Controlador',58]);
  const guardado=ids.map(id=>({id,role:t.G.jogadores[id].role,lesao:t.G.jogadores[id].lesao,at:{...t.G.jogadores[id].at}}));
  try{
    /* Todos os Duelistas com o MESMO perfil de atributos antes de reescalar.
       Sem isso o caso dependia de quem por acaso ocupava cada posição do
       elenco naquele ponto da bateria: um deles nascia com perfil que dava
       função secundária diferente, o overComo dele desabava e o teste passava
       ou falhava por causa do mundo, não da regra que ele cobra. */
    const molde={...t.G.jogadores[ids[0]].at};
    ids.forEach((id,i)=>{
      if(!perfis[i])return;
      const p=t.G.jogadores[id];
      p.role=perfis[i][0];p.role2=null;
      Object.assign(p.at,molde);
      w.aplicarOver(p,perfis[i][1]);
      p.role2=null;
      /* autoEscalar não escala quem está machucado, e depois de uma temporada
         simulada sempre tem alguém no departamento médico: sem zerar isto, o
         caso mede a lesão em vez de medir a régua da escalação. */
      p.lesao=0;
    });
    t.autoEscalar(time);
    const overs=time.titulares.map(i=>t.over(t.G.jogadores[i])).sort((a,b)=>b-a);
    if(overs[4]<80)
      throw new Error('escalou alguém de over '+overs[4]+' tendo Duelistas de 84+: '+overs.join(',')+
        ' | elenco: '+ids.map(id=>{const p=t.G.jogadores[id];
          return p.role+(p.role2?'/'+p.role2:'')+':'+t.over(p);}).join(' '));
  }finally{
    guardado.forEach(g=>{const p=t.G.jogadores[g.id];
      p.role=g.role;Object.assign(p.at,g.at);p.lesao=g.lesao;});
    t.autoEscalar(time);
  }
});

await teste('cobertura ainda vale quando a diferença de over é pequena',async()=>{
  const time=t.G.times[t.G.meuTime];
  /* O elenco INTEIRO é montado, não só os primeiros: deixar o resto intacto
     fazia o teste depender de quem sobrava, e ele quebrava sempre que o mundo
     era gerado de outro jeito — o que acontece a cada mudança no consumo do
     gerador semeado. */
  const ids=time.elenco.slice();
  const base=[['Duelista',80],['Duelista',80],['Iniciador',79],['Sentinela',79],
              ['Duelista',81],['Controlador',78]];
  const perfis=ids.map((_,i)=>base[i]||['Duelista',60]);
  const guardado=ids.map(id=>({id,role:t.G.jogadores[id].role,at:{...t.G.jogadores[id].at}}));
  try{
    ids.forEach((id,i)=>{
      if(!perfis[i])return;
      const p=t.G.jogadores[id];
      p.role=perfis[i][0];p.role2=null;
      w.aplicarOver(p,perfis[i][1]);
    });
    t.autoEscalar(time);
    const desc=t.funcoesDescobertas(time);
    if(desc.length>1)
      throw new Error('deixou '+desc.length+' funções descobertas por 1 a 3 pontos de over: '+desc.join(', '));
  }finally{
    guardado.forEach(g=>{const p=t.G.jogadores[g.id];p.role=g.role;Object.assign(p.at,g.at);});
    t.autoEscalar(time);
  }
});

await teste('todo titular sai com a função em que vai jogar registrada',async()=>{
  for(const id in t.G.times){
    const time=t.G.times[id];
    for(const pid of time.titulares){
      const p=t.G.jogadores[pid];
      if(!p.roleAtual)throw new Error(p.nome+' sem roleAtual');
      if(p.role!=='Flex'&&p.roleAtual!==p.role&&p.roleAtual!==p.role2)
        throw new Error(p.nome+' escalado como '+p.roleAtual+', mas é '+p.role+'/'+(p.role2||'—'));
    }
  }
});

await teste('jogar fora de posição custa over de verdade',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.role==='Duelista');
  if(!p)return;
  const comoDuelista=t.overComo(p,'Duelista');
  const comoControlador=t.overComo(p,'Controlador');
  if(!(comoDuelista>comoControlador))
    throw new Error('Duelista rende igual como Controlador: '+comoDuelista+' vs '+comoControlador);
});

await teste('a ficha editável mostra e salva a função secundária',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.role2);
  if(!p)throw new Error('ninguém no mundo tem secundária');
  w.modalEditarJogador(p.id);
  const sel=$('#edjRole2');
  if(!sel)throw new Error('campo de secundária não apareceu na ficha');
  if(sel.value!==p.role2)throw new Error('campo veio com '+sel.value+', esperado '+p.role2);
  const bloqueadas=[...sel.options].filter(o=>o.disabled).map(o=>o.value);
  for(const r of bloqueadas)
    if(t.custoDeFuncao(p,r)<=t.CUSTO_MAX_SECUNDARIA)
      throw new Error(r+' foi bloqueada mas o custo é só '+t.custoDeFuncao(p,r));
  /* secundária que deixou de valer tem de aparecer marcada e explicada, não
     sumir em silêncio como se o jogador nunca tivesse tido uma */
  const antes=p.role2, at={...p.at};
  try{
    Object.assign(p.at,{mira:30,reflexo:30,mov:30,util:99,visao:99,clutch:99,consist:99});
    p.role='Controlador';p.role2='Duelista';
    w.modalEditarJogador(p.id);
    const s2=$('#edjRole2');
    if(s2.value!=='Duelista')
      throw new Error('secundária obsoleta sumiu da ficha em vez de aparecer marcada');
    if(!s2.innerHTML.includes('não vale mais'))
      throw new Error('não explicou por que a secundária deixou de valer');
  }finally{Object.assign(p.at,at);p.role2=antes;}
});


/* ============================================================
   TRANSFERÊNCIAS
   ============================================================ */
/* Clube-fantasma idêntico ao de origem, mudando só o que o teste quer medir.
   Comparar clubes reais misturaria nível de elenco, vaga e caixa. */
function clonarClube(base,mudancas){
  return Object.assign({
    id:'clone_'+Math.random().toString(36).slice(2), tag:'CLN', nome:'Clube Clone',
    regiao:base.regiao, tier:base.tier, prestigio:base.prestigio,
    caixa:9e9, patroc:base.patroc, torcida:base.torcida,
    elenco:base.elenco.slice(), titulares:base.titulares.slice()
  },mudancas||{});
}

await teste('mudar de região custa mais caro, e a China é a mais cara',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.regiaoNatal(x)==='AMER');
  if(!p)throw new Error('ninguém de AMER com clube');
  const base=t.G.times[p.timeId];
  const semEle=base.elenco.filter(i=>i!==p.id);
  const alvo=r=>clonarClube(base,{regiao:r,elenco:semEle,titulares:base.titulares.filter(i=>i!==p.id)});
  const casa=t.salarioPedido(p,alvo('AMER'));
  const emea=t.salarioPedido(p,alvo('EMEA'));
  const pac=t.salarioPedido(p,alvo('PAC'));
  const cn=t.salarioPedido(p,alvo('CN'));
  if(!(emea>casa))throw new Error(`EMEA (${emea}) não custou mais que casa (${casa})`);
  if(!(cn>emea))throw new Error(`China (${cn}) não custou mais que EMEA (${emea})`);
  if(!(cn>pac))throw new Error(`China (${cn}) não custou mais que Pacífico (${pac})`);
});

await teste('cair de divisão custa mais que qualquer mudança de região',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.G.times[x.timeId].tier===1&&t.over(x)<86);
  const base=t.G.times[p.timeId];
  const semEle=base.elenco.filter(i=>i!==p.id);
  const t2=clonarClube(base,{tier:2,elenco:semEle,titulares:base.titulares.filter(i=>i!==p.id)});
  const cn=clonarClube(base,{regiao:'CN',elenco:semEle,titulares:base.titulares.filter(i=>i!==p.id)});
  if(!(t.salarioPedido(p,t2)>t.salarioPedido(p,cn)))
    throw new Error(`Tier 2 (${t.salarioPedido(p,t2)}) não custou mais que China (${t.salarioPedido(p,cn)})`);
});

await teste('jogador quer mais para entrar no banco do que para ser titular',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId);
  const base=t.G.times[p.timeId];
  /* elenco fraco: ele seria titular. elenco forte: ele seria reserva. */
  const fracos=Object.values(t.G.jogadores).filter(x=>t.over(x)<t.over(p)-8&&x.id!==p.id).slice(0,7);
  const fortes=Object.values(t.G.jogadores).filter(x=>t.over(x)>t.over(p)+3&&x.id!==p.id).slice(0,7);
  if(fracos.length<7||fortes.length<7)return;
  const comoTitular=clonarClube(base,{elenco:fracos.map(x=>x.id),titulares:fracos.slice(0,5).map(x=>x.id)});
  const comoReserva=clonarClube(base,{elenco:fortes.map(x=>x.id),titulares:fortes.slice(0,5).map(x=>x.id)});
  if(t.posicaoNoElenco(p,comoReserva)<=5)throw new Error('o cenário de banco não ficou sendo banco');
  if(!(t.salarioPedido(p,comoReserva)>t.salarioPedido(p,comoTitular)))
    throw new Error(`banco ${t.salarioPedido(p,comoReserva)} não custou mais que titular ${t.salarioPedido(p,comoTitular)}`);
});

await teste('clube melhor sai mais barato que clube pior',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.G.times[x.timeId].tier===1);
  const base=t.G.times[p.timeId];
  const semEle=base.elenco.filter(i=>i!==p.id);
  const pior=clonarClube(base,{prestigio:Math.max(35,base.prestigio-25),elenco:semEle,
    titulares:base.titulares.filter(i=>i!==p.id)});
  const melhor=clonarClube(base,{prestigio:Math.min(92,base.prestigio+15),elenco:semEle,
    titulares:base.titulares.filter(i=>i!==p.id)});
  if(!(t.salarioPedido(p,pior)>t.salarioPedido(p,melhor)))
    throw new Error(`pior ${t.salarioPedido(p,pior)} não custou mais que melhor ${t.salarioPedido(p,melhor)}`);
});

await teste('titular de elite no auge não desce de divisão por dinheiro nenhum',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.G.times[x.timeId].tier===1);
  const at={...p.at},idade=p.idade;
  try{
    w.aplicarOver(p,92);p.idade=24;
    const base=t.G.times[p.timeId];
    const t2=clonarClube(base,{tier:2,elenco:base.elenco.filter(i=>i!==p.id),
      titulares:base.titulares.filter(i=>i!==p.id)});
    const motivos=t.avaliarProposta(p,t2,99999999,999999,3);
    if(!motivos.some(m=>m.includes('auge')))
      throw new Error('aceitou cair de divisão com proposta absurda: '+JSON.stringify(motivos));
  }finally{Object.assign(p.at,at);p.idade=idade;}
});

await teste('a recusa por salário diz qual fator pesou',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&t.regiaoNatal(x)!=='CN');
  const base=t.G.times[p.timeId];
  const cn=clonarClube(base,{regiao:'CN',elenco:base.elenco.filter(i=>i!==p.id),
    titulares:base.titulares.filter(i=>i!==p.id)});
  const motivos=t.avaliarProposta(p,cn,0,100,2);
  const salarial=motivos.find(m=>m.includes('quer perto de'));
  if(!salarial)throw new Error('não reclamou do salário: '+JSON.stringify(motivos));
  if(!salarial.includes('pesa:'))throw new Error('não explicou o motivo: '+salarial);
});

await teste('a IA fecha transferências entre clubes na virada',async()=>{
  const antes={};
  for(const id in t.G.jogadores)antes[id]=t.G.jogadores[id].timeId;
  t.mercadoTransferencias();
  let entreClubes=0;
  for(const id in t.G.jogadores){
    const p=t.G.jogadores[id];
    if(antes[id]&&p.timeId&&antes[id]!==p.timeId)entreClubes++;
  }
  if(!entreClubes)throw new Error('nenhuma transferência entre clubes');
});

await teste('a IA não estoura o teto de folha',async()=>{
  t.mercadoTransferencias();
  const estourados=[];
  for(const id in t.G.times){
    const time=t.G.times[id];
    if(time.id===t.G.meuTime)continue;
    const folha=(time.elenco.reduce((s,i)=>s+t.G.jogadores[i].salario,0)+w.folhaStaff(time))*12;
    if(folha>t.receitaAnual2(time)*0.95)estourados.push(time.tag+' '+Math.round(folha/t.receitaAnual2(time)*100)+'%');
  }
  if(estourados.length>4)
    throw new Error(estourados.length+' clubes acima de 95% da receita: '+estourados.slice(0,5).join(', '));
});

await teste('a proposta mostra a conta do pedido e o botão de preencher',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId&&x.timeId!==t.G.meuTime
    &&t.G.times[x.timeId].regiao!==t.G.times[t.G.meuTime].regiao);
  t.G.janela=true;
  w.modalProposta(p.id);
  if(!$('#pSal'))throw new Error('modal não abriu');
  const d=t.detalharPedido(p,t.G.times[t.G.meuTime]);
  if(Number($('#pSal').value)!==d.pedido)
    throw new Error('o campo veio com '+$('#pSal').value+', esperado '+d.pedido);
  if(d.itens.length&&!w.document.body.innerHTML.includes('Por que ele pede isso'))
    throw new Error('a conta não apareceu');
  /* cada fator do pedido tem de estar visível, não só o total */
  for(const it of d.itens)
    if(!w.document.body.innerHTML.includes(it.rot))
      throw new Error('fator não listado na conta: '+it.rot);
  if(!$('#pJusto'))throw new Error('sem botão de preencher com o valor aceito');
});


/* ============================================================
   RUÍDO, CARREIRA E FONTES
   ============================================================ */
await teste('consistência controla a oscilação do dia, não o ruído do round',async()=>{
  const time=t.G.times[t.G.meuTime];
  const guardado=time.titulares.map(i=>t.G.jogadores[i].at.consist);
  try{
    time.titulares.forEach(i=>{t.G.jogadores[i].at.consist=40;});
    const instavel=w.desvioDoDia(time);
    time.titulares.forEach(i=>{t.G.jogadores[i].at.consist=95;});
    const regular=w.desvioDoDia(time);
    if(!(instavel>regular*2))
      throw new Error(`consistência 40 (σ ${instavel.toFixed(1)}) devia oscilar bem mais que 95 (σ ${regular.toFixed(1)})`);
  }finally{time.titulares.forEach((i,k)=>{t.G.jogadores[i].at.consist=guardado[k];});}
});

await teste('carreira longa: ninguém se aposenta antes dos 30',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const idade=p.idade,pico=p.pico;
  try{
    for(const i of [20,24,28,29]){
      p.idade=i;p.pico=t.over(p)+20;   /* mesmo em queda forte */
      if(w.chanceAposentadoria(p)>0)
        throw new Error('aos '+i+' anos já havia chance de aposentadoria');
    }
  }finally{p.idade=idade;p.pico=pico;}
});

await teste('quem cai muito do próprio pico se aposenta antes',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const idade=p.idade,pico=p.pico;
  try{
    p.idade=36;
    p.pico=t.over(p);            const inteiro=w.chanceAposentadoria(p);
    p.pico=t.over(p)+14;         const caido=w.chanceAposentadoria(p);
    if(!(caido>inteiro))throw new Error(`em queda ${caido.toFixed(2)} não supera em forma ${inteiro.toFixed(2)}`);
    p.idade=44;
    if(w.chanceAposentadoria(p)!==1)throw new Error('aos 44 a aposentadoria devia ser certa');
  }finally{p.idade=idade;p.pico=pico;}
});

await teste('o valor de mercado cai com a idade acima dos 30',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const idade=p.idade;
  try{
    p.idade=29;const a=w.valor(p);
    p.idade=34;const b=w.valor(p);
    p.idade=39;const c=w.valor(p);
    if(!(a>b&&b>c))throw new Error(`29:${a} 34:${b} 39:${c} — não é decrescente`);
  }finally{p.idade=idade;}
});

await teste('as fontes estão embutidas, não vêm da rede',async()=>{
  const html=readFileSync(alvo,'utf8');
  if(/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html))
    throw new Error('o dist ainda aponta para o Google Fonts');
  for(const fam of ['Inter','Bebas Neue','JetBrains Mono'])
    if(!html.includes(`font-family:'${fam}'`))
      throw new Error('sem @font-face de '+fam);
  const faces=(html.match(/@font-face/g)||[]).length;
  if(faces<7)throw new Error('esperava 7 variantes embutidas, achei '+faces);
  if(!html.includes('data:font/woff2;base64,'))
    throw new Error('as fontes não estão em base64');
});


/* ============================================================
   EXPORTAÇÃO NÃO PODE APAGAR A BASE
   ============================================================ */
await teste('base sem ninguém marcado como real não gera arquivo',async()=>{
  const marcas=[];
  for(const id in t.G.jogadores){marcas.push([id,t.G.jogadores[id].real]);t.G.jogadores[id].real=false;}
  const nomes=[];
  try{
    /* também apaga os nicks reais, senão remarcarReais() devolve a marcação */
    for(const id in t.G.jogadores){nomes.push([id,t.G.jogadores[id].nome]);
      t.G.jogadores[id].nome='Fantasma'+id;}
    if(t.gerarElencosJS()!==null)
      throw new Error('gerou arquivo com zero jogadores — isso apaga data/elencos.js');
  }finally{
    nomes.forEach(([id,n])=>{t.G.jogadores[id].nome=n;});
    marcas.forEach(([id,r])=>{t.G.jogadores[id].real=r;});
  }
});

await teste('save antigo sem marcação se cura pelo nick',async()=>{
  const marcas=[];
  for(const id in t.G.jogadores){marcas.push([id,t.G.jogadores[id].real]);t.G.jogadores[id].real=false;}
  try{
    if(t.quantosReais()!==0)throw new Error('a desmarcação não pegou');
    const n=t.remarcarReais();
    if(!(n>300))throw new Error('remarcou só '+n+' jogadores, esperava mais de 300');
    const js=t.gerarElencosJS();
    if(!js)throw new Error('ainda não exporta depois de remarcar');
  }finally{marcas.forEach(([id,r])=>{t.G.jogadores[id].real=r;});}
});

await teste('o botão de exportar recusa base vazia em vez de baixar',async()=>{
  const marcas=[],nomes=[];
  for(const id in t.G.jogadores){
    marcas.push([id,t.G.jogadores[id].real]);nomes.push([id,t.G.jogadores[id].nome]);
    t.G.jogadores[id].real=false;t.G.jogadores[id].nome='Fantasma'+id;
  }
  let baixou=false;
  const orig=w.baixarTexto;
  try{
    w.eval('window.__baixou=false;baixarTexto=function(){window.__baixou=true;}');
    t.tela='editor';t.edAba='io';w.render();
    $('#edGerarElencos').click();
    baixou=w.__baixou;
    if(baixou)throw new Error('baixou um arquivo vazio');
  }finally{
    nomes.forEach(([id,n])=>{t.G.jogadores[id].nome=n;});
    marcas.forEach(([id,r])=>{t.G.jogadores[id].real=r;});
    if(orig)w.eval('baixarTexto=window.__baixarOrig||baixarTexto');
  }
});


/* ============================================================
   LEGADO, CONFRONTO DIRETO E RIVALIDADE
   ============================================================ */
await teste('a pré-história de 2021 a 2025 entra no mundo',async()=>{
  const pre=(t.G.historico||[]).filter(h=>h.pre);
  if(pre.length!==t.HISTORIA_REAL.length)
    throw new Error(`registrou ${pre.length} de ${t.HISTORIA_REAL.length} títulos`);
  if(pre.some(h=>h.ano>2025))throw new Error('2026 não podia entrar: é a temporada que se joga');
  if(pre.some(h=>h.ano<2021))throw new Error('ano fora da faixa');
});

await teste('campeão que ainda existe recebe o título; quem sumiu fica só no registro',async()=>{
  for(const h of t.HISTORIA_REAL){
    const c=t.acharClubePorNome(h.campeao);
    if(!c)continue;
    if(!(c.titulos||[]).some(x=>x.includes(h.evento)&&x.startsWith(String(h.ano))))
      throw new Error(`${c.tag} não recebeu ${h.ano} ${h.evento}`);
  }
  const extintos=t.HISTORIA_REAL.filter(h=>!t.acharClubePorNome(h.campeao));
  if(!extintos.length)throw new Error('esperava ao menos um campeão extinto no registro');
});

await teste('os apelidos de clube não deixam título se perder',async()=>{
  for(const nome of ['DRX','Bilibili Gaming','Leviatán','Fnatic'])
    if(!t.acharClubePorNome(nome))
      throw new Error(nome+' não casou com nenhum clube — o título dele sumiria');
});

await teste('quem ganhou mais tem mais torcida que quem nunca ganhou',async()=>{
  const t1=Object.values(t.G.times).filter(x=>x.tier===1);
  const campeoes=t1.filter(x=>(x.legado||0)>=1.5);
  const zerados=t1.filter(x=>!(x.legado||0));
  if(!campeoes.length||!zerados.length)return;
  const md=a=>{const s=a.map(x=>x.torcida).sort((p,q)=>p-q);return s[Math.floor(s.length/2)];};
  if(!(md(campeoes)>md(zerados)))
    throw new Error(`campeões ${md(campeoes)} não superam os sem título ${md(zerados)}`);
});

await teste('o prestígio do Tier 2 só se afasta do ponto comum pelo mérito',async()=>{
  /* A uniformidade EXATA é do momento da criação e está conferida em
     tools/legado.mjs, que monta um mundo limpo. Aqui a base já rodou nos testes
     anteriores, então o que se cobra é a REGRA, não um número: quem subiu de
     prestígio tem de ter ganho alguma coisa. Medir a dispersão bruta amarrava
     este caso a quantos torneios os testes anteriores por acaso rodaram. */
  /* Só clubes de Challengers de nascença: a divisão vai se enchendo de
     rebaixados, que chegam com o prestígio do Tier 1 menos a queda e não têm
     nada a ver com a régua comum de partida. */
  const t2=Object.values(t.G.times).filter(x=>x.tier===2&&x.tierInicial===2);
  const semTitulo=t2.filter(x=>!(x.titulos||[]).length);
  /* Duas coisas movem prestígio, e as duas são mérito: título (+2.2) e
     resultado de partida (±0.06). Sem título, sobra só a segunda, que é
     pequena de propósito — uma temporada inteira de jogos não pode valer o
     mesmo que levantar uma taça. Se esta faixa abrir, ou a régua comum não
     foi aplicada, ou alguém está mexendo em prestígio por fora. */
  if(semTitulo.length){
    const p=semTitulo.map(x=>x.prestigio);
    const min=Math.min(...p),max=Math.max(...p);
    if(max-min>4)
      throw new Error(`clubes de Challengers sem título já variam de ${min.toFixed(2)} a ${max.toFixed(2)}`);
    if(Math.abs((min+max)/2-t.PRESTIGIO_T2)>2)
      throw new Error(`o centro saiu de ${t.PRESTIGIO_T2} para ${((min+max)/2).toFixed(2)}`);
  }
  const campeao=t2.filter(x=>(x.titulos||[]).length).sort((a,b)=>b.titulos.length-a.titulos.length)[0];
  if(campeao&&semTitulo.length){
    const teto=Math.max(...semTitulo.map(x=>x.prestigio));
    if(campeao.prestigio<=teto)
      throw new Error(campeao.nome+' tem '+campeao.titulos.length+' título(s) e não passou de quem não tem nenhum');
  }
});

await teste('confronto direto é simétrico e conta certo',async()=>{
  const ids=Object.keys(t.G.times);
  const a=ids[0],b=ids[1];
  const antes=t.confronto(a,b);
  t.registrarConfronto(a,b,a,'teste');
  t.registrarConfronto(b,a,a,'teste');   /* mesma dupla, ordem trocada */
  const dA=t.confronto(a,b), dB=t.confronto(b,a);
  if(dA.jogos!==antes.jogos+2)throw new Error('não somou os dois jogos: '+dA.jogos);
  if(dA.vitorias!==antes.vitorias+2)throw new Error('vitórias erradas para A');
  if(dB.derrotas!==dA.vitorias)throw new Error('o registro não é simétrico');
  if(dB.jogos!==dA.jogos)throw new Error('jogos diferentes conforme a ordem');
});

await teste('rivalidade exige histórico, não nasce de decreto',async()=>{
  const ids=Object.keys(t.G.times);
  const novo=ids[ids.length-1];
  const h2h=t.G.h2h;
  try{
    t.G.h2h={};
    if(t.rivaisDe(novo,3).length)throw new Error('inventou rival sem nenhum confronto');
  }finally{t.G.h2h=h2h;}
});

await teste('a liga do Tier 2 tem nome, não a lista de ids',async()=>{
  const t2=Object.values(t.G.times).find(x=>x.tier===2);
  const nome=t.nomeLiga(t2);
  if(/^t\d/.test(nome)||nome.includes(','))
    throw new Error('nome da liga saiu como lista de ids: '+nome);
  if(!/Challengers/.test(nome))throw new Error('nome inesperado: '+nome);
});

await teste('a tela de História abre e mostra a linha do tempo',async()=>{
  t.tela='historia';w.render();
  const html=$('#view').innerHTML;
  for(const termo of ['Galeria de títulos','Rivalidades','Confronto direto','2021'])
    if(!html.includes(termo))throw new Error('faltou na tela: '+termo);
  if(!html.includes('não compete mais'))
    throw new Error('não marcou os campeões extintos');
});


/* ============================================================
   PAÍS DE SEDE E POPULARIDADE
   ============================================================ */
await teste('país em massa aceita o formato e recusa o que não existe',async()=>{
  const times=Object.values(t.G.times).slice(0,3);
  const antes=times.map(x=>x.pais);
  try{
    const r=t.edAplicarPaises(
      times[0].tag+' = BR\n'+
      times[1].tag+' = us\n'+          /* minúscula tem de valer */
      times[2].tag+' = ZZ\n'+          /* país inexistente */
      'TAGQUENAOEXISTE = BR\n'+
      '// comentário\n'+
      'linha sem sentido');
    if(r.n!==2)throw new Error('aplicou '+r.n+', esperava 2');
    if(times[0].pais!=='BR')throw new Error('não gravou BR');
    if(times[1].pais!=='US')throw new Error('não normalizou para maiúscula');
    if(times[2].pais===' ZZ')throw new Error('aceitou país inexistente');
    if(r.erros.length!==3)throw new Error('reportou '+r.erros.length+' erros, esperava 3');
  }finally{times.forEach((x,k)=>{x.pais=antes[k];});}
});

await teste('país de país popular rende mais torcida que país neutro',async()=>{
  const alvo=Object.values(t.G.times).find(x=>x.tier===2);
  const antes=alvo.pais, torc=alvo.torcida, semente=t.semente;
  /* torcidaInicial tem um gauss(0,4) dentro: um sorteio contra outro sorteio
     empata ou inverte com facilidade, e o caso passava ou falhava conforme o
     mundo que os testes anteriores por acaso deixaram. A regra é sobre a
     MÉDIA, então é a média que se mede — e a semente volta ao lugar no fim,
     porque sortear aqui empurraria o gerador do motor. */
  const media=pais=>{
    alvo.pais=pais;
    let s=0;for(let i=0;i<60;i++)s+=t.torcidaInicial(alvo);
    return s/60;
  };
  try{
    const popular=media('BR'), neutro=media('IT');   /* IT está fora da lista = 1.0 */
    if(!(popular>neutro+0.5))
      throw new Error(`média BR ${popular.toFixed(1)} não superou país neutro ${neutro.toFixed(1)}`);
    if(!(t.POP_PAIS.BR>1))throw new Error('BR devia estar acima da média');
    if(t.POP_PAIS.IT!=null)throw new Error('país fora da lista não podia ter peso próprio');
  }finally{alvo.pais=antes;alvo.torcida=torc;w.srand(semente);}
});

await teste('nenhum país da tabela é penalizado abaixo da média',async()=>{
  for(const p in t.POP_PAIS)
    if(t.POP_PAIS[p]<1)throw new Error(p+' está abaixo de 1.0 — o jogo é popular em todo lugar');
});

await teste('clubes.js exportado é JS válido e reabre com os mesmos países',async()=>{
  const alvo=Object.values(t.G.times).slice(0,4);
  const antes=alvo.map(x=>x.pais);
  try{
    alvo.forEach((x,k)=>{x.pais=['BR','US','KR','CN'][k];});
    const js=t.gerarClubesJS();
    if(!js)throw new Error('não gerou nada mesmo com clubes preenchidos');
    w.eval('window.__cb=(function(){'+js+';return CLUBES_BASE;})()');
    const lido=w.window.__cb;
    alvo.forEach((x,k)=>{
      if(!lido[x.tag])throw new Error(x.tag+' não saiu no arquivo');
      if(lido[x.tag].pais!==['BR','US','KR','CN'][k])
        throw new Error(x.tag+' saiu com '+lido[x.tag].pais);
    });
  }finally{alvo.forEach((x,k)=>{x.pais=antes[k];});}
});

await teste('sem nenhum país definido, clubes.js não gera arquivo',async()=>{
  const antes=[];
  for(const id in t.G.times){antes.push([id,t.G.times[id].pais]);t.G.times[id].pais=null;}
  try{
    if(t.gerarClubesJS()!==null)
      throw new Error('gerou arquivo vazio — sobrescreveria data/clubes.js com nada');
  }finally{antes.forEach(([id,p])=>{t.G.times[id].pais=p;});}
});

await teste('a aba tem o campo em massa e o botão de tornar permanente',async()=>{
  t.tela='editor';t.edAba='io';w.render();
  if(!$('#paisTxt'))throw new Error('sem campo de países em massa');
  if(!$('#edGerarClubes'))throw new Error('sem botão de baixar clubes.js');
  $('#paisExp').click();
  const v=$('#paisTxt').value;
  if(!/=/.test(v))throw new Error('listar os atuais não trouxe nada no formato TAG = PA');
});


/* ============================================================
   PARSER DO VLR.GG
   ------------------------------------------------------------
   Os três exemplos abaixo usam o elenco real da Sentinels, lido
   da página do vlr, para o teste medir o caso de verdade e não
   um formato que eu inventei.
   ============================================================ */
const VLR_TEXTO_LINHAS=`johnqt
Mohamed Amine Ouarid
Reduxx
Yassin Aboulalazm
Jerrwin
Gurjiwan Gill
cortezia
Gabriel Cortez
JonahP
Jonah Pulice
Marved
Jimmy Nguyen
Zyto
Bryan Ybanez
manager
Ewok
Marthinus Jacobus Van Der Walt
head coach`;

const VLR_TEXTO_TRAVESSAO=`johnqt — Mohamed Amine Ouarid
Reduxx — Yassin Aboulalazm
Jerrwin — Gurjiwan Gill
cortezia — Gabriel Cortez
JonahP — Jonah Pulice
Marved — Jimmy Nguyen (stand-in)
Ewok — Marthinus Jacobus Van Der Walt (head coach)`;

const VLR_HTML=`<div class="team-roster">
 <a href="/player/9/johnqt" class="team-roster-item"><i class="flag mod-ma"></i>
   <div class="team-roster-item-name-alias">johnqt</div>
   <div class="team-roster-item-name-real">Mohamed Amine Ouarid</div></a>
 <a href="/player/12/reduxx" class="team-roster-item"><i class="flag mod-eg"></i>
   <div class="team-roster-item-name-alias">Reduxx</div>
   <div class="team-roster-item-name-real">Yassin Aboulalazm</div></a>
 <a href="/player/44/cortezia" class="team-roster-item"><i class="flag mod-br"></i>
   <div class="team-roster-item-name-alias">cortezia</div>
   <div class="team-roster-item-name-real">Gabriel Cortez</div></a>
 <a href="/player/77/ewok" class="team-roster-item"><i class="flag mod-za"></i>
   <div class="team-roster-item-name-alias">Ewok</div>
   <div class="team-roster-item-name-real">Marthinus Jacobus Van Der Walt</div>
   <div class="team-roster-item-name-role">head coach</div></a>
</div>`;

await teste('lê a colagem em texto, uma célula por linha',async()=>{
  const r=t.parsearVlr(VLR_TEXTO_LINHAS,'SEN');
  if(!r.ok)throw new Error(r.erro);
  const nicks=r.jogadores.map(j=>j.nick);
  for(const n of ['johnqt','Reduxx','Jerrwin','cortezia','JonahP','Marved'])
    if(!nicks.includes(n))throw new Error('perdeu o jogador '+n);
  const staff=r.staff.map(s=>s.nick);
  if(!staff.includes('Ewok'))throw new Error('não separou o head coach: '+JSON.stringify(staff));
  if(nicks.includes('Ewok'))throw new Error('head coach entrou como jogador');
});

await teste('lê a colagem com travessão',async()=>{
  const r=t.parsearVlr(VLR_TEXTO_TRAVESSAO,'SEN');
  if(!r.ok)throw new Error(r.erro);
  const j=r.jogadores.find(x=>x.nick==='Marved');
  if(!j)throw new Error('perdeu o Marved');
  if(j.nome!=='Jimmy Nguyen')throw new Error('não limpou o (stand-in): '+j.nome);
  if(r.jogadores.some(x=>x.nick==='Ewok'))throw new Error('head coach entrou como jogador');
});

await teste('ninguém é descartado em silêncio',async()=>{
  /* A regra que mais importa neste recurso: toda pessoa que aparece na colagem
     tem de sair em algum lugar — jogador ou comissão. Sumir sem aviso é pior
     que ler errado, porque você não tem como perceber. */
  for(const[rot,txt] of [['travessão',VLR_TEXTO_TRAVESSAO],['linhas',VLR_TEXTO_LINHAS],
                         ['html',VLR_HTML]]){
    const r=t.parsearVlr(txt,'SEN');
    if(!r.ok)throw new Error(rot+': '+r.erro);
    const saiu=new Set([...r.jogadores,...r.staff].map(x=>x.nick.toLowerCase()));
    for(const nick of ['johnqt','Reduxx','cortezia','Ewok'])
      if(txt.includes(nick)&&!saiu.has(nick.toLowerCase()))
        throw new Error(rot+': '+nick+' está na colagem e não saiu nem como jogador nem como comissão');
  }
  const r=t.parsearVlr(VLR_TEXTO_TRAVESSAO,'SEN');
  const ewok=r.staff.find(x=>x.nick==='Ewok');
  if(!ewok)throw new Error('Ewok não foi listado como comissão');
  if(!/coach/i.test(ewok.rotulo||''))throw new Error('não guardou o cargo lido: '+ewok.rotulo);
  if(ewok.nome!=='Marthinus Jacobus Van Der Walt')
    throw new Error('o cargo ficou grudado no nome: '+ewok.nome);
  if(!r.avisos.some(a=>a.includes('Ewok')))
    throw new Error('não avisou que Ewok foi separado');
});

await teste('a colagem em HTML traz o país da bandeira',async()=>{
  const r=t.parsearVlr(VLR_HTML,'SEN');
  if(!r.ok)throw new Error(r.erro);
  if(r.formato!=='html')throw new Error('não reconheceu como HTML');
  const esperado={johnqt:'MA',Reduxx:'EG',cortezia:'BR'};
  for(const nick in esperado){
    const j=r.jogadores.find(x=>x.nick===nick);
    if(!j)throw new Error('perdeu '+nick);
    if(j.pais!==esperado[nick])throw new Error(nick+' saiu com país '+(j.pais||'vazio'));
  }
  if(r.jogadores.some(x=>x.nick==='Ewok'))throw new Error('head coach entrou como jogador');
});

await teste('classe que não é país conhecido não vira nacionalidade',async()=>{
  const r=t.parsearVlr(VLR_HTML.replace('mod-ma','mod-xx'),'SEN');
  const j=r.jogadores.find(x=>x.nick==='johnqt');
  if(j.pais)throw new Error('inventou o país '+j.pais+' a partir de uma classe desconhecida');
});

await teste('função e over saem vazios, e o parser avisa',async()=>{
  const r=t.parsearVlr(VLR_TEXTO_LINHAS,'SEN');
  for(const l of r.linhas.split('\n')){
    const c=l.split('|').map(x=>x.trim());
    if(c[2])throw new Error('preencheu função sozinho: '+l);
    if(c[3])throw new Error('preencheu over sozinho: '+l);
  }
  if(!r.avisos.some(a=>/função nem over/.test(a)))
    throw new Error('não avisou que função e over ficam vazios');
});

await teste('as linhas geradas são aceitas pelo importador',async()=>{
  const alvo=Object.values(t.G.times).find(x=>x.tier===1);
  const antes=alvo.elenco.length;
  const r=t.parsearVlr(VLR_TEXTO_TRAVESSAO,alvo.tag);
  const res=w.importarElencos(r.linhas,'substituir');
  if(res.erros&&res.erros.length)
    throw new Error('o importador recusou: '+res.erros.slice(0,2).join(' / '));
  if(!alvo.elenco.length)throw new Error('não entrou ninguém');
  const nomes=alvo.elenco.map(i=>t.G.jogadores[i].nome);
  if(!nomes.includes('johnqt'))throw new Error('johnqt não entrou: '+nomes.join(', '));
  if(antes===undefined)throw new Error('estado inconsistente');
});

await teste('colagem vazia ou sem elenco é recusada com explicação',async()=>{
  const v1=t.parsearVlr('','SEN');
  if(v1.ok)throw new Error('aceitou colagem vazia');
  const v2=t.parsearVlr('CLASSIFICAÇÃO\nRANKING MUNDIAL\n1234','SEN');
  if(v2.ok)throw new Error('achou jogador onde não há: '+JSON.stringify(v2.jogadores));
  if(!/elenco/i.test(v2.erro))throw new Error('erro pouco explicativo: '+v2.erro);
});

await teste('a aba tem o campo de colagem e a prévia antes de importar',async()=>{
  t.tela='editor';t.edAba='io';w.render();
  if(!$('#vlrTxt'))throw new Error('sem campo de colagem');
  $('#vlrTxt').value=VLR_TEXTO_TRAVESSAO;
  $('#vlrGo').click();
  const feed=$('#vlrFeed').innerHTML;
  if(!feed.includes('Entendi isto'))throw new Error('não mostrou a prévia');
  if(!feed.includes('johnqt'))throw new Error('a prévia não listou os jogadores');
  if(!$('#vlrUsar'))throw new Error('sem botão para levar ao importador');
  /* nada pode ter entrado na base só por ler a colagem */
  if(t.G.jogadores.__novo)throw new Error('a leitura mexeu na base');
});


/* ============================================================
   PARTIDA AO VIVO
   ============================================================ */
function umMapaDeVerdade(){
  const ids=Object.keys(t.G.times);
  const A=t.G.times[ids[0]],B=t.G.times[ids[1]];
  return{mapa:t.simMapa(A,B,'Ascent'),A,B};
}

await teste('o round guarda o que a narração precisa',async()=>{
  const{mapa}=umMapaDeVerdade();
  if(!mapa.hist.length)throw new Error('mapa sem histórico');
  for(const h of mapa.hist){
    for(const campo of ['sa','sb','r','lado','v'])
      if(h[campo]===undefined)throw new Error('round sem '+campo);
    if(typeof h.sobrou!=='number')throw new Error('round sem contagem de sobreviventes');
  }
  const ultimo=mapa.hist[mapa.hist.length-1];
  if(ultimo.sa!==mapa.sa||ultimo.sb!==mapa.sb)
    throw new Error(`placar do último round (${ultimo.sa}-${ultimo.sb}) diverge do mapa (${mapa.sa}-${mapa.sb})`);
  if(!mapa.hist.some(h=>h.fk))throw new Error('nenhum round registrou quem abriu');
});

await teste('a narração não altera a simulação',async()=>{
  /* rnd() é o gerador SEMEADO do motor. Se a narração o chamasse, a partida
     seguinte mudaria só porque você assistiu a esta — o pior tipo de bug,
     porque some quando você desliga a tela para investigar. */
  const{mapa,A,B}=umMapaDeVerdade();
  const antes=t.simMapa(A,B,'Bind');
  t.narrarMapa(mapa,true,A.tag,B.tag);
  t.narrarFimDeMapa(mapa,true,A.tag,B.tag);
  const depois=t.simMapa(A,B,'Bind');
  /* narrar entre as duas simulações não pode ter consumido nada do gerador:
     rodamos de novo do mesmo ponto e comparamos o formato, não o valor */
  if(typeof depois.sa!=='number')throw new Error('simulação quebrou depois de narrar');
  const fonte=String(w.narrarRound)+String(w.pesoDoRound||'');
  if(/\brnd\s*\(/.test(fonte))
    throw new Error('a narração chama rnd() — isso adianta o gerador do motor');
  if(antes.hist.length<1||depois.hist.length<1)throw new Error('mapas vazios');
});

await teste('o mapa só é anunciado como encerrado no round que o encerra',async()=>{
  const{mapa,A,B}=umMapaDeVerdade();
  const nar=t.narrarMapa(mapa,true,A.tag,B.tag);
  nar.forEach((x,i)=>{
    const fim=/MAPA SEU|mapa deles/.test(x.texto);
    if(fim&&i!==nar.length-1)
      throw new Error(`anunciou o fim no round ${i+1} de ${nar.length}: ${x.texto}`);
    if(!fim&&i===nar.length-1)
      throw new Error('o último round não anunciou o fim: '+x.texto);
  });
});

await teste('o placar narrado bate com o do motor em todo round',async()=>{
  const{mapa,A,B}=umMapaDeVerdade();
  const nar=t.narrarMapa(mapa,true,A.tag,B.tag);
  nar.forEach((x,i)=>{
    const h=mapa.hist[i];
    if(x.placar.meu!==h.sa||x.placar.dele!==h.sb)
      throw new Error(`round ${i+1}: narrou ${x.placar.meu}-${x.placar.dele}, motor tem ${h.sa}-${h.sb}`);
  });
});

await teste('rounds decisivos pesam mais que rounds comuns',async()=>{
  const{mapa,A,B}=umMapaDeVerdade();
  const nar=t.narrarMapa(mapa,true,A.tag,B.tag);
  const fim=nar[nar.length-1].peso;
  const meio=nar[Math.floor(nar.length/3)].peso;
  if(!(fim>meio))throw new Error(`o round que fecha pesa ${fim} e um round comum pesa ${meio}`);
  if(nar.some(x=>x.peso<0||x.peso>1))throw new Error('peso fora de 0..1');
});

await teste('a mesma coisa não é dita a cada round',async()=>{
  const{mapa,A,B}=umMapaDeVerdade();
  const nar=t.narrarMapa(mapa,true,A.tag,B.tag);
  const formas=nar.map(x=>x.texto.replace(/\d+/g,'#'));
  const distintas=new Set(formas).size;
  if(distintas<formas.length*0.6)
    throw new Error(`só ${distintas} frases distintas em ${formas.length} rounds`);
});

await teste('a tela ao vivo abre, pula para o fim e não mexe na base',async()=>{
  const ids=Object.keys(t.G.times);
  const A=t.G.times[ids[0]],B=t.G.times[ids[1]];
  const antesCaixa=A.caixa, antesElenco=A.elenco.length;
  const res={aId:A.id,bId:B.id,vencedor:A.id,perdedor:B.id,wa:2,wb:0,bo:3,
             ctx:{nome:'Teste'},mvp:A.titulares[0],
             mapas:[t.simMapa(A,B,'Ascent'),t.simMapa(A,B,'Bind')]};
  const meuAntes=t.G.meuTime;
  t.G.meuTime=A.id;
  try{
    t.partidaAoVivo(res);
    if(!$('#modal').innerHTML.includes('av-placar'))throw new Error('a tela não abriu');
    t.avPular();
    const html=$('#modal').innerHTML;
    if(!/Vitória|Derrota/.test(html))throw new Error('pular não chegou ao desfecho');
    if(!$('#avFicha'))throw new Error('sem acesso à ficha completa no fim');
    if(A.caixa!==antesCaixa||A.elenco.length!==antesElenco)
      throw new Error('assistir alterou o estado do clube');
    t.avFechar();
    if($('#modal').innerHTML)throw new Error('fechar não limpou a tela');
  }finally{t.G.meuTime=meuAntes;t.avFechar();}
});


/* ============================================================
   PAPEL DO MANAGER, METAS E DEMISSÃO
   ============================================================ */
function comManager(papel,fn){
  const antes=t.G.manager;
  try{ t.criarManager('Teste',papel); t.montarMetas(); return fn(); }
  finally{ t.G.manager=antes; }
}

await teste('diretoria não tem meta e não pode ser demitida',async()=>{
  comManager('diretoria',()=>{
    if(t.souTreinador())throw new Error('papel errado');
    if(t.G.manager.metas.length)throw new Error('diretoria recebeu meta');
    if(t.avaliarTemporada()!==null)throw new Error('diretoria foi avaliada');
    const sit=t.situacaoManager();
    if(!sit.livre)throw new Error('a situação não marcou o modo livre');
    if(sit.confianca!==undefined)throw new Error('diretoria tem confiança para perder');
  });
});

await teste('treinador recebe meta de posição na liga',async()=>{
  comManager('treinador',()=>{
    const m=t.G.manager.metas;
    if(!m.length)throw new Error('treinador ficou sem meta');
    const principal=m.find(x=>x.peso>0);
    if(!principal)throw new Error('nenhuma meta com peso');
    if(principal.tipo!=='posicao')throw new Error('a meta principal não é de posição');
    if(!t.situacaoManager().metas.length)throw new Error('a situação não expõe as metas');
  });
});

await teste('terminar em último NUNCA cumpre a meta',async()=>{
  /* Foi o defeito que a simulação de carreira pegou: "entre os 9 primeiros"
     numa liga de 8 times era cumprida ficando em oitavo. */
  comManager('treinador',()=>{
    for(const id in t.G.times){
      const time=t.G.times[id];
      const liga=t.G.regioes[time.regiao][time.tier===1?'t1':'t2'];
      t.G.meuTime=id;
      const metas=t.montarMetas();
      for(const meta of metas.filter(x=>x.tipo==='posicao')){
        if(meta.alvo>=liga.length)
          throw new Error(`${time.tag}: alvo ${meta.alvo} numa liga de ${liga.length} — o último cumpriria`);
        if(meta.alvo<1)throw new Error(time.tag+': alvo inválido '+meta.alvo);
      }
    }
  });
});

await teste('a meta não exige o título todo ano de um clube médio',async()=>{
  comManager('treinador',()=>{
    let comAlvo1=0,total=0;
    for(const id in t.G.times){
      t.G.meuTime=id;total++;
      const p=t.montarMetas().find(x=>x.peso>0);
      if(p&&p.alvo<=1)comAlvo1++;
    }
    if(comAlvo1>total*0.05)
      throw new Error(comAlvo1+' de '+total+' clubes com meta de ser campeão — é sentença, não meta');
  });
});

await teste('meta se reescala quando a liga muda de tamanho',async()=>{
  const antes=t.G.manager, meuAntes=t.G.meuTime;
  try{
    const time=Object.values(t.G.times).find(x=>x.tier===1);
    t.G.meuTime=time.id;
    t.criarManager('Teste','treinador');t.montarMetas();
    const meta=t.G.manager.metas.find(x=>x.peso>0);
    const deAntes=meta.de;
    /* finge o rebaixamento: mesma meta, liga menor */
    meta.de=deAntes*2;
    const v=t.avaliarTemporada();
    if(!v)throw new Error('não avaliou');
    const m2=t.G.manager.metas.find(x=>x.peso>0);
    if(!m2.ajustada)throw new Error('não registrou o reajuste da meta');
    if(m2.alvo>=v.de-1)throw new Error('o alvo reajustado ainda permite o último lugar');
  }finally{t.G.manager=antes;t.G.meuTime=meuAntes;}
});

await teste('a demissão sempre deixa alguma porta aberta',async()=>{
  const antes=t.G.manager, meuAntes=t.G.meuTime;
  try{
    /* pega o clube de MENOR prestígio: é o caso em que a regra de teto zerava
       a lista e a carreira acabava sem aviso */
    const pior=Object.values(t.G.times).sort((a,b)=>a.prestigio-b.prestigio)[0];
    t.G.meuTime=pior.id;
    t.criarManager('Teste','treinador');t.montarMetas();
    t.G.manager.confianca=0;
    t.G.manager.clubes.push({tag:pior.tag,nome:pior.nome,de:t.G.ano,ate:t.G.ano});
    const of=t.ofertasDeEmprego();
    if(!of.length)throw new Error('nenhum clube no mundo inteiro — beco sem saída');
    if(of.some(x=>x.id===pior.id))throw new Error('ofereceu o clube que acabou de demitir');
  }finally{t.G.manager=antes;t.G.meuTime=meuAntes;}
});

await teste('assumir novo clube reinicia confiança e metas',async()=>{
  const antes=t.G.manager, meuAntes=t.G.meuTime;
  try{
    t.criarManager('Teste','treinador');
    t.G.manager.confianca=0;t.G.manager.demitido=true;
    const novo=Object.values(t.G.times).find(x=>x.id!==t.G.meuTime);
    const r=t.assumirClube(novo.id);
    if(!r.ok)throw new Error(r.erro);
    if(t.G.meuTime!==novo.id)throw new Error('não trocou de clube');
    if(t.G.manager.demitido)throw new Error('continuou marcado como demitido');
    if(t.G.manager.confianca<=0)throw new Error('começou o novo emprego já ameaçado');
    if(!t.G.manager.metas.length)throw new Error('sem metas no novo clube');
  }finally{t.G.manager=antes;t.G.meuTime=meuAntes;}
});

await teste('o veredito abre e explica o que foi cobrado',async()=>{
  const antes=t.G.manager;
  try{
    t.criarManager('Teste','treinador');t.montarMetas();
    const v=t.avaliarTemporada();
    if(!v)throw new Error('sem veredito');
    t.modalVeredito(v);
    const html=$('#modal').innerHTML;
    if(!html.includes('O que foi cobrado'))throw new Error('não listou as metas');
    if(!/Confiança da diretoria/.test(html))throw new Error('não mostrou a confiança');
    for(const meta of v.metas)
      if(!html.includes(meta.texto.slice(0,20)))throw new Error('meta ausente da tela: '+meta.texto);
    w.fechar&&w.fechar();
  }finally{t.G.manager=antes;$('#modal').innerHTML='';}
});

await teste('a Central mostra o cartão do manager conforme o papel',async()=>{
  const antes=t.G.manager;
  try{
    t.criarManager('Teste','treinador');t.montarMetas();
    t.tela='inicio';w.render();
    if(!$('#view').innerHTML.includes('mgr-metas'))throw new Error('treinador sem metas na Central');
    t.criarManager('Teste','diretoria');
    t.tela='inicio';w.render();
    const html=$('#view').innerHTML;
    if(html.includes('mgr-metas'))throw new Error('diretoria com metas na Central');
    if(!html.includes('Diretoria'))throw new Error('não identificou o papel');
  }finally{t.G.manager=antes;}
});


/* ============================================================
   AFINIDADE DE MAPA POR JOGADOR
   ============================================================ */
await teste('todo jogador nasce com afinidade em todos os mapas',async()=>{
  let semPerfil=0;
  for(const id in t.G.jogadores){
    const p=t.G.jogadores[id];
    for(const mp of t.MAP_POOL)
      if(typeof t.afinidadeDe(p,mp)!=='number')throw new Error(p.nome+' sem afinidade em '+mp);
    const vs=(t.MAP_POOL).map(mp=>t.afinidadeDe(p,mp));
    if(vs.every(v=>Math.abs(v)<1))semPerfil++;
  }
  const total=Object.keys(t.G.jogadores).length;
  if(semPerfil>total*0.15)
    throw new Error(semPerfil+' de '+total+' jogadores sem nenhuma opinião de mapa — é ruído, não perfil');
});

await teste('a opinião forte é de poucos mapas, não de todos',async()=>{
  /* Um jogador que ama ou odeia doze mapas não tem identidade nenhuma. */
  const p=Object.values(t.G.jogadores)[0];
  const antes={...p.mapas};
  try{
    for(let i=0;i<40;i++){
      p.mapas=t.afinidadeInicial();
      const fortes=t.MAP_POOL.filter(mp=>Math.abs(p.mapas[mp])>=4).length;
      if(fortes>t.MAP_POOL.length/2)
        throw new Error(fortes+' mapas com opinião forte de '+t.MAP_POOL.length);
    }
  }finally{p.mapas=antes;}
});

await teste('afinidade do elenco muda quando a escalação muda',async()=>{
  const time=t.G.times[t.G.meuTime];
  const mp=t.MAP_POOL[0];
  const antes=t.afinidadeElenco(time,mp);
  const guardado=time.titulares.slice();
  try{
    time.titulares.forEach(id=>{t.G.jogadores[id].mapas[mp]=8;});
    if(!(t.afinidadeElenco(time,mp)>antes))
      throw new Error('a média não acompanhou os titulares');
    time.titulares.forEach(id=>{t.G.jogadores[id].mapas[mp]=-8;});
    if(!(t.afinidadeElenco(time,mp)<0))throw new Error('a média não caiu');
  }finally{time.titulares=guardado;}
});

await teste('a afinidade do elenco pesa na força do time',async()=>{
  const time=t.G.times[t.G.meuTime];
  const mp=t.MAP_POOL[0];
  const guardado=time.titulares.map(id=>t.G.jogadores[id].mapas[mp]);
  try{
    time.titulares.forEach(id=>{t.G.jogadores[id].mapas[mp]=-8;});
    const ruim=t.forcaTime(time,mp,'atk');
    time.titulares.forEach(id=>{t.G.jogadores[id].mapas[mp]=8;});
    const bom=t.forcaTime(time,mp,'atk');
    if(!(bom>ruim))throw new Error(`força ${bom.toFixed(1)} com afinidade máxima não superou ${ruim.toFixed(1)}`);
    if(bom-ruim>22)throw new Error('o mapa virou o fator dominante da partida: '+(bom-ruim).toFixed(1));
  }finally{time.titulares.forEach((id,k)=>{t.G.jogadores[id].mapas[mp]=guardado[k];});}
});

await teste('render acima do próprio normal sobe a afinidade, abaixo derruba',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const mp=t.MAP_POOL[1];
  const antesMapa=p.mapas[mp], antesTemp={...p.temp};
  try{
    p.mapas[mp]=0;
    p.temp={...p.temp,maps:10,acs:2000};      /* média de 200 de ACS */
    t.evoluirAfinidade(p,mp,280);             /* bem acima do próprio normal */
    const subiu=p.mapas[mp];
    if(!(subiu>0))throw new Error('render alto não subiu a afinidade: '+subiu);
    p.mapas[mp]=0;
    t.evoluirAfinidade(p,mp,120);             /* bem abaixo */
    if(!(p.mapas[mp]<0))throw new Error('render baixo não derrubou a afinidade: '+p.mapas[mp]);
  }finally{p.mapas[mp]=antesMapa;p.temp=antesTemp;}
});

await teste('a afinidade nunca sai da faixa',async()=>{
  const p=Object.values(t.G.jogadores)[0];
  const mp=t.MAP_POOL[2];
  const antesMapa=p.mapas[mp], antesTemp={...p.temp};
  try{
    p.mapas[mp]=8;p.temp={...p.temp,maps:10,acs:1000};
    for(let i=0;i<60;i++)t.evoluirAfinidade(p,mp,900);
    if(p.mapas[mp]>8)throw new Error('estourou o teto: '+p.mapas[mp]);
    p.mapas[mp]=-8;
    for(let i=0;i<60;i++)t.evoluirAfinidade(p,mp,1);
    if(p.mapas[mp]<-8)throw new Error('furou o piso: '+p.mapas[mp]);
  }finally{p.mapas[mp]=antesMapa;p.temp=antesTemp;}
});

await teste('a ficha do jogador mostra o perfil de mapas',async()=>{
  const p=Object.values(t.G.jogadores).find(x=>x.timeId);
  w.modalJogador(p.id);
  const html=$('#modal').innerHTML;
  if(!html.includes('mapa-tira'))throw new Error('sem a tira de mapas');
  for(const mp of t.MAP_POOL.slice(0,4))
    if(!html.includes(mp))throw new Error('mapa ausente da ficha: '+mp);
  const ord=t.mapasDe(p);
  for(let i=1;i<ord.length;i++)
    if(ord[i].v>ord[i-1].v)throw new Error('a lista não está ordenada do melhor para o pior');
  $('#modal').innerHTML='';
});

await teste('Táticas separa o mapa do clube do mapa do elenco',async()=>{
  t.tela='taticas';w.render();
  const html=$('#view').innerHTML;
  if(!html.includes('Clube')||!html.includes('Elenco'))
    throw new Error('a tabela não separa as duas origens');
});


await teste('todo medidor da interface recebe rótulo, fração e tamanho',async()=>{
  /* medidor(rotulo, v, px) com v entre 0 e 1. Chamar medidor(valor, 100) faz o
     anel marcar 100 sempre e imprimir o valor como rótulo — já aconteceu duas
     vezes, na tela de rivalidades e na de Finanças, e nas duas o número errado
     ficou lá visível sem quebrar nada. */
  const fontes=w.document.documentElement.innerHTML;
  const chamadas=[...fontes.matchAll(/medidor\(([^;]{0,140}?)\)\}/g)].map(m=>m[1]);
  for(const c of chamadas){
    if(/^\s*['"`<]/.test(c))continue;                 /* começa com rótulo: ok */
    throw new Error('medidor sem rótulo como 1º argumento: medidor('+c+')');
  }
});

await teste('Finanças desconta o custeio do resultado do ano',async()=>{
  t.tela='financas';w.render();
  const html=$('#view').innerHTML;
  if(!html.includes('Custeio anual'))throw new Error('a tela não mostra o custeio');
  if(!html.includes('Teto de folha'))throw new Error('a tela não mostra o teto de folha');
  const time=t.G.times[t.G.meuTime];
  const folha=(time.elenco.reduce((a,i)=>a+t.G.jogadores[i].salario,0))*12+t.folhaAnual(time)-
              (time.elenco.reduce((a,i)=>a+t.G.jogadores[i].salario,0))*12;
  const esperado=t.receitaAnual(time)-t.folhaAnual(time)-t.custeioAnual(time);
  /* o valor aparece formatado; basta conferir o sinal e a ordem de grandeza */
  if(esperado>0&&html.includes('-$'))throw new Error('resultado negativo numa conta positiva');
  if(!(t.receitaAnual(time)-t.folhaAnual(time)>esperado))
    throw new Error('o custeio não está saindo do resultado anual');
});

await teste('save de antes do calendário semanal volta a jogar',async()=>{
  /* O calendário antigo não tinha semana nenhuma. Carregado como estava,
     blocoDaSemana() não achava bloco em semana alguma: o ano inteiro passava
     em "Intervalo", sem um único jogo e sem erro — a temporada sumia em
     silêncio. A migração tem de remontar o calendário. */
  comSaveVelho(()=>{
    const reg=saveVelho();
    reg.estado.calendario=[
      {nome:'Pré-temporada',stages:[],endKey:'preseason',janela:true},
      {nome:'Stage 1',stages:[],endKey:'stage1'},
      {nome:'Fim de temporada',stages:[],endKey:'offseason'}
    ];
    reg.estado.bloco=1;
    delete reg.estado.semana;
    t.desempacotarRun(reg);
    if(t.G.calendario[0].ini===undefined)throw new Error('o calendário continuou sem semanas');
    if(!(t.G.semana>=1&&t.G.semana<=t.SEMANAS_ANO))throw new Error('semana inválida: '+t.G.semana);
    if(t.blocoDaSemana(t.G.semana)==null)
      throw new Error('a semana '+t.G.semana+' caiu fora de qualquer bloco');
    /* e joga de verdade */
    let jogos=0;
    for(let i=0;i<12;i++){const r=t.avancar();jogos+=(r&&r.resultados||[]).length;}
    if(!jogos)throw new Error('12 semanas sem uma única partida depois de migrar');
  });
});

await teste('a Central acha o próximo jogo em grupo e em chaveamento',async()=>{
  /* Só sabia ler pontos corridos: nos formatos novos dizia "esperando o
     próximo torneio" nas semanas em que o clube tinha jogo marcado. */
  const i=t.blocoDaSemana(t.G.semana);
  const b=i==null?null:t.G.calendario[i];
  if(!b)return;
  const temJogo=b.stages.some(s=>!s.feito&&(s.rodadaAtual||[]).some(par=>par.includes(t.G.meuTime)));
  const px=t.proximoConfronto();
  if(temJogo&&(!px||px.espera))
    throw new Error('há jogo marcado nesta semana e a Central diz que não');
  if(temJogo&&!px.adv&&!px.bye)throw new Error('achou o jogo mas não achou o adversário');
});

await teste('emprestado volta ao dono na virada, e não vira agente livre',async()=>{
  /* O empréstimo dá um contrato de um ano ao clube que recebe. Se a rotina de
     contratos rodasse antes da devolução, esse ano vencia e o jogador caía no
     mercado — o dono perdia um titular de graça, sem aviso. */
  const meu=t.G.times[t.G.meuTime];
  const destino=Object.values(t.G.times).find(x=>x.id!==meu.id&&x.elenco.length<t.ELENCO_MAX);
  const p=t.G.jogadores[meu.elenco.find(i=>!meu.titulares.includes(i))||meu.elenco[0]];
  const contratoReal=p.contrato;
  t.executarEmprestimo(p,destino,{jogadorId:p.id,clubeId:destino.id,tipo:'emprestimo',
    taxa:0,salario:Math.round(p.salario*0.75),anos:1,opcaoCompra:0});
  if(!p.emprestimo)throw new Error('o empréstimo não foi registrado');
  t.resolverEmprestimos();
  if(!p.timeId)throw new Error('virou agente livre em vez de voltar');
  if(p.timeId!==meu.id)throw new Error('foi parar no '+t.G.times[p.timeId].nome);
  if(p.contrato<1)throw new Error('voltou sem contrato (era '+contratoReal+')');
});

await teste('o anúncio morre quando o jogador muda de clube',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const outro=Object.values(t.G.times).find(x=>x.id!==meu.id&&x.elenco.length<t.ELENCO_MAX);
  const p=t.G.jogadores[meu.elenco.find(i=>!meu.titulares.includes(i))||meu.elenco[0]];
  t.anunciarJogador(p,'venda',false,t.pedidoDeVenda2(p));
  if(!p.anuncio)throw new Error('não consegui anunciar para montar o caso');
  t.contratar(p,outro,2,p.salario);
  if(p.anuncio)throw new Error('chegou ao clube novo ainda anunciado à venda');
  if((t.G.propostas||[]).some(x=>x.jogadorId===p.id))
    throw new Error('sobraram propostas por um jogador que trocou de clube');
});

await teste('nenhuma tela mostra NaN, undefined ou objeto cru',async()=>{
  /* Um campo que não foi migrado, uma conta com divisor zero, um objeto
     concatenado em string: nada disso quebra o jogo, só aparece na cara de
     quem está jogando. A varredura completa, em onze pontos da temporada,
     está em tools/telas-texto.mjs; aqui vai a versão rápida, no estado em que
     a bateria já deixou o mundo. */
  const ruim=/\bNaN\b|\bundefined\b|\[object Object\]|\bInfinity\b/;
  const olhar=(onde,txt)=>{
    const m=String(txt||'').match(ruim);
    if(!m)return;
    const i=String(txt).indexOf(m[0]);
    throw new Error(onde+': "'+String(txt).slice(Math.max(0,i-70),i+40).replace(/\s+/g,' ')+'"');
  };
  const eraTela=t.tela, eraMerc=t.mercAba;
  try{
    for(const [k] of t.NAV){t.tela=k;w.render();olhar('tela '+k,$('#view').textContent);}
    for(const ab of ['minha','INT','pts'])
      olhar('comp/'+ab,w.eval(`tela='comp';compAba='${ab}';render();$('#view').textContent`));
    for(const ab of ['jogadores','comissao','saidas']){
      t.tela='mercado';t.mercAba=ab;w.render();
      olhar('mercado/'+ab,$('#view').textContent);
    }
    olhar('topbar',$('#top').textContent);
    const time=t.G.times[t.G.meuTime];
    w.modalJogador(time.titulares[0]);olhar('ficha do jogador',$('#modal').textContent);$('#modal').innerHTML='';
    const sid=Object.keys(t.G.staff||{})[0];
    if(sid){w.modalStaff(sid);olhar('ficha da comissão',$('#modal').textContent);$('#modal').innerHTML='';}
  }finally{t.tela=eraTela;t.mercAba=eraMerc;w.eval("compAba='minha'");w.render();}
});

await teste('a partida ao vivo aguenta passo depois do fim',async()=>{
  /* O timer do avanço automático dispara mais uma vez depois do clique em
     "pular para o fim": avMapaAtual() devolvia undefined e a narração morria
     lendo o histórico de um mapa que não existe, com a partida já decidida. */
  let r=null;
  for(let i=0;i<60&&!(r&&r.minhaPartida);i++)r=t.avancar();
  if(!r||!r.minhaPartida)return;
  w.partidaAoVivo(r.minhaPartida);
  try{
    w.avPular();
    for(let i=0;i<15;i++)w.avPasso();      /* não pode explodir */
    if(!$('#modal').textContent.length)throw new Error('a tela ficou vazia depois do fim');
  }finally{
    if(typeof w.avFechar==='function')w.avFechar();
    $('#modal').innerHTML='';w.render();
  }
});

await teste('perder uma final entra na história do clube',async()=>{
  /* Só a semeadura de 2021–2025 contava finais perdidas: no jogo o clube podia
     perder dez decisões e a ficha continuava marcando zero vice. */
  const comVice=Object.values(t.G.times).filter(x=>(x.vices||0)>0);
  const encerrados=[];
  for(const b of t.G.calendario)for(const s of b.stages)if(s._encerrado)encerrados.push(s);
  if(!encerrados.length)return;                 /* nada decidido ainda nesta run */
  for(const s of encerrados){
    const vice=s.ranking&&s.ranking[1];
    if(!vice)continue;
    if(!((t.G.times[vice].vices||0)>0))
      throw new Error(t.G.times[vice].tag+' foi vice de '+t.nomeTitulo(s)+' e está com zero vice');
  }
  if(!comVice.length)throw new Error('nenhum clube do mundo tem vice depois de torneios decididos');
});

await teste('treinador demitido fica sem clube e com a porta de volta na tela',async()=>{
  /* A demissão só existia dentro do modal do veredito. Quem fechasse o modal
     sem escolher clube seguia "treinando" quem o demitiu: metas velhas na
     tela, confiança congelada e nenhuma temporada mais avaliada. A carreira
     acabava em silêncio. */
  const guardado=JSON.parse(JSON.stringify(t.G.manager||{}));
  const eraTela=t.tela;
  try{
    w.eval(`criarManager('Teste','treinador');montarMetas();`);
    if(!t.situacaoManager().metas.length)throw new Error('não consegui montar o caso: sem metas');
    t.demitirManager(t.G.times[t.G.meuTime]);
    const sit=t.situacaoManager();
    if(!sit.demitido)throw new Error('a situação não diz que ele foi demitido');
    if(sit.metas&&sit.metas.length)throw new Error('continuou mostrando meta de um clube que não é dele');
    if(!(sit.ofertas||[]).length)throw new Error('nenhum clube interessado — carreira sem saída');
    t.tela='inicio';w.render();
    const html=$('#view').innerHTML;
    if(!html.includes('Sem clube'))throw new Error('a Central não diz que ele está sem clube');
    if(!html.includes('data-assumir'))throw new Error('a Central não oferece por onde recomeçar');
    /* e assumir de volta funciona */
    const alvo=sit.ofertas[0];
    const r=t.assumirClube(alvo.id);
    if(!r.ok)throw new Error('não deu para assumir: '+r.erro);
    if(t.G.meuTime!==alvo.id)throw new Error('assumiu e o clube não mudou');
    if(t.situacaoManager().demitido)throw new Error('assumiu e continuou demitido');
    if(!t.situacaoManager().metas.length)throw new Error('assumiu sem meta nenhuma');
  }finally{
    t.G.manager=guardado;t.tela=eraTela;w.render();
  }
});

await teste('o clube sempre põe cinco em quadra, nem que seja machucado',async()=>{
  /* Com sete jogadores e uma sequência ruim de lesões — e ela acontece —
     sobrava menos de cinco gente inteira, a escalação saía VAZIA e a partida
     estourava no meio da temporada. Cinco em quadra é invariante; quem entra
     em recuperação joga pior, e é esse o custo. */
  const time=t.G.times[t.G.meuTime];
  const antes=time.elenco.map(i=>t.G.jogadores[i].lesao);
  const tit=time.titulares.slice();
  try{
    time.elenco.forEach(i=>{t.G.jogadores[i].lesao=3;});
    t.autoEscalar(time);
    if(time.titulares.length!==5)
      throw new Error('com o elenco todo lesionado escalou '+time.titulares.length);
    if(!isFinite(t.forcaTime(time,t.MAP_POOL[0])))
      throw new Error('a força do time virou NaN');
    /* e o time machucado tem de render MENOS que o mesmo time inteiro */
    const doente=t.forcaTime(time,t.MAP_POOL[0]);
    time.elenco.forEach(i=>{t.G.jogadores[i].lesao=0;});
    t.autoEscalar(time);
    const sadio=t.forcaTime(time,t.MAP_POOL[0]);
    if(!(sadio>doente))
      throw new Error('entrar machucado não custou nada: '+doente.toFixed(1)+' vs '+sadio.toFixed(1));
  }finally{
    time.elenco.forEach((i,k)=>{t.G.jogadores[i].lesao=antes[k]||0;});
    time.titulares=tit;t.autoEscalar(time);
  }
});

await teste('desenhar a tela nunca mexe no gerador do motor',async()=>{
  /* Esta é a regra mais fácil de quebrar sem perceber e a mais cara quando
     quebra: rnd() é o gerador SEMEADO da simulação. Se qualquer função de
     desenho o chamar — um sorteio de chave para "prever" o próximo jogo, um
     embaralhamento para variar um texto —, o fluxo anda, e a partida que ia
     acontecer deixa de acontecer. O save fica válido e o mundo fica errado.

     Testar por leitura do código não pega tudo. Este caso desenha TODAS as
     telas, todas as abas do Editor e as fichas, e confere que a semente ficou
     exatamente onde estava. */
  const antes=t.semente;
  for(const [k] of t.NAV){t.tela=k;w.render();}
  for(const [k] of t.ED_ABAS){t.telaMenu='banco';t.edAba=k;w.render();}
  t.modo='jogo';t.tela='comp';
  /* compAba é um `let` de módulo: só dá para trocar por eval no próprio
     escopo, como o resto da ponte. Escrever em __t.compAba não faria nada e o
     caso passaria sem ter visitado aba nenhuma. */
  for(const ab of ['minha','INT','pts'])w.eval(`compAba='${ab}';render()`);
  w.eval(`compAba='minha'`);
  t.tela='mercado';
  for(const ab of ['jogadores','comissao','saidas']){t.mercAba=ab;w.render();}
  const time=t.G.times[t.G.meuTime];
  w.modalJogador(time.titulares[0]);$('#modal').innerHTML='';
  const sid=Object.keys(t.G.staff||{})[0];
  if(sid){w.modalStaff(sid);$('#modal').innerHTML='';}
  w.modalAnunciar(time.elenco[0]);$('#modal').innerHTML='';
  t.tela='inicio';t.mercAba='jogadores';w.render();
  if(t.semente!==antes)
    throw new Error('a semente saiu de '+antes+' para '+t.semente+' só de desenhar as telas');
});

/* ============================================================
   CALENDÁRIO E FORMATOS
   O tempo era uma pilha de campeonatos e os torneios eram uma
   lista que encolhia. Agora é um ano com data, com grupos
   sorteados e chave de dupla eliminação.
   ============================================================ */

await teste('a temporada é um ano de semanas, sem bloco fora do calendário',async()=>{
  let fim=0;
  for(const b of t.TEMPORADA){
    if(!(b.ini>=1&&b.fim<=t.SEMANAS_ANO))throw new Error(b.nome+' fora do ano: '+b.ini+'–'+b.fim);
    if(b.ini>b.fim)throw new Error(b.nome+' começa depois de acabar');
    if(b.ini<=fim)throw new Error(b.nome+' se sobrepõe ao bloco anterior');
    fim=b.fim;
  }
});

await teste('sobra semana livre entre torneios',async()=>{
  /* Sem intervalo, "avançar" volta a ser pular de campeonato em campeonato e
     não existe tempo para treinar nem para planejar nada. */
  let livres=0;
  for(let sem=1;sem<=t.SEMANAS_ANO;sem++)if(t.blocoDaSemana(sem)==null)livres++;
  if(livres<3)throw new Error('só '+livres+' semana(s) livre(s) no ano inteiro');
});

await teste('a data da semana anda junto com o calendário',async()=>{
  const a=t.rotuloSemana(2026,1), b=t.rotuloSemana(2026,26), c=t.rotuloSemana(2026,52);
  if(a===b||b===c)throw new Error('semanas diferentes com a mesma data: '+[a,b,c].join(' | '));
  if(!/jun|jul/.test(t.rotuloSemana(2026,26)))
    throw new Error('a semana 26 deveria cair no meio do ano, e caiu em: '+t.rotuloSemana(2026,26));
});

await teste('sorteio distribui os potes sem juntar dois cabeças no mesmo grupo',async()=>{
  const ids=Object.values(t.G.times).filter(x=>x.tier===1).slice(0,12).map(x=>x.id);
  const r=t.sortearGrupos(ids,2,['Alpha','Omega']);
  if(r.grupos.length!==2)throw new Error('saiu com '+r.grupos.length+' grupos');
  const soma=r.grupos.reduce((a,g)=>a+g.times.length,0);
  if(soma!==ids.length)throw new Error(soma+' times sorteados de '+ids.length);
  /* os dois primeiros do pote 1 têm de cair em grupos diferentes */
  const pote1=r.sorteio.filter(x=>x.pote===1);
  if(new Set(pote1.map(x=>x.grupo)).size!==pote1.length)
    throw new Error('dois cabeças de chave no mesmo grupo');
});

await teste('fase de grupos: cada um joga só contra o próprio grupo',async()=>{
  const s=Object.values(t.G.times)&&acharGrupoRodado();
  if(!s)return;
  const fora=s.resultados.filter(r=>s._grupoDe[r.a]!==s._grupoDe[r.b]);
  if(fora.length)throw new Error(fora.length+' jogo(s) entre grupos diferentes');
  for(const g of s.grupos)for(const id of g.times){
    const j=g.tabela[id].v+g.tabela[id].d;
    if(j!==g.times.length-1)
      throw new Error(t.G.times[id].nome+' fez '+j+' jogos num grupo de '+g.times.length);
  }
});

await teste('dupla eliminação: ninguém cai com uma derrota só',async()=>{
  const s=acharDERodada();
  if(!s)return;
  if(!s.campeao)throw new Error('terminou sem campeão');
  const derrotas={};
  s.resultados.forEach(r=>{const p=r.v===r.a?r.b:r.a;derrotas[p]=(derrotas[p]||0)+1;});
  const cedo=s.times.filter(id=>id!==s.campeao&&id!==s.vice&&(derrotas[id]||0)<2);
  if(cedo.length)throw new Error(cedo.map(i=>t.G.times[i].tag).join(',')+' eliminado(s) com uma derrota');
  if((derrotas[s.campeao]||0)>1)throw new Error('campeão com '+derrotas[s.campeao]+' derrotas');
  if(!(s.chave||[]).some(r=>r.fase==='lb'))throw new Error('chaveamento sem chave inferior');
  if(!(s.chave||[]).some(r=>r.fase==='gf'))throw new Error('chaveamento sem grande final');
});

await teste('todo torneio que paga elege um melhor jogador',async()=>{
  const sem=[];
  for(const b of t.G.calendario)for(const s of b.stages){
    if(!s._encerrado)continue;
    if(!s.mvp)sem.push(t.nomeStage(s));
  }
  if(sem.length)throw new Error('sem MVP: '+sem.join(', '));
});

await teste('o MVP jogou de verdade e a ficha dele fecha',async()=>{
  for(const b of t.G.calendario)for(const s of b.stages){
    if(!s.mvp)continue;
    const r=t.resumoMVP(s);
    if(!r)throw new Error(t.nomeStage(s)+': MVP sem resumo');
    if(!(r.maps>0))throw new Error(t.nomeStage(s)+': MVP com zero mapas');
    if(!(r.acs>0))throw new Error(t.nomeStage(s)+': MVP com ACS zerado');
    if(!s.times.includes(r.time&&r.time.id))
      throw new Error(t.nomeStage(s)+': MVP de um clube que não disputou');
  }
});

await teste('fase de grupos não tem campeão, tem classificados',async()=>{
  for(const b of t.G.calendario)for(const s of b.stages){
    if(s.tipo!=='grupos'||!s.feito)continue;
    if(!s.classificados||!s.classificados.length)
      throw new Error(t.nomeStage(s)+' terminou sem classificados');
    if((s.titulosDados||0)>0)throw new Error('fase de grupos entregou título');
    if(!/Grupos/.test(t.nomeStage(s)))throw new Error('a fase de grupos não se identifica: '+t.nomeStage(s));
    if(/Grupos/.test(t.nomeTitulo(s)))throw new Error('o TÍTULO carrega o nome da fase: '+t.nomeTitulo(s));
  }
});

await teste('Competições mostra grupos, chaveamento e a ficha do torneio',async()=>{
  t.tela='comp';w.render();
  const html=$('#view').innerHTML;
  if(!/Alpha|Omega/.test(html))throw new Error('nenhuma tabela de grupo na tela');
  if(!html.includes('Dupla eliminação'))throw new Error('a tela não explica o formato');
  if(!/Chave (superior|inferior)/.test(html))throw new Error('sem chaveamento desenhado');
  if(!html.includes('ao campeão'))throw new Error('a ficha do torneio não mostra premiação');
  if(!html.includes('Melhor jogador do torneio'))throw new Error('sem o MVP na tela');
});

/* ============================================================
   VENDER E EMPRESTAR
   Comprar de um clube que tinha cinco jogadores deixava aquele
   clube com quatro e quebrava a escalação dele. E vender os seus
   simplesmente não existia.
   ============================================================ */

await teste('comprar de um clube no mínimo não o deixa sem elenco',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const outro=Object.values(t.G.times).find(x=>x.id!==meu.id&&x.elenco.length>=5);
  /* enxuga o vendedor até o mínimo */
  while(outro.elenco.length>t.ELENCO_MIN){
    const p=t.G.jogadores[outro.elenco.find(i=>!outro.titulares.includes(i))||outro.elenco[outro.elenco.length-1]];
    t.liberar(p);
  }
  if(outro.elenco.length!==t.ELENCO_MIN)throw new Error('não consegui montar o cenário');
  const alvo=t.G.jogadores[outro.titulares[0]];
  const antesMeu=meu.elenco.length;
  t.contratar(alvo,meu,2,alvo.salario);
  if(outro.elenco.length<t.ELENCO_MIN)
    throw new Error(outro.nome+' ficou com '+outro.elenco.length+' jogadores depois da venda');
  if(outro.titulares.length!==5)
    throw new Error(outro.nome+' ficou com '+outro.titulares.length+' titulares');
  if(meu.elenco.length!==antesMeu+1)throw new Error('o comprador não recebeu o jogador');
});

await teste('nenhum clube do mundo fica abaixo do elenco mínimo',async()=>{
  const curtos=Object.values(t.G.times).filter(x=>x.elenco.length<t.ELENCO_MIN);
  if(curtos.length)throw new Error(curtos.map(x=>x.nome+' ('+x.elenco.length+')').join(', '));
});

await teste('clube no elenco mínimo cobra mais caro pelo passe',async()=>{
  const x=Object.values(t.G.times).find(y=>y.elenco.length>t.ELENCO_MIN+2);
  const p=t.G.jogadores[x.titulares[0]];
  const cheio=t.pedidoDeVenda2(p);
  const guardados=x.elenco.slice();
  try{
    x.elenco=x.elenco.slice(0,t.ELENCO_MIN);
    if(!(t.pedidoDeVenda2(p)>cheio))
      throw new Error('elenco curto não encareceu o passe: '+cheio+' → '+t.pedidoDeVenda2(p));
  }finally{x.elenco=guardados;}
});

await teste('anunciar exige elenco acima do mínimo para venda',async()=>{
  const x=Object.values(t.G.times).find(y=>y.elenco.length===t.ELENCO_MIN)
       ||Object.values(t.G.times)[0];
  const guardados=x.elenco.slice();
  try{
    x.elenco=x.elenco.slice(0,t.ELENCO_MIN);
    const p=t.G.jogadores[x.elenco[0]];
    const r=t.anunciarJogador(p,'venda',false,100000);
    if(r.ok)throw new Error('deixou anunciar para venda com o elenco no mínimo');
    if(!/contrate|mínimo|abrir mão/i.test(r.erro||''))throw new Error('o motivo não explica nada: '+r.erro);
  }finally{x.elenco=guardados;}
});

await teste('anúncio atrai proposta de quem precisa daquela função',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const p=t.G.jogadores[meu.elenco.slice().sort((a,b)=>t.over(t.G.jogadores[b])-t.over(t.G.jogadores[a]))[0]];
  const janela=t.G.janela;
  try{
    t.G.janela=true;
    t.anunciarJogador(p,'ambos',true,t.pedidoDeVenda2(p));
    let achou=0;
    for(let i=0;i<40&&!achou;i++){t.gerarPropostas();achou=(t.G.propostas||[]).filter(x=>x.jogadorId===p.id).length;}
    if(!achou)throw new Error('40 semanas de janela aberta e nenhuma proposta por um titular anunciado');
    const pr=(t.G.propostas||[]).find(x=>x.jogadorId===p.id);
    if(!(pr.taxa>0))throw new Error('proposta sem valor');
    if(pr.clubeId===meu.id)throw new Error('o próprio clube propôs');
  }finally{t.G.janela=janela;t.retirarAnuncio(p);}
});

await teste('proposta não chega com a janela fechada',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const p=t.G.jogadores[meu.elenco[0]];
  const janela=t.G.janela;
  try{
    t.G.janela=false;
    t.anunciarJogador(p,'ambos',false,t.pedidoDeVenda2(p));
    for(let i=0;i<10;i++)t.gerarPropostas();
    if((t.G.propostas||[]).some(x=>x.jogadorId===p.id))
      throw new Error('proposta chegou com a janela fechada');
  }finally{t.G.janela=janela;t.retirarAnuncio(p);}
});

await teste('aceitar venda move jogador e dinheiro, e repõe o elenco',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const janela=t.G.janela;
  try{
    t.G.janela=true;
    const p=t.G.jogadores[meu.elenco.find(i=>!meu.titulares.includes(i))||meu.elenco[0]];
    t.anunciarJogador(p,'venda',false,t.pedidoDeVenda2(p));
    let pr=null;
    for(let i=0;i<40&&!pr;i++){t.gerarPropostas();pr=(t.G.propostas||[]).find(x=>x.jogadorId===p.id&&x.tipo==='compra');}
    if(!pr)return;                       /* sem comprador nesta semente: nada a testar */
    const caixaAntes=meu.caixa, comprador=t.G.times[pr.clubeId], nAntes=meu.elenco.length;
    const r=t.aceitarProposta(pr.id);
    if(!r.ok)throw new Error(r.erro);
    if(p.timeId!==comprador.id)throw new Error('o jogador não mudou de clube');
    if(meu.caixa!==caixaAntes+pr.taxa)throw new Error('o dinheiro não entrou');
    if(meu.elenco.length<t.ELENCO_MIN)throw new Error('vendedor ficou abaixo do mínimo');
    if(nAntes>t.ELENCO_MIN&&meu.elenco.includes(p.id))throw new Error('o jogador continua no elenco');
    if(p.anuncio)throw new Error('o anúncio não foi retirado');
  }finally{t.G.janela=janela;}
});

await teste('empréstimo troca de elenco mas não troca de dono',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const destino=Object.values(t.G.times).find(x=>x.id!==meu.id&&x.elenco.length<t.ELENCO_MAX);
  const p=t.G.jogadores[meu.elenco.find(i=>!meu.titulares.includes(i))||meu.elenco[0]];
  const salOriginal=p.salario;
  const pr={id:'x',jogadorId:p.id,clubeId:destino.id,tipo:'emprestimo',
            taxa:5000,salario:Math.round(salOriginal*0.75),anos:1,opcaoCompra:200000};
  t.executarEmprestimo(p,destino,pr);
  try{
    if(p.timeId!==destino.id)throw new Error('o jogador não foi para o outro elenco');
    if(!p.emprestimo||p.emprestimo.donoId!==meu.id)throw new Error('o dono se perdeu');
    if(!(p.emprestimo.parteDono>0))throw new Error('o dono não ficou com parte nenhuma do salário');
    if(!(t.custoEmprestimosDe(meu)>0))throw new Error('a parte do dono não entra no custo dele');
    if(!t.emprestadosDe(meu).some(x=>x.id===p.id))throw new Error('não aparece na lista de emprestados');
  }finally{
    t.resolverEmprestimos();
  }
});

await teste('emprestado volta na virada de temporada',async()=>{
  const meu=t.G.times[t.G.meuTime];
  const destino=Object.values(t.G.times).find(x=>x.id!==meu.id&&x.elenco.length<t.ELENCO_MAX);
  const p=t.G.jogadores[meu.elenco.find(i=>!meu.titulares.includes(i))||meu.elenco[0]];
  t.executarEmprestimo(p,destino,{jogadorId:p.id,clubeId:destino.id,tipo:'emprestimo',
    taxa:0,salario:Math.round(p.salario*0.75),anos:1,opcaoCompra:0});
  t.resolverEmprestimos();
  if(p.timeId!==meu.id)throw new Error('não voltou para o dono');
  if(p.emprestimo)throw new Error('a marca de empréstimo ficou pendurada');
  if(t.custoEmprestimosDe(meu)!==0)throw new Error('o dono continua pagando por quem já voltou');
});

await teste('a aba Saídas mostra elenco, propostas e emprestados',async()=>{
  t.tela='mercado';t.mercAba='saidas';w.render();
  const html=$('#view').innerHTML;
  if(!html.includes('Seu elenco'))throw new Error('sem a tabela do elenco');
  if(!html.includes('Propostas na mesa'))throw new Error('sem a caixa de propostas');
  if(!html.includes('Anunciar')&&!html.includes('Retirar'))throw new Error('sem ação de anunciar');
  t.mercAba='jogadores';
});

/* ============================================================
   ORÇAMENTO DO CLUBE
   O dinheiro tem de ter para onde ir — senão o caixa de quem
   vence vira poça parada — sem que ninguém quebre no caminho.
   As duas coisas ao mesmo tempo, que é o pedido.
   ============================================================ */

await teste('o teto de folha desconta o custeio antes de liberar salário',async()=>{
  const time=t.G.times[t.G.meuTime];
  const livre=t.receitaLivre(time);
  if(!(livre>0&&livre<t.receitaAnual(time)))
    throw new Error('receita livre '+livre+' não está entre zero e a receita bruta');
  if(Math.abs(livre-(t.receitaAnual(time)-t.custeioAnual(time)))>1)
    throw new Error('receita livre não bate com receita menos custeio');
});

await teste('nenhum clube pode comprometer mais do que arrecada',async()=>{
  /* Se o teto passasse de 100% da receita livre, o clube fecharia o ano no
     vermelho tendo respeitado o próprio limite — e é isso que leva à falência,
     que é justamente o que não pode acontecer. */
  for(const id in t.G.times){
    const x=t.G.times[id];
    if(t.tetoFolhaDe(x)>1)
      throw new Error(x.nome+' pode comprometer '+(t.tetoFolhaDe(x)*100).toFixed(0)+'% da receita livre');
  }
  if(t.TETO_FOLHA_MAX>1)throw new Error('o teto máximo passou de 100% da receita livre');
});

await teste('caixa parado amplia o teto de folha',async()=>{
  const x=t.G.times[t.G.meuTime];
  const caixa=x.caixa;
  try{
    x.caixa=0;                     const pobre=t.tetoFolhaDe(x);
    x.caixa=t.receitaAnual(x)*8;   const rico =t.tetoFolhaDe(x);
    if(!(rico>pobre))throw new Error('reserva não virou teto: '+pobre.toFixed(2)+' → '+rico.toFixed(2));
    if(rico>t.TETO_FOLHA_MAX+1e-9)throw new Error('o teto passou do máximo');
  }finally{x.caixa=caixa;}
});

await teste('clube endividado aperta o cinto em vez de afundar',async()=>{
  const x=t.G.times[t.G.meuTime];
  const caixa=x.caixa;
  try{
    x.caixa=-500000;
    if(t.tetoFolhaDe(x)>=t.TETO_FOLHA)
      throw new Error('quem está no vermelho continua podendo gastar o mesmo — não há caminho de volta');
  }finally{x.caixa=caixa;}
});

await teste('a obra só sai se a operação sustentar o custo depois',async()=>{
  /* Clube pobre com caixa cheio não pode construir o que não consegue manter:
     é assim que ele quebra no ano seguinte. */
  const x=Object.values(t.G.times).filter(y=>y.tier===2)[0];
  const antes=JSON.stringify(x.estrutura), caixa=x.caixa;
  try{
    x.caixa=50000000;                       /* dinheiro de sobra */
    const salvos=x.elenco.map(i=>t.G.jogadores[i].salario);
    x.elenco.forEach(i=>{t.G.jogadores[i].salario=t.receitaAnual(x);});  /* folha impagável */
    const r=t.investirEstrutura(x);
    x.elenco.forEach((i,j)=>{t.G.jogadores[i].salario=salvos[j];});
    if(r)throw new Error('construiu mesmo sem conseguir manter: '+JSON.stringify(r));
    if(JSON.stringify(x.estrutura)!==antes)throw new Error('a estrutura foi alterada mesmo com a obra recusada');
  }finally{x.caixa=caixa;}
});

await teste('a obra sai quando o clube pode pagar, e cobra o preço da tabela',async()=>{
  const x=Object.values(t.G.times).find(y=>Object.values(y.estrutura).some(v=>v<t.ESTRUTURA_MAX));
  if(!x)return;
  const caixa=x.caixa, antes=JSON.stringify(x.estrutura);
  /* A obra exige margem depois de pronta, então o caso tem de montar um clube
     que realmente sustenta o custeio — dar caixa infinito não basta, e não
     bastar é justamente a regra que este arquivo cobra em outro caso. */
  const salarios=x.elenco.map(i=>t.G.jogadores[i].salario);
  try{
    x.caixa=50000000;
    x.elenco.forEach(i=>{t.G.jogadores[i].salario=1;});
    const r=t.investirEstrutura(x);
    if(!r)throw new Error('clube com caixa e folga não conseguiu construir nada');
    if(x.caixa!==50000000-r.custo)throw new Error('a obra não cobrou o preço da tabela');
    if(r.custo!==t.custoUpgrade(r.nivel-1))throw new Error('preço fora da tabela de custoUpgrade');
  }finally{x.caixa=caixa;x.estrutura=JSON.parse(antes);
    x.elenco.forEach((i,k)=>{t.G.jogadores[i].salario=salarios[k];});}
});

/* ============================================================
   ESCALA DA COMISSÃO
   O nível 1..5 é do MUNDO, não da divisão. Metade do mundo é
   Tier 2, então o ponto neutro mora embaixo da escala. O que não
   pode acontecer é o Tier 2 inteiro ficar abaixo do neutro:
   investir na comissão vira dinheiro jogado fora.
   ============================================================ */

await teste('a comissão de Tier 2 usa a faixa inteira da divisão',async()=>{
  /* Mede a RÉGUA, não o mundo. Depois de algumas temporadas o Challengers está
     cheio de clube rebaixado, que trouxe a comissão do Tier 1 junto — e isso
     está certo. O que se cobra aqui é o sorteio: com prestígio igual para todo
     mundo, a faixa empilhava no piso (62–73 de uma faixa que promete 62–78) e
     nenhum clube se distinguia. */
  const [lo,hi]=t.FAIXAS.comissao[2];
  const semente=t.semente;
  try{
    const overs=[];
    for(let k=0;k<=10;k++)for(let r=0;r<12;r++)
      overs.push(t.overAlvoPeso('comissao',2,k/10,3));
    const mn=Math.min(...overs), mx=Math.max(...overs);
    if(mn<lo||mx>hi)throw new Error('o sorteio vazou da faixa: '+mn+'–'+mx+' fora de '+lo+'–'+hi);
    if(mx<hi-2)throw new Error('empilhou no piso: teto sorteado '+mx+' de uma faixa que promete até '+hi);
    if(mn>lo+4)throw new Error('empilhou no teto: piso sorteado '+mn+' numa faixa que começa em '+lo);
  }finally{w.srand(semente);}
});

await teste('investir na comissão do Tier 2 passa do ponto neutro',async()=>{
  /* O topo da faixa da divisão, não o topo do que o mundo por acaso tem hoje:
     é a régua que decide se investir em comissão no Challengers compensa. */
  const teto=t.nivelStaff(t.FAIXAS.comissao[2][1]);
  if(teto<=t.NIVEL_NEUTRO)
    throw new Error('o melhor nível que a faixa do Tier 2 alcança é '+teto.toFixed(2)+
      ', e o neutro é '+t.NIVEL_NEUTRO+' — contratar o melhor da divisão ainda seria penalidade');
});

await teste('a escala continua sendo do mundo, não da divisão',async()=>{
  /* O teto da FAIXA do Tier 2 não pode valer mais que o piso da faixa do
     Tier 1: se valesse, subir de divisão não significaria comissão melhor.
     Comparar os clubes de hoje não mede isso — um rebaixado leva a comissão
     de elite junto, e continua sendo comissão de elite. */
  const tetoT2=t.nivelStaff(t.FAIXAS.comissao[2][1]);
  const pisoT1=t.nivelStaff(t.FAIXAS.comissao[1][0]);
  if(tetoT2>pisoT1)throw new Error('o teto do Tier 2 ('+tetoT2.toFixed(2)+
    ') passou o piso do Tier 1 ('+pisoT1.toFixed(2)+')');
  /* e a escala é monótona: over maior nunca dá nível menor */
  let ant=-1;
  for(let o=62;o<=99;o++){const n=t.nivelStaff(o);
    if(n<ant)throw new Error('a escala desceu em over '+o);ant=n;}
});

await teste('as três fórmulas de comissão usam o mesmo ponto neutro',async()=>{
  /* match.js zera em (1.1+0.9)*NIVEL_NEUTRO; clock.js usa (nivel-NIVEL_NEUTRO).
     Quando alguém mexe num e esquece do outro, uma divisão inteira sai do
     compasso sem ninguém notar — foi o que aconteceu com o 3 do clock.js. */
  const fontes=w.document.documentElement.innerHTML;
  if(/staff\.(fisio|mental)[^;]*-\s*3\)/.test(fontes))
    throw new Error('clock.js voltou a ter um 3 escrito à mão no lugar de NIVEL_NEUTRO');
  if(/staff\.analista\s*\*\s*\.?9\)\s*-\s*4/.test(fontes))
    throw new Error('match.js voltou a ter o -4 escrito à mão');
  if(/staff\.fisio\|\|3\)/.test(fontes))
    throw new Error('a lesão de partida voltou a usar 3 como neutro');
});

await teste('no Tier 2 quem tem mais torcida sustenta comissão melhor',async()=>{
  const t2=Object.values(t.G.times).filter(x=>x.tier===2)
    .map(x=>({torcida:x.torcida,peso:t.pesoComissao(x)}));
  const ord=[...t2].sort((a,b)=>b.torcida-a.torcida);
  if(!(ord[0].peso>ord[ord.length-1].peso))
    throw new Error('a torcida deixou de posicionar a comissão no Tier 2');
});

/* ============================================================
   MIGRAÇÃO DE SAVE
   Um save gravado antes de um sistema entrar não tem os campos
   dele. Se ninguém preenche na carga, o motor recebe undefined
   onde espera número — foi assim que a torcida virou NaN e
   contaminou o caixa. Estes casos abrem um save "velho" de
   verdade e conferem que ele volta inteiro.
   ============================================================ */

/* Um save v6: o estado atual sem nenhum campo que entrou depois. */
function saveVelho(){
  const reg=JSON.parse(JSON.stringify(t.empacotarRun('velho')));
  reg.versao=6;
  const g=reg.estado;
  delete g.h2h; delete g.manager; delete g.marcas; delete g.mapasAtivos;
  g.historico=(g.historico||[]).filter(h=>!h||!h.pre);
  for(const id in g.times){
    const x=g.times[id];
    delete x.torcida; delete x.patrocinios; delete x.patroc;
    delete x.titulos; delete x.legado; delete x.vices;
  }
  for(const id in g.jogadores){
    const y=g.jogadores[id];
    delete y.mapas; delete y.role2; delete y.roleAtual; delete y.pico;
  }
  return reg;
}
function comSaveVelho(fn){
  const antes=t.empacotarRun('atual');
  try{ return fn(); }
  finally{ t.desempacotarRun(JSON.parse(JSON.stringify(antes))); }
}

await teste('RUN_VERSAO acompanha os campos que existem',async()=>{
  if(t.RUN_VERSAO<7)throw new Error('a versão parou em '+t.RUN_VERSAO+
    ' enquanto manager, torcida, patrocínios, legado e mapas já existem');
});

await teste('save antigo carrega e sai com todos os campos',async()=>{
  comSaveVelho(()=>{
    const reg=saveVelho();
    if(!t.desempacotarRun(reg))throw new Error('desempacotarRun recusou o save');
    if(reg.versao!==t.RUN_VERSAO)throw new Error('a versão do registro não foi atualizada');
    const g=t.G;
    if(!g.h2h)throw new Error('h2h não nasceu');
    if(!g.marcas||!Object.keys(g.marcas).length)throw new Error('marcas não nasceram');
    if(!g.mapasAtivos||!g.mapasAtivos.length)throw new Error('mapasAtivos não nasceu');
    for(const id in g.times){
      const x=g.times[id];
      if(typeof x.torcida!=='number'||!isFinite(x.torcida))
        throw new Error(x.nome+' saiu da migração com torcida '+x.torcida);
      if(!x.patrocinios)throw new Error(x.nome+' sem quadro de patrocínio');
      if(!Array.isArray(x.titulos))throw new Error(x.nome+' sem lista de títulos');
    }
    for(const id in g.jogadores){
      const y=g.jogadores[id];
      if(!y.mapas)throw new Error(y.nome+' sem afinidade de mapa');
      if(!y.roleAtual)throw new Error(y.nome+' sem função atual');
      if(typeof y.pico!=='number'||!isFinite(y.pico))throw new Error(y.nome+' sem pico');
    }
  });
});

await teste('a torcida de um save antigo não vira NaN na virada',async()=>{
  comSaveVelho(()=>{
    t.desempacotarRun(saveVelho());
    for(const id in t.G.times){
      const x=t.G.times[id];
      const v=t.atualizarTorcida(x);
      if(!isFinite(v))throw new Error(x.nome+' virou NaN na primeira temporada');
      if(!isFinite(t.aporteLiga(x)))throw new Error(x.nome+': aporte da liga virou NaN');
      if(!isFinite(t.receitaAnual(x)))throw new Error(x.nome+': receita anual virou NaN');
    }
  });
});

await teste('carregar um save não mexe na sequência do sorteio',async()=>{
  /* A migração sorteia. Se sorteasse na sequência da própria run, todo o
     futuro dela mudaria só por ter sido carregada. */
  comSaveVelho(()=>{
    const reg=saveVelho();
    t.desempacotarRun(reg);
    if(t.semente!==(reg.semente||1))
      throw new Error('a semente saiu de '+(reg.semente||1)+' para '+t.semente);
  });
});

await teste('migrar duas vezes não duplica a história',async()=>{
  comSaveVelho(()=>{
    const reg=saveVelho();
    t.desempacotarRun(reg);
    const pre1=t.G.historico.filter(h=>h&&h.pre).length;
    const tit1=Object.values(t.G.times).reduce((s,x)=>s+(x.titulos||[]).length,0);
    t.migrarRun(reg);
    const pre2=t.G.historico.filter(h=>h&&h.pre).length;
    const tit2=Object.values(t.G.times).reduce((s,x)=>s+(x.titulos||[]).length,0);
    if(pre1!==pre2||tit1!==tit2)
      throw new Error('a segunda passagem somou história: '+pre1+'→'+pre2+', títulos '+tit1+'→'+tit2);
  });
});

await teste('migração preserva o que o save já tinha',async()=>{
  comSaveVelho(()=>{
    const reg=saveVelho();
    const id=Object.keys(reg.estado.times)[0];
    reg.estado.times[id].torcida=41;
    reg.estado.times[id].titulos=['2023 · Champions'];
    t.desempacotarRun(reg);
    if(t.G.times[id].torcida!==41)throw new Error('a torcida gravada foi sobrescrita');
    if(t.G.times[id].titulos.length!==1)throw new Error('a lista de títulos foi sobrescrita');
  });
});


/* ============================================================
   TREINO SEMANAL, ROTAÇÃO DE MAPAS E FAMILIARIDADE COM AGENTE
   O sistema mais novo do jogo e o que tinha zero casos aqui.
   Os três primeiros são regressões de bugs que já aconteceram.
   ============================================================ */

const meuTimeDeTeste=()=>t.G.times[t.G.meuTime]||t.G.times[Object.keys(t.G.times)[0]];

await teste('plano de treino não guarda jogador que saiu do elenco',async()=>{
  /* Regressão: o plano crescia sem parar — doze entradas para nove jogadores —
     e um id reaproveitado herdaria o plano de quem foi vendido. */
  const time=meuTimeDeTeste();
  const id=time.elenco[0];
  t.definirPlano(time,id,'atributo','mira');
  t.definirPlano(time,'fantasma_999','atributo','util');
  t.limparPlano(time);
  const pl=t.planoDe(time);
  if(pl.individual['fantasma_999'])throw new Error('entrada morta ficou no plano');
  if(!pl.individual[id])throw new Error('limpar apagou quem ainda está no elenco');
  for(const k in pl.individual)
    if(!time.elenco.includes(k))throw new Error('plano tem '+k+', que não está no elenco');
});

await teste('mapa que sai de rotação não continua no plano',async()=>{
  /* Regressão: o plano ficava apontando para um mapa morto e treinava o vazio
     em silêncio por semanas. */
  const time=meuTimeDeTeste();
  const ativo=t.G.mapasAtivos[0];
  t.definirMapaTreino(time,ativo);
  if(t.planoDe(time).mapa!==ativo)throw new Error('não aceitou um mapa ativo');
  const guarda=t.G.mapasAtivos.slice();
  t.G.mapasAtivos=guarda.filter(m=>m!==ativo);
  try{
    t.limparPlano(time);
    if(t.planoDe(time).mapa)throw new Error('ficou com mapa morto: '+t.planoDe(time).mapa);
  }finally{ t.G.mapasAtivos=guarda; }
});

await teste('plano não aceita atributo nem agente inexistente',async()=>{
  /* Regressão: definirPlano aceitava qualquer string e treinarAgente criava um
     boneco fantasma na ficha do jogador. */
  const time=meuTimeDeTeste();
  const id=time.elenco[0];
  const p=t.G.jogadores[id];
  t.definirPlano(time,id,'atributo','mira');
  t.definirPlano(time,id,'agente','Bonecodenada');
  const pl=t.planoDe(time).individual[id];
  if(pl.tipo==='agente')throw new Error('aceitou um agente que não existe');
  t.definirPlano(time,id,'atributo','atributoQueNaoExiste');
  if(t.planoDe(time).individual[id].alvo==='atributoQueNaoExiste')
    throw new Error('aceitou um atributo que não existe');
  t.treinarAgente(p,'Bonecodenada',10);
  if(p.agenteNivel&&p.agenteNivel['Bonecodenada']!==undefined)
    throw new Error('treinar o inexistente criou nível fantasma');
});

await teste('definir mapa fora da rotação não vale',async()=>{
  const time=meuTimeDeTeste();
  const fora=t.MAP_POOL.find(m=>!t.mapaAtivo(m));
  t.definirMapaTreino(time,fora||'MapaQueNaoExiste');
  if(t.planoDe(time).mapa)throw new Error('aceitou mapa fora do pool ativo');
});

await teste('pool ativo tem o tamanho da rotação e sai do pool real',async()=>{
  const ativos=t.G.mapasAtivos;
  if(ativos.length!==t.MAPAS_ATIVOS)
    throw new Error('pool com '+ativos.length+' mapas, esperado '+t.MAPAS_ATIVOS);
  if(new Set(ativos).size!==ativos.length)throw new Error('mapa repetido no pool ativo');
  for(const m of ativos)
    if(!t.MAP_POOL.includes(m))throw new Error(m+' não é um mapa do jogo');
});

await teste('rotação troca mapas sem furar o tamanho do pool',async()=>{
  const guardaPool=t.G.mapasAtivos.slice();
  const guardaDesde=Object.assign({},t.G.mapaDesde);
  const guardaSem=t.semente;
  try{
    const antes=t.G.mapasAtivos.slice();
    t.rotacionarMapas('teste');
    const depois=t.G.mapasAtivos;
    if(depois.length!==t.MAPAS_ATIVOS)
      throw new Error('depois da rotação o pool tem '+depois.length);
    if(new Set(depois).size!==depois.length)throw new Error('rotação repetiu mapa');
    const trocou=antes.filter(m=>!depois.includes(m)).length;
    if(trocou===0)throw new Error('a rotação não trocou nada');
    for(const m of depois)
      if(!t.MAP_POOL.includes(m))throw new Error(m+' não é um mapa do jogo');
  }finally{
    t.G.mapasAtivos=guardaPool;t.G.mapaDesde=guardaDesde;
  }
});

await teste('rotação limpa o mapa de treino de todos os clubes',async()=>{
  const guardaPool=t.G.mapasAtivos.slice();
  const guardaDesde=Object.assign({},t.G.mapaDesde);
  const planos={};
  for(const id in t.G.times)planos[id]=Object.assign({},t.planoDe(t.G.times[id]));
  try{
    for(const id in t.G.times)t.definirMapaTreino(t.G.times[id],t.G.mapasAtivos[0]);
    t.rotacionarMapas('teste');
    for(const id in t.G.times){
      const m=t.planoDe(t.G.times[id]).mapa;
      if(m&&!t.mapaAtivo(m))
        throw new Error(t.G.times[id].nome+' ficou treinando '+m+', que saiu de rotação');
    }
  }finally{
    t.G.mapasAtivos=guardaPool;t.G.mapaDesde=guardaDesde;
    for(const id in t.G.times)if(planos[id])t.G.times[id].treino=planos[id];
  }
});

await teste('a IA não treina sempre o mesmo mapa, nem sempre o pior',async()=>{
  /* Treinar SEMPRE o pior mapa parecia sensato e homogeneizava o mundo: em uma
     temporada todo clube ficava bom em tudo e o veto perdia conteúdo. */
  const outro=Object.values(t.G.times).find(x=>x.id!==t.G.meuTime);
  const guardaSemana=t.G.semana;
  try{
    const escolhas=new Set();
    for(let s=1;s<=8;s++){t.G.semana=s;escolhas.add(t.mapaDaSemanaIA(outro));}
    if(escolhas.size<2)throw new Error('a IA escolheu sempre o mesmo mapa em 8 semanas');
    const pior=(t.G.mapasAtivos||[]).slice()
      .sort((a,b)=>t.afinidadeElenco(outro,a)-t.afinidadeElenco(outro,b))[0];
    let vezesNoPior=0;
    for(let s=1;s<=8;s++){t.G.semana=s;if(t.mapaDaSemanaIA(outro)===pior)vezesNoPior++;}
    if(vezesNoPior>=7)throw new Error('a IA passou '+vezesNoPior+' de 8 semanas no pior mapa');
    for(let s=1;s<=8;s++){t.G.semana=s;
      const esc=t.mapaDaSemanaIA(outro);
      if(esc&&!t.mapaAtivo(esc))throw new Error('a IA escolheu '+esc+', fora de rotação');}
  }finally{ t.G.semana=guardaSemana; }
});

await teste('treinar mapa não infla o pool inteiro',async()=>{
  /* Sem teto na média, o treino era ganho líquido toda semana e o clube subia
     todos os mapas junto — bom em tudo é o mesmo que bom em nada para o veto. */
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify({tr:time.treino,js:time.elenco.map(i=>t.G.jogadores[i])}));
  try{
    const pool=t.G.mapasAtivos;
    for(const id of time.elenco){
      const p=t.G.jogadores[id];
      if(!p.mapas)p.mapas={};
      for(const mp of pool)p.mapas[mp]=6;      /* bom em tudo, de propósito */
    }
    const antes=pool.reduce((s,mp)=>s+t.afinidadeElenco(time,mp),0)/pool.length;
    for(let s=0;s<10;s++){t.definirMapaTreino(time,pool[s%pool.length]);t.aplicarTreinoSemanal(time);}
    const depois=pool.reduce((s,mp)=>s+t.afinidadeElenco(time,mp),0)/pool.length;
    if(!(depois<antes))
      throw new Error('a média do pool foi de '+antes.toFixed(2)+' para '+depois.toFixed(2)+' — o pool infla');
    for(const id of time.elenco){
      const p=t.G.jogadores[id];
      for(const mp in p.mapas)
        if(!(p.mapas[mp]>=-8&&p.mapas[mp]<=8))throw new Error('afinidade fora de faixa: '+mp+'='+p.mapas[mp]);
    }
  }finally{
    time.treino=foto.tr;
    foto.js.forEach(j=>Object.assign(t.G.jogadores[j.id],j));
  }
});

await teste('nível de agente é leitura pura — não sorteia nem cria',async()=>{
  /* A tela de Treino pergunta o nível de todo agente de todo jogador. Se a
     pergunta sorteasse, desenhar a tela mudaria o futuro da simulação. */
  const p=t.G.jogadores[meuTimeDeTeste().elenco[0]];
  const sem=t.semente;
  const chaves=Object.keys(p.agenteNivel||{}).length;
  for(const fun in t.AGENTS)for(const ag of t.AGENTS[fun])t.nivelAgente(p,ag);
  if(t.semente!==sem)throw new Error('ler o nível mexeu na semente');
  if(Object.keys(p.agenteNivel||{}).length!==chaves)
    throw new Error('ler o nível criou chave nova na ficha');
});

await teste('todo jogador nasce com familiaridade nos próprios mains',async()=>{
  /* Checa a FICHA, não o nivelAgente: ele devolve 78 de cortesia para um main
     sem entrada, e essa cortesia escondia mains realmente sem familiaridade —
     era o que acontecia quando a padronização trocava os mains sem re-semear. */
  let semNivel=0,fora=0,acimaTeto=0;
  for(const id in t.G.jogadores){
    const p=t.G.jogadores[id];
    if(!p.agenteNivel){semNivel+=(p.agentes||[]).length;continue;}
    for(const ag of (p.agentes||[])){
      const n=p.agenteNivel[ag];
      if(typeof n!=='number'||!(n>0)){semNivel++;continue;}
      if(n<0||n>100)fora++;
    }
  }
  if(semNivel)throw new Error(semNivel+' main(s) sem familiaridade na ficha');
  if(fora)throw new Error(fora+' nível(is) fora de 0–100');
});

await teste('familiaridade nasce dentro do teto da função',async()=>{
  /* Medido no NASCIMENTO, não no mundo rodado: um veterano em declínio perde
     atributo e o teto desce, mas ele não desaprende o boneco da carreira dele —
     ficar acima do teto depois de anos é a regra funcionando, não um furo.
     O que era furo era nascer acima: metade do mundo começava assim. */
  const guarda=t.semente;
  try{
    let acima=0,conta=0;
    for(const id in t.G.jogadores){
      const p=t.G.jogadores[id];
      const foto=Object.assign({},p.agenteNivel);
      t.semearAgentes(p);
      for(const ag of (p.agentes||[])){
        conta++;
        if(p.agenteNivel[ag]>t.tetoAgente(p,ag)+0.01)acima++;
      }
      p.agenteNivel=foto;
    }
    if(!conta)throw new Error('nenhum main para medir');
    if(acima)throw new Error(acima+' de '+conta+' mains nasceram acima do próprio teto');
  }finally{ t.semente=guarda; }
});

await teste('familiaridade sobe com treino e respeita o teto da função',async()=>{
  const p=t.G.jogadores[meuTimeDeTeste().elenco[0]];
  const foto=Object.assign({},p.agenteNivel);
  try{
    const meu=(p.agentes||[])[0];
    if(!meu)return;
    const antes=t.nivelAgente(p,meu);
    for(let i=0;i<200;i++)t.treinarAgente(p,meu,6);
    const depois=t.nivelAgente(p,meu);
    if(!(depois>=antes))throw new Error('treinar baixou o nível: '+antes+'→'+depois);
    const teto=t.tetoAgente(p,meu);
    if(depois>teto+0.01)throw new Error('passou do teto: '+depois.toFixed(1)+' > '+teto.toFixed(1));
  }finally{ p.agenteNivel=foto; }
});

await teste('o MESMO agente tem teto menor para quem está fora da função',async()=>{
  /* É o que faz "ir contra o meta" custar: o jogador aprende, mas não chega
     onde chegaria no papel dele.

     A primeira versão comparava um agente da função dele contra um agente de
     OUTRA função, e falhava com razão: o teto também depende da aptidão, e um
     jogador cujos atributos servem melhor a outra função pode ter teto maior
     fora do papel dele. Isso é a fórmula funcionando, não a regra quebrando.
     Para medir a REGRA é preciso fixar o agente e mudar só a função. */
  const p=t.G.jogadores[meuTimeDeTeste().elenco[0]];
  const papelAntes=p.role;
  try{
    const ag=(t.AGENTS[papelAntes]||[])[0];
    if(!ag)return;
    const dentro=t.tetoAgente(p,ag);
    const outra=Object.keys(t.AGENTS).find(f=>f!==papelAntes&&f!=='Flex');
    p.role=outra;
    const fora=t.tetoAgente(p,ag);
    if(!(dentro>fora))
      throw new Error('mesmo agente: teto dentro da função ('+dentro.toFixed(1)+
                      ') não é maior que fora dela ('+fora.toFixed(1)+')');
  }finally{ p.role=papelAntes; }
});

await teste('semana de treino não deixa nada fora de faixa',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify({tr:time.treino,js:time.elenco.map(i=>t.G.jogadores[i])}));
  try{
    time.elenco.forEach((id,i)=>{
      const tipo=['atributo','agente','descanso'][i%3];
      const p=t.G.jogadores[id];
      const alvo=tipo==='atributo'?'mira':(tipo==='agente'?(p.agentes||[])[0]:null);
      if(tipo!=='agente'||alvo)t.definirPlano(time,id,tipo,alvo);
    });
    t.definirMapaTreino(time,t.G.mapasAtivos[0]);
    for(let s=0;s<8;s++)t.aplicarTreinoSemanal(time);
    for(const id of time.elenco){
      const p=t.G.jogadores[id];
      if(!(p.fadiga>=0&&p.fadiga<=1))throw new Error(p.nome+': fadiga '+p.fadiga);
      for(const m in p.mapas)
        if(!(p.mapas[m]>=-8&&p.mapas[m]<=8))throw new Error(p.nome+': afinidade '+m+'='+p.mapas[m]);
      for(const ag in (p.agenteNivel||{}))
        if(!(p.agenteNivel[ag]>=0&&p.agenteNivel[ag]<=100))
          throw new Error(p.nome+': nível de '+ag+'='+p.agenteNivel[ag]);
      for(const a of t.ATTRS)
        if(!isFinite(p.at[a[0]]))throw new Error(p.nome+': atributo '+a[0]+' virou '+p.at[a[0]]);
    }
  }finally{
    time.treino=foto.tr;
    foto.js.forEach(j=>Object.assign(t.G.jogadores[j.id],j));
  }
});

await teste('treinar um mapa sobe a afinidade nele mais que nos outros',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify({tr:time.treino,js:time.elenco.map(i=>t.G.jogadores[i])}));
  try{
    const mapa=t.G.mapasAtivos[0];
    const outro=t.G.mapasAtivos[1];
    t.definirMapaTreino(time,mapa);
    const antesA=time.elenco.reduce((s,i)=>s+t.afinidadeDe(t.G.jogadores[i],mapa),0);
    const antesB=time.elenco.reduce((s,i)=>s+t.afinidadeDe(t.G.jogadores[i],outro),0);
    for(let s=0;s<6;s++)t.aplicarTreinoSemanal(time);
    const depA=time.elenco.reduce((s,i)=>s+t.afinidadeDe(t.G.jogadores[i],mapa),0);
    const depB=time.elenco.reduce((s,i)=>s+t.afinidadeDe(t.G.jogadores[i],outro),0);
    if(!(depA-antesA>depB-antesB))
      throw new Error('treinado subiu '+(depA-antesA).toFixed(2)+' e abandonado '+(depB-antesB).toFixed(2));
  }finally{
    time.treino=foto.tr;
    foto.js.forEach(j=>Object.assign(t.G.jogadores[j.id],j));
  }
});

await teste('descansar baixa a fadiga e treinar sobe',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify({tr:time.treino,js:time.elenco.map(i=>t.G.jogadores[i])}));
  try{
    const id=time.titulares&&time.titulares.length?time.titulares[0]:time.elenco[0];
    const p=t.G.jogadores[id];
    p.fadiga=0.5;
    t.definirPlano(time,id,'descanso',null);
    for(let s=0;s<4;s++)t.desenvolver(p,time);
    const descansado=p.fadiga;
    p.fadiga=0.5;
    t.definirPlano(time,id,'atributo','mira');
    for(let s=0;s<4;s++)t.desenvolver(p,time);
    const treinado=p.fadiga;
    if(!(descansado<treinado))
      throw new Error('descansar ('+descansado.toFixed(3)+') não cansa menos que treinar ('+treinado.toFixed(3)+')');
  }finally{
    time.treino=foto.tr;
    foto.js.forEach(j=>Object.assign(t.G.jogadores[j.id],j));
  }
});

await teste('quem descansa não ganha atributo na semana',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify({tr:time.treino,js:time.elenco.map(i=>t.G.jogadores[i])}));
  try{
    const id=time.elenco[0];
    const p=t.G.jogadores[id];
    t.definirPlano(time,id,'descanso',null);
    const antes=t.ATTRS.reduce((s,a)=>s+p.at[a[0]],0);
    for(let s=0;s<20;s++)t.desenvolver(p,time);
    const depois=t.ATTRS.reduce((s,a)=>s+p.at[a[0]],0);
    if(depois>antes)throw new Error('descansando ganhou '+(depois-antes)+' de atributo');
  }finally{
    time.treino=foto.tr;
    foto.js.forEach(j=>Object.assign(t.G.jogadores[j.id],j));
  }
});

await teste('a IA escolhe plano para todo clube que não é o meu',async()=>{
  const guarda={};
  for(const id in t.G.times)guarda[id]=JSON.parse(JSON.stringify(t.planoDe(t.G.times[id])));
  try{
    let semPlano=0;
    for(const id in t.G.times){
      const x=t.G.times[id];
      if(x.id===t.G.meuTime)continue;
      t.planoIA(x);
      const pl=t.planoDe(x);
      if(!Object.keys(pl.individual).length)semPlano++;
      if(pl.mapa&&!t.mapaAtivo(pl.mapa))
        throw new Error(x.nome+': a IA escolheu '+pl.mapa+', fora de rotação');
      for(const k in pl.individual)
        if(!x.elenco.includes(k))throw new Error(x.nome+': a IA planejou para '+k+', que não é do elenco');
    }
    if(semPlano)throw new Error(semPlano+' clube(s) da IA ficaram sem plano');
  }finally{
    for(const id in t.G.times)t.G.times[id].treino=guarda[id];
  }
});

await teste('a IA não sobrescreve o plano que eu escolhi',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(t.planoDe(time)));
  try{
    const id=time.elenco[0];
    const antesMeu=t.G.meuTime;
    t.G.meuTime=time.id;
    t.definirPlano(time,id,'descanso',null);
    t.definirMapaTreino(time,t.G.mapasAtivos[2]);
    t.planoIA(time);
    const pl=t.planoDe(time);
    t.G.meuTime=antesMeu;
    if(pl.individual[id].tipo!=='descanso')throw new Error('a IA trocou meu plano individual');
    if(pl.mapa!==t.G.mapasAtivos[2])throw new Error('a IA trocou meu mapa de treino');
  }finally{ time.treino=foto; }
});

await teste('o plano de treino e a familiaridade sobrevivem ao save',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(t.planoDe(time)));
  try{
    const id=time.elenco[0], id2=time.elenco[1];
    const ag=(t.G.jogadores[id].agentes||[])[0];
    if(ag)t.definirPlano(time,id,'agente',ag);
    t.definirPlano(time,id2,'descanso',null);
    t.definirMapaTreino(time,t.G.mapasAtivos[3]);
    const mapa=t.planoDe(time).mapa;
    const niv=Object.assign({},t.G.jogadores[id].agenteNivel);
    const ativos=t.G.mapasAtivos.slice();
    const reg=JSON.parse(JSON.stringify(t.empacotarRun()));
    t.desempacotarRun(reg);
    const pl=t.planoDe(t.G.times[time.id]);
    if(pl.mapa!==mapa)throw new Error('o mapa de treino virou '+pl.mapa+' depois de carregar');
    if(ag&&(!pl.individual[id]||pl.individual[id].tipo!=='agente'))
      throw new Error('o treino de agente não sobreviveu ao save');
    if(!pl.individual[id2]||pl.individual[id2].tipo!=='descanso')
      throw new Error('o descanso não sobreviveu ao save');
    const dep=t.G.jogadores[id].agenteNivel||{};
    for(const k in niv)if(Math.abs((dep[k]||0)-niv[k])>0.001)
      throw new Error('a familiaridade com '+k+' virou '+dep[k]+' (era '+niv[k]+')');
    if(JSON.stringify(t.G.mapasAtivos)!==JSON.stringify(ativos))
      throw new Error('o pool ativo mudou ao carregar');
  }finally{ t.G.times[time.id].treino=foto; }
});

await teste('a tela de Treino desenha e responde ao clique',async()=>{
  t.modo='menu';t.telaMenu='treino';
  w.render&&w.render();
  const txt=corpo()?corpo().textContent:'';
  if(!txt||txt.length<40)throw new Error('a tela de Treino saiu vazia');
  const sem=t.semente;
  w.render&&w.render();
  if(t.semente!==sem)throw new Error('desenhar a tela de Treino mexeu na semente');
  const cartoes=$$('#menuCorpo [data-mapa],#view [data-mapa]');
  if(cartoes.length){
    clicar(cartoes[0]);
    if(!corpo().textContent.length)throw new Error('clicar no mapa esvaziou a tela');
  }
  const sels=$$('#menuCorpo select,#view select');
  for(const s of sels.slice(0,6)){
    const ops=[...s.options];
    if(ops.length<2)continue;
    s.value=ops[ops.length-1].value;
    disparar(s,'change');
  }
  const time=meuTimeDeTeste();
  for(const k in t.planoDe(time).individual)
    if(!time.elenco.includes(k))throw new Error('a tela criou plano para '+k+', fora do elenco');
});

await teste('apagar na base não deixa proposta nem plano pendurado',async()=>{
  /* Apagar no Banco de dados no meio da temporada deixava uma proposta de
     compra apontando para um jogador que não existe mais, e a entrada dele no
     plano de treino do clube. */
  const time=meuTimeDeTeste();
  const r=t.edCriarJogador(time.id,{over:70,idade:22});
  if(!r.ok)return;   /* elenco cheio: nada a testar aqui */
  const pid=time.elenco[time.elenco.length-1];
  t.definirPlano(time,pid,'atributo','mira');
  t.G.propostas=t.G.propostas||[];
  t.G.propostas.push({id:'pr_teste_'+pid,jogadorId:pid,clubeId:Object.keys(t.G.times)[1],
                      tipo:'compra',valor:100,prazo:3});
  const anteriorIgl=time.igl;
  time.igl=pid;
  t.edApagar(pid);
  if((t.G.propostas||[]).some(x=>x.jogadorId===pid))
    throw new Error('sobrou proposta apontando para o jogador apagado');
  if(t.planoDe(time).individual[pid])
    throw new Error('o plano de treino ficou com o jogador apagado');
  if(time.igl===pid)throw new Error('o IGL do clube é o jogador apagado');
  if(!time.igl)time.igl=anteriorIgl;
  if(time.elenco.includes(pid))throw new Error('o apagado continua no elenco');
  if((time.titulares||[]).includes(pid))throw new Error('o apagado continua titular');
  t.G.propostas=(t.G.propostas||[]).filter(x=>!String(x.id).startsWith('pr_teste_'));
});

await teste('botão de um render antigo não derruba o jogo',async()=>{
  /* O formulário do clube lia v.querySelector('#edNome').value sem conferir se
     o campo estava na tela. Um botão que ficou de um render anterior continua
     clicável e estourava em cima de null. */
  t.modo='jogo';t.tela='editor';
  w.render&&w.render();
  const antigos=$$('#view button').slice(0,10);
  t.tela='elenco';
  w.render&&w.render();
  for(const b of antigos){
    const txt=(b.textContent||'').toLowerCase();
    if(/excluir|apagar|nova run|carregar|importar|substituir/.test(txt))continue;
    clicar(b);   /* solto no ar: não pode estourar */
  }
  if(!$('#view'))throw new Error('a tela desapareceu');
});

await teste('quem sai do clube sai do plano na hora, não na semana seguinte',async()=>{
  /* liberar() e contratar() tiravam o jogador do elenco e deixavam a linha dele
     no plano até o próximo aplicarTreinoSemanal. Com 57 clubes vendendo por
     dinheiro na virada, o mundo inteiro ficava com plano de gente que saiu — e
     a sua tela de Treino listava o nome de quem já não era seu. */
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(t.planoDe(time)));
  const r=t.edCriarJogador(time.id,{over:66,idade:23});
  try{
    if(!r.ok)return;
    const pid=time.elenco[time.elenco.length-1];
    t.definirPlano(time,pid,'atributo','mira');
    t.liberar(t.G.jogadores[pid]);
    if(t.planoDe(time).individual[pid])
      throw new Error('liberar deixou o jogador no plano de treino');
    const destino=Object.values(t.G.times).find(x=>x.id!==time.id&&x.elenco.length<t.ELENCO_MAX);
    if(destino){
      t.contratar(t.G.jogadores[pid],destino,2,t.G.jogadores[pid].salario);
      t.definirPlano(destino,pid,'atributo','mira');
      const volta=Object.values(t.G.times).find(x=>x.id!==destino.id&&x.elenco.length<t.ELENCO_MAX);
      if(volta){
        t.contratar(t.G.jogadores[pid],volta,2,t.G.jogadores[pid].salario);
        if(t.planoDe(destino).individual[pid])
          throw new Error('contratar deixou o jogador no plano do clube de origem');
      }
    }
  }finally{ time.treino=foto; }
});

await teste('jogador que deixa de existir não fica pendurado em nada',async()=>{
  /* Aposentadoria e poda do mercado apagavam o jogador direto, sem limpar
     proposta, plano nem crachá de IGL. */
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(t.planoDe(time)));
  const r=t.edCriarJogador(time.id,{over:66,idade:34});
  try{
    if(!r.ok)return;
    const pid=time.elenco[time.elenco.length-1];
    t.definirPlano(time,pid,'atributo','mira');
    t.G.propostas=t.G.propostas||[];
    t.G.propostas.push({id:'pr_apos_'+pid,jogadorId:pid,clubeId:Object.keys(t.G.times)[1],
                        tipo:'compra',valor:100,prazo:3});
    const iglAntes=time.igl;
    time.igl=pid;
    t.esquecerJogador(pid);
    if((t.G.propostas||[]).some(x=>x.jogadorId===pid))throw new Error('sobrou proposta pelo jogador');
    if(t.planoDe(time).individual[pid])throw new Error('sobrou plano de treino do jogador');
    if(time.igl===pid)throw new Error('o crachá de IGL ficou pendurado nele');
    if(!time.igl)time.igl=iglAntes;
    t.edApagar(pid);
  }finally{
    time.treino=foto;
    t.G.propostas=(t.G.propostas||[]).filter(x=>!String(x.id).startsWith('pr_apos_'));
  }
});


/* ============================================================
   META DE AGENTES, COMPS, SCOUTING, VETO, TEMPO E CONVERSA
   ============================================================ */

await teste('o meta nasce da taxa de escolha real de 2026',async()=>{
  const m=t.metaInicial();
  if(Object.keys(m).length<20)
    throw new Error('o meta nasceu com '+Object.keys(m).length+' agentes — a colisão de nome voltou');
  const pares=Object.entries(t.AGENT_PICK_2026).sort((a,b)=>b[1]-a[1]);
  const maisPego=pares[0][0], menosPego=pares[pares.length-1][0];
  if(!(m[maisPego]>m[menosPego]))
    throw new Error(maisPego+' ('+t.AGENT_PICK_2026[maisPego]+'% no vlr) não nasceu acima de '+menosPego);
  for(const a of t.nomesDeAgentes())
    if(!(m[a]>=20&&m[a]<=95))throw new Error(a+' nasceu com força '+m[a]);
});

await teste('o patch destrona em vez de achatar tudo em 50',async()=>{
  /* Com nerf no topo e buff na cauda, o desvio da força do meta caía de 11
     para 2,9 em três anos: todo agente virava 50 e o meta deixava de existir. */
  const guarda=JSON.parse(JSON.stringify(t.G.meta||{}));
  const guardaP=(t.G.patches||[]).slice();
  const sem=t.semente;
  try{
    t.G.meta=t.metaInicial();
    const dp=()=>{const v=Object.values(t.G.meta);
      const md=v.reduce((s,x)=>s+x,0)/v.length;
      return Math.sqrt(v.reduce((s,x)=>s+(x-md)**2,0)/v.length);};
    const antes=dp();
    const topoAntes=t.nomesDeAgentes().slice().sort((a,b)=>t.forcaMeta(b)-t.forcaMeta(a))[0];
    for(let i=0;i<12;i++)t.aplicarPatch('teste');
    const depois=dp();
    if(depois<antes*0.35)
      throw new Error('o meta achatou: desvio '+antes.toFixed(1)+' → '+depois.toFixed(1));
    const topoDepois=t.nomesDeAgentes().slice().sort((a,b)=>t.forcaMeta(b)-t.forcaMeta(a))[0];
    if(topoDepois===topoAntes)
      throw new Error('doze patches e a coroa não trocou de cabeça ('+topoAntes+')');
  }finally{ t.G.meta=guarda;t.G.patches=guardaP;t.semente=sem; }
});

await teste('a comp muda de mapa para mapa',async()=>{
  /* A primeira versão escolhia agente sem olhar o mapa, e o relatório de
     scouting mostrava literalmente a mesma comp oito vezes. */
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(time.comps||{}));
  try{
    /* Só dá para exigir variação entre mapas cujo pendor o jogo CONHECE: o
       viés de lado é dado real (MAPA_ATK) e cobre os oito mapas do pool de
       2026. Mapa que entrou por rotação e não está na tabela vale neutro, e
       neutro contra neutro monta a mesma comp — o que é honesto, e não bug. */
    const pool=(t.G.mapasAtivos||[]).filter(mp=>t.MAPA_ATK[mp]!==undefined);
    if(pool.length<2)throw new Error('nenhum par de mapas com dado de lado para comparar');
    const pendores=new Set(pool.map(mp=>t.pendorDoMapa(mp).toFixed(2)));
    if(pendores.size<2)throw new Error('os mapas do pool têm todos o mesmo pendor');
    const assinaturas=new Set();
    for(const mp of pool){
      t.aplicarPreset(time,mp,'melhor');
      assinaturas.add(t.compEscalada(time,mp).map(l=>l.ag).join('|'));
    }
    if(assinaturas.size<2)
      throw new Error('a mesma comp nos '+pool.length+' mapas com pendor diferente');
  }finally{ time.comps=foto; }
});

await teste('o preset Melhor não monta comp com buraco',async()=>{
  /* Escolher jogador a jogador é guloso: cinco escolhas boas montavam comp sem
     iniciador, e o buraco custa mais que os cinco ganhos somados. */
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(time.comps||{}));
  try{
    for(const mp of t.G.mapasAtivos){
      t.aplicarPreset(time,mp,'melhor');
      const funs={};
      t.compEscalada(time,mp).forEach(l=>{funs[l.fun]=(funs[l.fun]||0)+1;});
      if(!((funs['Controlador']||0)+(funs['Flex']||0)))
        throw new Error(mp+': comp sem controlador');
      if(!(funs['Iniciador']||0))throw new Error(mp+': comp sem iniciador');
      const melhor=t.pesoComp(time,mp);
      t.aplicarPreset(time,mp,'conforto');
      const conforto=t.pesoComp(time,mp);
      t.aplicarPreset(time,mp,'melhor');
      if(melhor<conforto-0.01)
        throw new Error(mp+': o preset Melhor ('+melhor.toFixed(2)+') saiu pior que o Conforto ('+conforto.toFixed(2)+')');
    }
  }finally{ time.comps=foto; }
});

await teste('escalar agente que ninguém treinou custa força',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(time.comps||{}));
  try{
    const mp=t.G.mapasAtivos[0];
    t.aplicarPreset(time,mp,'conforto');
    const bom=t.pesoComp(time,mp);
    for(const id of time.titulares){
      const p=t.G.jogadores[id];
      const pool=t.agentesDe(p.roleAtual||p.role)||[];
      const pior=pool.slice().sort((a,b)=>t.nivelAgente(p,a)-t.nivelAgente(p,b))[0];
      if(pior)t.definirAgente(time,mp,id,pior);
    }
    const ruim=t.pesoComp(time,mp);
    if(!(ruim<bom))throw new Error('comp de desconhecidos ('+ruim.toFixed(2)+') não é pior que a de mains ('+bom.toFixed(2)+')');
  }finally{ time.comps=foto; }
});

await teste('fugir do meta aumenta a surpresa',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(time.comps||{}));
  try{
    const mp=t.G.mapasAtivos[0];
    t.aplicarPreset(time,mp,'meta');
    const sMeta=t.surpresaDaComp(time,mp);
    t.aplicarPreset(time,mp,'contra');
    const sContra=t.surpresaDaComp(time,mp);
    if(!(sContra>sMeta))
      throw new Error('contra o meta ('+sContra.toFixed(2)+') não surpreende mais que o meta ('+sMeta.toFixed(2)+')');
    if(sContra>1||sMeta<0)throw new Error('surpresa fora de 0 a 1');
  }finally{ time.comps=foto; }
});

await teste('comp perde jogador que saiu e mapa que saiu de rotação',async()=>{
  const time=meuTimeDeTeste();
  const foto=JSON.parse(JSON.stringify(time.comps||{}));
  const guardaPool=t.G.mapasAtivos.slice();
  try{
    const mp=t.G.mapasAtivos[0];
    t.aplicarPreset(time,mp,'melhor');
    t.compDe(time,mp)['fantasma_1']='Omen';
    t.limparComps(time);
    if(t.compDe(time,mp)['fantasma_1'])throw new Error('comp ficou com jogador que não é do elenco');
    t.G.mapasAtivos=guardaPool.filter(x=>x!==mp);
    t.limparComps(time);
    if(time.comps[mp])throw new Error('comp ficou apontando para mapa fora de rotação');
  }finally{ t.G.mapasAtivos=guardaPool;time.comps=foto; }
});

await teste('o relatório não vaza o que o nível não paga',async()=>{
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id);
  const a=time.staff.analista, o=time.staff.olheiro;
  try{
    for(let nv=1;nv<=t.SCOUT_MAX;nv++){
      time.staff.analista=nv;time.staff.olheiro=nv;
      const sem=t.semente;
      const r=t.relatorioScout(time,adv,3);
      if(t.semente!==sem)throw new Error('montar o relatório mexeu na semente');
      if(r.nivel!==nv)throw new Error('pedi nível '+nv+' e veio '+r.nivel);
      if(nv<3&&r.mapas.some(m=>m.valor!==null))throw new Error('nível '+nv+' vazou número de mapa');
      if(nv<3&&r.chave)throw new Error('nível '+nv+' vazou o jogador-chave');
      if(nv<4&&r.tatica)throw new Error('nível '+nv+' vazou a tática deles');
      if(nv<5&&r.vetoProvavel)throw new Error('nível '+nv+' vazou o veto provável');
      if(nv>=5&&!r.vetoProvavel)throw new Error('nível 5 não trouxe o veto provável');
      if(!t.resumoScout(r))throw new Error('nível '+nv+' ficou sem resumo em português');
    }
  }finally{ time.staff.analista=a;time.staff.olheiro=o; }
});

await teste('o mesmo relatório lido duas vezes dá o mesmo número',async()=>{
  /* O borrão do nível baixo é determinístico de propósito: se sorteasse,
     reabrir a tela mudaria a leitura e o número não valeria nada. */
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id);
  const a=time.staff.analista;
  try{
    time.staff.analista=3;
    const r1=t.relatorioScout(time,adv,3), r2=t.relatorioScout(time,adv,3);
    if(JSON.stringify(r1.mapas.map(m=>m.valor))!==JSON.stringify(r2.mapas.map(m=>m.valor)))
      throw new Error('duas leituras, dois números');
  }finally{ time.staff.analista=a; }
});

await teste('comissão melhor entrega relatório mais detalhado',async()=>{
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id);
  const a=time.staff.analista, o=time.staff.olheiro;
  try{
    time.staff.analista=1;time.staff.olheiro=1;
    const pobre=t.nivelScout(time);
    time.staff.analista=5;time.staff.olheiro=5;
    const rico=t.nivelScout(time);
    if(!(rico>pobre))throw new Error('comissão 5 ('+rico+') não lê mais que comissão 1 ('+pobre+')');
  }finally{ time.staff.analista=a;time.staff.olheiro=o; }
});

await teste('o veto segue o formato do circuito em Bo1, Bo3 e Bo5',async()=>{
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id);
  const pool=(t.G.mapasAtivos||[]).length;
  for(const bo of [1,3,5]){
    const sem=t.semente;
    const V=t.iniciarVeto(time.id,adv.id,bo,true);
    let n=0;
    while(!V.fim&&n++<40){
      const restam=t.vetoRestantes(V);
      t.vetoEscolher(V,t.vetoMinhaVez(V)?restam[0]:null);
    }
    if(t.semente!==sem)throw new Error('Bo'+bo+': o veto interativo consumiu sorteio do motor');
    const res=t.vetoResultado(V);
    const esperado=bo===1?1:bo===3?3:5;
    if(res.mapas.length!==esperado)
      throw new Error('Bo'+bo+' terminou com '+res.mapas.length+' mapas, esperado '+esperado);
    if(res.seq.length!==pool)throw new Error('Bo'+bo+' não consumiu o pool inteiro');
    if(new Set(res.seq.map(x=>x.m)).size!==res.seq.length)throw new Error('Bo'+bo+': mapa repetido');
    if(res.seq.filter(x=>x.tipo==='dec').length!==1)throw new Error('Bo'+bo+': decider errado');
    for(const x of res.seq)if(!t.mapaAtivo(x.m))throw new Error('Bo'+bo+': '+x.m+' não está em rotação');
  }
});

await teste('renovação: pedido explicado, sem sorteio, e o jogador pode recusar',async()=>{
  const time=meuTimeDeTeste();
  const p=t.G.jogadores[time.elenco[0]];
  const foto=JSON.stringify(p);
  try{
    p.moral=0.6;delete p.renovBloq;p.renovTent=0;
    const sem=t.semente;
    const d=w.pedidoRenovacao(p,time);
    if(!(d.pedido>0)||!d.anos||d.anos[0]>d.anos[1])throw new Error('pedido sem valor ou sem duração: '+JSON.stringify(d));
    /* proposta baixa: recusa e conta tentativa */
    const r1=w.proporRenovacao(p,time,Math.round(d.pedido*0.5),d.anos[0]);
    if(r1.ok)throw new Error('aceitou metade do pedido');
    if(t.semente!==sem)throw new Error('a negociação consumiu sorteio do motor');
    /* três recusas fecham a porta */
    w.proporRenovacao(p,time,Math.round(d.pedido*0.5),d.anos[0]);
    w.proporRenovacao(p,time,Math.round(d.pedido*0.5),d.anos[0]);
    if(!w.renovacaoFechada(p))throw new Error('três propostas baixas não fecharam a conversa');
    const r2=w.proporRenovacao(p,time,d.pedido*2,d.anos[0]);
    if(r2.ok)throw new Error('com a conversa fechada ainda renovou');
    /* reaberto, a proposta justa fecha */
    delete p.renovBloq;
    const alvo=w.pedidoParaAnos(w.pedidoRenovacao(p,time),d.anos[1]);
    const moral0=p.moral;
    const r3=w.proporRenovacao(p,time,alvo,d.anos[1]);
    if(!r3.ok)throw new Error('recusou o próprio pedido: '+r3.motivos.join(' '));
    if(p.contrato!==d.anos[1]||p.salario!==alvo)throw new Error('contrato não ficou como acordado');
    if(!(p.moral>moral0))throw new Error('renovar não levantou a moral');
  }finally{Object.assign(p,JSON.parse(foto));delete p.renovBloq;}
});

await teste('renovação: garoto em ascensão quer contrato curto, e longo custa mais',async()=>{
  const time=meuTimeDeTeste();
  const p=t.G.jogadores[time.elenco[0]];
  const foto=JSON.stringify(p);
  try{
    p.idade=20;p.pot=Math.min(99,t.over(p)+12);
    const d=w.pedidoRenovacao(p,time);
    if(d.anos[1]>2)throw new Error('garoto em ascensão aceitou até '+d.anos[1]+' anos sem prêmio');
    if(!(w.pedidoParaAnos(d,4)>w.pedidoParaAnos(d,2)))throw new Error('quatro anos não custaram mais que dois');
  }finally{Object.assign(p,JSON.parse(foto));}
});

await teste('Finanças › Renovar abre a negociação e fecha acordo pela tela',async()=>{
  const time=meuTimeDeTeste();
  const p=t.G.jogadores[time.elenco[0]];
  const foto=JSON.stringify(p);
  try{
    p.moral=0.7;delete p.renovBloq;p.renovTent=0;
    t.tela='financas';w.render();
    const b=$('[data-renov="'+p.id+'"]');
    if(!b)throw new Error('sem botão Renovar em Finanças');
    clicar(b);
    if(w.document.querySelector('#dialogo .ovl'))throw new Error('ainda abre um confirm em vez da negociação');
    const M=w.document.querySelector('#modal');
    if(!/Por que ele pede isso/.test(M.textContent))throw new Error('a negociação não explica o pedido');
    clicar(M.querySelector('#rJusto'));
    clicar(M.querySelector('#rEnviar'));
    if(!/Acordo fechado/.test(M.textContent))throw new Error('o pedido dele não fechou acordo: '+M.querySelector('#rFeed').textContent);
  }finally{Object.assign(p,JSON.parse(foto));w.document.querySelector('#modal').innerHTML='';}
});

await teste('nenhuma janela nativa do navegador no jogo',async()=>{
  /* alert() e confirm() travam a página e, no app de PC, dependem da webview.
     O jogo usa o próprio diálogo. */
  const {readdirSync}=await import('node:fs');
  const dir=resolve(raiz,'src/ui');
  for(const f of readdirSync(dir).filter(x=>x.endsWith('.js'))){
    const linhas=readFileSync(resolve(dir,f),'utf8').split('\n');
    linhas.forEach((l,i)=>{
      if(/^\s*(\/\*|\*)/.test(l))return;
      if(/(^|[^.\w])(alert|confirm|prompt)\(/.test(l))
        throw new Error(f+':'+(i+1)+' usa janela nativa: '+l.trim().slice(0,70));
    });
  }
});

await teste('o diálogo do jogo confirma, cancela e não apaga o modal aberto',async()=>{
  w.abrir('<p id="fichaAberta">ficha</p>');
  let r=w.confirmar('Apagar?','Apagar');
  await responder(false);
  if(await r!==false)throw new Error('cancelar não devolveu false');
  if(!w.document.querySelector('#fichaAberta'))throw new Error('o diálogo apagou o modal de baixo');
  r=w.confirmar('Apagar?','Apagar');
  await responder(true);
  if(await r!==true)throw new Error('confirmar não devolveu true');
  r=w.avisar('Caixa insuficiente.');
  await responder(true);
  await r;
  if(w.document.querySelector('#dialogo .ovl'))throw new Error('o diálogo ficou aberto');
  w.document.querySelector('#modal').innerHTML='';
});

await teste('todo mapa jogado sai do veto com lado de início',async()=>{
  /* Quem escolhe o mapa entrega o lado ao outro; no decider escolhe quem não
     fez o último ban. Vale para o veto interativo e para o da IA. */
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id&&(x.elenco||[]).length>=5);
  for(const bo of [1,3,5]){
    const v=t.vetoAutomatico(time.id,adv.id,bo,true);
    if(v.lados.length!==v.mapas.length||v.lados.some(l=>l!=='atk'&&l!=='def'))
      throw new Error('Bo'+bo+' interativo: lados '+JSON.stringify(v.lados));
    const sem=t.semente;
    const S=t.abrirSerie(time.id,adv.id,bo);
    t.semente=sem;
    if(S.veto.lados.length!==S.veto.mapas.length||S.veto.lados.some(l=>l!=='atk'&&l!=='def'))
      throw new Error('Bo'+bo+' da IA: lados '+JSON.stringify(S.veto.lados));
  }
  /* o seu clicar no lado vale */
  const V=t.iniciarVeto(time.id,adv.id,3,true);
  let n=0,escolhi=null;
  while(!V.fim&&n++<40){
    const passo=V.passos[V.i];
    if(t.vetoMinhaVez(V)&&passo.tipo==='lado'){escolhi='atk';t.vetoEscolher(V,'atk');}
    else t.vetoEscolher(V,t.vetoMinhaVez(V)?t.vetoRestantes(V)[0]:null);
  }
  if(!escolhi)throw new Error('o veto Bo3 não me deu nenhum passo de lado');
  const meuPick=V.seq.find(x=>x.tipo==='pick'&&!x.meu);
  if(!meuPick||meuPick.lado0!=='atk')throw new Error('escolhi atacar e o mapa ficou '+(meuPick&&meuPick.lado0));
});

await teste('o mapa começa no lado escolhido, sem mexer no sorteio',async()=>{
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id&&(x.elenco||[]).length>=5);
  const mapa=t.G.mapasAtivos[0];
  const sem=t.semente;
  const M1=t.abrirMapa(time,adv,mapa,'def');
  const depois1=t.semente;
  t.semente=sem;
  const M2=t.abrirMapa(time,adv,mapa);
  const depois2=t.semente;
  if(M1.ladoA!=='def')throw new Error('pedi defesa e o mapa começou '+M1.ladoA);
  if(depois1!==depois2)throw new Error('escolher o lado consumiu sorteio diferente da moeda');
});

await teste('a pré-partida tem a etapa de comps da série',async()=>{
  let c=null,n=0;
  while(n<60&&!c){c=t.compromissoDaSemana();if(!c){t.avancar();n++;}}
  if(!c)throw new Error('nenhuma partida minha em 60 semanas');
  t.abrirPrePartida(c,()=>{});
  try{
    const V=t.PP.V;let k=0;
    while(!V.fim&&k++<40)t.vetoEscolher(V,null);
    t.PP.etapa='comps';t.ppPintar();
    const M=w.document.querySelector('#modal');
    const jogados=V.seq.filter(x=>x.tipo!=='ban').length;
    const sel=M.querySelectorAll('[data-ppag]').length;
    if(sel!==jogados*5)throw new Error(sel+' seletores de agente para '+jogados+' mapas');
    if(!M.querySelector('[data-pppreset]'))throw new Error('sem presets na etapa de comps');
    if(!/você começa/.test(M.textContent))throw new Error('a etapa de comps não mostra o lado de início');
    /* trocar o agente pela tela grava na comp do mapa */
    const s0=M.querySelector('[data-ppag]');
    const [mapa,pid]=s0.dataset.ppag.split('|');
    const outro=[...s0.options].map(o=>o.value).find(v=>v!==s0.value);
    s0.value=outro;s0.dispatchEvent(new w.Event('change'));
    const time=t.G.times[t.G.meuTime];
    if(time.comps[mapa][pid]!==outro)throw new Error('a troca de agente não foi gravada');
  }finally{t.ppFechar();}
});

await teste('a partida joga exatamente os mapas que o veto escolheu',async()=>{
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id&&(x.elenco||[]).length>=5);
  const v=t.vetoAutomatico(time.id,adv.id,3,true);
  const res=t.simPartida(time.id,adv.id,3,{veto:v});
  const jogados=res.mapas.map(m=>m.mapa);
  jogados.forEach((mp,i)=>{
    if(mp!==v.mapas[i])throw new Error('mapa '+(i+1)+': joguei '+mp+' e escolhi '+v.mapas[i]);
  });
});

await teste('o pedido de tempo tem limite e muda o round seguinte',async()=>{
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id&&(x.elenco||[]).length>=5);
  const mapa=t.G.mapasAtivos[0];
  const M=t.abrirMapa(time,adv,mapa);
  let aceitos=0;
  for(let i=0;i<6;i++)if(t.pedirTempo(M,true))aceitos++;
  if(aceitos!==t.TEMPOS_POR_MAPA)
    throw new Error('aceitou '+aceitos+' pedidos num mapa, limite é '+t.TEMPOS_POR_MAPA);
  if(t.podePedirTempo(M,true))throw new Error('ainda deixa pedir depois de gastar todos');
  /* e depois de pedir, o time pedinte entra com vantagem por alguns rounds */
  const M2=t.abrirMapa(time,adv,mapa);
  t.pedirTempo(M2,true);
  if(!(M2.bonusA>0))throw new Error('o tempo pedido não deixou bônus nenhum');
  t.passoRound(M2);
  if(M2.bonusA!==0&&M2.bonusA>=2)throw new Error('o bônus do tempo não está sendo consumido');
});

await teste('a série em passos dá o mesmo que a série de uma vez',async()=>{
  /* O motor foi partido em abrirMapa/passoRound/fecharMapa para a tela poder
     conduzir. Se as duas formas divergirem, o refactor quebrou o jogo. */
  const time=meuTimeDeTeste();
  const adv=Object.values(t.G.times).find(x=>x.id!==time.id&&(x.elenco||[]).length>=5);
  const v=t.vetoAutomatico(time.id,adv.id,3,true);
  const sem=t.semente;
  /* simPartida aplica o pós-jogo (forma, moral, fadiga, afinidade, sinergia);
     sem desfazer isso a segunda forma joga com outro elenco e o placar só
     batia por sorte */
  const ids=[...time.elenco,...adv.elenco];
  const foto=JSON.stringify({p:ids.map(id=>t.G.jogadores[id]),a:time,b:adv});
  const direto=t.simPartida(time.id,adv.id,3,{veto:v});
  const depoisDireto=t.semente;
  const f=JSON.parse(foto);
  ids.forEach((id,i)=>Object.assign(t.G.jogadores[id],f.p[i]));
  Object.assign(time,f.a);Object.assign(adv,f.b);
  t.semente=sem;
  const S=t.abrirSerie(time.id,adv.id,3,v);
  while(!S.fim){
    if(!t.serieAbrirMapa(S))break;
    while(!S.M.fim)t.passoRound(S.M);
    t.serieFecharMapa(S);
  }
  const passo=t.fecharSerie(S,{});
  if(passo.wa!==direto.wa||passo.wb!==direto.wb)
    throw new Error('placar da série diferente: '+direto.wa+'-'+direto.wb+' contra '+passo.wa+'-'+passo.wb);
  if(passo.mapas.length!==direto.mapas.length)throw new Error('número de mapas diferente');
  passo.mapas.forEach((m,i)=>{
    if(m.sa!==direto.mapas[i].sa||m.sb!==direto.mapas[i].sb)
      throw new Error('mapa '+(i+1)+' com placar diferente');
  });
  if(t.semente!==depoisDireto)
    throw new Error('as duas formas consumiram sorteio diferente');
});

await teste('o foco tático é pedra-papel-tesoura, não resposta certa fixa',async()=>{
  const A=meuTimeDeTeste();
  const B=Object.values(t.G.times).find(x=>x.id!==A.id);
  const fa=A.tatica.foco, fb=B.tatica.foco;
  try{
    const par=(x,y)=>{A.tatica.foco=x;B.tatica.foco=y;return t.vantagemTatica(A,B);};
    if(!(par('execucao','default')>0))throw new Error('execução não bate default');
    if(!(par('default','retake')>0))throw new Error('default não bate retake');
    if(!(par('retake','execucao')>0))throw new Error('retake não bate execução');
    if(par('default','default')!==0)throw new Error('foco igual devia dar zero');
    for(const f of ['execucao','default','retake']){
      const contra=['execucao','default','retake'].filter(x=>x!==f);
      const ganhos=contra.map(x=>par(f,x));
      if(!(ganhos.some(g=>g>0)&&ganhos.some(g=>g<0)))
        throw new Error(f+' não perde para ninguém — voltou a ser resposta certa fixa');
    }
  }finally{ A.tatica.foco=fa;B.tatica.foco=fb; }
});

await teste('agressividade depende do elenco que você montou',async()=>{
  const time=meuTimeDeTeste();
  const foto=time.titulares.map(id=>({id,at:Object.assign({},t.G.jogadores[id].at)}));
  const ag=time.tatica.agres;
  const mapa=t.G.mapasAtivos[0];
  try{
    const por=(duelo)=>{
      time.titulares.forEach(id=>{const p=t.G.jogadores[id];
        if(duelo){p.at.mira=95;p.at.reflexo=95;p.at.mov=90;p.at.util=45;p.at.visao=45;}
        else{p.at.mira=50;p.at.reflexo=50;p.at.mov=50;p.at.util=95;p.at.visao=95;}});
      return t.perfilAgressivo(time);
    };
    if(!(por(true)>0))throw new Error('elenco de mira e reflexo não deu perfil agressivo');
    if(!(por(false)<0))throw new Error('elenco de utilidade não deu perfil cauteloso');
    /* e o efeito de lado tem de ser simétrico: se ajudar mais do que cobra,
       agressividade máxima volta a ser de graça */
    /* O efeito de LADO tem de somar zero no mapa inteiro (todo time ataca
       metade dos rounds). O que sobra na soma dos dois lados é só o perfil do
       elenco — se sobrasse mais que isso, agressividade máxima voltaria a ser
       de graça, que era exatamente o defeito antigo. */
    por(true);
    time.tatica.agres=5;
    const perfil=t.perfilAgressivo(time);
    const soma=t.pesoAgressividade(time,mapa,'atk')+t.pesoAgressividade(time,mapa,'def');
    const esperado=2*(5-3)*perfil*0.035;
    if(Math.abs(soma-esperado)>0.05)
      throw new Error('o efeito de lado não some: sobra '+soma.toFixed(2)+
                      ', esperado '+esperado.toFixed(2));
    time.tatica.agres=1;
    const somaBaixa=t.pesoAgressividade(time,mapa,'atk')+t.pesoAgressividade(time,mapa,'def');
    if(!(somaBaixa<soma))
      throw new Error('com elenco de duelo, ser cauteloso não custa nada');
  }finally{
    foto.forEach(f=>Object.assign(t.G.jogadores[f.id].at,f.at));
    time.tatica.agres=ag;
  }
});

await teste('conversar levanta o jogador e tem intervalo',async()=>{
  const time=meuTimeDeTeste();
  const p=t.G.jogadores[time.elenco[0]];
  const foto={moral:p.moral,fadiga:p.fadiga,uc:p.ultimaConversa,pr:p.promessa,cb:p.cobrado};
  try{
    delete p.ultimaConversa;delete p.promessa;
    p.moral=0.4;
    const r=t.conversarCom(time,p,'franco');
    if(!r.ok)throw new Error('conversa recusada: '+r.erro);
    if(!(p.moral>0.4))throw new Error('conversa franca não levantou a moral');
    const r2=t.conversarCom(time,p,'franco');
    if(r2.ok)throw new Error('deixou conversar duas vezes na mesma semana');
    if(t.podeConversar(p))throw new Error('podeConversar não respeita o intervalo');
  }finally{ p.moral=foto.moral;p.fadiga=foto.fadiga;
    if(foto.uc)p.ultimaConversa=foto.uc;else delete p.ultimaConversa;
    if(foto.pr)p.promessa=foto.pr;else delete p.promessa;
    if(foto.cb)p.cobrado=foto.cb;else delete p.cobrado; }
});

await teste('promessa de titularidade não cumprida cobra caro',async()=>{
  const time=meuTimeDeTeste();
  const reserva=time.elenco.find(id=>!time.titulares.includes(id));
  if(!reserva)return;
  const p=t.G.jogadores[reserva];
  const foto={moral:p.moral,uc:p.ultimaConversa,pr:p.promessa};
  const moraisAntes=time.elenco.map(id=>({id,m:t.G.jogadores[id].moral}));
  try{
    delete p.ultimaConversa;
    p.moral=0.5;
    const r=t.conversarCom(time,p,'promessa');
    if(!r.ok)throw new Error('não deixou prometer: '+r.erro);
    if(!p.promessa)throw new Error('a promessa não ficou registrada');
    const depoisDaPromessa=p.moral;
    if(!(depoisDaPromessa>0.5))throw new Error('prometer não levantou nada');
    /* vence a promessa sem ele virar titular */
    p.promessa.ate=(t.G.semana||1)-1;
    p.promessa.ano=t.G.ano;
    const quebradas=t.cobrarPromessas(time);
    if(quebradas!==1)throw new Error('a promessa vencida não foi cobrada');
    if(!(p.moral<0.5))
      throw new Error('promessa quebrada deixou a moral em '+p.moral.toFixed(2)+', acima de onde começou');
    if(p.promessa)throw new Error('a promessa ficou pendurada depois de cobrada');
  }finally{
    moraisAntes.forEach(x=>{t.G.jogadores[x.id].moral=x.m;});
    p.moral=foto.moral;
    if(foto.uc)p.ultimaConversa=foto.uc;else delete p.ultimaConversa;
    if(foto.pr)p.promessa=foto.pr;else delete p.promessa;
  }
});

await teste('cobrar custa moral e rende treino',async()=>{
  const time=meuTimeDeTeste();
  const p=t.G.jogadores[time.elenco[0]];
  const foto={moral:p.moral,uc:p.ultimaConversa,cb:p.cobrado};
  try{
    delete p.ultimaConversa;delete p.cobrado;
    p.moral=0.7;
    const r=t.conversarCom(time,p,'cobranca');
    if(!r.ok)throw new Error('não deixou cobrar: '+r.erro);
    if(!(p.moral<0.7))throw new Error('cobrança não custou moral');
    if(!t.estaCobrado(p))throw new Error('a cobrança não deixou efeito de treino');
  }finally{ p.moral=foto.moral;
    if(foto.uc)p.ultimaConversa=foto.uc;else delete p.ultimaConversa;
    if(foto.cb)p.cobrado=foto.cb;else delete p.cobrado; }
});

await teste('o viés de lado dos mapas vem do dado real',async()=>{
  for(const mp of (t.G.mapasAtivos||[])){
    const atk=t.MAPA_ATK[mp];
    if(atk===undefined)continue;
    const v=t.viesLado(mp,'atk'), d=t.viesLado(mp,'def');
    if(Math.abs(v+d)>0.001)throw new Error(mp+': ataque e defesa não são simétricos');
    if(atk>50&&!(v>0))throw new Error(mp+' tem '+atk+'% no ataque mas o viés não favorece atacar');
    if(atk<50&&!(v<0))throw new Error(mp+' tem '+atk+'% no ataque mas o viés não favorece defender');
  }
});

await teste('o pool ativo de largada é o pool real de 2026',async()=>{
  const inicial=t.poolInicial();
  if(inicial.length!==t.MAPAS_ATIVOS)
    throw new Error('pool inicial com '+inicial.length+' mapas');
  for(const mp of t.POOL_2026)
    if(!inicial.includes(mp))throw new Error(mp+' está no pool real de 2026 e não no do jogo');
  if(!t.MAP_POOL.includes('Summit'))throw new Error('Summit não está no catálogo de mapas');
});

await teste('a tela de Comps desenha, é pura e responde',async()=>{
  /* Faxina antes de medir: o mundo já rodou temporadas nos casos anteriores e
     pode ter comp de jogador vendido esperando a faxina semanal. Culpar a tela
     por estado que ela não criou é medir o mundo, não a regra. */
  t.limparComps(meuTimeDeTeste());
  t.modo='jogo';t.tela='comps';
  const sem=t.semente;
  w.render&&w.render();
  if(t.semente!==sem)throw new Error('desenhar a tela de Comps mexeu na semente');
  const txt=corpo()?corpo().textContent:'';
  if(!txt||txt.length<60)throw new Error('a tela de Comps saiu vazia');
  const abas=$$('#view [data-compmapa]');
  if(!abas.length)throw new Error('não achei as abas de mapa');
  clicar(abas[abas.length-1]);
  const presets=$$('#view [data-preset]');
  if(!presets.length)throw new Error('não achei os presets');
  for(const b of presets)clicar(b);
  const sels=$$('#view [data-compag]');
  if(!sels.length)throw new Error('não achei os seletores de agente');
  for(const s of sels.slice(0,3)){
    const ops=[...s.options];
    if(ops.length<2)continue;
    s.value=ops[ops.length-1].value;
    disparar(s,'change');
  }
  const time=meuTimeDeTeste();
  for(const mp in (time.comps||{}))
    for(const pid in time.comps[mp]){
      if(!time.elenco.includes(pid))throw new Error('a tela criou comp para quem não é do elenco');
      if(!t.funcaoConhece(time.comps[mp][pid]))throw new Error('a tela gravou um agente que não existe');
    }
});

await teste('a Central mostra quem está insatisfeito',async()=>{
  const time=meuTimeDeTeste();
  const p=t.G.jogadores[time.elenco[0]];
  const moral=p.moral;
  try{
    p.moral=0.3;
    t.modo='jogo';t.tela='inicio';
    const sem=t.semente;
    w.render&&w.render();
    if(t.semente!==sem)throw new Error('a Central mexeu na semente');
    const txt=corpo()?corpo().textContent:'';
    if(!txt.includes(p.nome))throw new Error('jogador com moral 30% não apareceu no vestiário');
  }finally{ p.moral=moral; }
});

await teste('a IA escolhe tática e lê o adversário quando tem analista',async()=>{
  const outro=Object.values(t.G.times).find(x=>x.id!==t.G.meuTime);
  const foto=JSON.parse(JSON.stringify(outro.tatica));
  const a=outro.staff.analista, o=outro.staff.olheiro;
  try{
    outro.staff.analista=5;outro.staff.olheiro=5;
    const adv=t.proximoAdversarioDe(outro);
    t.taticaIA(outro);
    if(!['execucao','default','retake'].includes(outro.tatica.foco))
      throw new Error('a IA escolheu um foco que não existe: '+outro.tatica.foco);
    if(!(outro.tatica.agres>=1&&outro.tatica.agres<=5))
      throw new Error('a IA escolheu agressividade '+outro.tatica.agres);
    if(adv){
      const contra={default:'execucao',retake:'default',execucao:'retake'};
      if(outro.tatica.foco!==contra[adv.tatica.foco||'default'])
        throw new Error('com analista 5 a IA não escolheu o contra-foco');
    }
    outro.staff.analista=1;outro.staff.olheiro=1;
    t.taticaIA(outro);
    if(!['execucao','default','retake'].includes(outro.tatica.foco))
      throw new Error('sem analista a IA ficou sem foco');
  }finally{ outro.tatica=foto;outro.staff.analista=a;outro.staff.olheiro=o; }
});

await teste('meta, comps e patches sobrevivem ao save',async()=>{
  const time=meuTimeDeTeste();
  const mp=t.G.mapasAtivos[0];
  t.aplicarPreset(time,mp,'melhor');
  const comp=JSON.stringify(t.compDe(time,mp));
  const meta=JSON.stringify(t.G.meta);
  const reg=JSON.parse(JSON.stringify(t.empacotarRun()));
  t.desempacotarRun(reg);
  if(JSON.stringify(t.G.meta)!==meta)throw new Error('o meta mudou ao carregar');
  if(JSON.stringify(t.compDe(t.G.times[time.id],mp))!==comp)
    throw new Error('a comp do mapa não sobreviveu ao save');
});

await teste('clube com o elenco mínimo em pé não fabrica jogador',async()=>{
  /* A base subia promessa para qualquer clube com menos de nove, e o mundo
     enchia de gente gerada que ninguém pediu. */
  const antes=Object.keys(t.G.jogadores).length;
  const tamanhos=Object.values(t.G.times).map(x=>(x.elenco||[]).length);
  if(Math.min(...tamanhos)<t.ELENCO_MIN)
    throw new Error('algum clube já está abaixo do mínimo antes do teste');
  /* nenhum clube abaixo do mínimo: reposição não deve gerar ninguém */
  for(const id in t.G.times)t.reporElenco(t.G.times[id]);
  const depois=Object.keys(t.G.jogadores).length;
  if(depois!==antes)
    throw new Error('a reposição gerou '+(depois-antes)+' jogador(es) com todos os elencos cheios');
});

await teste('clube abaixo do mínimo é reposto, e só até cinco',async()=>{
  const time=Object.values(t.G.times).find(x=>x.id!==t.G.meuTime&&(x.elenco||[]).length>=5);
  const foto={elenco:time.elenco.slice(),titulares:(time.titulares||[]).slice(),igl:time.igl};
  const guardaLivres=t.G.livres.slice();
  const donos=foto.elenco.map(id=>({id,timeId:t.G.jogadores[id].timeId}));
  try{
    /* tira gente até ficar com três */
    while(time.elenco.length>3){
      const id=time.elenco.pop();
      const p=t.G.jogadores[id];
      p.timeId=null;
      time.titulares=(time.titulares||[]).filter(x=>x!==id);
    }
    t.reporElenco(time);
    if(time.elenco.length!==t.ELENCO_MIN)
      throw new Error('reposto até '+time.elenco.length+', esperado exatamente '+t.ELENCO_MIN);
  }finally{
    time.elenco=foto.elenco;time.titulares=foto.titulares;time.igl=foto.igl;
    donos.forEach(d=>{t.G.jogadores[d.id].timeId=d.timeId;});
    t.G.livres=guardaLivres;
  }
});

await teste('jogador gerado depois do mundo nasce com 15 ou 16 anos',async()=>{
  /* Vale para a promoção de emergência, a promessa da base e o sangue novo do
     mercado: quem entra, entra pela base — não aparece pronto. */
  const time=Object.values(t.G.times).find(x=>x.id!==t.G.meuTime&&(x.elenco||[]).length>=5);
  const foto={elenco:time.elenco.slice(),titulares:(time.titulares||[]).slice(),igl:time.igl};
  const guardaLivres=t.G.livres.slice();
  const donos=foto.elenco.map(id=>({id,timeId:t.G.jogadores[id].timeId}));
  const conhecidos=new Set(Object.keys(t.G.jogadores));
  try{
    /* mercado vazio + elenco curto força a geração, que é o caminho que
       interessa medir */
    t.G.livres=[];
    while(time.elenco.length>3){
      const id=time.elenco.pop();
      t.G.jogadores[id].timeId=null;
      time.titulares=(time.titulares||[]).filter(x=>x!==id);
    }
    t.reporElenco(time);
    const novos=Object.keys(t.G.jogadores).filter(id=>!conhecidos.has(id));
    if(!novos.length)throw new Error('mercado vazio e elenco curto e não gerou ninguém');
    for(const id of novos){
      const p=t.G.jogadores[id];
      if(p.idade<t.IDADE_NOVO_MIN||p.idade>t.IDADE_NOVO_MAX)
        throw new Error(p.nome+' nasceu com '+p.idade+' anos, fora de '+
                        t.IDADE_NOVO_MIN+'–'+t.IDADE_NOVO_MAX);
    }
    novos.forEach(id=>{delete t.G.jogadores[id];});
  }finally{
    time.elenco=foto.elenco;time.titulares=foto.titulares;time.igl=foto.igl;
    donos.forEach(d=>{t.G.jogadores[d.id].timeId=d.timeId;});
    t.G.livres=guardaLivres;
  }
});


const larg=Math.max(...passos.map(p=>p[1].length));
console.log('TESTE DE INTERFACE — '+passos.length+' casos\n');
passos.forEach(([st,nome,det])=>{
  console.log((st==='ok'?' ok  ':' X   ')+nome.padEnd(larg)+(det?'  '+det:''));
});
const soltos=erros.filter(e=>!passos.some(p=>p[2].includes(e)));
if(soltos.length)console.log('\nerros fora de caso:\n'+soltos.map(e=>' · '+e).join('\n'));
console.log('\n'+(falhas||soltos.length?falhas+' falha(s).':'Tudo passou.'));
dom.window.close();
process.exit(falhas||soltos.length?1:0);
