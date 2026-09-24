import React, { useState, useEffect, useRef } from "react";
import { Text, Animated, StyleSheet } from "react-native";

/**
 * A reusable component that triggers a scale and color flash when the value changes.
 * Mirrored from the web platform's market data animations.
 */
const parseNumeric = (v) => {
    if (typeof v === "number") return v;
    if (!v) return 0;
    // Remove everything except digits and decimal point
    const cleaned = v.toString().replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
};

const FluctuatingPrice = ({ value, numericValue, label, showLabel = true, containerStyle, textStyle, decimals = 2 }) => {
    // Priority given to numericValue if provided
    const valForCompare = numericValue !== undefined ? numericValue : parseNumeric(value);
    const prevValue = useRef(valForCompare);
    
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [flash, setFlash] = useState(null); // "up", "down", null

    useEffect(() => {
        const current = valForCompare;
        const prev = prevValue.current;
        
        if (current !== prev && !isNaN(current) && !isNaN(prev)) {
            const dir = current > prev ? "up" : "down";
            setFlash(dir);

            // Scale bounce for visual pop during price change
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.08,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true
                })
            ]).start();

            // Clear flash after 380ms so the transparent green/red glow is clearly visible
            const timer = setTimeout(() => setFlash(null), 380);
            prevValue.current = current;
            return () => clearTimeout(timer);
        }
        prevValue.current = current;
    }, [valForCompare]);

    // Transparent green and red colors for fluctuation (box removed when idle)
    const flashBgColor = flash === "up" 
        ? "rgba(34, 197, 94, 0.22)" 
        : flash === "down" 
        ? "rgba(239, 68, 68, 0.22)" 
        : "transparent";

    const flashBorderColor = flash === "up"
        ? "rgba(34, 197, 94, 0.45)"
        : flash === "down"
        ? "rgba(239, 68, 68, 0.45)"
        : "transparent";

    const flashTextColor = flash === "up" 
        ? "#00E676" 
        : flash === "down" 
        ? "#FF5252" 
        : (textStyle?.color || "white");

    return (
        <Animated.View style={[
            containerStyle,
            {
                backgroundColor: flashBgColor,
                borderColor: flashBorderColor,
                borderWidth: 1,
                borderRadius: 6,
                transform: [{ scale: scaleAnim }]
            }
        ]}>
            <Text 
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                    textStyle, 
                    { 
                        color: flashTextColor, 
                        fontWeight: flash ? "900" : (textStyle?.fontWeight || "800") 
                    }
                ]}
            >
                {showLabel && label ? `${label}: ` : ""}{value}
            </Text>
        </Animated.View>
    );
};

export default FluctuatingPrice;
