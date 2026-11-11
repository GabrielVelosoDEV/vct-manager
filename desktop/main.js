/* ============================================================
   VCT MANAGER — app de PC
   ------------------------------------------------------------
   O jogo é o mesmo do site: este arquivo só abre o index.html
   numa janela própria, sem barra de navegador. As partidas salvas
   ficam no armazenamento do app (%APPDATA%/VCT Manager) e
   continuam lá ao atualizar ou reinstalar. Opcionalmente, também
   numa pasta de verdade (Documentos\VCT Manager): preload.js.
   ============================================================ */
const {app,BrowserWindow,shell,Menu,ipcMain,dialog}=require('electron');
const path=require('path');
const fs=require('fs');

/* ---------- pasta de saves (opcional) ----------
   Por padrão a carreira fica no armazenamento do app. Se o jogador ligar a
   pasta, cada carreira também vira um arquivo em Documentos\VCT Manager (ou
   onde ele escolher). A escolha fica em config.json, no armazenamento do app.
   Só nomes de arquivo do jogo passam: nada de caminho, nada fora da pasta. */
const CFG=()=>path.join(app.getPath('userData'),'config.json');
function lerCfg(){try{return JSON.parse(fs.readFileSync(CFG(),'utf8'));}catch(e){return{};}}
function gravarCfg(c){try{fs.mkdirSync(path.dirname(CFG()),{recursive:true});fs.writeFileSync(CFG(),JSON.stringify(c,null,1));}catch(e){}}
const PADRAO=()=>path.join(app.getPath('documents'),'VCT Manager');
const nomeOk=n=>/^[A-Za-z0-9_-]+\.vct(run|base)\.json$/.test(n);
function pastaAtual(){const c=lerCfg();return c.pasta&&c.ligada?c.pasta:null;}
ipcMain.handle('pasta:estado',()=>{const c=lerCfg();return{ligada:!!(c.pasta&&c.ligada),caminho:c.pasta||null,padrao:PADRAO()};});
ipcMain.handle('pasta:ligar',async(e,escolher)=>{
  let alvo=lerCfg().pasta||PADRAO();
  if(escolher){
    const r=await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender),{title:'Pasta dos saves do VCT Manager',
      defaultPath:alvo,properties:['openDirectory','createDirectory']});
    if(r.canceled||!r.filePaths[0])return{ok:false,cancelou:true};
    alvo=r.filePaths[0];
    /* apontou para uma pasta qualquer: cria "VCT Manager" dentro dela */
    const temSave=()=>{try{return fs.readdirSync(alvo).some(nomeOk);}catch(e){return false;}};
    if(path.basename(alvo)!=='VCT Manager'&&!temSave())alvo=path.join(alvo,'VCT Manager');
  }
  try{fs.mkdirSync(alvo,{recursive:true});}catch(err){return{ok:false,erro:'Não deu para criar a pasta: '+err.message};}
  gravarCfg({...lerCfg(),pasta:alvo,ligada:true});
  return{ok:true,caminho:alvo};
});
ipcMain.handle('pasta:desligar',()=>{gravarCfg({...lerCfg(),ligada:false});return true;});
ipcMain.handle('pasta:listar',()=>{
  const p=pastaAtual();if(!p)return [];
  try{return fs.readdirSync(p).filter(nomeOk).map(n=>{try{return{nome:n,texto:fs.readFileSync(path.join(p,n),'utf8')};}catch(e){return null;}}).filter(Boolean);}
  catch(e){return [];}
});
ipcMain.handle('pasta:gravar',(e,nome,texto)=>{
  const p=pastaAtual();if(!p||!nomeOk(nome))return false;
  try{fs.mkdirSync(p,{recursive:true});const tmp=path.join(p,nome+'.tmp');fs.writeFileSync(tmp,texto);fs.renameSync(tmp,path.join(p,nome));return true;}
  catch(err){return false;}
});
ipcMain.handle('pasta:apagar',(e,nome)=>{const p=pastaAtual();if(!p||!nomeOk(nome))return false;try{fs.unlinkSync(path.join(p,nome));}catch(err){}return true;});
ipcMain.handle('pasta:abrir',()=>{const p=pastaAtual()||lerCfg().pasta;if(p)shell.openPath(p);return !!p;});

app.setAppUserModelId('dev.gabrielveloso.vctmanager');
/* uma janela só: abrir o atalho de novo traz a que já está aberta */
if(!app.requestSingleInstanceLock())app.quit();

let janela=null;
function abrirJanela(){
  janela=new BrowserWindow({
    width:1440,height:900,minWidth:1100,minHeight:700,
    title:'VCT Manager',backgroundColor:'#0B1218',show:false,
    icon:path.join(__dirname,'web','assets','ui','favicon.png'),
    autoHideMenuBar:true,
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false,
      preload:path.join(__dirname,'preload.js')}
  });
  Menu.setApplicationMenu(null);
  janela.once('ready-to-show',()=>{janela.maximize();janela.show();});
  /* link de fora (VLR.gg, notícias, Liquipedia) abre no navegador, não no jogo */
  const externo=url=>/^https?:/i.test(url);
  janela.webContents.setWindowOpenHandler(({url})=>{if(externo(url))shell.openExternal(url);return{action:'deny'};});
  janela.webContents.on('will-navigate',(e,url)=>{if(externo(url)){e.preventDefault();shell.openExternal(url);}});
  /* F11 tela cheia; F5 recarrega (o jogo salva sozinho); F12 só fora do instalador */
  janela.webContents.on('before-input-event',(e,t)=>{
    if(t.type!=='keyDown')return;
    if(t.key==='F11'){janela.setFullScreen(!janela.isFullScreen());e.preventDefault();}
    else if(t.key==='F5'){janela.webContents.reload();e.preventDefault();}
    else if(t.key==='F12'&&!app.isPackaged){janela.webContents.toggleDevTools();e.preventDefault();}
  });
  /* Ao fechar, espera o jogo gravar a carreira (o salvamento é assíncrono e o
     beforeunload do site não garante que termina antes da janela sumir). */
  let saindo=false;
  janela.on('close',e=>{
    if(saindo)return;
    e.preventDefault();saindo=true;
    const fim=()=>{if(janela&&!janela.isDestroyed())janela.destroy();};
    const limite=setTimeout(fim,4000);
    janela.webContents.executeJavaScript(`(async()=>{try{
        if(typeof Base!=='undefined'&&Base.fecharEdicao)Base.fecharEdicao();
        if(typeof G!=='undefined'&&G&&G.meuTime)await salvarRun(G.runNome);
      }catch(e){}return true;})()`).catch(()=>{}).finally(()=>{clearTimeout(limite);fim();});
  });
  janela.on('closed',()=>{janela=null;});
  janela.loadFile(path.join(__dirname,'web','index.html'));
}
app.on('second-instance',()=>{if(janela){if(janela.isMinimized())janela.restore();janela.focus();}});
app.whenReady().then(abrirJanela);
app.on('window-all-closed',()=>app.quit());
