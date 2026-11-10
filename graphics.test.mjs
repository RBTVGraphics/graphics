import assert from "node:assert/strict";
import {test} from "node:test";
import {initial,reduce,playing,starter,validCue,clips,segments,segmentLibrary,countdownVisible,countdownReveals,boardForSegment,graphicForSegment,templates,backgrounds} from "./docs/graphics.mjs";
import {existsSync} from "node:fs";
import {imageURL} from "./docs/image-links.mjs";
import {imageAsset,imageExtension} from "./docs/local-images.mjs";

const take=(state,id,now=1000)=>reduce(state,{action:"take",cue:starter.find(c=>c.id===id)},now);
test("a new lower third replaces its predecessor without touching the ticker",()=>{
  const state=take(take(take(initial("test"),"ticker"),"host"),"headlines");
  assert.deepEqual(Object.values(state.active).map(c=>c.id),["ticker","headlines"]);
  assert.equal(state.rev,3);
});
test("playback ends on schedule and leaves the previous layers live",()=>{
  let state=take(take(initial("test"),"host"),"scan");
  assert.equal(state.active.full.at,1200);
  assert.equal(state.active.full.until,5700);
  assert.equal(playing(state,5699).length,2);
  assert.equal(playing(state,5700).length,1);
  state=reduce(state,{action:"expire"},5700);
  assert.deepEqual(Object.keys(state.active),["lower"]);
});
test("off clears only its layer, while clear blanks Program",()=>{
  const state=take(take(initial("test"),"host"),"bug");
  assert.deepEqual(Object.keys(reduce(state,{action:"off",layer:"lower"},1000).active),["bug"]);
  const blank=reduce(state,{action:"clear"},1000);
  assert.equal(blank.cleared,true);
  assert.deepEqual(blank.active,{});
});
test("cue data is normalized and unknown templates are rejected",()=>{
  assert.throws(()=>validCue({id:"test",type:"constructor"}));
  assert.throws(()=>validCue({id:"bad/id",type:"video"}));
  assert.deepEqual(validCue({id:"test",type:"video",data:{clip:"not-a-clip",extra:"ignore"}}).data,{clip:"opener"});
});
test("all fifteen segment bumpers and the opener have packaged media",()=>{
  assert.equal(segmentLibrary.length,15);
  assert.equal(new Set(segmentLibrary.map(s=>s.id)).size,15);
  assert.equal(Object.keys(segments).length,15);
  assert.equal(Object.keys(clips).length,16);
  for(const [clip,asset] of Object.entries(clips)){
    assert.ok(existsSync(new URL("./docs/"+asset.file,import.meta.url)),asset.file);
    assert.equal(validCue({id:"test",type:"video",data:{clip}}).data.clip,clip);
  }
});
test("three matching boards are editable, stay live and preserve other layers",()=>{
  let state=take(initial("test"),"host");
  for(const [segment,type] of Object.entries(boardForSegment)){
    assert.ok(clips[segment]);
    assert.ok(templates[type].fields.length>=8);
    const cue=validCue({id:type,type,data:{context:"Volleyball • Week 4"}});
    state=reduce(state,{action:"take",cue},1000);
    assert.equal(state.active.full.data.context,"Volleyball • Week 4");
    assert.equal(state.active.full.until,0);
    assert.equal(playing(state,25000).length,2);
  }
});
test("countdown reveals third, second, then first",()=>{
  assert.deepEqual(countdownReveals.map(stage=>[3,2,1].filter(n=>countdownVisible(n,stage))),[[3],[3,2],[3,2,1]]);
  const cue=validCue({id:"count",type:"countdown",data:{reveal:"invalid",item1:"Keep hidden"}});
  assert.equal(cue.data.reveal,"#3 only");
});
test("every segment maps to a distinct editable graphic on the intended layer",()=>{
  assert.equal(new Set(Object.values(graphicForSegment)).size,15);
  const intended={guest_id:"lower",replay_note:"lower",closing_take:"lower",spotlight:"feature",field_report:"feature"};
  for(const segment of segmentLibrary){
    const type=graphicForSegment[segment.id], template=templates[type];
    assert.ok(template.fields.length>=3,segment.title);
    assert.equal(new Set(template.fields.map(f=>f.id)).size,template.fields.length);
    const field=template.fields[0].id;
    const cue=validCue({id:type,type,data:{[field]:"Weekly test copy"}});
    const result=reduce(initial("test"),{action:"take",cue},1000);
    const layer=intended[type]||"full";
    assert.equal(result.active[layer].data[field],"Weekly test copy");
    assert.equal(result.active[layer].until,0);
    assert.deepEqual(reduce(result,{action:"off",layer},5000).active,{});
  }
});
test("image links accept direct HTTPS URLs and ignore unsupported or private-address URLs",()=>{
  const safe="https://media.example.org/crest.png?rev=2";
  assert.equal(imageURL(" "+safe+"#section "),safe);
  for(const unsafe of ["javascript:alert(1)","data:image/png;base64,AAAA","http://media.example.org/crest.png","https://user:pass@media.example.org/a","https://127.0.0.1/a","https://[::1]/a","https://printer.local/a","https://intranet/a","https://media.example.org/a b"]){
    assert.equal(imageURL(unsafe),"",unsafe);
  }
  const cue=validCue({id:"logos",type:"matchup",data:{awayLogo:safe,homeLogo:"http://no.example.org/a"}});
  assert.equal(cue.data.awayLogo,safe);assert.equal(cue.data.homeLogo,"");
  const old=validCue({id:"old",type:"guest_id",data:{guest:"Coach"}});
  assert.equal(old.data.guest,"Coach");assert.equal(old.data.portrait,"");
});
test("uploads use constrained local references and only supported image formats",()=>{
  const ref="asset:studio:"+"ab".repeat(32)+".png";
  assert.equal(imageAsset(ref).mode,"studio");
  assert.equal(validCue({id:"photo",type:"spotlight",data:{photo:ref}}).data.photo,ref);
  const browser="asset:browser:"+"12".repeat(16)+".webp";
  assert.equal(validCue({id:"photo",type:"spotlight",data:{photo:browser}}).data.photo,browser);
  assert.equal(validCue({id:"photo",type:"spotlight",data:{photo:"asset:studio:../../settings.json"}}).data.photo,"");
  assert.equal(imageExtension(Uint8Array.of(137,80,78,71,13,10,26,10)),"png");
  assert.equal(imageExtension(Uint8Array.of(255,216,255)),"jpg");
  assert.equal(imageExtension(new TextEncoder().encode("RIFF0000WEBP")),"webp");
  assert.equal(imageExtension(new TextEncoder().encode("<svg></svg>")),"");
});
test("black is true RGB black; changing or clearing cues preserves the chosen backdrop",()=>{
  assert.deepEqual(Object.keys(backgrounds),["black","green","chroma","blue","transparent"]);
  assert.equal(backgrounds.black.color,"#000000");
  const live=take(initial("test"),"host");
  const black=reduce(live,{action:"background",background:"black"},1000);
  assert.deepEqual(black.active,live.active);
  assert.equal(reduce(black,{action:"clear"},1000).background,"black");
  assert.throws(()=>reduce(black,{action:"background",background:"url(example)"},1000));
});
