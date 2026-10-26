import { createElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const ORIGIN = 'https://kz.nurapp.app';

function html(videoId: string) {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#p{position:absolute;top:0;left:0;width:100%;height:100%}</style>
</head><body><div id="p"></div>
<script>
function send(m){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m))}
function onYouTubeIframeAPIReady(){
  new YT.Player('p',{videoId:'${videoId}',
    playerVars:{autoplay:1,playsinline:1,rel:0,modestbranding:1,origin:'${ORIGIN}'},
    events:{
      onReady:function(e){e.target.playVideo()},
      onStateChange:function(e){send({state:e.data})},
      onError:function(e){send({error:e.data})}
    }});
}
</script>
<script src="https://www.youtube.com/iframe_api"></script>
</body></html>`;
}

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
  onError: (code: number) => void;
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
        source={{ html: html(videoId), baseUrl: ORIGIN }}
        style={{ backgroundColor: '#000' }}
        javaScriptEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.state === 0) onEnded();
            if (m.error !== undefined) onError(m.error);
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
