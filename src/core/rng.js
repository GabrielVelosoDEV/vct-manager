/* ============================================================
   VCT MANAGER — motor de simulação de e-sports (Valorant)
   ============================================================ */

/* ---------- RNG determinístico ---------- */
let _s = 1;
function srand(s){ _s = (s>>>0) || 1; }
function rnd(){ _s^=_s<<13;_s>>>=0;_s^=_s>>17;_s^=_s<<5;_s>>>=0;return _s/4294967296; }
const ri=(a,b)=>Math.floor(rnd()*(b-a+1))+a;
const pick=a=>a[Math.floor(rnd()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function gauss(m,s){let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const money=v=>{const n=Math.round(v);if(Math.abs(n)>=1e6)return '$'+(n/1e6).toFixed(2)+'M';if(Math.abs(n)>=1e3)return '$'+(n/1e3).toFixed(0)+'k';return '$'+n;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
