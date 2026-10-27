"""Yearly prayer timetables of every city in assets/muftyat-cities.json, straight from api.muftyat.kz
(the source of namaz.muftyat.kz), for this year and the next. Writes assets/muftyat/times-<year>.json:
{city id: one string per year, 24 digits a day = HHMM of fajr, sunrise, dhuhr, asr, maghrib, isha}."""
import datetime
import json
import os
import time
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
regions = json.load(open("assets/muftyat-cities.json"))
os.makedirs("assets/muftyat", exist_ok=True)
this_year = datetime.date.today().year
for year in (this_year, this_year + 1):
    out, failed = {}, []
    for city in (c for r in regions for c in r["cities"]):
        url = f"https://api.muftyat.kz/prayer-times/{year}/{city['lat']}/{city['lon']}"
        for attempt in range(3):
            try:
                days = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40))["result"]
                break
            except Exception as e:
                days = None
                time.sleep(2 + attempt * 3)
        if not days:
            failed.append(city["name"])
            continue
        days.sort(key=lambda d: d["Date"])
        out[city["id"]] = "".join(d[k].replace(":", "") for d in days for k in KEYS)
        time.sleep(0.3)
    print(year, len(out), "cities, failed:", failed)
    if len(out) < len(failed) * 4:
        raise SystemExit(f"Too many failures for {year}; keeping the previous timetables")
    path = f"assets/muftyat/times-{year}.json"
    if os.path.exists(path):
        # Keep a city's previous timetable when only its request failed this time.
        out = {**json.load(open(path)), **{str(k): v for k, v in out.items()}}
    json.dump(out, open(path, "w"), separators=(",", ":"))
