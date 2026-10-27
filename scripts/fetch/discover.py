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
            if "lockupViewModel" in o:
                v = o["lockupViewModel"]
                md = v.get("metadata", {}).get("lockupMetadataViewModel", {})
                rows.append((v.get("contentId"), md.get("title", {}).get("content"),
                             json.dumps(md.get("metadata", {}), ensure_ascii=False)[:300], ""))
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

for url in ["https://muftyat.kz/kk/books/", "https://muftyat.kz/kk/dini-senim/", "https://muftyat.kz/kk/search/?q=%D0%BD%D0%B0%D0%BC%D0%B0%D0%B7",
            "https://muftyat.kz/ru/search/?q=%D0%BD%D0%B0%D0%BC%D0%B0%D0%B7"]:
    try:
        page = get(url)
        print("URL", url, len(page))
        for href, text in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', page, re.S):
            t = re.sub(r"<[^>]+>|\s+", " ", text).strip()
            if t and not href.startswith("#"):
                print("  ", href, "|", t[:90])
    except Exception as e:
        print("failed", url, e)
