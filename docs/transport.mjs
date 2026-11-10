import {initial,reduce} from "./graphics.mjs";
import {saveBrowserImage,imageTypes} from "./local-images.mjs";
const stateKey="rbtv-prep-signal:program:v1";
const channelName="rbtv-prep-signal:v1";
const localApi=new URL("./api/status",location.href);
export async function connect(onState,onStatus=()=>{}){
  let info;
  if(["localhost","127.0.0.1","[::1]"].includes(location.hostname)||location.protocol==="http:"){
    try {
      const response=await fetch(localApi,{cache:"no-store",signal:AbortSignal.timeout(2500)});
      if(response.ok && response.headers.get("content-type")?.includes("application/json"))info=await response.json();
    } catch {}
  }
  if(info?.app==="prep-signal-live"){
    const url=(s)=>new URL("./api/"+s,location.href);
    const sse=new EventSource(url("events"));
    sse.onopen=()=>onStatus({mode:"studio",connected:true,locked:!!info.locked});
    sse.onerror=()=>onStatus({mode:"studio",connected:false,locked:!!info.locked});
    sse.onmessage=e=>{try{onState(JSON.parse(e.data));}catch{}};
    const hash=new URLSearchParams(location.hash.slice(1));
    let access=hash.get("key")||sessionStorage.getItem("rbtv-operator-key")||"";
    if(hash.has("key")) {sessionStorage.setItem("rbtv-operator-key",access);history.replaceState(null,"",location.pathname+location.search);}
    return {mode:"studio",locked:info.locked&&!access,async upload(blob){
      const response=await fetch(url("images"),{method:"POST",headers:{"Content-Type":"application/octet-stream","X-RBTV-Control":"1","X-RBTV-Key":access},body:blob});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||"The image could not be saved.");
      return result.asset;
    },async send(cmd){
      const response=await fetch(url("command"),{method:"POST",headers:{"Content-Type":"application/json","X-RBTV-Control":"1","X-RBTV-Key":access},body:JSON.stringify(cmd)});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||"The cue could not be sent.");
      return result;
    }};
  }
  const read=()=>{try{return JSON.parse(localStorage.getItem(stateKey))||initial("browser-preview");}catch{return initial("browser-preview");}};
  const bc=typeof BroadcastChannel==="function"?new BroadcastChannel(channelName):null;
  let state=read();
  const update=(next)=>{if(next?.session!==state.session||next?.rev>state.rev){state=next;onState(state);}};
  bc?.addEventListener("message",e=>update(e.data));
  window.addEventListener("storage",e=>{if(e.key===stateKey)update(read());});
  onState(state);onStatus({mode:"preview",connected:true});
  return {mode:"preview",async upload(blob,ext){return saveBrowserImage(blob.slice(0,blob.size,imageTypes[ext]),ext);},async send(cmd){
    const saved=read(), latest=saved.rev>=state.rev?saved:state;
    const next=reduce(latest,cmd);
    try{localStorage.setItem(stateKey,JSON.stringify(next));}catch{if(!bc)throw Error("Browser storage is unavailable.");}
    bc?.postMessage(next);update(next);return next;
  }};
}
