"""Prints what the network-only data sources look like (run in CI, where the internet is open)."""
import json
import re
import sys
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept-Language": "ru-RU,ru;q=0.9,kk;q=0.8"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read().decode("utf-8", "replace")


def qdc():
    data = json.loads(get("https://api.qurancdn.com/api/qdc/audio/reciters/7/audio_files?chapter=1&segments=true"))
    print(json.dumps(data, ensure_ascii=False)[:3000])


def yt_search(q):
    html = get("https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": q}))
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m:
        print("no data for", q)
        return
    data = json.loads(m.group(1))
    out = []

    def walk(o):
        if isinstance(o, dict):
            if "videoRenderer" in o:
                v = o["videoRenderer"]
                out.append((v.get("videoId"),
                            "".join(r.get("text", "") for r in v.get("title", {}).get("runs", [])),
                            "".join(r.get("text", "") for r in v.get("ownerText", {}).get("runs", [])),
                            v.get("ownerText", {}).get("runs", [{}])[0].get("navigationEndpoint", {}).get("browseEndpoint", {}).get("browseId"),
                            v.get("lengthText", {}).get("simpleText"),
                            v.get("viewCountText", {}).get("simpleText")))
            for x in o.values():
                walk(x)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(data)
    print(f"### {q}")
    for row in out[:25]:
        print(" | ".join(str(x) for x in row))


if __name__ == "__main__":
    try:
        qdc()
    except Exception as e:
        print("qdc failed", e)
    for q in sys.argv[1:]:
        try:
            yt_search(q)
        except Exception as e:
            print("search failed", q, e)
