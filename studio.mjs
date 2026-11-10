import {createServer} from "node:http";
import {createReadStream,statSync,readFileSync,mkdirSync,writeFileSync,renameSync} from "node:fs";
import {mkdir,writeFile,rename,stat} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve,sep,extname} from "node:path";
import {networkInterfaces} from "node:os";
import {randomUUID,randomBytes,timingSafeEqual,createHash} from "node:crypto";
import {initial,reduce,backgrounds} from "./docs/graphics.mjs";
import {imageExtension,imageTypes,maxImageBytes} from "./docs/local-images.mjs";

const args=process.argv.slice(2);
if(args.includes("--help")) {
  console.log("Usage: node studio.mjs [--port 4173] [--lan]");
  process.exit(0);
}
const lan=args.includes("--lan"), portAt=args.indexOf("--port");
const port=portAt<0?4173:Number(args[portAt+1]);
if(!Number.isInteger(port)||port<1||port>65535)throw Error("Choose a valid --port between 1 and 65535.");
const root=fileURLToPath(new URL("./docs/",import.meta.url));
const dataRoot=resolve(process.env.RBTV_STUDIO_DATA_DIR||fileURLToPath(new URL("./.studio-data/",import.meta.url)));
const imageRoot=resolve(dataRoot,"images"), settingsPath=resolve(dataRoot,"output-settings.json");
const key=lan?randomBytes(24).toString("base64url"):"";
const ips=Object.values(networkInterfaces()).flat().filter(n=>n.family==="IPv4"&&!n.internal).map(n=>n.address);
const hosts=new Set(["127.0.0.1","localhost",...(lan?ips:[])]);
const media={".html":"text/html; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".mp4":"video/mp4"};
let savedSettings;
try{savedSettings=JSON.parse(readFileSync(settingsPath,"utf8"));}catch{}
let state=initial(randomUUID(),savedSettings?.background), timer;
const streams=new Set();
const json=(res,status,data)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data));};
const packet=()=>`data: ${JSON.stringify(state)}\n\n`;
const update=(command)=>{
  state=reduce(state,command);
  for(const stream of streams)if(!stream.write(packet())&&stream.writableLength>131072)stream.destroy();
  clearTimeout(timer);
  const deadlines=Object.values(state.active).map(c=>c.until).filter(Boolean);
  if(deadlines.length)timer=setTimeout(()=>update({action:"expire"}),Math.max(15,Math.min(...deadlines)-Date.now()+20));
};
function auth(req){
  if(!lan)return true;
  const a=Buffer.from(req.headers["x-rbtv-key"]||""),b=Buffer.from(key);
  return a.length===b.length&&timingSafeEqual(a,b);
}
function saveBackground(background){
  mkdirSync(dataRoot,{recursive:true,mode:0o700});
  const tmp=resolve(dataRoot,".settings-"+randomUUID());
  writeFileSync(tmp,JSON.stringify({background})+"\n",{mode:0o600,flag:"wx"});
  renameSync(tmp,settingsPath);
}
async function saveImage(req,res){
  if(Number(req.headers["content-length"])>maxImageBytes)return json(res,413,{error:"Choose an image under 8 MB."});
  try{
    const chunks=[];let size=0;
    for await(const chunk of req){
      size+=chunk.length;
      if(size>maxImageBytes)return json(res,413,{error:"Choose an image under 8 MB."});
      chunks.push(chunk);
    }
    const bytes=Buffer.concat(chunks), extension=imageExtension(bytes);
    if(!extension)return json(res,415,{error:"Choose a PNG, JPG or WebP image."});
    const name=createHash("sha256").update(bytes).digest("hex")+"."+extension, target=resolve(imageRoot,name);
    await mkdir(imageRoot,{recursive:true,mode:0o700});
    if(!(await stat(target).catch(()=>null))?.isFile()){
      const tmp=resolve(imageRoot,".upload-"+randomUUID());
      await writeFile(tmp,bytes,{mode:0o600,flag:"wx"});
      await rename(tmp,target);
    }
    return json(res,201,{asset:"asset:studio:"+name});
  }catch{return json(res,500,{error:"Could not save this image. Check that the studio folder is writable."});}
}
const server=createServer(async (req,res)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
  let base,url;
  try{base=new URL("http://"+req.headers.host);url=new URL(req.url,base);}catch{return json(res,400,{error:"Invalid URL."});}
  if(!hosts.has(base.hostname)||url.origin!==base.origin)return json(res,403,{error:"Unrecognized studio host."});
  if(req.method==="GET"&&url.pathname==="/api/status")return json(res,200,{app:"prep-signal-live",locked:lan});
  if(req.method==="GET"&&url.pathname==="/api/events"){
    if(streams.size>=48)return json(res,503,{error:"Too many browser outputs."});
    res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","Connection":"keep-alive"});
    res.write("retry: 1000\n\n"+packet());streams.add(res);
    res.on("close",()=>streams.delete(res));return;
  }
  if(req.method==="POST"&&["/api/command","/api/images"].includes(url.pathname)){
    if(req.headers.origin!==base.origin||req.headers["x-rbtv-control"]!=="1")return json(res,403,{error:"Use the studio control page to send cues."});
    if(!auth(req))return json(res,403,{error:"Use the LAN operator link printed when starting the studio."});
    if(url.pathname==="/api/images")return saveImage(req,res);
    try{
      const chunks=[];let size=0;
      for await(const chunk of req){
        size+=chunk.length;if(size>12000)return json(res,413,{error:"Cue data is too large."});
        chunks.push(chunk);
      }
      const cmd=JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if(!["take","off","clear","background"].includes(cmd?.action))return json(res,400,{error:"Invalid action."});
      if(cmd.action==="background"){
        if(!Object.hasOwn(backgrounds,cmd.background))return json(res,400,{error:"Unknown output background."});
        try{saveBackground(cmd.background);}catch{return json(res,500,{error:"Could not save output settings. Check that the studio folder is writable."});}
      }
      update(cmd);return json(res,200,state);
    }catch(e){return json(res,400,{error:e.message||"Invalid command."});}
  }
  if(!["GET","HEAD"].includes(req.method))return json(res,405,{error:"Method not allowed."});
  let path, size, type;
  const uploaded=/^\/api\/images\/([a-f0-9]{64}\.(png|jpg|webp))$/.exec(url.pathname);
  try {
    if(uploaded){path=resolve(imageRoot,uploaded[1]);type=imageTypes[uploaded[2]];}
    else{
      const file=url.pathname==="/"?"index.html":decodeURIComponent(url.pathname.slice(1));
      path=resolve(root,file);
      if(!path.startsWith(resolve(root)+sep)||!Object.hasOwn(media,extname(path)))throw Error();
      type=media[extname(path)];
    }
    const stat=statSync(path);
    if(!stat.isFile())throw Error();
    size=stat.size;
  }catch{return json(res,404,{error:"Page not found."});}
  const headers={"Content-Type":type,"Accept-Ranges":"bytes","Cache-Control":uploaded?"private, max-age=86400, immutable":type.startsWith("video")?"private, max-age=300":"no-cache"};
  let start=0,end=size-1,status=200;
  if(req.headers.range){
    const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(m&&(m[1]||m[2])) {
      start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
      end=m[1]&&m[2]?Math.min(size-1,Number(m[2])):size-1;
    }
    if(!m||(!m[1]&&!m[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){
      res.writeHead(416,{"Content-Range":`bytes */${size}`});return res.end();
    }
    headers["Content-Range"]=`bytes ${start}-${end}/${size}`;status=206;
  }
  headers["Content-Length"]=end-start+1;
  res.writeHead(status,headers);
  if(req.method==="HEAD")return res.end();
  const body=createReadStream(path,{start,end});
  body.on("error",()=>res.destroy());res.on("close",()=>body.destroy());body.pipe(res);
});
setInterval(()=>{for(const res of streams)res.write(": heartbeat\n\n");},5000).unref();
server.on("error",err=>{console.error("Prep Signal Studio could not start:",err.message);process.exitCode=1;});
server.listen(port,lan?"0.0.0.0":"127.0.0.1",()=>{
  console.log("\nTHE PREP SIGNAL  /  RBTV GRAPHICS DESK\n");
  console.log(`Control:      http://127.0.0.1:${port}/${key?"#key="+key:""}`);
  console.log(`Clean output: http://127.0.0.1:${port}/output.html`);
  if(lan) {
    for(const ip of ips){console.log(`LAN control:  http://${ip}:${port}/#key=${key}`);console.log(`LAN output:   http://${ip}:${port}/output.html`);}
    console.log("Use LAN mode on a trusted production network only. Keep the operator link private.");
  }
  console.log("Leave this window open during the show. Ctrl+C stops the studio.\n");
});
