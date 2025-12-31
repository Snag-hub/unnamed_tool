'use client';

import { useCallback } from 'react';

type HapticPattern =
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error'
    | 'selection';

export function useHaptic() {
    const trigger = useCallback((pattern: HapticPattern) => {
        if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
            return;
        }

        switch (pattern) {
            case 'light':
                window.navigator.vibrate(10);
                break;
            case 'medium':
                window.navigator.vibrate(40);
                break;
            case 'heavy':
                window.navigator.vibrate(70);
                break;
            case 'selection':
                window.navigator.vibrate(15);
                break;
            case 'success':
                window.navigator.vibrate([10, 30, 10]);
                break;
            case 'warning':
                window.navigator.vibrate([30, 50, 10]);
                break;
            case 'error':
                window.navigator.vibrate([10, 50, 10, 50]);
                break;
            default:
                break;
        }
    }, []);

    return { trigger };
}
