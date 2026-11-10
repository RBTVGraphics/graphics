import {segmentLibrary} from "./segments.mjs";
import {segmentGraphics} from "./segment-graphics.mjs";
import {imageField,imageReference} from "./image-links.mjs";
export {segmentLibrary};
// Add a template here; the cue editor builds its inputs from this registry.
const field = (id, label, max = 60, multiline = false) => ({id, label, max, multiline});
const rowField=(n,id,label,max,group)=>({...field(id+n,label,max),group:group+n});
export const boardForSegment={"lock-the-signal":"picks","signal-strength":"rankings","the-signal-three":"countdown"};
export const graphicForSegment={...boardForSegment,...Object.fromEntries(Object.entries(segmentGraphics).map(([id,g])=>[g.segment,id]))};
export const countdownReveals=["#3 only","#3 and #2","Reveal all three"];
export const countdownVisible=(rank,reveal)=>rank>=3-Math.max(0,countdownReveals.indexOf(reveal));
export const clips = {
  opener: {name: "Show opener", file: "media/opener.mp4", seconds: 6},
  ...Object.fromEntries(segmentLibrary.map(segment=>[segment.id,{
    name:segment.title+" bumper",file:"media/"+(segment.file??segment.id+".mp4"),seconds:4.5,
  }])),
};
export const segments=Object.fromEntries(segmentLibrary.map(segment=>[segment.title,segment.label]));
export const templates = {
  name: {name:"Nameplate", layer:"lower", icon:"ID", fields:[field("name","Name",46),field("role","Role or affiliation",60)]},
  topic: {name:"Talking point", layer:"lower", icon:"TP", fields:[field("tag","Segment label",26),field("headline","Talking point",96)]},
  quote: {name:"Quote / stat", layer:"feature", icon:"QT", fields:[field("tag","Label",28),field("headline","Quote or statistic",140,true),field("source","Attribution / source",65)]},
  matchup: {name:"Matchup", layer:"feature", icon:"VS", fields:[field("tag","Sport / event",38),field("away","Team A",32),field("home","Team B",32),field("detail","Date, time or score",60),imageField("awayLogo","Team A logo link (optional)"),imageField("homeLogo","Team B logo link (optional)")]},
  picks: {name:"Picks board", layer:"full", icon:"PK", board:true, fields:[
    field("context","Matchup or event",82),
    ...[1,2,3].flatMap(n=>[rowField(n,"host","Host name",34,"Host "),rowField(n,"pick","Winner pick",40,"Host "),rowField(n,"reason","Reason (optional)",86,"Host "),imageField("art"+n,"Picked team logo link (optional)","Host "+n)]),
  ]},
  rankings: {name:"Power rankings", layer:"full", icon:"RK", board:true, fields:[
    field("context","Sport / class / week",82),field("criteria","Ranking criteria (optional)",110),
    ...[1,2,3].flatMap(n=>[rowField(n,"team","Team",46,"Rank #"),rowField(n,"note","Record, movement or note (optional)",86,"Rank #"),imageField("art"+n,"Team logo link (optional)","Rank #"+n)]),
  ]},
  countdown: {name:"Top-three countdown", layer:"full", icon:"03", board:true, fields:[
    field("context","Countdown theme",82),{id:"reveal",label:"Reveal on next TAKE",choices:countdownReveals},
    ...[3,2,1].flatMap(n=>[rowField(n,"item","Play or moment",55,"Play #"),rowField(n,"note","Athlete, school or detail (optional)",86,"Play #"),imageField("art"+n,"Play still link (optional)","Play #"+n)]),
  ]},
  segment: {name:"Segment slate", layer:"full", icon:"SL", fields:[{id:"segment",label:"Segment",choices:Object.keys(segments)},field("detail","Optional subtitle",80)]},
  ticker: {name:"Ticker", layer:"ticker", icon:"TK", fields:[field("tag","Label",18),field("text","Ticker items (use | between items)",350,true)]},
  bug: {name:"Show bug", layer:"bug", icon:"BG", fields:[field("label","Optional short label",15)]},
  video: {name:"Playback", layer:"full", icon:"▶", fields:[{id:"clip",label:"Video",choices:Object.keys(clips)}]},
  ...segmentGraphics,
};
export const layers = ["bug","ticker","lower","feature","full"];
export const backgrounds={
  black:{label:"Black",color:"#000000"},
  green:{label:"Green",color:"#00A651"},
  chroma:{label:"Chroma green",color:"#00FF00"},
  blue:{label:"Blue",color:"#0000FF"},
  transparent:{label:"Transparent",color:"transparent"},
};
export const starter = [
  {id:"open",type:"video",label:"Show opener",data:{clip:"opener"}},
  {id:"host",type:"name",label:"Host nameplate",data:{name:"Host name",role:"The Prep Signal"}},
  {id:"scan",type:"video",label:"Statewide Scan • bumper",data:{clip:"scan"}},
  {id:"headlines",type:"topic",label:"Statewide Scan • talking point",data:{tag:"Statewide Scan",headline:"What changed around Illinois this week?"}},
  {id:"guest",type:"name",label:"Guest nameplate",data:{name:"Guest name",role:"Coach / Athlete • School"}},
  {id:"channel",type:"segment",label:"Open Channel • slate",data:{segment:"Open Channel",detail:""}},
  {id:"spike",type:"video",label:"Signal Spike • bumper",data:{clip:"spike"}},
  {id:"opinion",type:"topic",label:"Signal Spike • debate question",data:{tag:"Signal Spike",headline:"Which result surprised you most this week?"}},
  {id:"boost",type:"segment",label:"Signal Boost • slate",data:{segment:"Signal Boost",detail:""}},
  {id:"dial",type:"segment",label:"Next on the Dial • slate",data:{segment:"Next on the Dial",detail:""}},
  {id:"game",type:"matchup",label:"Games to watch • matchup",data:{tag:"Games to watch",away:"Team A",home:"Team B",detail:"Day • Time • Venue"}},
  {id:"stat",type:"quote",label:"Quote / stat card",data:{tag:"By the numbers",headline:"Enter a verified stat or a short quote",source:"Source / attribution"}},
  {id:"ticker",type:"ticker",label:"Headlines ticker",data:{tag:"Prep Signal",text:"Enter your first headline | Add scores and upcoming games"}},
  {id:"bug",type:"bug",label:"The Prep Signal • show bug",data:{label:""}},
];
export function validCue(cue) {
  if (!cue || !Object.hasOwn(templates,cue.type) || typeof cue.id!=="string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(cue.id)) throw Error("Invalid graphic.");
  const data={};
  for (const f of templates[cue.type].fields) {
    const raw=String(cue.data?.[f.id]??"");
    data[f.id]=f.image?imageReference(raw):f.choices ? (f.choices.includes(raw)?raw:f.choices[0]) : raw.slice(0,f.max);
  }
  return {id:cue.id,type:cue.type,label:String(cue.label??"").trim().slice(0,80)||templates[cue.type].name,data};
}
export function initial(session,background="transparent") { return {session,rev:0,active:{},background:Object.hasOwn(backgrounds,background)?background:"transparent"}; }
export function reduce(state, command, now=Date.now()) {
  const active={...state.active};
  for(const layer of Object.keys(active)) if(active[layer].until && active[layer].until<=now) delete active[layer];
  if(command.action==="clear") return {...state,rev:state.rev+1,active:{},cleared:true};
  if(command.action==="expire") return {...state,rev:state.rev+1,active,cleared:false};
  if(command.action==="background"){
    if(!Object.hasOwn(backgrounds,command.background))throw Error("Unknown output background.");
    return {...state,rev:state.rev+1,active,cleared:false,background:command.background};
  }
  if(command.action==="off") {
    if(!layers.includes(command.layer)) throw Error("Unknown output layer.");
    delete active[command.layer];
  } else if(command.action==="take") {
    const cue=validCue(command.cue), layer=templates[cue.type].layer, video=cue.type==="video";
    const at=now+(video?200:0);
    active[layer]={...cue,instance:state.rev+1,at,until:video?at+clips[cue.data.clip].seconds*1000:0};
  } else throw Error("Unknown action.");
  return {...state,rev:state.rev+1,active,cleared:false};
}
export function playing(state,now=Date.now()) {
  return Object.entries(state?.active??{}).filter(([layer,cue])=>layers.includes(layer)&&(!cue.until||cue.until>now));
}
