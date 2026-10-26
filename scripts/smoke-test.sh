#!/usr/bin/env bash
# Installs the APK on the running emulator, opens the main screens and prints each screenshot to the
# shots/NN-name.png. Fails if the app is not running at the end.
set -u
APK="$1"
PKG=kz.nurapp.app

mkdir -p shots
N=0
shot() {
  sleep "$2"
  N=$((N + 1))
  adb exec-out screencap -p > "shots/$(printf %02d $N)-$1.png"
}
open_link() { adb shell am start -W -a android.intent.action.VIEW -d "$1" "$PKG" >/dev/null; }

adb install -r "$APK"
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 25
adb exec-out screencap -p > screen.png
adb shell pidof "$PKG" || { adb logcat -d -v brief | grep -E "AndroidRuntime|FATAL" | tail -n 120; exit 1; }

# Dismiss the notification permission prompt.
adb shell input keyevent 4
shot home 3
open_link "nur:///surah/1"
shot surah 6
adb shell input tap 40 600
shot surah-playing 15
open_link "nur:///sermons"
shot sermons 10
adb shell input tap 160 280
shot sermon-playing 15
open_link "nur:///learn/prayer"
shot learn 5

adb logcat -d -v brief | grep -E "FATAL|AndroidRuntime|ReactNativeJS" | tail -n 80
adb shell pidof "$PKG"
