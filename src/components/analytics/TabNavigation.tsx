'use client';

import React from 'react';

export type AnalyticsTab = 'fisico' | 'actividad' | 'entreno' | 'adherencia';

interface TabNavigationProps {
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'fisico' as AnalyticsTab, label: '📈 Físico', icon: '📈' },
    { id: 'actividad' as AnalyticsTab, label: '🔥 Actividad', icon: '🔥' },
    { id: 'entreno' as AnalyticsTab, label: '💪 Entreno', icon: '💪' },
    { id: 'adherencia' as AnalyticsTab, label: '📅 Adherencia', icon: '📅' }
  ];

  return (
    <div className="flex space-x-1 p-2 bg-gray-50 rounded-lg mb-4 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-primary text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.icon}</span>
        </button>
      ))}
    </div>
  );
};