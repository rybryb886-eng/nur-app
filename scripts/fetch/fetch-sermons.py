"""Sermons from the Muftyat's «Уағыздар жинағы» playlist, chosen by Madi. Writes assets/sermons.json,
which the app bundles and also re-reads from GitHub at runtime, so new videos show without an update."""
import json
import re
import urllib.request

PLAYLIST = "PL1OPjpx94Q5_lVFLV1Qp-gGTu-grRZ87Z"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
           "Accept-Language": "kk-KZ,kk;q=0.9,ru;q=0.8"}


def request(url, body=None):
    data = json.dumps(body).encode() if body else None
    headers = {**HEADERS, **({"Content-Type": "application/json"} if body else {})}
    return urllib.request.urlopen(urllib.request.Request(url, data, headers), timeout=40).read().decode()


items, tokens = [], []


def walk(o):
    if isinstance(o, dict):
        if "lockupViewModel" in o:
            v = o["lockupViewModel"]
            md = v.get("metadata", {}).get("lockupMetadataViewModel", {})
            title = md.get("title", {}).get("content", "")
            if v.get("contentType") == "LOCKUP_CONTENT_TYPE_VIDEO" and title:
                items.append({"id": v["contentId"], "title": title})
        if "continuationCommand" in o:
            if o["continuationCommand"].get("token"):
                tokens.append(o["continuationCommand"]["token"])
        for x in o.values():
            walk(x)
    elif isinstance(o, list):
        for x in o:
            walk(x)


html = request(f"https://www.youtube.com/playlist?list={PLAYLIST}")
version = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html).group(1)
walk(json.loads(re.search(r"var ytInitialData = (\{.*?\});</script>", html).group(1)))
seen = set()
while tokens and len(seen) < 50:
    token = tokens.pop()
    if token in seen:
        continue
    seen.add(token)
    body = {"context": {"client": {"clientName": "WEB", "clientVersion": version, "hl": "kk"}}, "continuation": token}
    walk(json.loads(request("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", body)))



def speaker_of(part):
    """A speaker's name from one "|"-separated part of a title, or "" if the part isn't a name."""
    name = re.sub(r"^\(.*?\)\s*|^[Ұұ]стаз\s+", "", part.strip()).strip()
    words = name.split()
    if not 2 <= len(words) <= 6 or "MUFTYAT" in name.upper() or re.search(r"[(?!:«»0-9]", name):
        return ""
    if not all(w[0].isupper() or w in ("қажы", "хазірет", "мүфти") for w in words):
        return ""
    return " ".join(w.capitalize() if w.isupper() else w for w in words)


unique = list({s["id"]: s for s in items}.values())
for s in unique:
    parts = s["title"].split("|")
    names = [speaker_of(p) for p in parts[1:]] if len(parts) > 1 else []
    s["speaker"] = next((n for n in reversed(names) if n), "")
if len(unique) < 10:
    raise SystemExit(f"Only {len(unique)} videos fetched; keeping the previous list")
json.dump(unique, open("assets/sermons.json", "w"), ensure_ascii=False, indent=0)
print(len(unique), "videos")
for s in unique[:15]:
    print(s)
