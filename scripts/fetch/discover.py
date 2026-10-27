"""Temporary: shows what the playlist and muftyat.kz offer (CI only)."""
import json
import re
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept-Language": "kk-KZ,kk;q=0.9,ru;q=0.8"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode("utf-8", "replace")


try:
    html = get("https://www.youtube.com/playlist?list=PL1OPjpx94Q5_lVFLV1Qp-gGTu-grRZ87Z")
    data = json.loads(re.search(r"var ytInitialData = (\{.*?\});</script>", html).group(1))
    rows = []

    def walk(o):
        if isinstance(o, dict):
            if "playlistVideoRenderer" in o:
                v = o["playlistVideoRenderer"]
                rows.append((v.get("videoId"), "".join(r.get("text", "") for r in v["title"].get("runs", [])),
                             "".join(r.get("text", "") for r in v.get("shortBylineText", {}).get("runs", [])),
                             v.get("lengthText", {}).get("simpleText")))
            if "playlistHeaderRenderer" in o or "pageHeaderRenderer" in o:
                print("HEADER", json.dumps(o, ensure_ascii=False)[:600])
            for x in o.values():
                walk(x)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(data)
    print("PLAYLIST", len(rows))
    for r in rows:
        print(" | ".join(str(x) for x in r))
except Exception as e:
    print("playlist failed", e)

for url in ["https://muftyat.kz/sitemap.xml", "https://muftyat.kz/kk/", "https://muftyat.kz/ru/"]:
    try:
        page = get(url)
        links = sorted(set(re.findall(r'https?://muftyat\.kz/[^"\'<> ]+|href="(/[^"]+)"', page)))
        print("URL", url, len(page))
        for l in links:
            l = l if isinstance(l, str) else "".join(l)
            if re.search(r"namaz|daret|dәret|gusyl|ghusl|ğusyl|tahar|wudu|abdest|oqu|kitap|book|ilim|knowledge|fiqh|fiqh|faq|sura|abc|beginner|jana", l, re.I):
                print("  ", l)
        print("  sample:", [l for l in links][:60])
    except Exception as e:
        print("failed", url, e)
