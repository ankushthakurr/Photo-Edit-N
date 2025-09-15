/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import Editor from './pages/Editor';
import LogoGenerator from './pages/LogoGenerator';
import MockupGenerator from './pages/MockupGenerator';

export type Page = 'home' | 'editor' | 'logo' | 'mockup';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');

  const renderContent = () => {
    switch (page) {
      case 'editor':
        return <Editor />;
      case 'logo':
        return <LogoGenerator onNavigateHome={() => setPage('home')} />;
      case 'mockup':
        return <MockupGenerator onNavigateHome={() => setPage('home')} />;
      case 'home':
      default:
        return <HomePage onSelectTool={setPage} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header page={page} onNavigateHome={() => setPage('home')} />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${page === 'home' ? 'items-center' : 'items-start'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
