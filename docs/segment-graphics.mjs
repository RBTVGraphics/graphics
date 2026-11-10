import {imageField as pic} from "./image-links.mjs";
// One definition per new segment: editor fields, segment pairing and output layout.
const f=(id,label,max=70,group)=>({id,label,max,group});
const cfg=(segment,name,icon,layer,layout,fields,help)=>({segment,name,icon,layer,layout,fields,help});
export const segmentGraphics={
  scan_results:cfg("scan","Results board","SC","full","results",[
    f("context","Week / sport",62),
    ...[1,2,3].flatMap(i=>[f("event"+i,"Matchup or event",56,"Result "+i),f("result"+i,"Verified score or finish",35,"Result "+i),f("note"+i,"Why it matters (optional)",76,"Result "+i),pic("art"+i,"Team or event logo link (optional)","Result "+i)]),
  ],"Enter up to three verified results. Blank rows stay off the board."),
  guest_id:cfg("open-channel","Guest ID","OC","lower","guest",[
    f("guest","Guest name",46),f("role","Role and school / team",68),f("topic","Interview topic (optional)",65),pic("portrait","Guest portrait link (optional)"),
  ],"A lower third for an interview. Take it over the guest’s camera or video feed."),
  debate:cfg("spike","Debate board","SS","full","debate",[
    f("question","Debate question",82),
    f("claim","First position",62,"The take"),f("claimEvidence","Evidence or example",92,"The take"),
    f("counter","Counterposition",62,"The counter"),f("counterEvidence","Evidence or example",92,"The counter"),
  ],"Give both positions a claim and one piece of evidence."),
  spotlight:cfg("signal-boost","Spotlight card","SB","feature","spotlight",[
    f("subject","Athlete or team",46),f("school","School / sport",64),f("achievement","Achievement or story",108),f("stat","Standout number (optional)",20),f("statLabel","What the number measures (optional)",52),pic("photo","Athlete or team photo link (optional)"),
  ],"A side card that leaves room for the host or subject. Use the stat only when it adds something."),
  schedule:cfg("next-on-the-dial","Games-to-watch board","ND","full","schedule",[
    f("context","Date range / sports",62),
    ...[1,2,3].flatMap(i=>[f("event"+i,"Matchup or event",56,"Event "+i),f("time"+i,"Day and time",35,"Event "+i),f("where"+i,"Venue or where to watch",76,"Event "+i),pic("art"+i,"Team or event logo link (optional)","Event "+i)]),
  ],"Enter up to three events with verified times and venues. Blank rows stay off the board."),
  replay_note:cfg("frame-by-frame","Replay annotation","FF","lower","replay",[
    f("headline","What viewers should look for",76),f("detail","Coaching or technique note (optional)",92),
    {id:"focus",label:"Focus marker",choices:["Off","Upper left","Upper right","Center","Lower left","Lower right"]},pic("still","Replay still link (optional)"),
  ],"Add a 16:9 still for an inset, or take over a replay cued separately in ATEM/OBS. The marker is fixed; it does not track a player or control playback."),
  upset_watch:cfg("upset-frequency","Upset watch","UF","full","upset",[
    f("context","Sport / matchup date",62),f("favorite","Favorite",48),f("challenger","Challenger",48),f("why","What could swing the matchup?",100),pic("favoriteLogo","Favorite logo link (optional)"),pic("challengerLogo","Challenger logo link (optional)"),
  ],"Name both teams and make a case for the challenger. No betting odds needed."),
  turning_point:cfg("the-turning-point","Turning-point timeline","TP","full","timeline",[
    f("context","Game or event",62),
    f("before","Score or situation before",60,"Before"),f("beforeNote","Context (optional)",90,"Before"),
    f("turn","The moment that changed it",60,"The moment"),f("turnNote","Time / play detail (optional)",90,"The moment"),pic("turnStill","Turning-point still link (optional)","The moment"),
    f("after","Score or situation after",60,"After"),f("afterNote","What changed (optional)",90,"After"),
  ],"Build the story in three beats: before, the moment, and what changed after it."),
  stat_story:cfg("by-the-numbers","Stat breakdown","BN","full","stat",[
    f("context","Team, sport or stat window",62),f("value","Number",16),f("measure","What it measures",56),
    f("meaning","What the number tells us",110),f("caveat","What it misses (optional)",100),f("source","Source and date",82),
  ],"Use one verified number, a clear takeaway and the source. Add a caveat if the stat could be misleading."),
  field_report:cfg("around-the-map","Illinois dateline","AM","feature","dateline",[
    f("place","Illinois city or community",46),f("school","School or team",62),f("story","Story headline",80),f("reporter","Student reporter (optional)",46),pic("photo","Location or story photo link (optional)"),
  ],"A side card for an Illinois field report. The silhouette is decorative, not a location pin."),
  rules_board:cfg("rule-check","Rule explainer","RC","full","rule",[
    f("context","Sport and rule topic",65),f("call","What happened on the play?",92),f("rule","What does the rule say?",110),
    f("example","What would change the call?",110),f("source","Rulebook / rule reference",80),pic("diagram","Example diagram or still link (optional)"),
  ],"Show the call, explain the rule in plain language, and give a concrete example. Verify the rule before air."),
  closing_take:cfg("the-final-word","Closing takeaway","FW","lower","closing",[
    f("host","Host name",42),f("takeaway","One takeaway",88),f("reason","One supporting reason (optional)",94),
  ],"Give each host a separate cue. Duplicate the first one and fill in the second host’s takeaway."),
};
