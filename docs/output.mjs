import {connect} from "./transport.mjs";
import {createRenderer} from "./render.mjs";
import {initial,backgrounds} from "./graphics.mjs";
const audio=new URLSearchParams(location.search).get("audio")!=="0";
const surface=document.querySelector("#output");
const render=createRenderer(surface,{mode:"output",muted:!audio});
let state=initial("connecting"), timer;
const receive=(next)=>{state=next;surface.style.backgroundColor=backgrounds[state.background]?.color||"transparent";render(state);};
await connect(receive,({mode,connected})=>{
  clearTimeout(timer);
  if(mode==="studio"&&!connected)timer=setTimeout(()=>receive(initial("disconnected",state.background)),12000);
});
setInterval(()=>render(state),200);
