# The Prep Signal · RBTV Live Graphics

One desk for building an episode rundown, previewing cues and sending graphics to a clean 1920 × 1080 browser output. The studio edition runs locally and includes the finished waveform opener plus 15 animated segment bumpers. No Singular Live or Uno account is needed.

## Public website — no account required

- **Controller:** https://rbtvgraphics.github.io/graphics/
- **Clean output:** https://rbtvgraphics.github.io/graphics/output.html
- **Download the complete studio:** https://github.com/RBTVGraphics/graphics/archive/refs/heads/main.zip

Open the controller in Chrome, then click **Open output**. Keep both tabs in the **same browser profile on the same computer**. Send the clean-output window to the HDMI display feeding the ATEM; never send the controller to air. Choose **Output Settings → Black → Apply to output** for the black-key setup. Use the ATEM's appropriate keyer and rehearse with a camera: luma keying can remove dark details inside graphics and photographs too.

Each visitor has their own browser-saved rundown and Program state. Opening the link on another computer does **not** connect to your show or let visitors operate the school feed. This is a static website, not an internet-based shared control server. An OBS Browser Source is a separate browser context: use the **local studio** below for OBS, other applications, or multiple production computers.

**Moving from the old site:** On the old controller, click **Export**; on this controller, click **Import** and choose that JSON file. Browser-uploaded images must be uploaded again, because browser storage does not transfer between website addresses. Direct image links remain in the rundown. The GitHub website needs internet access; download and launch the complete studio for offline use. Install Node.js 18 or newer before taking the studio offline.

## GitHub Pages maintenance

The website source and all broadcast assets are in **docs/**. In this repository's **Settings → Pages**, use **Deploy from a branch**, branch **main**, folder **/docs**. The `.nojekyll` file keeps the site buildless. Committing changes to that folder republishes the website; allow the Pages deployment to finish before rehearsing. No build service, ChatGPT account, or paid graphics service is required.

The repository is public. Never commit private student photographs, credentials, exported show rundowns, or the local `.studio-data` folder. Upload episode images using the controller instead; they stay in the current browser profile or local studio, not in this repository.

## Run a rehearsal

1. Unzip the whole folder. Open Terminal, type `cd ` (with a space), drag the unzipped **graphics-main** folder into Terminal and press Return. Run `zsh "Start Prep Signal.command"` and leave that window open. This works even when a GitHub download has not retained executable permissions. Alternatively, run `node studio.mjs` with Node.js 18 or newer. The Mac launcher can also find the Node bundled with Codex. To enable double-click launching, run `chmod +x "Start Prep Signal.command"` once in that folder.
2. Open **http://127.0.0.1:4173/** in a browser on that Mac. This is the control desk. If port 4173 is already in use, run the launcher with `--port 4174` and use the URLs it prints.
3. In OBS, add a **Browser** source using **http://127.0.0.1:4173/output.html**. Use 1920 × 1080 and place it above the cameras. Leave **Shutdown source when not visible** and **Refresh browser when scene becomes active** off if you need a continuous output across scene changes. For an OBS setup with several camera scenes, reuse the same browser source. Keep the controller out of the program feed.
4. Select a cue, enter the episode's real names and copy, and check **Preview**. Use **TAKE** to send it to **Program**, **OFF** to remove an individual layer, or **Clear All** to clear everything immediately. **Ctrl/⌘ + Enter** takes the selected cue; **Esc** clears Program. Test those controls before air.
5. Take each video once in a rehearsal. Confirm picture, levels and playback through the OBS audio mixer; enable **Control audio via OBS** where available. The desk's Program monitor is muted, and an ordinary browser may mute autoplay. Add `?audio=0` to the output URL if clips should be silent.

The lower third, feature card, ticker and bug are independent layers. Nameplates and talking points share a layer, as do quote/stat and matchup cards. Full-screen playback covers the layers below it, then automatically clears and reveals them again. Segment slates stay up until you take another full-screen cue or turn them off.

## Save and reuse a rundown

Select **Bumpers** beside the rundown to browse all 15 formats. Each has a student production idea and an off-air player. Select a segment and click **Add to rundown**; it is then ready in Preview, but doesn't go to air until **TAKE**. All bumpers run 4.5 seconds, cover Program and clear back to the prior graphics. The opener is still available under **Add → Playback**. MP4s are in `docs/media/` if the crew wants to use one in an edit.

### On-air segment graphics

Choose **+ Add → Segment graphics**, or select a segment in **Bumpers** and choose **Add matching graphic**. Every segment has its own editable template:

| Segment | Graphic | Placement |
| --- | --- | --- |
| Statewide Scan | Up to three results, verified scores and why they matter | Full screen |
| Open Channel | Guest name, role, school and interview topic | Lower third |
| Signal Spike | Debate question, competing takes and evidence | Full screen |
| Signal Boost | Athlete/team spotlight, achievement and optional stat | Side card |
| Next on the Dial | Up to three upcoming events, times and venues | Full screen |
| Lock the Signal | Matchup, host picks and reasons | Full screen |
| Frame by Frame | Replay note and optional fixed-position focus marker | Lower third / overlay |
| Signal Strength | Top three teams, records, notes and ranking criteria | Full screen |
| Upset Frequency | Favorite vs. challenger and the key to an upset | Full screen |
| The Signal Three | Three plays with a staged #3 → #2 → #1 reveal | Full screen |
| The Turning Point | Before, the moment and after | Full screen |
| By the Numbers | One verified stat, meaning, caveat and source | Full screen |
| Around the Map | Illinois dateline, school, story and reporter | Side card |
| Rule Check | The call, rule, example and reference | Full screen |
| The Final Word | One host's takeaway and supporting reason | Lower third |

- **Lock the Signal:** Enter a matchup and up to three hosts' picks. Leave an unused host row blank. Add an optional reason for each pick.
- **Signal Strength:** Enter three ranked teams, a sport or week, and optional records or notes. Add the panel's ranking criteria at the bottom.
- **The Signal Three:** Enter all three plays before going live. Start with **#3 only**, then select **#3 and #2**, then **Reveal all three**. Each selection stays in Preview until you press **TAKE**. For a fixed running order, duplicate the cue and set one reveal stage per copy ahead of time.

These are graphics, not video clips. They stay on air until replaced by another cue on the same layer or cleared with **OFF** beside the appropriate layer. **Duplicate** a cue to reuse it for another matchup or episode without overwriting the previous copy. For **Frame by Frame**, roll or freeze the replay in ATEM/OBS separately. The graphic adds a caption and a fixed-position marker; it does not pause, track or control the replay. A controller bumper occupies the full-screen layer and covers overlays while playing.

### Add a logo, photo or still

Where you see an optional **image link** field, paste a direct HTTPS link to a school-approved image the crew has permission to air. Team and event logos work best as transparent PNGs. Use a square-ish guest portrait or a 16:9 still for replays. For **Frame by Frame**, a linked still appears in an inset and the marker moves into that inset. On **The Signal Three**, each play's still goes on air only when that play is revealed.

Wait for **Image ready in this browser** and check Preview. Then test the cue once in the actual clean output before air, especially if OBS runs on a different machine. A link should show the image itself in a signed-out browser, not a Drive share page, login screen, or article. Don't paste private or expiring links. The graphics browser loads the images directly over the internet; the desk saves URLs, not copies. If a link is missing, blocked, or broken, the rest of the graphic still airs without the image.

### Use images without internet

Click **Upload image** beside any supported image field and choose a PNG, JPG, or WebP (up to 8 MB). Check **Uploaded image ready** and Preview before taking it. Transparent PNG logos retain their alpha. Uploading replaces the link in that slot; **Remove image** detaches it from the cue without deleting the stored file, so other cues can still use it.

Launch the local studio package at school. It saves files to the hidden **.studio-data** folder beside the launcher and serves them to the clean output, including OBS, over the local connection. The hosted website saves uploads only in that browser profile; they do not transfer to the studio. Use the school Mac to upload the production files.

**Backups and upgrades:** The rundown JSON stores image references, not the uploaded image files. For the local studio, back up the rundown JSON and **.studio-data** together. Copy the data folder into the replacement studio folder before launching it; use **Command–Shift–.** in Finder to show hidden folders. Do not replace a data folder that already contains uploads without backing up both. A browser-only upload must be reattached when moving the rundown to another profile or to the local studio.

### Set the ATEM or OBS background

In the controller, open **Output Settings**, select a background, and click **Apply to output**. Choices are Black **#000000**, Green **#00A651**, Chroma green **#00FF00**, Blue **#0000FF**, and Transparent. This fills only the areas behind the graphics; full-screen boards and video bumpers keep their original backgrounds. The studio remembers the setting after restart. **Clear All** clears cues, not the background.

For a black-key workflow, choose **Black** and send the clean output to the ATEM as before. If you are using a projector scene to feed the ATEM, remove any old green or blue backing layer from that OBS scene. Rehearse over a camera shot: a black/luma key can also remove dark detail within logos, photos and graphics. If it does, try chroma green (provided the graphics don't use that color) or use **Transparent** when compositing directly in OBS.

**Upgrading an existing studio:** Export the current rundown as a backup, close the old studio, and launch the new folder. Use the same browser, address and port to retain browser-saved cues; otherwise import the backup. The expanded library does not overwrite the rundown or change the output URL.

Build the rundown on the **Rundown** panel. Rename, duplicate or reorder cues before the show. The example copy is for rehearsal; verify names, scores, dates and attributions before airing. Edits are saved in this browser profile, not on the server. Use **Export** to back up a rundown or move it to another computer, and **Import** to load it there. A studio restart always starts with a clean Program feed.

The hosted website syncs the control and output tabs only within the same browser profile. Use the local studio URLs for OBS, a second application, or a multi-computer production. If your school permits it, launch with `--lan` on a trusted production network and use the LAN addresses printed in Terminal. Keep the operator URL private. The clean LAN output is viewable by anyone who can reach that server. Do not forward the port or expose it to the internet.

## Add graphics later

- To add an episode cue, use **Add** in the desk. No code change needed.
- To add a segment bumper, update `docs/segments.mjs` and add its H.264 MP4 to `docs/media/`. To add a different type of playback cue, update `clips` in `docs/graphics.mjs` with its exact runtime so auto-clear works.
- The source for the new bumper animations is in `tools/`. Run `bash tools/build-bumpers.sh` on a Mac with Swift, Node and FFmpeg to re-render them. The studio itself does not need Swift or FFmpeg.
- For a new graphic type, register its fields and layer in `docs/graphics.mjs`, add the corresponding layout in `docs/render.mjs`, and style it in `docs/graphics.css`. The desk automatically offers registered types.
- Run `node --test graphics.test.mjs` after editing the cue or layer logic.
