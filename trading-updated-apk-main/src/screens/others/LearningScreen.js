import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Play, ChevronLeft, BookOpen } from 'lucide-react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import ScreenHeader from '../../components/ScreenHeader';

const { width } = Dimensions.get('window');

// ─── Replace this with your actual YouTube video ID ───
const VIDEO_ID = 'grAMOvn4pFM';

// ─── Update these chapters with your video's real timestamps (in seconds) ───
const SEGMENTS = [
    { id: '1', title: 'Introduction to Trading', start: 0, end: 180 },
    { id: '2', title: 'What is the Stock Market?', start: 180, end: 450 },
    { id: '3', title: 'Types of Orders', start: 450, end: 780 },
    { id: '4', title: 'Technical Analysis Basics', start: 780, end: 1200 },
    { id: '5', title: 'Risk Management Rules', start: 1200, end: 1650 },
    { id: '6', title: 'Building a Trading Plan', start: 1650, end: 2100 },
];

const buildHTML = (videoId) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; background:#000; }
    html, body { width:100%; height:100%; overflow:hidden; }
    #player { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    var player;
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: function(e) {
            var stateMap = {};
            stateMap[YT.PlayerState.PLAYING] = 'playing';
            stateMap[YT.PlayerState.PAUSED]  = 'paused';
            stateMap[YT.PlayerState.ENDED]   = 'ended';
            var s = stateMap[e.data] || 'unknown';
            window.ReactNativeWebView.postMessage(JSON.stringify({ type:'state', state:s }));
          }
        }
      });
    }

    // Send current time every second
    setInterval(function() {
      if (player && typeof player.getCurrentTime === 'function') {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type:'time', time: player.getCurrentTime() })
        );
      }
    }, 1000);

    // Listen for seek commands from React Native
    document.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'seekTo' && player) {
          player.seekTo(msg.time, true);
          player.playVideo();
        }
      } catch(_) {}
    });
  </script>
</body>
</html>
`;

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (h > 0) parts.push(String(h));
    parts.push(String(m).padStart(2, '0'));
    parts.push(String(s).padStart(2, '0'));
    return parts.join(':');
};

const LearningScreen = ({ navigation }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const webviewRef = useRef(null);

    const onMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'time') {
                setCurrentTime(data.time);
            }
        } catch (_) { }
    }, []);

    const handleSegmentPress = useCallback((start) => {
        if (webviewRef.current) {
            webviewRef.current.injectJavaScript(
                `(function(){ 
                    document.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type:'seekTo', time:${start} }) })); 
                })()`
            );
        }
    }, []);

    const renderSegment = useCallback(({ item }) => {
        const isActive = currentTime >= item.start && currentTime < item.end;
        return (
            <TouchableOpacity
                style={[styles.segmentItem, isActive && styles.activeSegmentItem]}
                onPress={() => handleSegmentPress(item.start)}
                activeOpacity={0.75}
            >
                <View style={styles.segmentLeft}>
                    <View style={[styles.iconCircle, isActive && styles.activeIconCircle]}>
                        <Play size={16} color={isActive ? '#1a1a2e' : '#CFD1C4'} fill={isActive ? '#1a1a2e' : 'none'} />
                    </View>
                    <View style={styles.textWrap}>
                        <Text style={[styles.segTitle, isActive && styles.activeSegTitle]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.segTime, isActive && styles.activeSegTime]}>
                            {formatTime(item.start)} – {formatTime(item.end)}
                        </Text>
                    </View>
                </View>
                {isActive ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>PLAYING</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    }, [currentTime, handleSegmentPress]);

    return (
        <ScreenWrapper>
            <ScreenHeader title="LEARNING MODULE" showBackButton />

            {/* YouTube Player via WebView */}
            <View style={styles.playerBox}>
                <WebView
                    ref={webviewRef}
                    source={{ html: buildHTML(VIDEO_ID) }}
                    style={styles.webview}
                    onMessage={onMessage}
                    javaScriptEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    allowsFullscreenVideo
                />
            </View>

            {/* Chapters List */}
            <View style={styles.listWrap}>
                <View style={styles.listHeader}>
                    <BookOpen size={18} color="#CFD1C4" />
                    <Text style={styles.listHeaderText}>Course Chapters</Text>
                </View>
                <FlatList
                    data={SEGMENTS}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSegment}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    backBtn: { padding: 4 },
    headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    headerSpacer: { width: 32 },

    playerBox: {
        width: '100%',
        height: width * (9 / 16),
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },

    listWrap: {
        flex: 1,
        marginTop: 10,
        paddingHorizontal: 15,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    listHeaderText: {
        color: '#CFD1C4',
        fontSize: 18.5,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    listContent: { paddingBottom: 30 },

    segmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(207, 209, 196, 0.08)',
        borderRadius: 12,
        padding: 13,
        marginBottom: 9,
        borderWidth: 1,
        borderColor: 'rgba(207, 209, 196, 0.18)',
    },
    activeSegmentItem: {
        backgroundColor: '#CFD1C4',
        borderColor: '#CFD1C4',
    },
    segmentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(207, 209, 196, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activeIconCircle: {
        backgroundColor: 'rgba(26, 26, 46, 0.15)',
    },
    textWrap: { flex: 1 },
    segTitle: { color: 'white', fontSize: 16.5, fontWeight: '600' },
    activeSegTitle: { color: '#1a1a2e' },
    segTime: { color: '#597895', fontSize: 13.5, marginTop: 2 },
    activeSegTime: { color: 'rgba(26, 26, 46, 0.55)' },

    badge: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    badgeText: { color: '#CFD1C4', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.5 },
});

export default LearningScreen;
