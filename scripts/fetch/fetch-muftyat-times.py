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


def fetch(city, year):
    url = f"https://api.muftyat.kz/prayer-times/{year}/{city['lat']}/{city['lon']}"
    for attempt in range(4):
        try:
            days = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))["result"]
            days.sort(key=lambda d: d["Date"])
            return "".join(d[k].replace(":", "") for d in days for k in KEYS)
        except Exception as e:
            print("retry", city["name"], year, e)
            time.sleep(5 + attempt * 10)
    return None


cities = [c for r in regions for c in r["cities"]]
for year in (this_year, this_year + 1):
    out, todo = {}, cities
    for _ in range(3):  # the API drops some requests under load; go over the failed ones again
        failed = []
        for city in todo:
            table = fetch(city, year)
            if table:
                out[str(city["id"])] = table
            else:
                failed.append(city)
            time.sleep(0.5)
        todo = failed
        if not todo:
            break
        time.sleep(30)
    print(year, len(out), "cities, failed:", [c["name"] for c in todo])
    if not out:
        raise SystemExit(f"Nothing fetched for {year}; keeping the previous timetables")
    path = f"assets/muftyat/times-{year}.json"
    if os.path.exists(path):
        # Keep a city's previous timetable when only its request failed this time.
        out = {**json.load(open(path)), **out}
    json.dump(out, open(path, "w"), separators=(",", ":"))
