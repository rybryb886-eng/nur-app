"""Latest videos of the sermon channels listed in lib/sermonChannels.json, as the app's offline
fallback (the app refreshes the same feeds itself at runtime). Writes assets/sermons.json."""
import json
import re
import time
import urllib.request
from html import unescape

channels = json.load(open("lib/sermonChannels.json"))
items = []
for ch in channels:
    try:
        req = urllib.request.Request(f"https://www.youtube.com/feeds/videos.xml?channel_id={ch['id']}",
                                     headers={"User-Agent": "Mozilla/5.0 (nur-app data build)"})
        xml = urllib.request.urlopen(req, timeout=30).read().decode()
    except Exception as e:
        print("failed", ch, e)
        continue
    for entry in re.findall(r"<entry>(.*?)</entry>", xml, re.S):
        vid = re.search(r"<yt:videoId>(.*?)</yt:videoId>", entry).group(1)
        title = unescape(re.search(r"<title>(.*?)</title>", entry).group(1))
        published = re.search(r"<published>(.*?)</published>", entry).group(1)
        items.append({"id": vid, "title": title, "channel": ch["id"], "published": published})
    print(ch["name"], "ok")
    time.sleep(1)
json.dump(items, open("assets/sermons.json", "w"), ensure_ascii=False, indent=0)
print(len(items), "videos")
