/* ============================================================
   VCT MANAGER — app de PC
   ------------------------------------------------------------
   O jogo é o mesmo do site: este arquivo só abre o index.html
   numa janela própria, sem barra de navegador. As partidas salvas
   ficam no armazenamento do app (%APPDATA%/VCT Manager) e
   continuam lá ao atualizar ou reinstalar.
   ============================================================ */
const {app,BrowserWindow,shell,Menu}=require('electron');
const path=require('path');

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
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:false}
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
