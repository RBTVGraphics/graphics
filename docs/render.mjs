import {clips,segments,playing,countdownVisible,templates} from "./graphics.mjs";
import {segmentLayouts} from "./segment-render.mjs";
import {linkedImage} from "./image-links.mjs";
export function el(tag,cls,text) {
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  if(text!==undefined) n.textContent=text;
  return n;
}
const add=(parent,tag,cls,text)=>parent.appendChild(el(tag,cls,text));
const brand=(parent,cls="brandmark")=>{
  const img=add(parent,"img",cls); img.src="./media/prep-signal.png"; img.alt="The Prep Signal · RBTV"; return img;
};
const signal=(parent)=>{
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 460 48"); svg.setAttribute("aria-hidden","true"); svg.classList.add("wave");
  const path=document.createElementNS(svg.namespaceURI,"path");
  path.setAttribute("d","M0 26 H128 L141 23 L151 29 L164 14 L180 40 L196 5 L215 43 L231 11 L246 33 L260 20 L275 28 L288 26 H460");
  svg.append(path);parent.append(svg);
};
function videoNode(parent,cue,{mode,muted}){
  const clip=clips[cue.data.clip];
  if(!clip)return;
  if(mode==="preview") {
    parent.classList.add("clip-preview");
    add(parent,"div","play-icon","▶");
    add(parent,"h2","slate-title",clip.name);
    add(parent,"div","slate-detail",`PLAYBACK / ${clip.seconds} SEC`);
    return;
  }
  const video=add(parent,"video","playback");
  video.src="./"+clip.file;
  video.playsInline=true;
  video.muted=muted;
  video.preload="auto";
  const start=()=>{
    if(!video.isConnected || Date.now()>=cue.until)return;
    const seek=Math.max(0,(Date.now()-cue.at)/1000);
    if(seek>0.1 && video.readyState>=1) video.currentTime=seek;
    video.play().catch(()=>{
      if(video.isConnected && Date.now()<cue.until) {video.muted=true;video.play().catch(()=>{});}
    });
  };
  const wait=Math.max(0,cue.at-Date.now());
  if(video.readyState>=1)setTimeout(start,wait);
  else video.addEventListener("loadedmetadata",()=>setTimeout(start,Math.max(0,cue.at-Date.now())),{once:true});
  video.addEventListener("ended",()=>parent.classList.add("video-ended"),{once:true});
  video.addEventListener("error",()=>parent.classList.add("video-ended"),{once:true});
}

function board(n,d,type){
  n.classList.add("sports-board","sports-"+type);
  const themes={
    picks:["LOCK THE SIGNAL","PICKS BOARD","WHO WINS?"],
    rankings:["SIGNAL STRENGTH","POWER RANKINGS","RBTV STUDENT PANEL RANKINGS"],
    countdown:["THE SIGNAL THREE","TOP-THREE COUNTDOWN","COUNTING DOWN TO NO. 1"],
  };
  const [title,kicker,footer]=themes[type];
  const shell=add(n,"div","board-shell"), top=add(shell,"header","board-top");
  brand(top);add(top,"div","board-kicker","RBTV  /  "+kicker);
  const head=add(shell,"div","board-heading");
  add(head,"h2","board-title",title);
  const context=add(head,"p","board-context",d.context?.trim()||"");context.hidden=!context.textContent;
  const rows=add(shell,"div","board-rows");
  for(const rank of type==="countdown"?[3,2,1]:[1,2,3]){
    const host=d["host"+rank]?.trim(), pick=d["pick"+rank]?.trim();
    if(type==="picks"&&!host&&!pick&&!d["reason"+rank]?.trim())continue;
    const revealed=type!=="countdown"||countdownVisible(rank,d.reveal);
    const row=add(rows,"div","board-row"+(revealed?"":" board-row-locked"));
    const badge=add(row,"span","board-badge",String(rank).padStart(2,"0"));
    if(type==="picks"){
      badge.setAttribute("aria-hidden","true");
      add(row,"div","board-host",host||"—");
    }
    const content=add(row,"div","board-copy");
    const headline=type==="picks"?pick:d[(type==="rankings"?"team":"item")+rank]?.trim();
    const detail=type==="picks"?d["reason"+rank]:d["note"+rank];
    add(content,"div","board-primary",revealed?(headline||"—"):"STILL TO COME");
    if(revealed&&detail?.trim())add(content,"div","board-note",detail.trim());
    if(revealed)linkedImage(row,d["art"+rank],type==="countdown"?"countdown-still":"board-logo");
  }
  if(!rows.childElementCount)add(rows,"p","board-empty","No picks entered");
  const bottom=add(shell,"footer","board-foot");
  add(bottom,"span",null,type==="rankings"&&d.criteria?.trim()?"RBTV PANEL  /  "+d.criteria.trim():footer);
  signal(bottom);
}

// Layouts are keyed by template ID. Use textContent for all user-entered content.
const layouts={
  name(n,d){add(n,"div","g-tag","THE PREP SIGNAL");add(n,"div","lower-title",d.name||"Name");add(n,"div","lower-sub",d.role||"");},
  topic(n,d){add(n,"div","g-tag",d.tag||"TALKING POINT");add(n,"div","lower-title topic-title",d.headline||"Talking point");},
  quote(n,d){add(n,"div","g-tag",d.tag||"QUOTE / STAT");add(n,"div","feature-title",d.headline||"Quote or stat");add(n,"div","feature-sub",d.source||"");},
  matchup(n,d){
    add(n,"div","g-tag",d.tag||"MATCHUP");
    const row=add(n,"div","teams");
    const a=add(row,"div","match-team");linkedImage(a,d.awayLogo,"match-logo");add(a,"span",null,d.away||"Team A");
    add(row,"b",null,"VS");
    const b=add(row,"div","match-team");linkedImage(b,d.homeLogo,"match-logo");add(b,"span",null,d.home||"Team B");
    add(n,"div","feature-sub",d.detail||"");
  },
  picks(n,d){board(n,d,"picks");},
  rankings(n,d){board(n,d,"rankings");},
  countdown(n,d){board(n,d,"countdown");},
  segment(n,d){const card=add(n,"div","slate-card");brand(card);add(card,"div","g-tag","THE PREP SIGNAL / SEGMENTS");add(card,"h2","slate-title",d.segment);signal(card);add(card,"div","slate-detail",d.detail||segments[d.segment]||"");},
  ticker(n,d){
    add(n,"span","ticker-tag",d.tag||"HEADLINES");
    const rail=add(n,"div","ticker-rail"), loop=add(rail,"div","ticker-loop");
    const headlines=(d.text||"").split("|").map(s=>s.trim()).filter(Boolean).join("  ◆  ")||"The Prep Signal";
    const text=(headlines+"  ◆  ").repeat(Math.max(2,Math.ceil(150/(headlines.length+5))));
    const copy=add(loop,"span",null,text);
    add(loop,"span",null,text).setAttribute("aria-hidden","true");
    loop.style.setProperty("--pace",Math.max(18,copy.offsetWidth/115)+"s");
  },
  bug(n,d){brand(n);if(d.label)add(n,"div","bug-label",d.label);},
  video(n,d,options,cue){videoNode(n,cue,options);},
  ...segmentLayouts(add,brand,signal),
};

export function createRenderer(host,options={mode:"output",muted:false}) {
  const scene=add(host,"div","graphics-scene");
  const fit=()=>scene.style.transform=`translate(-50%,-50%) scale(${Math.min(host.clientWidth/1920,host.clientHeight/1080)})`;
  new ResizeObserver(fit).observe(host);fit();
  const mounted=new Map();
  let previous=null;
  return (state)=>{
    if(previous!==state.session){for(const entry of mounted.values()) entry.node.remove(); mounted.clear(); previous=state.session;}
    if(state.cleared)scene.querySelectorAll(".gfx.exit").forEach(node=>node.remove());
    const on=new Map(playing(state));
    scene.classList.toggle("with-ticker",on.has("ticker"));
    for(const [layer,entry] of mounted){
      const current=on.get(layer);
      if(current?.instance===entry.instance)continue;
      entry.node.querySelector("video")?.pause();
      const isBoard=t=>templates[t]?.board||templates[t]?.segment;
      const replacingBoard=layer==="full"&&current&&(isBoard(current.type)||isBoard(entry.node.dataset.kind));
      if(entry.node.dataset.kind==="video" || options.mode==="preview" || state.cleared || replacingBoard)entry.node.remove();
      else {entry.node.classList.add("exit");setTimeout(()=>entry.node.remove(),240);}
      mounted.delete(layer);
    }
    for(const [layer,cue] of on) {
      if(mounted.has(layer)||!Object.hasOwn(layouts,cue.type))continue;
      const n=el("div",`gfx gfx-${cue.type} layer-${layer}`);
      n.dataset.kind=cue.type;
      scene.append(n);
      layouts[cue.type](n,cue.data,options,cue);
      mounted.set(layer,{instance:cue.instance,node:n});
    }
  };
}
