/* ============================================================
   EVENTOS
   ============================================================ */
function ligarEventos(){
  const t=meu();const v=raizAtual();
  if(!v)return;
  const on=(sel,f)=>v.querySelectorAll(sel).forEach(el=>el.onclick=e=>{e.stopPropagation();f(el);});
  /* Lê um campo do formulário sem confiar que ele está na tela. Um botão de um
     render anterior continua clicável enquanto alguém tiver a referência dele,
     e aí `v.querySelector('#edNome').value` estourava em cima de null. Ler por
     aqui devolve vazio e o formulário simplesmente não aplica nada. */
  const val=(sel,padrao)=>{const el=v.querySelector(sel);return el?el.value:(padrao===undefined?'':padrao);};
  const temCampo=sel=>!!v.querySelector(sel);
  on('[data-ca]',el=>{compAba=el.dataset.ca;render();});
  on('#autoEsc',()=>{autoEscalar(t);render();});
  on('[data-banco]',el=>{
    if(t.titulares.length<=5&&t.elenco.length>5){
      const sub=t.elenco.find(i=>!t.titulares.includes(i)&&!P(i).lesao);
      if(!sub)return;
      t.titulares=t.titulares.map(i=>i===el.dataset.banco?sub:i);
      t.sinergia=clamp(t.sinergia-5,0,100);
    }
    t.elenco.forEach(i=>P(i).igl=(i===t.igl));
    if(!t.titulares.includes(t.igl))t.igl=t.titulares[0];
    render();
  });
  on('[data-tit]',el=>{
    const sai=t.titulares.map(P).sort((a,b)=>over(a)-over(b))[0];
    t.titulares=t.titulares.map(i=>i===sai.id?el.dataset.tit:i);
    t.sinergia=clamp(t.sinergia-5,0,100);
    if(!t.titulares.includes(t.igl))t.igl=t.titulares[0];
    t.elenco.forEach(i=>P(i).igl=(i===t.igl));render();
  });
  on('[data-igl]',el=>{t.igl=el.dataset.igl;t.elenco.forEach(i=>P(i).igl=(i===t.igl));render();});
  on('[data-up]',el=>{
    const[grp,k]=el.dataset.up.split('.');
    const c=custoUpgrade(t[grp][k]);
    if(t.caixa<c){avisar('Caixa insuficiente: '+money(c)+' necessários.');return;}
    t.caixa-=c;t[grp][k]++;noticia('Estrutura melhorada: '+k+' nível '+t[grp][k]+'.');render();
  });
  on('[data-prop]',el=>modalProposta(el.dataset.prop));
  on('[data-assumir]',el=>{
    const r=assumirClube(el.dataset.assumir);
    if(!r.ok){avisar(r.erro||'Não deu para assumir esse clube.');return;}
    flash(r.msg);irPara('inicio');
  });
  on('[data-treinomapa]',el=>{definirMapaTreino(t,el.dataset.treinomapa||null);render();});
  on('[data-anunciar]',el=>modalAnunciar(el.dataset.anunciar));
  on('[data-desanunciar]',el=>{
    const r=retirarAnuncio(P(el.dataset.desanunciar));
    if(r&&r.msg)noticia(r.msg);
    render();
  });
  on('[data-aceitar]',el=>{
    const r=aceitarProposta(el.dataset.aceitar);
    if(!r.ok){avisar(r.erro||'A proposta não pôde ser aceita.');return;}
    noticia('🤝 '+r.msg);render();
  });
  on('[data-recusar]',el=>{recusarProposta(el.dataset.recusar);render();});
  on('[data-renov]',async el=>{
    const p=P(el.dataset.renov);const novo=Math.round(salario(p)*1.12/100)*100;
    if(await confirmar('Renovar '+p.nome+' por 3 anos a '+money(novo)+'/mês?','Renovar')){p.contrato=3;p.salario=novo;p.moral=clamp(p.moral+.08,0,1);render();}
  });
  on('[data-disp]',async el=>{
    const p=P(el.dataset.disp);
    if(t.elenco.length<=5){avisar('Você precisa de pelo menos 5 jogadores.');return;}
    if(await confirmar('Dispensar '+p.nome+'? Multa de '+money(p.salario*p.contrato*6)+'.','Dispensar')){
      t.caixa-=p.salario*p.contrato*6;liberar(p);render();}
  });
  /* ---- conversa com o elenco ---- */
  on('[data-conversa]',el=>{
    const [pid,opcao]=String(el.dataset.conversa).split(':');
    const r=conversarCom(t,P(pid),opcao);
    if(!r.ok){avisar(r.erro);return;}
    fechar();
    flash(r.msg+(r.delta?' (moral '+(r.delta>0?'+':'')+r.delta+')':''));
  });
  /* ---- comps de agente ---- */
  on('[data-compmapa]',el=>{compMapa=el.dataset.compmapa;render();});
  on('[data-preset]',el=>{aplicarPreset(t,mapaDaTelaComps(),el.dataset.preset);render();});
  on('[data-presettodos]',el=>{
    for(const mp of (G.mapasAtivos||[]))aplicarPreset(t,mp,el.dataset.presettodos);
    render();flash('Preset aplicado em todos os mapas da rotação.');
  });
  v.querySelectorAll('[data-compag]').forEach(el=>el.onchange=()=>{
    definirAgente(t,mapaDaTelaComps(),el.dataset.compag,el.value);
    render();
  });
  /* o select de plano individual não é clique, é change */
  v.querySelectorAll('[data-plano]').forEach(el=>el.onchange=()=>{
    const [tipo,alvo]=String(el.value).split(':');
    definirPlano(t,el.dataset.plano,tipo,alvo||null);
    render();
  });
  const bind=(sel,ev,f)=>{const el=v.querySelector(sel);if(el)el.addEventListener(ev,f);};
  bind('#trScrim','input',e=>{t.tatica.scrim=+e.target.value;
    const l=v.querySelector('#lbScrim');if(l)l.textContent=e.target.value;});
  bind('#agres','input',e=>{t.tatica.agres=+e.target.value;const l=v.querySelector('#lbAg');if(l)l.textContent=e.target.value;});
  bind('#scrim','input',e=>{t.tatica.scrim=+e.target.value;const l=v.querySelector('#lbSc');if(l)l.textContent=e.target.value;});
  bind('#foco','change',e=>{t.tatica.foco=e.target.value;});
  bind('#treino','change',e=>{t.tatica.treino=e.target.value;});
  bind('#fBusca','input',e=>{mFiltro.busca=e.target.value;const p=e.target.selectionStart;render();
    const n=$('#fBusca');if(n){n.focus();n.setSelectionRange(p,p);}});
  bind('#fSo','change',e=>{mFiltro.so=e.target.value;render();});
  bind('#fRole','change',e=>{mFiltro.role=e.target.value;render();});
  bind('#fReg','change',e=>{mFiltro.reg=e.target.value;render();});
  bind('#fOrd','change',e=>{mFiltro.ordem=e.target.value;render();});

  /* ---------- editor ---------- */
  on('[data-edaba]',el=>{edAba=el.dataset.edaba;render();});
  bind('#edSel','change',e=>{edTime=e.target.value;render();});

  on('#edSalvarT',()=>{
    const t2=G.times[edTime];
    const tagAntes=t2.tag;
    const staff={},estrutura={},mapPref={};
    v.querySelectorAll('[data-edstaff]').forEach(el=>staff[el.dataset.edstaff]=el.value);
    v.querySelectorAll('[data-edest]').forEach(el=>estrutura[el.dataset.edest]=el.value);
    v.querySelectorAll('[data-edmap]').forEach(el=>mapPref[el.dataset.edmap]=el.value);
    if(!temCampo('#edNome'))return;   /* o formulário do clube não está na tela */
    const r=edAplicarTime(edTime,{
      nome:val('#edNome',t2.nome), tag:val('#edTag',t2.tag),
      regiao:val('#edRegiao',t2.regiao), tier:val('#edTier',t2.tier),
      prestigio:val('#edPrest',t2.prestigio), sinergia:val('#edSin',t2.sinergia),
      pais:val('#edPaisClube',undefined),
      caixa:val('#edCaixa',t2.caixa), patroc:val('#edPatroc',t2.patroc),
      logo:val('#edLogo',t2.logo||''), staff, estrutura, mapPref
    });
    if(!r.ok){avisar(r.erro);return;}
    if(r.tagTrocada){
      Imgs.renomear(Imgs.chaveTime(r.tagTrocada.de),Imgs.chaveTime(r.tagTrocada.para))
        .then(()=>{render();flash('Time atualizado — imagem re-chaveada para '+r.tagTrocada.para+'.');});
      return;
    }
    render();flash('Time atualizado.');
  });

  on('#edAdd',()=>{const r=edCriarJogador(edTime,{});render();flash(r.ok?r.msg:r.erro);});
  on('#edPreencher5',()=>{const r=edPreencherElenco(edTime,5);render();flash(r.ok?r.msg:r.erro);});
  on('#edPreencher7',()=>{const r=edPreencherElenco(edTime,7);render();flash(r.ok?r.msg:r.erro);});
  on('#edAuto',()=>{autoEscalar(G.times[edTime]);render();flash('Escalação refeita.');});
  on('#edNovoLivre',()=>{const r=edCriarJogador(null,{});render();flash(r.ok?r.msg:r.erro);});

  on('[data-edp]',el=>modalEditarJogador(el.dataset.edp));
  on('[data-edlivre]',el=>{const r=edLiberar(el.dataset.edlivre);render();flash(r.ok?r.msg:r.erro);});
  on('[data-eddel]',async el=>{
    const p=P(el.dataset.eddel);if(!p)return;
    if(!await confirmar('Apagar '+p.nome+' da base? Não dá para desfazer.','Apagar'))return;
    const r=edApagar(el.dataset.eddel);render();flash(r.ok?r.msg:r.erro);
  });
  v.querySelectorAll('[data-edmover]').forEach(sel=>sel.addEventListener('change',e=>{
    const r=edMover(sel.dataset.edmover,e.target.value||null);
    render();flash(r.ok?(r.msg||'Movido.'):r.erro);
  }));

  /* filtros da aba Jogadores — preserva o cursor da busca */
  bind('#edfBusca','input',e=>{
    edFiltro.busca=e.target.value;const pos=e.target.selectionStart;render();
    const n=$('#edfBusca');if(n){n.focus();n.setSelectionRange(pos,pos);}
  });
  [['#edfStatus','status'],['#edfRole','role'],['#edfReg','reg'],['#edfTime','time'],['#edfOrdem','ordem']]
    .forEach(([sel,campo])=>bind(sel,'change',e=>{edFiltro[campo]=e.target.value;render();}));

  /* ---------- imagens ---------- */
  const subirPara=async(chave,file)=>{
    try{
      const[lg,al]=Imgs.formatoDaChave(chave);
      const uri=await Imgs.doArquivo(file,lg,al);
      const ok=await Imgs.gravar(chave,uri);
      render();flash(ok?'Imagem no pacote.':'Guardei só em memória — exporte o pacote.');
    }catch(e){flash(e.message||'Falha ao subir a imagem.');}
  };
  if(edAba==='times'&&G.times[edTime]){
    ligarDropzone(v.querySelector('#edDropLogo'),v.querySelector('#edFileLogo'),
      f=>subirPara(Imgs.chaveTime(G.times[edTime].tag),f));
  }
  ligarDropzone(v.querySelector('#edDropLote'),v.querySelector('#edFileLote'),async fs=>{
    const ok=[],semAlvo=[],falhou=[];
    for(const f of fs){
      const alvo=Imgs.chavePorNome(f.name);
      if(!alvo){semAlvo.push(f.name);continue;}
      try{
        const[lg,al]=Imgs.formatoDaChave(alvo.k);
        const uri=await Imgs.doArquivo(f,lg,al);
        await Imgs.gravar(alvo.k,uri);
        ok.push(alvo.alvo);
      }catch(e){falhou.push(f.name);}
    }
    edFeedImg=`<div class="card flat" style="border-left:4px solid ${ok.length?'var(--teal)':'var(--gold)'}">
      <b>${ok.length} imagem(ns) no pacote.</b>
      ${ok.length?'<div class="dim">'+ok.slice(0,12).map(esc).join(', ')+(ok.length>12?' e mais '+(ok.length-12):'')+'</div>':''}
      ${semAlvo.length?'<div style="margin-top:6px">Sem alvo na base (o nome tem de casar com uma tag ou um nick): <span class="dim">'+semAlvo.slice(0,10).map(esc).join(', ')+'</span></div>':''}
      ${falhou.length?'<div style="margin-top:6px">Não deu para ler: <span class="dim">'+falhou.map(esc).join(', ')+'</span></div>':''}</div>`;
    render();
  },true);
  on('[data-edimgdel]',async el=>{await Imgs.apagar(el.dataset.edimgdel);render();flash('Imagem removida do pacote.');});
  on('#edImgExport',()=>{
    if(!Imgs.quantos()){flash('O pacote está vazio.');return;}
    baixarJSON('vct-manager-imagens.json',Imgs.exportar());flash('Pacote exportado.');
  });
  bind('#edImgImport','change',async e=>{
    const f=e.target.files[0];if(!f)return;
    try{
      const r=await Imgs.importar(await lerJSON(f));
      render();flash(r.ok?r.n+' imagem(ns) importada(s).':r.erro);
    }catch(err){flash('Erro ao ler o arquivo.');}
  });
  on('#edImgLimpar',async()=>{
    if(!await confirmar('Limpar as '+Imgs.quantos()+' imagens do pacote? A resolução volta para a pasta assets/.','Limpar'))return;
    await Imgs.limpar();render();flash('Pacote limpo.');
  });

  on('#edFixCurtos',()=>{
    let n=0;
    Object.values(G.times).filter(t2=>t2.elenco.length<5).forEach(t2=>{edPreencherElenco(t2.id,5);n++;});
    render();flash(n+' elenco(s) preenchido(s).');
  });

  /* ---------- comissão técnica ---------- */
  on('[data-merc]',el=>{mercAba=el.dataset.merc;render();});
  on('[data-fichastaff]',el=>modalStaff(el.dataset.fichastaff));
  on('[data-propstaff]',el=>modalPropostaStaff(el.dataset.propstaff));
  on('[data-edstaffp]',el=>modalEditarStaff(el.dataset.edstaffp));
  on('[data-dispstaff]',async el=>{
    const m=G.staff[el.dataset.dispstaff];if(!m)return;
    const multa=Math.round(m.salario*Math.max(1,m.contrato)*4);
    if(!await confirmar('Dispensar '+m.nome+'? Multa de '+money(multa)+'.','Dispensar'))return;
    t.caixa-=multa;
    const r=liberarStaff(m.id);
    render();flash(r.ok?r.msg:r.erro);
  });
  on('[data-edstafflivre]',el=>{
    const r=liberarStaff(el.dataset.edstafflivre);render();flash(r.ok?r.msg:r.erro);
  });
  on('[data-edstaffdel]',async el=>{
    const m=G.staff[el.dataset.edstaffdel];if(!m)return;
    if(!await confirmar('Apagar '+m.nome+' da base?','Apagar'))return;
    const r=apagarStaff(m.id);render();flash(r.ok?r.msg:r.erro);
  });
  on('[data-edstaffnovo]',el=>{
    const cargo=el.dataset.edstaffnovo;
    const t2=G.times[edTime];
    const r=criarStaffLivre({cargo,regiao:t2.regiao,
      over:clamp(Math.round(t2.tier===1?28+t2.prestigio*0.78:18+t2.prestigio*0.72),32,97)});
    if(!r.ok){flash(r.erro);return;}
    moverStaff(r.id,edTime,cargo);
    render();flash(G.staff[r.id].nome+' assumiu como '+cargo+'.');
  });
  on('#edStaffNovoLivre',()=>{const r=criarStaffLivre({});render();flash(r.ok?r.msg:r.erro);});
  v.querySelectorAll('[data-comissao]').forEach(sel=>sel.addEventListener('change',e=>{
    const cargo=sel.dataset.comissao,novo=e.target.value;
    const t2=G.times[edTime];
    if(!novo){
      const atual=membroDe(t2,cargo);
      const r=atual?liberarStaff(atual.id):{ok:true,msg:'Vaga já estava aberta.'};
      render();flash(r.ok?r.msg:r.erro);return;
    }
    const r=moverStaff(novo,edTime,cargo);
    render();flash(r.ok?r.msg:r.erro);
  }));
  v.querySelectorAll('[data-contratarstaff]').forEach(sel=>sel.addEventListener('change',e=>{
    if(!e.target.value)return;
    const r=moverStaff(sel.dataset.contratarstaff,edTime,e.target.value);
    render();flash(r.ok?r.msg:r.erro);
  }));

  /* ---------- torneios ---------- */
  on('#edSalvarTor',()=>{
    const pega=(sel,campo)=>{
      const m={};
      v.querySelectorAll('['+sel+']').forEach(el=>{
        const id=el.getAttribute(sel);
        (m[id]=m[id]||{})[campo]=el.value;
      });
      return m;
    };
    const patch={};
    [['data-tnome','nome'],['data-tcurto','curto'],['data-tpremio','premio']].forEach(([sel,campo])=>{
      const m=pega(sel,campo);
      for(const id in m)Object.assign(patch[id]=patch[id]||{},m[id]);
    });
    let n=0;const erros=[];
    for(const id in patch){
      const r=edAplicarTorneio(id,patch[id]);
      r.ok?n++:erros.push(r.erro);
    }
    render();flash(erros.length?erros[0]:n+' torneio(s) atualizado(s).');
  });
  v.querySelectorAll('[data-tarte]').forEach(el=>el.addEventListener('change',e=>{
    const f=e.target.files[0];if(f)subirPara(Imgs.chaveTorneio(el.dataset.tarte),f);
  }));

  /* ---------- patrocinadores ---------- */
  v.querySelectorAll('[data-patroc]').forEach(el=>el.addEventListener('change',()=>{
    const r=edPatrocinioTrocar(edTime,el.dataset.patroc,el.value);
    render();flash(r.ok?r.msg:r.erro);
  }));
  on('#edRedistribuir',()=>{
    atribuirPatrocinios();
    for(const id in G.times)G.times[id].patroc=receitaAnual(G.times[id]);
    render();flash('Patrocínios redistribuídos pela atratividade atual.');
  });
  on('#mkAdd',()=>{
    const r=edMarcaCriar(val('#mkNovo'),val('#mkNovoNivel'));
    render();flash(r.ok?r.msg:r.erro);
  });
  on('[data-mkdel]',el=>{
    const r=edMarcaRemover(el.dataset.mkdel);
    render();flash(r.ok?r.msg:r.erro);
  },true);
  on('#edSalvarMarcas',()=>{
    const campos={};
    const junta=(sel,campo)=>v.querySelectorAll('['+sel+']').forEach(el=>{
      (campos[el.getAttribute(sel)]=campos[el.getAttribute(sel)]||{})[campo]=el.value;
    });
    junta('data-mknome','nome');junta('data-mksetor','setor');junta('data-mknivel','nivel');
    const erros=[];let n=0;
    for(const id in campos){
      const r=edMarcaAplicar(id,campos[id]);
      if(r.ok)n++;else erros.push(r.erro);
    }
    for(const id in G.times)G.times[id].patroc=receitaAnual(G.times[id]);
    render();flash(erros.length?erros[0]:n+' marca(s) atualizada(s).');
  });
  v.querySelectorAll('[data-mklogo]').forEach(el=>el.addEventListener('change',e=>{
    const f=e.target.files[0];if(f)subirPara(Imgs.chaveMarca(el.dataset.mklogo),f);
  }));

  /* ---------- agentes ---------- */
  on('#agAdd',()=>{
    const nome=val('#agNovo');
    const role=val('#agNovoRole');
    const r=edAddAgente(role,nome);
    render();flash(r.ok?r.msg:r.erro);
  });
  on('[data-agdel]',async el=>{
    const nome=el.dataset.agdel;
    if(!await confirmar('Remover o agente '+nome+'? Quem já joga com ele continua igual.','Remover'))return;
    const r=edRemoverAgente(el.dataset.agde,nome);
    render();flash(r.ok?r.msg:r.erro);
  });
  v.querySelectorAll('[data-agrole]').forEach(sel=>sel.addEventListener('change',e=>{
    const nome=sel.dataset.agrole,de=sel.dataset.agde,para=e.target.value;
    if(de===para)return;
    const add=edAddAgente(para,nome);
    if(!add.ok){render();flash(add.erro);return;}
    const rem=edRemoverAgente(de,nome);
    render();flash(rem.ok?nome+' virou '+para+'.':rem.erro);
  }));
  v.querySelectorAll('[data-agarte]').forEach(el=>el.addEventListener('change',e=>{
    const f=e.target.files[0];if(f)subirPara(Imgs.chaveAgente(el.dataset.agarte),f);
  }));

  /* ---------- importador em texto ---------- */
  on('#impGo',()=>{
    const txt=val('#impTxt');
    edModo=val('#impModo')||edModo;
    if(!txt.trim()){flash('Cole os elencos primeiro.');return;}
    const r=importarElencos(txt,edModo);
    const fb=v.querySelector('#impFeed');
    fb.innerHTML=`<div class="card flat" style="border-left:4px solid ${r.erros.length?'var(--gold)':'var(--teal)'}">
      <b>${r.add} jogador(es) importado(s)${r.ren?', '+r.ren+' time(s) renomeado(s)':''}.</b>
      ${r.erros.length?'<div style="margin-top:6px">'+r.erros.slice(0,12).map(e=>'<div class="dim">· '+esc(e)+'</div>').join('')+
        (r.erros.length>12?'<div class="dim">… e mais '+(r.erros.length-12)+'</div>':'')+'</div>':''}</div>`;
  });
  on('#expGo',()=>{edSaida=exportarElencos();render();});
  on('#edPadronizar',()=>{
    const c=padronizarBase();
    edSaida='';render();
    const el=document.getElementById('edPadFeed');
    if(el)el.innerHTML=`<div class="ok">Base padronizada.
      ${c.jogadoresT2} jogador(es) de Tier 2 e ${c.jogadoresT1} reserva(s) de Tier 1 realocados,
      ${c.comissao} membro(s) de comissão, ${c.potencial} potencial(is) recalculado(s),
      ${c.topo} promovido(s) ao topo da faixa.</div>`;
    flash('Base padronizada.');
  });
  /* Nunca baixar um arquivo vazio: ele iria por cima de data/elencos.js e
     apagaria a base. Melhor recusar e explicar. */
  const avisoVazio='Nenhum jogador de nome real nesta base — nada a exportar. '+
    'Se este save é antigo, entre no jogo, abra o Editor e clique em Padronizar '+
    'antes de exportar.';
  on('#vlrGo',()=>{
    const sel=v.querySelector('#vlrTime');
    const t=sel&&G.times[sel.value];
    const r=parsearVlr(val('#vlrTxt'),t?t.tag:'');
    const el=document.getElementById('vlrFeed');
    if(!r.ok){if(el)el.innerHTML=`<div class="card flat" style="border-left:4px solid var(--red)">${esc(r.erro)}</div>`;return;}
    /* prévia obrigatória: colagem errada não pode virar elenco sem você ver */
    if(el)el.innerHTML=`
      <div class="card flat"><div class="eyebrow">Entendi isto · colagem em ${r.formato}</div>
      <table><thead><tr><th>Nick</th><th>Nome real</th><th class="c">País</th></tr></thead>
      <tbody>${r.jogadores.map(j=>`<tr><td><b>${esc(j.nick)}</b></td>
        <td class="dim">${esc(j.nome)||'—'}</td>
        <td class="c">${j.pais?(FLAG[j.pais]||'')+' '+esc(j.pais):'<span class="dn">—</span>'}</td></tr>`).join('')}
      </tbody></table>
      ${r.staff.length?`<div class="eyebrow" style="margin-top:12px">Separados como comissão</div>
        <table><tbody>${r.staff.map(s2=>`<tr><td><b>${esc(s2.nick)}</b></td>
          <td class="dim">${esc(s2.nome)||'—'}</td>
          <td class="dim">${esc(s2.rotulo||'comissão')}</td></tr>`).join('')}</tbody></table>`:''}
      ${r.avisos.map(a=>'<div class="dim" style="margin-top:6px">· '+esc(a)+'</div>').join('')}
      <div style="margin-top:10px"><button class="btn" id="vlrUsar">Usar estas linhas no importador</button></div>
      </div>`;
    const btn=document.getElementById('vlrUsar');
    if(btn)btn.onclick=()=>{
      const alvo=v.querySelector('#impTxt');
      if(alvo){alvo.value=r.linhas;alvo.scrollIntoView({block:'center'});
        flash(r.jogadores.length+' linha(s) prontas — revise função e over antes de importar.');}
    };
  });
  on('#paisGo',()=>{
    const r=edAplicarPaises(val('#paisTxt'));
    render();
    const el=document.getElementById('paisFeed');
    if(el)el.innerHTML=`<div class="${r.erros.length?'card flat':'ok'}">${r.n} clube(s) atualizado(s).`+
      (r.erros.length?'<div style="margin-top:6px" class="dn">'+r.erros.map(esc).join('<br>')+'</div>':'')+'</div>';
    flash(r.n+' clube(s) com sede definida.');
  });
  on('#paisExp',()=>{
    const el=v.querySelector('#paisTxt');
    if(el){el.value=edListarPaises();flash('Lista atual carregada — edite e aplique.');}
  });
  on('#edGerarClubes',()=>{
    const js=gerarClubesJS();
    if(!js){flash('Nenhum clube com sede definida ainda — preencha os países antes.');return;}
    baixarTexto('clubes.js',js,'text/javascript');
    flash('clubes.js baixado — copie por cima do que está em data/.');
  });
  on('#edGerarElencos',()=>{
    const js=gerarElencosJS();
    if(!js){flash(avisoVazio);return;}
    baixarTexto('elencos.js',js,'text/javascript');
    flash(quantosReais()+' jogadores exportados — mova o arquivo para a pasta data/.');
  });
  on('#edVerElencos',()=>{
    const js=gerarElencosJS();
    if(!js){flash(avisoVazio);return;}
    edSaida=js;render();
  });
  on('#edNovo',async()=>{
    if(!await confirmar('Isso apaga a base editada e gera um mundo novo. Continuar?','Gerar mundo novo'))return;
    iniciarPreRun(Math.floor(Math.random()*900000)+1000);
  });

  /* ---------- pré-run ---------- */
  on('#prIniciar',()=>telaNovoJogo());

  /* ---------- configurações ---------- */
  on('[data-pref]',el=>{
    const k=el.dataset.pref,novo=!Prefs.get(k);
    Prefs.set(k,novo);
    el.classList.toggle('on',novo);
    el.setAttribute('aria-checked',String(novo));
    if(k==='animacoes')document.body.classList.toggle('sem-anim',!novo);
  });
  bind('#cfgRostos','change',e=>{Prefs.set('rostosGerados',e.target.value);render();});
  on('#cfgApagarRuns',async()=>{
    if(!listaRuns.length){flash('Não há partidas salvas.');return;}
    if(!await confirmar('Apagar as '+listaRuns.length+' partidas salvas? Não tem desfazer.','Apagar'))return;
    for(const r of listaRuns.slice())await Storage.apagar(r.id);
    await atualizarRuns();render();flash('Partidas apagadas.');
  });
  on('#cfgLimparImgs',async()=>{
    if(!Imgs.quantos()){flash('O pacote já está vazio.');return;}
    if(!await confirmar('Limpar as '+Imgs.quantos()+' imagens do pacote?','Limpar'))return;
    await Imgs.limpar();render();flash('Pacote limpo.');
  });

  /* ---------- runs ---------- */
  on('#runSalvar',async()=>{
    const n=val('#runNome').trim()||G.runNome||'Sem nome';
    const ok=await salvarRun(n);
    await atualizarRuns();render();flash(ok?'Run salva.':'Falha ao salvar — exporte o .json.');
  });
  on('#runBaixar',()=>{baixarRun();flash('Arquivo gerado.');});
  on('#runNova',async()=>{
    const seed=parseInt(val('#runSeed'))||Math.floor(Math.random()*900000)+1000;
    if(G&&G.meuTime&&!await confirmar('Criar um mundo novo? Salve a run atual antes se quiser mantê-la.','Criar mundo novo'))return;
    iniciarPreRun(seed);
  });
  on('[data-runload]',async el=>{
    const ok=await carregarRun(el.dataset.runload);
    if(!ok){flash('Não foi possível carregar essa run.');return;}
    tela='inicio';render();flash('Run carregada.');
  });
  on('[data-rundel]',async el=>{
    if(!await confirmar('Apagar esta run definitivamente?','Apagar'))return;
    await Storage.apagar(el.dataset.rundel);await atualizarRuns();render();
  });
  const dz=v.querySelector('#runDrop'),fi=v.querySelector('#runFile');
  if(dz){
    const receber=async file=>{
      try{
        const reg=await lerArquivoRun(file);
        if(!desempacotarRun(reg)){flash('Arquivo não parece uma run válida.');return;}
        await salvarRun(G.runNome);await atualizarRuns();
        tela='inicio';render();flash('Run importada.');
      }catch(e){flash('Erro ao ler o arquivo.');}
    };
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.borderColor='var(--red)';});
    dz.addEventListener('dragleave',()=>{dz.style.borderColor='';});
    dz.addEventListener('drop',e=>{e.preventDefault();dz.style.borderColor='';
      if(e.dataTransfer.files[0])receber(e.dataTransfer.files[0]);});
    if(fi)fi.addEventListener('change',e=>{if(e.target.files[0])receber(e.target.files[0]);});
  }
}
