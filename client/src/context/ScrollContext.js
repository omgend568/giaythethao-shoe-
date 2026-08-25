import { createContext, useContext, useState, useEffect } from 'react';

const ScrollContext = createContext();

export function ScrollProvider({ children }) {
    const [isScrolledPastHeader, setIsScrolledPastHeader] = useState(false);

    useEffect(() => {
        const headerHeight = 80;
        
        const handleScroll = () => {
            setIsScrolledPastHeader(window.scrollY > headerHeight);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <ScrollContext.Provider value={{ isScrolledPastHeader }}>
            {children}
        </ScrollContext.Provider>
    );
}

export function useScrollHeader() {
    const context = useContext(ScrollContext);
    if (!context) {
        return { isScrolledPastHeader: false };
    }
    return context;
}
