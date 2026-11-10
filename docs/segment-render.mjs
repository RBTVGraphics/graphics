import {segmentLibrary} from "./segments.mjs";
import {segmentGraphics} from "./segment-graphics.mjs";
import {linkedImage} from "./image-links.mjs";

const segmentTitles=Object.fromEntries(segmentLibrary.map(s=>[s.id,s.title]));
const clean=value=>value?.trim()||"";
const focusPositions={"Upper left":"ul","Upper right":"ur",Center:"center","Lower left":"ll","Lower right":"lr"};

export function segmentLayouts(add,brand,signal){
  const line=(parent,cls,value,fallback="")=>{
    const copy=clean(value)||fallback;
    return copy?add(parent,"div",cls,copy):null;
  };
  const titleFor=cfg=>segmentTitles[cfg.segment].toUpperCase();
  const footer=(shell,copy)=>{
    const foot=add(shell,"footer","board-foot");
    add(foot,"span",null,copy);signal(foot);
  };
  function full(n,cfg,context){
    n.classList.add("sports-board","sports-custom","sports-"+cfg.layout);
    const shell=add(n,"div","board-shell"),top=add(shell,"header","board-top");
    brand(top);add(top,"div","board-kicker","RBTV  /  "+cfg.name);
    const head=add(shell,"div","board-heading");
    add(head,"h2","board-title",titleFor(cfg));line(head,"board-context",context);
    return shell;
  }
  function tile(parent,label,title,detail,extra=""){
    const box=add(parent,"article","sport-tile "+extra);
    add(box,"div","tile-label",label);line(box,"tile-title",title,"—");line(box,"tile-detail",detail);
    return box;
  }
  function lower(n,cfg,headline,sub,meta){
    n.classList.add("sport-segment-lower");
    const box=add(n,"div","sport-lower-shell");
    const tag=add(box,"div","sport-label");add(tag,"b",null,titleFor(cfg));add(tag,"span",null,"RBTV");
    line(box,"sport-lower-title",headline,"—");line(box,"sport-lower-detail",sub);line(box,"sport-lower-meta",meta);
    return box;
  }
  function side(n,cfg){
    n.classList.add("sport-segment-side");
    const tag=add(n,"div","sport-label");add(tag,"b",null,titleFor(cfg));add(tag,"span",null,"RBTV");
    return add(n,"div","sport-side-copy");
  }
  function list(n,d,cfg,mode){
    const shell=full(n,cfg,d.context),rows=add(shell,"div","board-rows");
    for(let i=1;i<=3;i++){
      const headline=d["event"+i],score=mode==="results"?d["result"+i]:d["time"+i],detail=mode==="results"?d["note"+i]:d["where"+i];
      if(![headline,score,detail].some(clean))continue;
      const row=add(rows,"div","board-row segment-list-row");
      add(row,"span","board-badge",String(i).padStart(2,"0")).setAttribute("aria-hidden","true");
      const copy=add(row,"div","board-copy results-copy");
      linkedImage(copy,d["art"+i],"result-logo");
      const text=add(copy,"div","result-text");
      line(text,"board-primary",headline,"—");line(text,"board-note",detail);
      line(row,"segment-list-value",score,"—");
    }
    if(!rows.childElementCount)add(rows,"p","board-empty",mode==="results"?"No results entered":"No events entered");
    footer(shell,mode==="results"?"ILLINOIS HIGH SCHOOL SPORTS  /  WEEK IN REVIEW":"ILLINOIS HIGH SCHOOL SPORTS  /  WATCH LIST");
  }
  const layout={
    results(n,d,c){list(n,d,c,"results");},
    schedule(n,d,c){list(n,d,c,"schedule");},
    guest(n,d,c){linkedImage(lower(n,c,d.guest,d.role,d.topic),d.portrait,"guest-portrait");},
    closing(n,d,c){lower(n,c,d.takeaway,clean(d.host)&&"FINAL WORD FROM "+d.host,d.reason);},
    replay(n,d,c){
      n.classList.add("sport-replay");
      linkedImage(n,d.still,"replay-still");
      const focus=focusPositions[d.focus];
      if(focus){const marker=add(n,"div","replay-marker marker-"+focus);marker.setAttribute("aria-hidden","true");}
      lower(n,c,d.headline,d.detail);
    },
    debate(n,d,c){
      const shell=full(n,c,d.question),panels=add(shell,"div","sport-tiles sport-pair");
      tile(panels,"01  /  THE TAKE",d.claim,d.claimEvidence,"tile-navy");
      tile(panels,"02  /  THE COUNTER",d.counter,d.counterEvidence);
      footer(shell,"TWO PERSPECTIVES  /  BRING THE EVIDENCE");
    },
    spotlight(n,d,c){
      const box=side(n,c);line(box,"sport-side-title",d.subject,"—");line(box,"sport-side-kicker",d.school);
      line(box,"sport-side-story",d.achievement);linkedImage(box,d.photo,"side-photo");
      if(clean(d.stat)){const stat=add(box,"div","side-stat");line(stat,"side-stat-value",d.stat);line(stat,"side-stat-label",d.statLabel);}
    },
    upset(n,d,c){
      const shell=full(n,c,d.context),panels=add(shell,"div","sport-tiles sport-versus");
      linkedImage(tile(panels,"THE FAVORITE",d.favorite,"","tile-navy"),d.favoriteLogo,"tile-logo");
      add(panels,"span","sport-vs","VS");
      linkedImage(tile(panels,"THE CHALLENGER",d.challenger,"","tile-royal"),d.challengerLogo,"tile-logo");
      const pivot=add(shell,"div","sport-pivot");
      add(pivot,"div","tile-label","THE UPSET KEY");
      line(pivot,"tile-title",d.why,"—");
      footer(shell,"MATCHUP ANALYSIS  /  THE PREP SIGNAL");
    },
    timeline(n,d,c){
      const shell=full(n,c,d.context),panels=add(shell,"div","sport-tiles sport-trio");
      tile(panels,"01  /  BEFORE",d.before,d.beforeNote);
      linkedImage(tile(panels,"02  /  THE MOMENT",d.turn,d.turnNote,"tile-royal"),d.turnStill,"tile-still");
      tile(panels,"03  /  AFTER",d.after,d.afterNote);
      footer(shell,"ONE MOMENT  /  WHAT CHANGED");
    },
    stat(n,d,c){
      const shell=full(n,c,d.context),panels=add(shell,"div","sport-tiles stat-panels");
      const value=tile(panels,"THE NUMBER",d.value,d.measure,"tile-royal stat-value");
      value.querySelector(".tile-title").classList.toggle("stat-compact",clean(d.value).length>7);
      const meaning=tile(panels,"WHAT IT TELLS US",d.meaning,"","stat-meaning");
      if(clean(d.caveat)){add(meaning,"div","tile-label stat-caveat","WHAT IT MISSES");line(meaning,"tile-detail",d.caveat);}
      footer(shell,clean(d.source)?"SOURCE  /  "+d.source:"RBTV  /  STAT BREAKDOWN");
    },
    dateline(n,d,c){
      const box=side(n,c),row=add(box,"div","dateline-row"),map=add(row,"div","dateline-map");
      const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"), shape=document.createElementNS(svg.namespaceURI,"path");
      svg.setAttribute("viewBox","0 0 96 126");svg.setAttribute("aria-hidden","true");
      shape.setAttribute("d","M20 8H68L70 20L78 32V69L73 81L67 89L63 105L53 113L48 121L39 114L34 102L25 93L23 79L12 70L9 61L14 50L10 38L19 28L22 16Z");svg.append(shape);map.append(svg);
      const place=add(row,"div");line(place,"sport-side-title",d.place,"—");line(place,"sport-side-kicker",d.school);
      line(box,"sport-side-story",d.story);linkedImage(box,d.photo,"side-photo");
      if(clean(d.reporter))line(box,"side-stat-label reporter-credit","REPORTING  /  "+d.reporter);
    },
    rule(n,d,c){
      const shell=full(n,c,d.context),panels=add(shell,"div","sport-tiles sport-trio rules-trio");
      tile(panels,"01  /  THE CALL",d.call,"");
      tile(panels,"02  /  THE RULE",d.rule,"","tile-navy");
      linkedImage(tile(panels,"03  /  THE EXAMPLE",d.example,""),d.diagram,"tile-diagram");
      footer(shell,clean(d.source)?"RULE REFERENCE  /  "+d.source:"RULES EXPLAINED  /  THE PREP SIGNAL");
    },
  };
  return Object.fromEntries(Object.entries(segmentGraphics).map(([id,cfg])=>[id,(n,d)=>layout[cfg.layout](n,d,cfg)]));
}
