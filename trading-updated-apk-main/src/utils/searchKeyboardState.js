import { useState, useEffect } from 'react';

let isSearchKeyboardActive = true;
const searchKeyboardListeners = new Set();

export const setSearchKeyboardActive = (active) => {
    if (isSearchKeyboardActive !== active) {
        isSearchKeyboardActive = active;
        searchKeyboardListeners.forEach((fn) => fn(active));
    }
};

export const useSearchKeyboardActive = () => {
    const [active, setActive] = useState(isSearchKeyboardActive);
    useEffect(() => {
        searchKeyboardListeners.add(setActive);
        return () => searchKeyboardListeners.delete(setActive);
    }, []);
    return active;
};
