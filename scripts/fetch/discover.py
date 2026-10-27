"""Temporary: shows what the playlist and muftyat.kz offer (CI only)."""
import json
import re
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "Accept-Language": "kk-KZ,kk;q=0.9,ru;q=0.8"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode("utf-8", "replace")


html = get("https://www.youtube.com/playlist?list=PL1OPjpx94Q5_lVFLV1Qp-gGTu-grRZ87Z")
data = json.loads(re.search(r"var ytInitialData = (\{.*?\});</script>", html).group(1))
rows = []


def walk(o):
    if isinstance(o, dict):
        if "lockupViewModel" in o:
            v = o["lockupViewModel"]
            md = v.get("metadata", {}).get("lockupMetadataViewModel", {})
            parts = []
            for row in md.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", []):
                for p in row.get("metadataParts", []):
                    parts.append(p.get("text", {}).get("content", ""))
            rows.append((v.get("contentId"), v.get("contentType"), md.get("title", {}).get("content"), " / ".join(parts)))
        if "continuationCommand" in o:
            print("CONTINUATION present")
        for x in o.values():
            walk(x)
    elif isinstance(o, list):
        for x in o:
            walk(x)


walk(data)
print("PLAYLIST", len(rows))
for r in rows[:120]:
    print("PL", " | ".join(str(x) for x in r))

books = []
for page in range(1, 9):
    try:
        p = get(f"https://muftyat.kz/kk/books/?page={page}&lang=all&expertise=1")
        for href, text in re.findall(r'<a[^>]+href="(/kk/book/\d+/)"[^>]*>(.*?)</a>', p, re.S):
            t = re.sub(r"<[^>]+>|\s+", " ", text).strip()
            if t and t.lower() not in ("pdf", "flash") and len(t) < 90:
                books.append((href, t))
    except Exception as e:
        print("books failed", page, e)
for b in sorted(set(books)):
    print("BOOK", b[0], "|", b[1])
book = get("https://muftyat.kz/kk/book/28705/")
print("BOOKLINKS", sorted(set(re.findall(r'href="([^"]+\.(?:pdf|PDF)[^"]*)"', book)))[:10])
