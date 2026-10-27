"""Temporary: saves muftyat.kz texts on prayer, wudu and ghusl to research/ (CI uploads them)."""
import os
import re
import subprocess
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
os.makedirs("research", exist_ok=True)


def get(url, raw=False):
    b = urllib.request.urlopen(urllib.request.Request("https://muftyat.kz" + url, headers=UA), timeout=60).read()
    return b if raw else b.decode("utf-8", "replace")


def text(html):
    html = re.sub(r"<(script|style)[\s\S]*?</\1>", "", html)
    html = re.sub(r"<br\s*/?>|</p>|</h\d>|</li>|</div>", "\n", html)
    return re.sub(r"\n\s*\n+", "\n\n", re.sub(r"<[^>]+>", "", html)).strip()


for book in ["28698", "28705", "28692", "28697"]:
    try:
        page = get(f"/kk/book/{book}/")
        pdf = re.search(r'href="(/media/[^"]+\.pdf)"', page, re.I).group(1)
        open(f"research/book-{book}.pdf", "wb").write(get(pdf, raw=True))
        subprocess.run(["pdftotext", "-layout", f"research/book-{book}.pdf", f"research/book-{book}.txt"], check=True)
        os.remove(f"research/book-{book}.pdf")
        print("book", book, os.path.getsize(f"research/book-{book}.txt"))
    except Exception as e:
        print("book failed", book, e)

qa = get("/kk/qa/")
cats = sorted(set(re.findall(r'href="(/kk/qa/qa-[a-z-]+/)"', qa)))
print("QA categories", cats)
out = open("research/qa.txt", "w")
for cat in cats:
    if not re.search(r"namaz|taharat|daret|gusyl|tazal|ibadat", cat):
        continue
    for n in range(1, 6):
        try:
            listing = get(f"{cat}?page={n}")
        except Exception:
            break
        links = sorted(set(re.findall(r'href="(%s[^"?#]+/)"' % re.escape(cat), listing)))
        if not links:
            break
        for link in links:
            try:
                out.write(f"\n\n===== {link}\n" + text(get(link))[:6000])
            except Exception as e:
                print("qa failed", link, e)
out.close()
print("qa size", os.path.getsize("research/qa.txt"))
