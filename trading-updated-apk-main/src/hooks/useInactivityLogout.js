import { useEffect, useRef, useMemo } from 'react';
import { PanResponder } from 'react-native';
import * as api from '../services/api';
import { navigationRef } from '../navigation/RootNavigation';

/**
 * Custom hook to handle 10-minute inactivity auto-logout for React Native Mobile App.
 * Pass panHandlers to root View to capture touch events passively without stealing them.
 */
export const useInactivityLogout = (inactivityTime = 10 * 60 * 1000) => {
    const timeoutRef = useRef(null);

    const performLogout = () => {
        if (api.hasSession()) {
            console.log('[useInactivityLogout] ⏱️ 10 Minutes Inactivity timeout reached! Logging out...');
            api.clearSession(true);

            if (navigationRef.isReady()) {
                const currentRoute = navigationRef.getCurrentRoute();
                if (currentRoute && currentRoute.name !== 'Login') {
                    navigationRef.navigate('Login');
                }
            }
        }
    };

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (api.hasSession()) {
            timeoutRef.current = setTimeout(performLogout, inactivityTime);
        }
    };

    useEffect(() => {
        resetTimer();

        // Interval to check session status periodically (e.g. if user just logged in)
        const checkInterval = setInterval(() => {
            if (api.hasSession() && !timeoutRef.current) {
                resetTimer();
            }
        }, 5000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            clearInterval(checkInterval);
        };
    }, [inactivityTime]);

    // PanResponder passively listens to any touch without setting setPanResponder (returns false)
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponderCapture: () => {
                    resetTimer();
                    return false;
                },
                onMoveShouldSetPanResponderCapture: () => {
                    resetTimer();
                    return false;
                },
            }),
        [inactivityTime]
    );

    return {
        panHandlers: panResponder.panHandlers,
        resetTimer,
    };
};

export default useInactivityLogout;
