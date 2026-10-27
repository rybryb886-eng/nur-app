"""Cities of namaz.muftyat.kz (the Muftyat's own list, grouped by region) with the coordinates its
timetables use. Writes assets/muftyat-cities.json; the app downloads each city's yearly timetable
from api.muftyat.kz by these coordinates, so its times match the site exactly."""
import json
import re
import urllib.request
from html import unescape

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
html = urllib.request.urlopen(urllib.request.Request("https://namaz.muftyat.kz/kk/", headers=UA), timeout=40).read().decode()
select = re.search(r'<select class="select_city[^"]*">(.*?)</select>', html, re.S).group(1)
regions = []
for label, body in re.findall(r'<optgroup label="([^"]+)">(.*?)</optgroup>', select, re.S):
    cities = []
    for attrs, name in re.findall(r"<option([^>]*)>([^<]+)</option>", body):
        a = dict(re.findall(r'data-(\w+)="([^"]*)"', attrs))
        cities.append({"id": int(a["id"]), "name": unescape(name).strip(), "lat": float(a["lat"]), "lon": float(a["lng"]), "tz": int(a["tz"])})
    regions.append({"region": unescape(label), "cities": cities})
total = sum(len(r["cities"]) for r in regions)
if total < 20:
    raise SystemExit(f"Only {total} cities found; keeping the previous list")
json.dump(regions, open("assets/muftyat-cities.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(regions), "regions,", total, "cities")
