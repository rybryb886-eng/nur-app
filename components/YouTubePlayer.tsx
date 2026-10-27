import { createElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const ORIGIN = 'https://kz.nurapp.app';

// YouTube refuses embeds that arrive without a Referer (player errors 152/153), which is what a
// WebView loading inline HTML sends, so the embed page is opened directly with one.
function embedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(ORIGIN)}`;
}

// Runs inside the embed page: reports the end of the video and playback errors.
const WATCH = `
(function () {
  function send(m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  var hooked = null;
  var reported = false;
  setInterval(function () {
    var v = document.querySelector('video');
    if (v && v !== hooked) {
      hooked = v;
      v.addEventListener('ended', function () { send({ state: 0 }); });
      v.play && v.play().catch(function () {});
    }
    var err = document.querySelector('.ytp-error');
    if (err && err.offsetParent !== null && !reported) {
      reported = true;
      send({ error: (err.textContent || 'page').slice(0, 80) });
    }
  }, 1000);
})();
true;
`;

/**
 * Embedded YouTube player. Reports when the video ends (to move on to the next one in the
 * playlist) and when the owner does not allow embedding.
 */
export function YouTubePlayer({
  videoId,
  onEnded,
  onError,
}: {
  videoId: string;
  onEnded: () => void;
  onError: (code: number | string) => void;
}) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.frame}>
        {createElement('iframe', {
          src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
          style: { border: 0, width: '100%', height: '100%' },
          allow: 'autoplay; encrypted-media; fullscreen',
        })}
      </View>
    );
  }
  return (
    <View style={styles.frame}>
      <WebView
        key={videoId}
        source={{ uri: embedUrl(videoId), headers: { Referer: `${ORIGIN}/` } }}
        injectedJavaScript={WATCH}
        style={{ backgroundColor: '#000' }}
        javaScriptEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.state === 0) onEnded();
            if (m.error !== undefined) {
              console.warn(`YouTube player error ${m.error} for ${videoId}`);
              onError(m.error);
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
