/* ============================================================
   PONTE DO APP DE PC — pasta de saves
   ------------------------------------------------------------
   O jogo roda isolado (sem Node). Esta ponte dá a ele só o que a
   pasta de saves precisa: listar, ler, gravar e apagar arquivos
   .vctrun.json / .vctbase.json DENTRO da pasta escolhida, abrir a
   pasta no Explorer e trocar de pasta. Nada fora dela.
   ============================================================ */
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('vctPasta',{
  estado:()=>ipcRenderer.invoke('pasta:estado'),
  ligar:(escolher)=>ipcRenderer.invoke('pasta:ligar',!!escolher),
  desligar:()=>ipcRenderer.invoke('pasta:desligar'),
  listar:()=>ipcRenderer.invoke('pasta:listar'),
  gravar:(nome,texto)=>ipcRenderer.invoke('pasta:gravar',String(nome),String(texto)),
  apagar:(nome)=>ipcRenderer.invoke('pasta:apagar',String(nome)),
  abrir:()=>ipcRenderer.invoke('pasta:abrir')
});
