export const maxImageBytes=8*1024*1024;
export const imageTypes={png:"image/png",jpg:"image/jpeg",webp:"image/webp"};
export function imageExtension(bytes){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  const starts=(signature,at=0)=>signature.every((value,i)=>b[at+i]===value);
  if(starts([137,80,78,71,13,10,26,10]))return "png";
  if(starts([255,216,255]))return "jpg";
  if(starts([82,73,70,70])&&starts([87,69,66,80],8))return "webp";
  return "";
}
export function imageAsset(value){
  const m=/^asset:(?:(studio):([a-f0-9]{64})|(browser):([a-f0-9]{32}))\.(png|jpg|webp)$/.exec(value);
  return m?{id:value,mode:m[1]||m[3],file:(m[2]||m[4])+"."+m[5]}:null;
}
let dbPromise;
function imageDB(){
  if(!dbPromise){
    dbPromise=new Promise((resolve,reject)=>{
      const open=indexedDB.open("rbtv-prep-signal-images",1);
      open.onupgradeneeded=()=>open.result.createObjectStore("images");
      open.onsuccess=()=>resolve(open.result);
      open.onerror=()=>reject(open.error);
    });
    dbPromise.catch(()=>{dbPromise=null;});
  }
  return dbPromise;
}
export async function saveBrowserImage(blob,extension){
  const random=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
  const id="asset:browser:"+random+"."+extension;
  const db=await imageDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction("images","readwrite");
    tx.objectStore("images").put(blob,id);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
  return id;
}
export async function getBrowserImage(id){
  const db=await imageDB();
  return new Promise((resolve,reject)=>{
    const request=db.transaction("images").objectStore("images").get(id);
    request.onsuccess=()=>resolve(request.result??null);
    request.onerror=()=>reject(request.error);
  });
}
