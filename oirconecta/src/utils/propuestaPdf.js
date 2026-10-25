/**
 * Propuesta comercial en PDF (3 hojas carta) con la línea gráfica de OírConecta.
 * Es el mismo diseño del cotizador: portada, alternativas e inversión con
 * garantías, plan audiológico y sello de firma electrónica.
 *
 * Uso: const html = renderPropuestaPages(S, IMG); await descargarPropuestaPdf(S, IMG, nombre)
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

export const PROPUESTA_CSS = `
.page{--g:#085946;--g2:#0e7a5f;--g3:#12936f;--gl:#e9f2ee;--gl2:#f4f8f6;--gr:#a6a6a6;--gr2:#d9d9d9;--ink:#17231f;--mute:#5d6964;
  width:816px;height:1056px;overflow:hidden;background:#fff;color:var(--ink);font-family:Gotham,Montserrat,Helvetica,Arial,sans-serif;font-size:8.6pt;line-height:1.5;text-align:left}
.page *{box-sizing:border-box}
.page .in{padding:0 .6in}
.page .foot{position:absolute;left:.6in;right:.6in;bottom:.32in;display:flex;justify-content:space-between;align-items:center;font-size:6.8pt;color:var(--mute)}
.page .dots{display:flex;gap:4px}.page .dots i{width:6px;height:6px;border-radius:50%;background:var(--gr2)}.page .dots i.on{background:var(--g)}
.page .eyebrow{font-size:6.6pt;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:var(--g3)}
.page h2{font-weight:700;font-size:17pt;color:var(--g);letter-spacing:-.4px;line-height:1.15;margin:0}
.page h2 span{font-weight:300;color:var(--ink)}
.page .hero{background:var(--g);color:#fff;height:4.3in;position:relative;padding:.5in .6in 0;overflow:hidden}
.page .c1{position:absolute;right:-1.1in;top:-1.3in;width:4.2in;height:4.2in;border-radius:50%;border:38px solid rgba(255,255,255,.06)}
.page .c2{position:absolute;right:1.1in;top:2.1in;width:1.6in;height:1.6in;border-radius:50%;background:rgba(255,255,255,.05)}
.page .c3{position:absolute;right:.5in;top:.9in;width:.9in;height:.9in;border-radius:50%;background:rgba(166,166,166,.25)}
.page .htop{display:flex;justify-content:space-between;align-items:center;position:relative}
.page .htop img{height:34px}
.page .num{font-size:7pt;letter-spacing:1.5px;text-transform:uppercase;opacity:.8;text-align:right}
.page .num b{display:block;font-size:9pt;letter-spacing:.5px;font-weight:600}
.page h1{position:relative;font-weight:300;font-size:30pt;line-height:1.08;letter-spacing:-1px;margin:.55in 0 0}
.page h1 b{font-weight:800;display:block}
.page .sub{position:relative;margin-top:14px;font-size:9.5pt;opacity:.88;max-width:4.3in}
.page .pills{position:relative;display:flex;gap:8px;margin-top:22px}
.page .pill{border:1px solid rgba(255,255,255,.4);border-radius:30px;padding:5px 13px;font-size:7.2pt;font-weight:500}
.page .cards3{display:grid;gap:12px;margin-top:-.62in;position:relative;z-index:2}
.page .mini{background:#fff;border-radius:14px;box-shadow:0 10px 26px rgba(8,89,70,.14);text-align:center}
.page .mini .ph{border-radius:14px 14px 0 0;height:1.45in;background:linear-gradient(180deg,#f4f8f6,#ffffff);display:flex;align-items:center;justify-content:center;padding:10px}
.page .mini .ph img{max-height:1.22in;max-width:1.55in}
.page .mini .bd{padding:6px 12px 13px}
.page .mini h3{font-size:10.5pt;font-weight:700;margin:0}
.page .mini .lv{font-size:6.8pt;color:var(--mute)}
.page .mini .pr{margin-top:8px;font-size:12.5pt;font-weight:800;color:var(--g)}
.page .mini .pr small{display:block;font-size:6.4pt;font-weight:500;color:var(--mute);letter-spacing:.4px;text-transform:uppercase}
.page .mini .old{font-size:7pt;color:var(--gr);text-decoration:line-through}
.page .off{display:inline-block;margin-top:6px;background:var(--g);color:#fff;font-weight:700;font-size:6.8pt;border-radius:20px;padding:2px 10px}
.page .info{display:grid;grid-template-columns:1fr 1fr 1fr;margin-top:22px;border-top:1px solid var(--gr2);border-bottom:1px solid var(--gr2)}
.page .info>div{padding:13px 14px 13px 0}
.page .info>div+div{padding-left:14px;border-left:1px solid var(--gr2)}
.page .info p{font-size:8pt;line-height:1.45;margin:4px 0 0}
.page .info p b{font-weight:700;font-size:9pt}
.page .letter{margin-top:18px;display:grid;grid-template-columns:1.6in 1fr;gap:18px}
.page .letter p{font-size:8.4pt;color:var(--mute);margin:0 0 6px;white-space:pre-line}
.page .letter b{color:var(--ink);font-weight:600}
.page .ph2{padding:.5in .6in .18in;display:flex;justify-content:space-between;align-items:flex-end}
.page .ph2 img{height:24px}
.page .prod{display:grid;grid-template-columns:2.05in 1fr;border-radius:16px;overflow:hidden;margin-bottom:12px;border:1px solid var(--gr2)}
.page .prod .im{background:linear-gradient(160deg,#e9f2ee,#f4f8f6);position:relative;display:flex;align-items:center;justify-content:center;padding:14px}
.page .prod .im img{max-width:1.65in;max-height:1.6in;position:relative}
.page .prod .im .n{position:absolute;left:12px;top:10px;font-size:22pt;font-weight:800;color:rgba(8,89,70,.14)}
.page .prod .bd{padding:13px 16px 12px}
.page .prod .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.page .prod h3{font-size:13pt;font-weight:800;letter-spacing:-.4px;line-height:1.1;margin:0}
.page .prod h3 span{display:block;font-size:7pt;font-weight:500;color:var(--mute);letter-spacing:.6px;margin-top:2px;text-transform:uppercase}
.page .tag{font-size:6.4pt;background:var(--g);color:#fff;font-weight:600;padding:3px 9px;border-radius:20px;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.page .feats{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin:10px 0}
.page .ft{display:grid;grid-template-columns:20px 1fr;gap:7px;font-size:7.4pt;line-height:1.38;color:var(--mute)}
.page .ft b{color:var(--ink);font-weight:700;display:block;font-size:7.6pt}
.page .ic{width:20px;height:20px;border-radius:6px;background:var(--gl);display:flex;align-items:center;justify-content:center}
.page .ic svg{width:12px;height:12px}
.page .price{display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--gr2);padding-top:8px;font-size:7pt;color:var(--mute)}
.page .price s{color:var(--gr)}
.page .price b{font-size:12pt;color:var(--g);font-weight:800;margin-left:6px}
.page .note{font-size:6.8pt;color:var(--mute);margin:7px 0 0}
.page table{width:100%;border-collapse:separate;border-spacing:0;margin-top:12px}
.page th{font-size:6.4pt;text-transform:uppercase;letter-spacing:1px;color:var(--mute);font-weight:600;padding:0 10px 7px;text-align:right;border-bottom:2px solid var(--g)}
.page th:first-child{text-align:left;padding-left:0}
.page td{padding:10px;text-align:right;border-bottom:1px solid var(--gr2);font-size:8.4pt;font-variant-numeric:tabular-nums;vertical-align:middle}
.page td:first-child{text-align:left;padding-left:0}
.page td .nm{display:flex;align-items:center;gap:10px}
.page td .nm img{width:34px;height:34px;object-fit:contain;background:#f4f8f6;border-radius:8px;padding:3px}
.page td .nm b{font-weight:700;display:block}
.page td .nm small{color:var(--mute);font-size:6.8pt}
.page td.dto{color:#a2402c}
.page td.dto span{background:#fdeee9;font-weight:700;font-size:6.8pt;border-radius:20px;padding:2px 7px;margin-right:5px}
.page td.tot{font-weight:800;color:#fff;background:var(--g);font-size:9.4pt;text-align:center}
.page .valid{display:flex;align-items:center;gap:14px;margin:16px 0;border-radius:14px;background:var(--gl);padding:11px 16px}
.page .valid .big{font-size:22pt;font-weight:800;color:var(--g);line-height:1;text-align:center}
.page .valid .big small{display:block;font-size:6.4pt;font-weight:600;letter-spacing:1.5px;text-transform:uppercase}
.page .valid p{font-size:8.2pt;border-left:1px solid var(--gr);padding-left:14px;margin:0}
.page .cols{display:grid;grid-template-columns:1.15fr 1fr;gap:14px;margin-top:6px}
.page .box{border-radius:14px;padding:14px 16px;border:1px solid var(--gr2)}
.page .box.dk{background:var(--g);color:#fff;border:none;position:relative;overflow:hidden}
.page .box.dk .ring{position:absolute;right:-40px;bottom:-40px;width:130px;height:130px;border-radius:50%;border:20px solid rgba(255,255,255,.06)}
.page .box h4{font-size:9.6pt;font-weight:700;margin:0 0 10px;color:var(--g)}
.page .box.dk h4{color:#fff}
.page .gi{display:grid;grid-template-columns:22px 1fr;gap:9px;align-items:center;font-size:7.8pt;margin-bottom:7px}
.page .gi .ic{width:22px;height:22px}
.page .pi{display:flex;align-items:center;gap:11px;margin-bottom:9px;position:relative}
.page .pi .k{font-size:20pt;font-weight:800;line-height:1;width:36px;text-align:center}
.page .pi p{font-size:7.8pt;line-height:1.35;margin:0}
.page .pi p b{display:block;font-weight:700;font-size:8.3pt}
.page .box.dk .sm{font-size:6.8pt;opacity:.75;margin:10px 0 0;position:relative}
.page .cond{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;font-size:6.9pt;color:var(--mute)}
.page .cond p{padding-left:10px;position:relative;margin:0}
.page .cond p i{position:absolute;left:0;top:5px;width:4px;height:4px;background:var(--gr);border-radius:50%}
.page .sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px}
.page .sign div{border-top:1.5px solid var(--ink);padding-top:6px;font-size:7.4pt;color:var(--mute)}
.page .sign b{display:block;font-weight:700;font-size:8.6pt;color:var(--ink)}
.page .sign{align-items:end}
.page .sign .stamp{border:1px solid #cfe0d8;background:#f2f6f4;border-radius:10px;padding:8px 11px;margin-bottom:10px;font-size:7.4pt;line-height:1.45;color:#2b3532}
.page .sign .stamp .st{display:flex;align-items:center;gap:6px;font-weight:700;font-size:8.4pt;color:#085946;margin-bottom:2px}
.page .sign .stamp .st i{width:13px;height:13px;border-radius:50%;background:#085946;display:inline-flex;align-items:center;justify-content:center}
.page .sign .stamp code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:6.8pt;color:#6b7470;letter-spacing:.4px}
.page .sign .sigspace{height:62px}
.page .sign .stamp div{border:none;padding:0;font-size:inherit;color:inherit}
.page .sign .stamp .st{font-size:8.4pt;color:#085946}
.chk{flex-direction:row;align-items:center;gap:8px;font-size:12px;color:var(--fg)}
.chk input{width:auto}
.page .strip{position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,#085946 0%,#085946 70%,#a6a6a6 70%,#a6a6a6 100%)}
`;

const ICONS = {
 chip:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
 onda:'<path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 10v4"/>',
 bateria:'<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4"/>',
 bluetooth:'<path d="M7 7l10 10-5 5V2l5 5L7 17"/>',
 celular:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
 agua:'<path d="M12 2.7l5.7 5.6a8 8 0 1 1-11.3 0z"/>',
 ia:'<path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
 oido:'<path d="M6 8.5a6 6 0 1 1 12 0c0 6-6 6-6 10a3.5 3.5 0 0 1-6.5 1"/><path d="M15 8.5a3 3 0 0 0-6 0"/>',
 enfoque:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 hoja:'<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/>',
 tv:'<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M8 21h8"/>',
 ajustes:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
 escudo:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
 mundo:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
 cargador:'<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
 cambio:'<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
 limpieza:'<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
 estuche:'<rect x="3" y="8" width="18" height="12" rx="4"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>',
 check:'<path d="M20 6L9 17l-5-5"/>'
};
const icon = (n)=>`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#085946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||ICONS.check}</svg>`;

export const ICON_NAMES = Object.keys(ICONS);

/** Catálogo base para precargar opciones (atributos verificados de cada referencia). */
export const CATALOGO_COTIZACION = {
 allure:{nombre:"Widex Allure 220",linea:"RIC R D · Chip W1",sub:"RIC R D · Plataforma 2025",corto:"RIC R D",tag:"Lo más reciente",img:"/img/productos/widex/allure.webp",precio:8314000,dto:5,feats:[
  {i:"chip",t:"Chip W1",d:"Aprox. 4 veces más velocidad y memoria."},
  {i:"onda",t:"PureSound + ZeroDelay",d:"Procesamiento de 0,5 ms, sonido natural."},
  {i:"enfoque",t:"Clasificador de entornos",d:"Se adapta automáticamente en tiempo real."},
  {i:"bluetooth",t:"Bluetooth LE Audio",d:"Preparado para Auracast (actualización futura)."},
  {i:"celular",t:"Llamadas manos libres",d:"iPhone y Android compatibles."},
  {i:"bateria",t:"Recargable · IP68",d:"Hasta ~25 h por carga; resistente a polvo y agua."}]},
 smartric:{nombre:"Widex SmartRIC 220",linea:"RIC en L · Hasta 37 h",sub:"Diseño en forma de L",corto:"RIC en L",tag:"Mayor autonomía",img:"/img/productos/widex/smartric.webp",precio:7470000,dto:10,feats:[
  {i:"oido",t:"Diseño en L",d:"Micrófonos alineados con la mirada (~12°) para enfocar la voz."},
  {i:"onda",t:"PureSound + ZeroDelay",d:"Sonido natural, sin efecto metálico."},
  {i:"bateria",t:"Hasta 37 h por carga",d:"Más de un día completo de uso."},
  {i:"estuche",t:"Estuche portátil",d:"Varias cargas completas; USB-C e inalámbrico."},
  {i:"ia",t:"Inteligencia artificial",d:"MySound / SoundSense Learn personalizan el sonido."},
  {i:"celular",t:"Streaming",d:"iPhone y Android compatibles; control por app."}]},
 moment:{nombre:"Widex Moment 220",linea:"Sheer sRIC R D",sub:"Sheer sRIC R D",corto:"Sheer sRIC R D",tag:"Discreto y versátil",img:"/img/productos/widex/moment.webp",precio:6963000,dto:10,feats:[
  {i:"onda",t:"PureSound + ZeroDelay",d:"Reconocido por su naturalidad sonora."},
  {i:"ajustes",t:"Speech Enhancer",d:"Habla más clara con reducción de ruido."},
  {i:"ia",t:"SoundSense Adapt",d:"App Moment con SoundSense Learn."},
  {i:"hoja",t:"Zen / Relax",d:"Sonidos de apoyo en el manejo de tinnitus."},
  {i:"tv",t:"Streaming",d:"iOS, Android compatibles y TV PLAY."},
  {i:"agua",t:"Recargable · IP68",d:"Ion-litio; resistente a polvo y agua."}]},
 blank:{nombre:"Nuevo producto",linea:"",sub:"",corto:"",tag:"",img:"",precio:0,dto:0,feats:[
  {i:"onda",t:"",d:""},{i:"bateria",t:"",d:""},{i:"celular",t:"",d:""},{i:"ia",t:"",d:""},{i:"agua",t:"",d:""},{i:"check",t:"",d:""}]}
};

const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const bold = s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
const money = n=>"$ "+Math.round(Number(n)||0).toLocaleString("es-CO");
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MES3=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function parseD(iso){const [y,m,d]=(iso||new Date().toISOString().slice(0,10)).split("-").map(Number);return new Date(y,m-1,d);}
const largo = d=>`${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
const corto = d=>`${d.getDate()} ${MES3[d.getMonth()]} ${d.getFullYear()}`;
const numd = d=>`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
const PALABRAS=["","Una alternativa","Dos alternativas","Tres alternativas"];

const CHECK='<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

export const net = (p) => Math.round((Number(p.precio) || 0) * (1 - (Number(p.dto) || 0) / 100));

/** Devuelve el HTML de las 3 hojas. S: datos de la propuesta; IMG: logos. */
export function renderPropuestaPages(S, IMG) {
  const toks = (t) => String(t || '').replace(/\{paciente\}/g, S.paciente).replace(/\{nombre\}/g, (S.paciente || '').split(' ')[0]).replace(/\{profesional\}/g, S.profesional);
  const imgSrc = (p) => (IMG[p.img] || p.img || '');
  const firmaCodigo = () => S.codigoFirma || '—';
  const d0=parseD(S.fecha), d1=new Date(d0); d1.setDate(d1.getDate()+Number(S.vigencia||0));
  const P=S.productos, q=Number(S.cantidad)||2, e=S.e;
  const foot=(txt,i)=>`<div class="foot"><span>${txt}</span><span class="dots">${[0,1,2].map(k=>`<i class="${k===i?"on":""}"></i>`).join("")}</span></div><div class="strip"></div>`;
  const p1=`<section class="page">
   <div class="hero"><div class="c1"></div><div class="c2"></div><div class="c3"></div>
    <div class="htop"><img src="${IMG.logow}" alt="OírConecta"><div class="num">Cotización<b>${esc(S.numero)}</b></div></div>
    <h1>Propuesta auditiva<b>personalizada</b></h1>
    <p class="sub">${PALABRAS[P.length]||P.length+" alternativas"} de tecnología Widex, ${P.length===1?"elegida":"elegidas"} según la valoración audiológica de ${esc(S.paciente)}.</p>
    <div class="pills"><span class="pill">Emitida ${corto(d0)}</span><span class="pill">Vigencia ${esc(S.vigencia)} días</span><span class="pill">Adaptación ${q===2?"binaural":"monoaural"}</span></div>
   </div>
   <div class="in">
    <div class="cards3" style="grid-template-columns:repeat(${Math.max(P.length,1)},1fr)">${P.map(p=>`
     <div class="mini"><div class="ph">${imgSrc(p)?`<img src="${imgSrc(p)}" alt="">`:""}</div><div class="bd"><h3>${esc(p.nombre.replace(/^Widex\s+/i,""))}</h3><div class="lv">${esc(p.linea)}</div>
     <div class="pr"><small>Por unidad</small>${money(net(p))}</div>${Number(p.dto)>0?`<div class="old">${money(p.precio)}</div><span class="off">−${esc(p.dto)}%</span>`:""}</div></div>`).join("")}
    </div>
    <div class="info">
     <div><div class="eyebrow">Paciente</div><p><b>${esc(S.paciente)}</b></p></div>
     <div><div class="eyebrow">Profesional</div><p><b>${esc(S.profesional)}</b><br>${esc(S.cargo)}</p></div>
     <div><div class="eyebrow">Fecha · Vigencia</div><p><b>${numd(d0)}</b><br>Válida hasta el ${numd(d1)}</p></div>
    </div>
    <div class="letter">
     <div><div class="eyebrow">${esc(e.razon)}</div><p style="font-size:7.4pt;margin-top:4px">NIT ${esc(e.nit)}\n${esc(e.dir)}\n${esc(e.cons)}\n${esc(e.edif)}\n${esc(e.ciudad)}</p></div>
     <div>${toks(S.intro).split("\n").filter(x=>x.trim()).map(x=>`<p>${esc(x).replace(new RegExp(esc((S.paciente||"").split(" ")[0])||"^$"),m=>`<b>${m}</b>`)}</p>`).join("")}</div>
    </div>
   </div>${foot(`${esc(e.email)} · ${esc(e.web)}`,0)}</section>`;

  const p2=`<section class="page">
   <div class="ph2"><div><div class="eyebrow">Alternativas recomendadas</div><h2>Tecnología Widex <span>a su medida</span></h2></div><img src="${IMG.logo}" alt=""></div>
   <div class="in">${P.map((p,k)=>`
    <div class="prod"><div class="im"><span class="n">${String(k+1).padStart(2,"0")}</span>${imgSrc(p)?`<img src="${imgSrc(p)}" alt="">`:""}</div>
     <div class="bd"><div class="hd"><h3>${esc(p.nombre)}<span>${esc(p.sub)}</span></h3>${p.tag?`<span class="tag">${esc(p.tag)}</span>`:""}</div>
      <div class="feats">${p.feats.filter(f=>f.t||f.d).map(f=>`<div class="ft"><span class="ic">${icon(f.i)}</span><div><b>${esc(f.t)}</b>${esc(f.d)}</div></div>`).join("")}</div>
      <div class="price"><span>Valor unitario <s>${money(p.precio)}</s>${Number(p.dto)>0?` · descuento ${esc(p.dto)}%`:""}</span><span>Neto por unidad<b>${money(net(p))}</b></span></div>
     </div></div>`).join("")}
    <p class="note">Características según información del fabricante; la autonomía de batería varía según el uso y el tiempo de streaming.</p>
   </div>${foot(`${esc(e.razon)} · NIT ${esc(e.nit)} · ${esc(S.numero)}`,1)}</section>`;

  const p3=`<section class="page">
   <div class="ph2"><div><div class="eyebrow">Inversión y beneficios</div><h2>Su inversión <span>en bienestar auditivo</span></h2></div><img src="${IMG.logo}" alt=""></div>
   <div class="in">
    <table><thead><tr><th>Referencia</th><th>Valor unitario</th><th>Descuento</th><th>Neto unitario</th><th style="text-align:center">${q===2?"Total par":"Total"}</th></tr></thead><tbody>
    ${P.map((p,k)=>`<tr><td><div class="nm">${imgSrc(p)?`<img src="${imgSrc(p)}" alt="">`:""}<div><b>${esc(p.nombre)}</b><small>${esc(p.corto)}</small></div></div></td><td>${money(p.precio)}</td>
     <td class="dto">${Number(p.dto)>0?`<span>${esc(p.dto)}%</span>−${money(p.precio-net(p))}`:"—"}</td><td>${money(net(p))}</td>
     <td class="tot" style="border-radius:${k===0?"10px 10px ":"0 0 "}${k===P.length-1?"10px 10px":"0 0"}">${money(net(p)*q)}</td></tr>`).join("")}
    </tbody></table>
    <p class="note">Valores en pesos colombianos (COP).${q===2?" El total par corresponde a adaptación binaural (2 unidades).":""}</p>
    <div class="valid"><div class="big">${esc(S.vigencia)}<small>días</small></div><p><b>Vigencia de la cotización:</b> del ${largo(d0).replace(/ de \d{4}$/,"")} al ${largo(d1)}. Los descuentos aplican únicamente dentro de este periodo.</p></div>
    <div class="cols">
     <div class="box"><h4>Garantías de producto</h4>${S.garantias.map(g=>`<div class="gi"><span class="ic">${icon(g.i)}</span><div>${bold(g.t)}</div></div>`).join("")}</div>
     <div class="box dk"><div class="ring"></div><h4>Plan de acompañamiento audiológico</h4>${S.plan.map(x=>`<div class="pi"><span class="k">${esc(x.n)}</span><p><b>${esc(x.t)}</b>${esc(x.d)}</p></div>`).join("")}
      <p class="sm">${esc(toks(S.planNota))}</p></div>
    </div>
    <div class="cond">${String(S.condiciones||"").split("\n").filter(x=>x.trim()).map(x=>`<p><i></i>${esc(x)}</p>`).join("")}</div>
    <div class="sign"><div style="border:none;padding:0">${S.firma&&S.firma.on?`<div class="stamp"><div class="st"><i>${CHECK}</i>Firmado electrónicamente</div>${esc(S.profesional)} · ${esc(e.razon.replace(/\s*S\.A\.S\.?/i,""))}<br>${numd(d0)}<br><code>Código: ${firmaCodigo()}</code></div>`:`<div class="sigspace"></div>`}<div style="border-top:1.5px solid #17231f;padding-top:6px;font-size:7.4pt;color:#5d6964"><b>${esc(S.profesional)}</b>${esc(S.cargo)} · ${esc(e.razon.replace(/\s*S\.A\.S\.?/i,""))}</div></div><div><b>${esc(S.paciente)}</b>Paciente · Alternativa elegida: ____________________</div></div>
   </div>${foot(`${esc(e.dir)}, ${esc(e.cons)}, ${esc(e.edif)} · ${esc(e.ciudad)} · ${esc(e.email)}`,2)}</section>`;
  return [p1, p2, p3];
}

/** Genera y descarga el PDF. Con opts.fichas, las agrega al final (PDF o imagen). */
export async function descargarPropuestaPdf(S, IMG, filename, opts = {}) {
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-20000px;top:0';
  holder.innerHTML = `<style>${PROPUESTA_CSS} .page .mini{box-shadow:none;border:1px solid #dfe8e4}</style>` + renderPropuestaPages(S, IMG).join('');
  document.body.appendChild(holder);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...holder.querySelectorAll('img')].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
    const els = [...holder.querySelectorAll('.page')];
    for (let i = 0; i < els.length; i++) {
      const c = await html2canvas(els[i], { scale: 2.5, backgroundColor: '#ffffff', useCORS: true, logging: false, width: 816, height: 1056, windowWidth: 816 });
      if (i > 0) pdf.addPage('letter', 'portrait');
      pdf.addImage(c.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 8.5, 11);
    }
    if (opts.fichas?.length) {
      await guardarConFichas(pdf, opts.fichas, filename);
    } else {
      pdf.save(filename);
    }
  } finally {
    holder.remove();
  }
}

export const EMPRESA = {
  razon: 'Oír Conecta S.A.S.', nit: '901.416.762-9', dir: 'Carrera 10 # 95-25', cons: 'Consultorio 320',
  edif: 'Edificio Centro Ejecutivo', ciudad: 'Bogotá D.C.', email: 'conversemos@oirconecta.com', web: 'oirconecta.com',
};

export const PROPUESTA_DEFAULTS = {
  intro: 'Estimado {nombre}:\nGracias por confiar en nosotros. Con base en su valoración, la {profesional} seleccionó estas alternativas de tecnología Widex, todas recargables y con conexión a su celular. Incluyen garantía, mantenimientos preventivos y un plan de acompañamiento audiológico con controles, evaluaciones anuales y teleconsultas.\nEn las páginas siguientes encontrará el detalle de cada opción, la inversión y las condiciones de la propuesta.',
  garantias: [
    { i: 'escudo', t: '**2 años** de garantía por defectos de fábrica.' },
    { i: 'mundo', t: '**1 año** de garantía internacional.' },
    { i: 'cargador', t: '**2 años** de garantía en el cargador por defectos de fábrica.' },
    { i: 'cambio', t: '**1 cambio de receptor** en el canal por uso.' },
    { i: 'limpieza', t: '**4 limpiezas** y mantenimientos preventivos.' },
  ],
  plan: [
    { n: '6', t: 'Controles posadaptación', d: 'Durante los 2 años de garantía.' },
    { n: '2', t: 'Evaluaciones anuales', d: 'De control audiológico.' },
    { n: '2', t: 'Teleconsultas', d: 'Con su audióloga, desde casa.' },
  ],
  planNota: 'A cargo de la {profesional} · Consultorio 320, Edificio Centro Ejecutivo.',
  condiciones: 'Garantías y plan audiológico aplican para las referencias cotizadas.\nLa garantía no cubre golpes, humedad extrema, manipulación indebida ni pérdida.\nLos descuentos aplican sobre el valor unitario indicado.\nProgramación y ajustes finales según la audiometría del paciente.',
};

export const LOGOS = { logo: '/logo-oirconecta.png', logow: '/logo-oirconecta-blanco.png' };

/** Convierte una propuesta de la API (/api/crm/cotizaciones/:id) en los datos del PDF. */
export function propuestaDesdeApi(p) {
  return {
    numero: p.numero,
    fecha: new Date(p.createdAt).toISOString().slice(0, 10),
    vigencia: p.vigenciaDias || 15,
    cantidad: p.opciones?.[0]?.cantidad || 2,
    paciente: p.paciente?.nombre || '',
    profesional: p.profesional || 'Equipo OírConecta',
    cargo: p.cargo || 'Audióloga',
    intro: p.intro || PROPUESTA_DEFAULTS.intro,
    productos: (p.opciones || []).map((o) => ({
      nombre: o.nombre, linea: o.linea || o.tecnologia || '', sub: o.sub || o.plataforma || '', corto: o.corto || o.tecnologia || '',
      tag: o.etiqueta || '', img: o.imagen || '', precio: o.valorUnitario, dto: o.descuento || 0, feats: o.atributos || [],
    })),
    garantias: p.garantias || PROPUESTA_DEFAULTS.garantias,
    plan: p.plan || PROPUESTA_DEFAULTS.plan,
    planNota: PROPUESTA_DEFAULTS.planNota,
    condiciones: p.condiciones || PROPUESTA_DEFAULTS.condiciones,
    e: EMPRESA,
    firma: { on: true },
    codigoFirma: p.codigoFirma,
  };
}

/** Imagen (cualquier formato del navegador) → JPEG para incrustarla en el PDF. */
async function imagenAJpeg(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
    const b = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
    return { bytes: await b.arrayBuffer(), w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}

/** Une la propuesta con las fichas técnicas y descarga el resultado. */
async function guardarConFichas(pdf, fichas, filename) {
  const doc = await PDFDocument.load(pdf.output('arraybuffer'));
  const W = 612; const H = 792; // carta en puntos
  for (const f of fichas) {
    try {
      const r = await fetch(f.url);
      const blob = await r.blob();
      const tipo = blob.type || f.tipo || '';
      if (tipo.includes('pdf') || /\.pdf($|\?)/i.test(f.url)) {
        const src = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
        const pages = await doc.copyPages(src, src.getPageIndices());
        pages.forEach((p) => doc.addPage(p));
      } else {
        const { bytes, w, h } = await imagenAJpeg(blob);
        const img = await doc.embedJpg(bytes);
        const page = doc.addPage([W, H]);
        const sc = Math.min((W - 48) / w, (H - 48) / h);
        page.drawImage(img, { x: (W - w * sc) / 2, y: (H - h * sc) / 2, width: w * sc, height: h * sc });
      }
    } catch (e) {
      console.warn('[propuesta] no se pudo adjuntar la ficha', f.nombre, e);
    }
  }
  const out = await doc.save();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
