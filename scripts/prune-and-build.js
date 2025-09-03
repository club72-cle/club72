// Deletes message files older than 24h and rebuilds data/feed.json
const fs = require('fs');
const path = require('path');


const MSG_DIR = path.join(process.cwd(), 'data', 'messages');
const FEED = path.join(process.cwd(), 'data', 'feed.json');
const TTL_MS = 24 * 60 * 60 * 1000;


function safeReadJSON(p){
try{ return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e){ return null; }
}


function main(){
if(!fs.existsSync(MSG_DIR)) fs.mkdirSync(MSG_DIR, {recursive:true});
const now = Date.now();
const files = fs.readdirSync(MSG_DIR).filter(f=>f.endsWith('.json'));
const keep = [];


for(const f of files){
const p = path.join(MSG_DIR, f);
const data = safeReadJSON(p);
const ts = data?.ts ? Number(data.ts) : null;
if(!ts || (now - ts) > TTL_MS){
try{ fs.unlinkSync(p); }catch(_){/* ignore */}
continue;
}
// sanitize a little before adding to feed
keep.push({
id: data.id || f.replace(/\.json$/, ''),
text: String(data.text||'').slice(0,600),
handle: String(data.handle||'anon').slice(0,40),
room: String(data.room||'main'),
ts: String(ts)
});
}


keep.sort((a,b)=>Number(a.ts)-Number(b.ts));
const out = { updated: Date.now(), messages: keep.slice(-1000) };
fs.mkdirSync(path.dirname(FEED), {recursive:true});
fs.writeFileSync(FEED, JSON.stringify(out, null, 2));
}


main();