import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useTrades } from '../context/TradeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TickerTape = () => {
    const { tickers } = useTrades();
    const scrollX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const [contentWidth, setContentWidth] = useState(0);

    const items = useMemo(() => {
        if (!tickers || tickers.length === 0) return [];
        return tickers.map(t => ({
            type: 'alert',
            label: '📢',
            value: t.text
        }));
    }, [tickers]);

    const onContentLayout = useCallback((e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContentWidth(w);
    }, []);

    useEffect(() => {
        if (items.length === 0 || contentWidth === 0) return;

        const totalDist = SCREEN_WIDTH + contentWidth;
        const speed = 60; // pixels per second
        const duration = (totalDist / speed) * 1000;

        const startAnim = () => {
            scrollX.setValue(SCREEN_WIDTH);
            Animated.timing(scrollX, {
                toValue: -contentWidth,
                duration,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) startAnim();
            });
        };

        startAnim();
        return () => scrollX.stopAnimation();
    }, [items.length, contentWidth]);

    if (items.length === 0) return null;

    return (
        <View style={styles.container}>
            <Animated.View
                onLayout={onContentLayout}
                style={[
                    styles.tickerContent,
                    { transform: [{ translateX: scrollX }] }
                ]}
            >
                {/* Single map, no complex mashup logic */}
                {items.map((item, idx) => (
                    <View key={idx} style={styles.item}>
                        {item.type === 'alert' ? (
                            <View style={styles.alertBox}>
                                <Text style={styles.alertLabel}>{item.label}: </Text>
                                <Text style={styles.alertValue}>{item.value}</Text>
                            </View>
                        ) : (
                            <View style={styles.indexBox}>
                                <Text style={styles.indexLabel}>{item.label}</Text>
                                <Text style={styles.indexValue}>{item.value}</Text>
                                <Text style={[styles.indexPct, { color: item.isUp ? '#48BB78' : '#F56565' }]}>
                                    {item.isUp ? '▲' : '▼'} {item.pct}%
                                </Text>
                            </View>
                        )}
                        {/* Huge gap after each item to prevent overlap */}
                        <View style={styles.spacer} />
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 32,
        backgroundColor: '#050a12',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99,179,237,0.2)',
        overflow: 'hidden',
        justifyContent: 'center',
    },
    tickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        // Important: never allow wrapping
        flexWrap: 'nowrap',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
    },
    indexBox: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
    },
    indexLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        fontWeight: '900',
        marginRight: 6,
    },
    indexValue: {
        color: 'white',
        fontSize: 14.5,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    indexPct: {
        fontSize: 12,
        fontWeight: '900',
        marginLeft: 6,
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99,179,237,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(99,179,237,0.3)',
        flexWrap: 'nowrap',
    },
    alertLabel: {
        color: '#63B3ED',
        fontSize: 12.5,
        fontWeight: 'bold',
    },
    alertValue: {
        color: 'white',
        fontSize: 13.5,
        fontWeight: '500',
    },
    spacer: {
        width: 150, // Massive fixed space to stop "mashup"
    }
});

export default TickerTape;
