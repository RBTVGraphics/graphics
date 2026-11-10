import {imageAsset,getBrowserImage} from "./local-images.mjs";
export const imageField=(id,label,group)=>({id,label,group,max:1536,image:true});
export const imageReference=raw=>imageAsset(String(raw??"").trim())?.id||imageURL(raw);

// Links are opened as images by the browser, not fetched or proxied by the server.
export function imageURL(raw){
  const value=String(raw??"").trim();
  if(!value||value.length>1536||!/^https:\/\//i.test(value)||/[\u0000-\u0020\u007f]/.test(value))return "";
  try{
    const url=new URL(value), host=url.hostname.toLowerCase().replace(/\.$/,"");
    if(url.protocol!=="https:"||url.username||url.password||!host.includes(".")||/^[\d.]+$/.test(host)||/\.(localhost|local|internal|lan|home|test|invalid)$/.test(host))return "";
    url.hash="";
    return url.href.length<=1536?url.href:"";
  }catch{return "";}
}

// Check in this browser only; the clean output may run in a different browser.
const probes=new Map();
export function probeImage(url){
  if(probes.has(url))return probes.get(url);
  const pending=new Promise(resolve=>{
    const img=new Image();
    img.referrerPolicy="no-referrer";
    const timer=setTimeout(()=>finish(false),8000);
    const finish=ok=>{clearTimeout(timer);img.onload=null;img.onerror=null;resolve(ok);};
    img.onload=()=>finish(img.naturalWidth>0);img.onerror=()=>finish(false);img.src=url;
  });
  probes.set(url,pending);
  if(probes.size>40)probes.delete(probes.keys().next().value);
  pending.then(ok=>{if(!ok&&probes.get(url)===pending)probes.delete(url);});
  return pending;
}

export function linkedImage(parent,raw,variant){
  const ref=imageReference(raw);if(!ref)return null;
  const asset=imageAsset(ref);
  const slot=document.createElement("span");
  slot.className="linked-art "+variant;
  slot.hidden=true;
  const img=document.createElement("img");
  img.alt="";img.decoding="async";img.referrerPolicy="no-referrer";
  img.addEventListener("load",()=>{if(img.naturalWidth){slot.hidden=false;slot.classList.add("is-ready");parent.classList.add(variant+"-ready");}},{once:true});
  img.addEventListener("error",()=>slot.remove(),{once:true});
  slot.append(img);parent.append(slot);
  if(asset?.mode==="browser"){
    getBrowserImage(asset.id).then(blob=>{
      if(!blob){slot.remove();return;}
      if(!slot.isConnected)return;
      const url=URL.createObjectURL(blob), done=()=>URL.revokeObjectURL(url);
      img.addEventListener("load",done,{once:true});img.addEventListener("error",done,{once:true});img.src=url;
    }).catch(()=>slot.remove());
  }else img.src=asset?"./api/images/"+asset.file:ref;
  return slot;
}
