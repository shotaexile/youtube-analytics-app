import React, { createContext, useContext, useState } from 'react';

export type AiTab = 'articles' | 'news' | 'rankings' | 'tools' | 'sources';

interface AiSubNavContextValue {
  activeTab: AiTab;
  setActiveTab: (tab: AiTab) => void;
}

const AiSubNavContext = createContext<AiSubNavContextValue>({
  activeTab: 'articles',
  setActiveTab: () => {},
});

export function AiSubNavProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AiTab>('articles');
  return (
    <AiSubNavContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AiSubNavContext.Provider>
  );
}

export function useAiSubNav() {
  return useContext(AiSubNavContext);
}
