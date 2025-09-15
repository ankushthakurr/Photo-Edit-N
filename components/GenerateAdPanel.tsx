/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { UploadIcon } from './icons';

interface GenerateAdPanelProps {
  onGenerateAd: () => void;
  adPrompt: string;
  setAdPrompt: (prompt: string) => void;
  brandColors: string[];
  setBrandColors: (colors: string[]) => void;
  logoForAd: File | null;
  setLogoForAd: (file: File | null) => void;
  isLoading: boolean;
}

const GenerateAdPanel: React.FC<GenerateAdPanelProps> = ({ 
  onGenerateAd, 
  adPrompt, 
  setAdPrompt, 
  brandColors, 
  setBrandColors, 
  logoForAd,
  setLogoForAd,
  isLoading 
}) => {
  const [newColor, setNewColor] = useState('#');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    if (logoForAd) {
      const url = URL.createObjectURL(logoForAd);
      setLogoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLogoPreviewUrl(null);
    }
  }, [logoForAd]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (adPrompt && logoForAd) {
      onGenerateAd();
    }
  };

  const handleAddColor = () => {
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newColor) && !brandColors.includes(newColor.toUpperCase())) {
      setBrandColors([...brandColors, newColor.toUpperCase()]);
      setNewColor('#');
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setBrandColors(brandColors.filter(color => color !== colorToRemove));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setLogoForAd(files[0]);
    }
  };

  const LogoUploader = () => (
    <div 
      className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDraggingOver ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        handleFileSelect(e.dataTransfer.files);
      }}
      onClick={() => document.getElementById('logo-upload-input')?.click()}
    >
      <UploadIcon className="w-8 h-8 text-gray-400 mb-2"/>
      <p className="text-gray-300 font-semibold">Upload a Logo</p>
      <p className="text-sm text-gray-500">Click to browse or drag & drop</p>
      <input 
        id="logo-upload-input" 
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );

  const LogoPreview = () => (
    <div className="flex items-center w-full p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
      {logoPreviewUrl && <img src={logoPreviewUrl} alt="Logo Preview" className="w-12 h-12 object-contain rounded-md mr-4 bg-white/10" />}
      <div className="flex-grow">
        <p className="text-sm font-semibold text-gray-200 truncate">{logoForAd?.name}</p>
        <p className="text-xs text-gray-500">{logoForAd && `${(logoForAd.size / 1024).toFixed(1)} KB`}</p>
      </div>
      <button
        type="button"
        onClick={() => setLogoForAd(null)}
        disabled={isLoading}
        className="ml-4 text-gray-500 hover:text-white transition-colors text-2xl leading-none font-bold active:scale-90"
        aria-label="Remove logo"
      >
        &times;
      </button>
    </div>
  );

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Generate an Advertisement</h3>
      <p className="text-sm text-center text-gray-400 -mt-2">Upload a logo and describe the ad you want to create.</p>
      
      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        
        {logoForAd ? <LogoPreview /> : <LogoUploader />}

        <textarea
          value={adPrompt}
          onChange={(e) => setAdPrompt(e.target.value)}
          placeholder="Describe the ad you want to generate..."
          className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[200px] resize-y"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
            <label htmlFor="brand-color-input" className="text-sm font-medium text-gray-400">Brand Colors</label>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 border border-gray-600 bg-gray-900/50 rounded-lg p-2">
                    <input
                        id="brand-color-input"
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="#RRGGBB"
                        maxLength={7}
                        className="w-24 bg-transparent text-center font-mono focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={handleAddColor}
                        disabled={isLoading}
                        className="px-4 py-1.5 bg-white/10 rounded-md text-sm font-semibold hover:bg-white/20 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </div>
                {brandColors.map(color => (
                    <div key={color} className="flex items-center gap-2 bg-gray-900/80 p-1 pr-2 rounded-full border border-gray-700">
                        <div className="w-6 h-6 rounded-full border-2 border-white/20" style={{ backgroundColor: color }} aria-label={`Color swatch for ${color}`} />
                        <span className="font-mono text-sm text-gray-300">{color}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveColor(color)} 
                          className="text-gray-500 hover:text-white transition-colors text-lg leading-none -mt-px"
                          aria-label={`Remove color ${color}`}
                          disabled={isLoading}
                        >
                          &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
        
        <button
            type="submit"
            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none mt-2"
            disabled={isLoading || !adPrompt.trim() || !logoForAd}
        >
            Generate Ad
        </button>
      </form>
    </div>
  );
};

export default GenerateAdPanel;