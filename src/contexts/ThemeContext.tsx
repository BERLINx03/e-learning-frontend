import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'light' | 'dark' | 'onyx' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  resolvedTheme: 'light' | 'dark' | 'onyx';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    return savedTheme || 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'onyx'>('light');

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Effect to handle 'system' theme preference and apply theme to document
  useEffect(() => {
    const updateTheme = () => {
      let newTheme: 'light' | 'dark' | 'onyx' = 'light';
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        newTheme = prefersDark ? 'dark' : 'light';
      } else {
        newTheme = theme as 'light' | 'dark' | 'onyx';
      }
      
      setResolvedTheme(newTheme);
      
      // Remove all theme classes first
      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-onyx');
      
      // Add the current theme class
      document.documentElement.classList.add(`theme-${newTheme}`);
      
      // Optionally set a data attribute for CSS targeting
      document.documentElement.setAttribute('data-theme', newTheme);

      // Apply proper color-scheme meta tag
      const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
      if (metaColorScheme) {
        metaColorScheme.setAttribute('content', newTheme === 'light' ? 'light' : 'dark');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'color-scheme';
        meta.content = newTheme === 'light' ? 'light' : 'dark';
        document.head.appendChild(meta);
      }
    };

    updateTheme();

    // Listen for changes in system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };
    
    // Use the correct event listener depending on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 