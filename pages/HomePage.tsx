/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import type { Page } from '../App';
import { PhotoSuiteIcon, LogoIcon, MockupIcon } from '../components/icons';

interface HomePageProps {
  onSelectTool: (tool: Page) => void;
}

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  status?: 'coming soon' | 'active';
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, onClick, status = 'active' }) => {
  const isComingSoon = status === 'coming soon';
  return (
    <div
      onClick={!isComingSoon ? onClick : undefined}
      className={`
        relative group bg-gray-800/50 border border-gray-700/60 rounded-xl p-6 flex flex-col items-start gap-4 
        transition-all duration-300 ease-in-out transform hover:-translate-y-2
        ${isComingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-800/80 hover:border-blue-500/50'}
      `}
    >
      {isComingSoon && (
        <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
          Coming Soon
        </div>
      )}
      <div className="w-12 h-12 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-100">{title}</h3>
      <p className="text-gray-400 flex-grow">{description}</p>
      {!isComingSoon && (
        <span className="mt-2 text-sm font-semibold text-blue-400 group-hover:underline">
          Open Tool &rarr;
        </span>
      )}
    </div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onSelectTool }) => {
  return (
    <div className="w-full max-w-5xl mx-auto text-center flex flex-col items-center gap-12 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
                All IN ONE
            </h1>
            <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
                Your complete suite of AI-powered creative tools. Everything you need to design, edit, and create.
            </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <ToolCard 
                icon={<PhotoSuiteIcon className="w-6 h-6" />}
                title="AI Photo Suite"
                description="Edit photos with text prompts, generate ads, apply filters, and make professional adjustments."
                onClick={() => onSelectTool('editor')}
            />
            <ToolCard 
                icon={<LogoIcon className="w-6 h-6" />}
                title="Logo Generator"
                description="Create a unique, professional logo for your brand by answering a few simple questions."
                onClick={() => onSelectTool('logo')}
            />
            <ToolCard 
                icon={<MockupIcon className="w-6 h-6" />}
                title="Mockup Generator"
                description="Place your brand assets into realistic, high-resolution mockups for any scenario."
                onClick={() => onSelectTool('mockup')}
            />
        </div>
    </div>
  );
};

export default HomePage;