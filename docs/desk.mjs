import {templates,starter,clips,segmentLibrary,layers,initial,validCue,playing,graphicForSegment,backgrounds} from "./graphics.mjs";
import {createRenderer,el} from "./render.mjs";
import {connect} from "./transport.mjs";
import {imageURL,probeImage} from "./image-links.mjs";
import {imageAsset,imageExtension,imageTypes,maxImageBytes,getBrowserImage} from "./local-images.mjs";

const $=(id)=>document.getElementById(id);
const saveKey="rbtv-prep-signal:rundown:v1";
const layerNames={lower:"Lower third",feature:"Feature card",bug:"Show bug",ticker:"Ticker",full:"Full screen"};
let cues, selected, state=initial("waiting"), transport, connected=false, locked=false, busy=false, prevSerial=0, flash, lastActive="";
const preview=createRenderer($("preview"),{mode:"preview",muted:true});
const program=createRenderer($("program"),{mode:"program",muted:true});
function parseRundown(value){
  if(!Array.isArray(value)||value.length>250)throw Error("Use a rundown with 250 or fewer cues.");
  const parsed=value.map(validCue);
  if(new Set(parsed.map(c=>c.id)).size!==parsed.length)throw Error("The rundown contains duplicate cue IDs.");
  return parsed;
}
try {const saved=localStorage.getItem(saveKey);cues=saved?parseRundown(JSON.parse(saved)):starter.map(validCue);}
catch {cues=starter.map(validCue);}
selected=cues[0]?.id;
const current=()=>cues.find(c=>c.id===selected);
const uid=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,"0")).join("");
const notice=(text)=>{
  clearTimeout(flash);$("toast").textContent=text;flash=setTimeout(()=>$("toast").textContent="",3900);
};
const persist=()=>{try{localStorage.setItem(saveKey,JSON.stringify(cues));}catch{notice("This browser could not save the rundown. Export a backup.");}};
function button(text,handler,extra=""){
  const b=el("button",`button mini ${extra}`,text);b.type="button";b.addEventListener("click",handler);return b;
}
function drawList(){
  const active=playing(state), list=$("cue-list");
  const focused=document.activeElement?.dataset?.cueId;
  const scroll=list.scrollTop;
  list.replaceChildren();
  cues.forEach((cue,i)=>{
    const b=el("button","cue");
    b.type="button";b.dataset.cueId=cue.id;
    b.setAttribute("aria-current",String(cue.id===selected));
    b.append(el("span","cue-icon",templates[cue.type].icon));
    const desc=el("span","cue-main");
    desc.append(el("span","cue-name",cue.label),el("span","cue-type",templates[cue.type].name));
    const number=el("span","cue-number",String(i+1).padStart(2,"0"));
    if(active.some(([,c])=>c.id===cue.id))number.append(el("span","cue-live","LIVE"));
    b.append(desc,number);
    b.addEventListener("click",()=>{selected=cue.id;drawList();drawEditor();drawPreview();});
    list.append(b);
  });
  if(!cues.length)list.append(el("p","cue-type","No cues yet. Use Add to build your rundown."));
  list.scrollTop=scroll;
  if(focused)Array.from(list.children).find(b=>b.dataset.cueId===focused)?.focus({preventScroll:true});
}
function drawPreview(){
  const cue=current();
  $("preview-label").textContent=cue?.label||"Select a cue";
  preview({session:"preview",active:cue?{[templates[cue.type].layer]:{...cue,instance:++prevSerial}}:{}});
  $("take").disabled=!cue||!connected||locked||busy;
  $("clear").disabled=!connected||locked;
}
function input(label,value,change,opts={}){
  const wrap=el("label",null,label);
  const field=el(opts.choices?"select":opts.multiline?"textarea":"input");
  if(opts.choices)for(const item of opts.choices){
    const option=el("option",null,opts.clip?clips[item].name:item);option.value=item;field.append(option);
  }
  if(opts.max)field.maxLength=opts.max;
  field.value=value??"";
  wrap.append(field);
  if(!opts.image){field.addEventListener("input",()=>change(field.value));return wrap;}
  field.type="url";field.autocomplete="off";field.spellcheck=false;field.placeholder="https://…";
  field.setAttribute("aria-label",label);
  const assetControl=el("div","asset-control"), assetActions=el("div","asset-actions");
  const file=el("input");file.type="file";file.accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";file.hidden=true;
  file.setAttribute("aria-label","Upload file for "+label);
  const upload=button("Upload image",()=>file.click());
  upload.setAttribute("aria-label","Upload image for "+label);
  const remove=button("Remove image",()=>{attached=null;field.value="";change("");inspect();});
  const attachedNote=el("span","asset-file");
  assetActions.append(upload,remove);assetControl.append(wrap,assetActions,file,attachedNote);
  const status=el("small","image-status");
  status.id="image-status-"+uid();status.setAttribute("role","status");
  field.setAttribute("aria-describedby",status.id);assetControl.append(status);
  let timeout,revision=0,attached=imageAsset(value??"");
  if(attached)field.value="";
  const report=(state,text)=>{status.dataset.state=state;status.textContent=text;};
  const inspect=(repaint=false)=>{
    const raw=field.value, url=imageURL(raw), token=++revision;
    clearTimeout(timeout);
    remove.hidden=!attached&&!raw.trim();
    attachedNote.hidden=!attached;
    attachedNote.textContent=attached?(attached.mode==="studio"?"Studio file attached":"Browser file attached"):"";
    if(attached)report("loading","Checking attached image…");
    else if(!raw.trim())report("empty","Paste a link or upload a PNG, JPG or WebP (up to 8 MB).");
    else if(!url)report("error","Paste a direct HTTPS image link.");
    else report("loading","Checking image…");
    timeout=setTimeout(async()=>{
      if(!wrap.isConnected||token!==revision)return;
      if(repaint)drawPreview();
      if(attached){
        const ready=attached.mode==="studio"?await probeImage("./api/images/"+attached.file):!!(await getBrowserImage(attached.id).catch(()=>null));
        if(!wrap.isConnected||token!==revision)return;
        report(ready?"ready":"error",ready?"Uploaded image ready.":"Image not found on this setup. Upload it again.");
        return;
      }
      if(!url)return;
      const ready=await probeImage(url);
      if(!wrap.isConnected||token!==revision)return;
      report(ready?"ready":"error",ready?"Image ready in this browser.":"Image didn’t load. The text graphic still works.");
    },repaint?360:0);
  };
  field.addEventListener("input",()=>{attached=null;change(field.value,false);inspect(true);});
  file.addEventListener("change",async()=>{
    const picked=file.files[0];file.value="";
    if(!picked)return;
    if(!transport||!connected||locked){report("error","Connect to the studio before uploading.");return;}
    if(picked.size>maxImageBytes){report("error","Choose an image no larger than 8 MB.");return;}
    clearTimeout(timeout);const token=++revision;
    field.disabled=upload.disabled=remove.disabled=true;
    report("loading","Saving image…");
    try{
      const ext=imageExtension(await picked.slice(0,12).arrayBuffer());
      if(!ext)throw Error("Choose a PNG, JPG or WebP image.");
      const blob=picked.slice(0,picked.size,imageTypes[ext]);
      const decoded=await createImageBitmap(blob).catch(()=>{throw Error("This file could not be opened as an image.");});
      const tooLarge=decoded.width*decoded.height>40_000_000;decoded.close();
      if(tooLarge)throw Error("Choose an image under 40 megapixels.");
      const ref=await transport.upload(blob,ext);
      const asset=imageAsset(ref);if(!asset)throw Error("The image could not be saved.");
      if(token!==revision||!assetControl.isConnected)return;
      attached=asset;field.value="";change(ref);inspect();
    }catch(e){if(token===revision&&assetControl.isConnected)report("error",e.message||"The image could not be saved.");}
    finally{field.disabled=upload.disabled=remove.disabled=false;}
  });
  inspect();return assetControl;
}
function drawEditor(){
  const cue=current(), form=$("editor"), actions=$("editor-actions");
  form.replaceChildren();actions.replaceChildren();
  $("type-pill").textContent=cue?templates[cue.type].name:"";
  if(!cue){form.append(el("span","cue-type","Select or add a cue to prepare it."));return;}
  form.append(input("Rundown label",cue.label,v=>{cue.label=v;persist();drawList();drawPreview();},{max:80}));
  if(templates[cue.type].board)form.append(el("small","cue-type",cue.type==="countdown"?"Fill in all three plays. Choose what to reveal, then TAKE each stage. Hidden entries do not appear on air.":"This board stays on air until another full-screen cue replaces it or you turn it OFF."));
  if(templates[cue.type].help)form.append(el("small","cue-type",templates[cue.type].help));
  const groups=new Map();
  for(const f of templates[cue.type].fields){
    if(f.group&&!groups.has(f.group)){
      const group=el("fieldset");group.append(el("legend",null,f.group));form.append(group);groups.set(f.group,group);
    }
    (groups.get(f.group)??form).append(input(f.label,cue.data[f.id],(v,repaint=true)=>{cue.data[f.id]=v;persist();if(repaint)drawPreview();},{...f,clip:cue.type==="video"}));
  }
  if(cue.type==="video")form.append(el("small","cue-type","Preview shows the clip title. TAKE plays the bundled video on Program and the browser output."));
  const i=cues.indexOf(cue);
  for(const [caption,dir] of [["↑ Move",-1],["↓ Move",1]]){
    const b=button(caption,()=>{
      const from=cues.indexOf(cue),to=from+dir;
      if(to<0||to>=cues.length)return;
      [cues[to],cues[from]]=[cues[from],cues[to]];persist();drawList();drawEditor();
    });
    b.disabled=i+dir<0||i+dir>=cues.length;actions.append(b);
  }
  actions.append(button("Duplicate",()=>{
    if(cues.length>=250)return notice("The rundown is full.");
    const next=validCue({...cue,id:uid(),label:cue.label+" copy"});
    cues.splice(cues.indexOf(cue)+1,0,next);selected=next.id;persist();drawList();drawEditor();drawPreview();
  }),button("Remove",()=>{
    const from=cues.indexOf(cue);cues.splice(from,1);selected=cues[Math.min(from,cues.length-1)]?.id;
    persist();drawList();drawEditor();drawPreview();
    if(playing(state).some(([,c])=>c.id===cue.id))notice("Removed from rundown only. Use OFF to clear the live graphic.");
  }));
}
function drawProgram(force=false){
  const bg=backgrounds[state.background]||backgrounds.transparent, opaque=bg.color!=="transparent";
  $("program").dataset.keyed=String(opaque);$("program").style.backgroundColor=opaque?bg.color:"";
  $("program-background").textContent=bg.label;
  $("current-background").textContent="On output: "+bg.label;
  const active=playing(state),signature=state.session+active.map(([l,c])=>l+c.instance).join("|");
  program(state);
  if(!force&&signature===lastActive)return;
  lastActive=signature;
  $("program-label").textContent=active.length?active.map(([,c])=>c.label).join(" · "):"Output is clear";
  $("program-tally").dataset.live=String(active.length>0);
  $("program-tally").textContent=active.length?"PROGRAM / LIVE":"PROGRAM";
  const node=$("active");node.replaceChildren();
  const map=new Map(active);
  for(const layer of [...layers].reverse()){
    const cue=map.get(layer);
    const r=el("div","layer-row");r.dataset.on=String(!!cue);
    const tx=el("div");tx.append(el("strong",null,layerNames[layer]),el("small",null,cue?.label||"Clear"));
    const off=button("OFF",()=>send({action:"off",layer}),"danger");
    off.disabled=!cue||!connected||locked;
    off.setAttribute("aria-label",`Clear ${layerNames[layer]}`);
    r.append(tx,off);node.append(r);
  }
  drawList();
}
function received(next){
  if(state.session===next.session&&state.rev>=next.rev)return;
  state=next;drawProgram();
}
async function send(command){
  if(!transport||!connected||locked){notice("Output control is not connected.");return false;}
  if(busy&&command.action!=="clear")return false;
  busy=true;drawPreview();
  try{const next=await transport.send(command);received(next);return true;}
  catch(e){notice(e.message||"Could not send cue.");return false;}
  finally{busy=false;drawPreview();}
}
const take=()=>{const cue=current();if(cue)send({action:"take",cue:validCue(cue)});};
$("take").addEventListener("click",take);
$("clear").addEventListener("click",()=>send({action:"clear"}));
$("editor").addEventListener("submit",e=>e.preventDefault());
document.addEventListener("keydown",e=>{
  if(e.repeat||$("add-dialog").open||$("bumper-dialog").open||$("settings-dialog").open)return;
  if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();take();}
  if(e.key==="Escape"&&document.activeElement?.tagName!=="SELECT"){e.preventDefault();send({action:"clear"});}
});
$("copy").addEventListener("click",async()=>{
  const url=$("open").href;
  try{await navigator.clipboard.writeText(url);notice("Output URL copied.");}
  catch{window.prompt("Copy this clean output URL:",url);}
});
for(const [value,bg] of Object.entries(backgrounds)){
  const label=el("label","color-option");
  const radio=el("input");radio.type="radio";radio.name="output-background";radio.value=value;
  const swatch=el("span","color-swatch");swatch.style.setProperty("--key-color",bg.color);swatch.dataset.color=value;swatch.setAttribute("aria-hidden","true");
  label.append(radio,swatch,el("strong",null,bg.label),el("code",null,value==="transparent"?"Alpha":bg.color));
  $("color-options").append(label);
}
$("settings").addEventListener("click",()=>{
  const value=Object.hasOwn(backgrounds,state.background)?state.background:"transparent";
  $("color-options").querySelector('input[value="'+value+'"]').checked=true;
  $("settings-dialog").showModal();
});
$("apply-background").addEventListener("click",async()=>{
  const value=$("color-options").querySelector("input:checked")?.value;
  if(!value)return;
  $("apply-background").disabled=true;
  try{if(await send({action:"background",background:value})){$("settings-dialog").close();notice("Output background: "+backgrounds[value].label+".");}}
  finally{$("apply-background").disabled=false;}
});
function appendCue(type,label,data={},dialog="add-dialog"){
  if(cues.length>=250){notice("The rundown is full.");return false;}
  const c=validCue({type,id:uid(),label,data});
  cues.push(c);selected=c.id;persist();drawList();drawEditor();drawPreview();$(dialog).close();
  $("cue-list").lastElementChild?.scrollIntoView({block:"nearest"});
  return true;
}
const segmentTypes=new Set(Object.values(graphicForSegment));
const placement={full:"Full screen",feature:"Side card",lower:"Lower third"};
const segmentCueLabel=(segment,type)=>segment.title+" • "+templates[type].name;
for(const segment of segmentLibrary){
  const type=graphicForSegment[segment.id], t=templates[type];
  if(!t)continue;
  const b=button(segmentCueLabel(segment,type),()=>appendCue(type,segmentCueLabel(segment,type)));
  b.append(el("span","cue-type",placement[t.layer]));
  $("segment-templates").append(b);
}
for(const [type,t] of Object.entries(templates))if(!segmentTypes.has(type))$("templates").append(button(t.icon+" · "+t.name,()=>appendCue(type,t.name)));
$("add").addEventListener("click",()=>$("add-dialog").showModal());
$("library-count").textContent=segmentLibrary.length+" segments";
let librarySelection=segmentLibrary[0];
const libraryRows=new Map();
function setLibrarySelection(segment){
  librarySelection=segment;
  for(const [id,b] of libraryRows)b.setAttribute("aria-current",String(id===segment.id));
  $("bumper-name").textContent=segment.title;
  $("bumper-idea").textContent=segment.idea;
  $("matching-board").hidden=!graphicForSegment[segment.id];
  const video=$("bumper-video");
  video.pause();video.src="./"+clips[segment.id].file;
}
const groupTitles={original:"Original lineup",featured:"Sports desk formats",bonus:"Rotation options"};
let previousGroup="";
for(const [i,segment] of segmentLibrary.entries()){
  if(previousGroup!==segment.group){
    $("bumper-list").append(el("p","eyebrow",groupTitles[segment.group]??segment.group));
    previousGroup=segment.group;
  }
  const b=el("button","cue");b.type="button";
  const label=el("span","cue-main");label.append(el("span","cue-name",segment.title),el("span","cue-type",segment.label));
  b.append(el("span","cue-number",String(i+1).padStart(2,"0")),label);
  b.addEventListener("click",()=>setLibrarySelection(segment));
  libraryRows.set(segment.id,b);$("bumper-list").append(b);
}
$("bumpers").addEventListener("click",()=>{
  const cue=current(), fromCue=cue?.type==="video"&&segmentLibrary.find(s=>s.id===cue.data.clip);
  setLibrarySelection(fromCue||librarySelection);$("bumper-dialog").showModal();
});
$("bumper-dialog").addEventListener("close",()=>{$("bumper-video").pause();$("bumper-video").removeAttribute("src");$("bumper-video").load();});
$("bumper-add").addEventListener("click",()=>{
  const clip=librarySelection.id;
  if(appendCue("video",clips[clip].name,{clip},"bumper-dialog"))notice("Bumper added to Preview. Program is unchanged.");
});
$("matching-board").addEventListener("click",()=>{
  const type=graphicForSegment[librarySelection.id];
  if(type&&appendCue(type,segmentCueLabel(librarySelection,type),{},"bumper-dialog"))notice("Graphic added to Preview. Program is unchanged.");
});
$("export").addEventListener("click",()=>{
  const href=URL.createObjectURL(new Blob([JSON.stringify({format:"rbtv-prep-signal",version:1,cues:cues.map(validCue)},null,2)],{type:"application/json"}));
  const link=el("a");link.href=href;link.download="prep-signal-rundown.json";link.click();setTimeout(()=>URL.revokeObjectURL(href),2000);
});
$("import").addEventListener("click",()=>$("file").click());
$("file").addEventListener("change",async e=>{
  const file=e.target.files[0];e.target.value="";
  if(!file)return;
  try{
    if(file.size>2000000)throw Error("This file is too large for a rundown.");
    const data=JSON.parse(await file.text());
    if(data.format!=="rbtv-prep-signal"||data.version!==1)throw Error("Choose a Prep Signal rundown export.");
    const next=parseRundown(data.cues);
    if(!window.confirm("Replace the saved rundown? Program output will not change."))return;
    cues=next;selected=cues[0]?.id;persist();drawList();drawEditor();drawPreview();notice("Rundown loaded.");
  } catch(err){notice(err.message||"Could not load rundown.");}
});
drawList();drawEditor();drawPreview();drawProgram(true);
transport=await connect(received,(s)=>{
  connected=s.connected;
  const node=$("connection");
  node.textContent=s.mode==="preview"?"Browser preview":s.connected?"Studio connected":"Reconnecting";
  node.dataset.state=s.mode==="preview"?"preview":s.connected?"live":"offline";
  $("mode-help").textContent=s.mode==="preview"?"Preview mode: the output syncs only in tabs of this browser. Use the local studio server for OBS.":"Studio mode: send the clean output URL to the switcher; keep this tab for control.";
  drawPreview();drawProgram(true);
});
locked=!!transport.locked;
if(locked)notice("LAN control requires the operator link printed when the studio server starts.");
drawPreview();drawProgram(true);
setInterval(()=>drawProgram(),180);
