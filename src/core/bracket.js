/* preview de chaveamento sem efeitos colaterais */
function paresKO(vivos){
  const n=vivos.length;
  if(n<=1)return{pares:[],byes:vivos.slice()};
  let m=1;while(m*2<=n)m*=2;
  const nm=m===n?n/2:n-m;
  const byes=vivos.slice(0,n-nm*2),jogam=vivos.slice(n-nm*2),pares=[];
  for(let i=0;i<nm;i++)pares.push([jogam[i],jogam[jogam.length-1-i]]);
  return{pares,byes};
}
function seedKO(s){const r=paresKO(s.vivos);s._byes=r.byes;return r.pares;}
