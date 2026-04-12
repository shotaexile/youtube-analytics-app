import React, { createContext, useContext, useState } from 'react';

export type YoutubeTab = 'dashboard' | 'rankings' | 'charts' | 'videos' | 'ai' | 'early-stats';

interface YoutubeSubNavContextValue {
  activeTab: YoutubeTab;
  setActiveTab: (tab: YoutubeTab) => void;
}

const YoutubeSubNavContext = createContext<YoutubeSubNavContextValue>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export function YoutubeSubNavProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<YoutubeTab>('dashboard');
  return (
    <YoutubeSubNavContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </YoutubeSubNavContext.Provider>
  );
}

export function useYoutubeSubNav() {
  return useContext(YoutubeSubNavContext);
}
