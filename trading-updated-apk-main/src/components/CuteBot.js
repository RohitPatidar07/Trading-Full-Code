import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const CuteBot = ({ size = 42 }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            {/* Background Halo */}
            <Circle cx="50" cy="50" r="46" fill="rgba(66, 133, 244, 0.08)" stroke="rgba(66, 133, 244, 0.3)" strokeWidth="1.5" />
            
            {/* Sleek Body */}
            <Path 
                d="M32 68 Q50 82 68 68 Q68 52 50 52 Q32 52 32 68" 
                fill="#2A5BD7" 
            />
            
            {/* Head - Sleeker Shape */}
            <Rect x="28" y="18" width="44" height="38" rx="12" fill="#2A5BD7" />
            
            {/* Visor Area - Glassy */}
            <Rect x="32" y="26" width="36" height="16" rx="6" fill="#0F172A" />
            
            {/* Professional Eyes - Minimalist */}
            <Rect x="40" y="32" width="6" height="4" rx="2" fill="#00E5FF" />
            <Rect x="54" y="32" width="6" height="4" rx="2" fill="#00E5FF" />
            
            {/* Subtle Shine/Highlight (Glassmorphism feel) */}
            <Path 
                d="M32 20 Q40 18 50 18 Q60 18 68 20" 
                fill="none" 
                stroke="rgba(255,255,255,0.2)" 
                strokeWidth="2" 
                strokeLinecap="round" 
            />
            
            {/* Antenna - Minimalist */}
            <Path d="M50 18 L50 10" stroke="#2A5BD7" strokeWidth="2" />
            <Circle cx="50" cy="8" r="2.5" fill="#4FC3F7" />
            
            {/* Side Details (Pods) */}
            <Rect x="24" y="28" width="4" height="12" rx="2" fill="#1E40AF" />
            <Rect x="72" y="28" width="4" height="12" rx="2" fill="#1E40AF" />

            {/* Subtle Smile */}
            <Path d="M48 37 Q50 39 52 37" fill="none" stroke="#00E5FF" strokeWidth="0.8" strokeLinecap="round" />
        </Svg>
    );
};

export default CuteBot;
