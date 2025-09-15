/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { LogoIcon, UploadIcon } from '../components/icons';
import { generateLogos } from '../services/geminiService';
import Spinner from '../components/Spinner';

const WizardStep: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
  <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
    <h3 className="text-2xl font-bold text-gray-200">{title}</h3>
    {children}
  </div>
);

const OptionButton: React.FC<{ text: string, isSelected: boolean, onClick: () => void, disabled?: boolean }> = ({ text, isSelected, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 w-full text-center ${
      isSelected 
      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
      : 'bg-white/10 hover:bg-white/20 text-gray-200'
    }`}
  >
    {text}
  </button>
);

const LogoGenerator: React.FC<{onNavigateHome: () => void}> = ({ onNavigateHome }) => {
  const [step, setStep] = useState(1);
  const [logoData, setLogoData] = useState({
    name: '',
    slogan: '',
    industry: '',
    styles: [] as string[],
    colors: '',
    iconography: '',
  });
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleReset = () => {
    setStep(1);
    setGeneratedLogos([]);
    setError(null);
    setLogoData({ name: '', slogan: '', industry: '', styles: [], colors: '', iconography: '' });
  };
  
  const handleStyleToggle = (style: string) => {
    setLogoData(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style]
    }));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const logos = await generateLogos(logoData);
      setGeneratedLogos(logos);
      setStep(step + 1); // Move to results view
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${logoData.name}-logo-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <Spinner />
          <p className="text-gray-300">AI is designing your logos...</p>
        </div>
      );
    }
    
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button onClick={() => { setError(null); setStep(step - 1 > 0 ? step - 1 : 1); }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors">
                Try Again
            </button>
          </div>
        );
    }

    if (step > 5) {
      return (
        <div className="w-full flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold text-gray-100">Your Logo Concepts</h2>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedLogos.map((logoSrc, index) => (
                <div key={index} className="group relative bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center gap-4">
                    <img src={logoSrc} alt={`Logo concept ${index + 1}`} className="w-full h-auto rounded-md object-contain" />
                    <button
                        onClick={() => handleDownload(logoSrc, index)}
                        className="absolute bottom-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-500"
                    >
                        Download
                    </button>
                </div>
              ))}
            </div>
            <button onClick={handleReset} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">
                Start Over
            </button>
        </div>
      )
    }

    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center text-blue-400">
            <LogoIcon className="w-8 h-8" />
        </div>
        
        {step === 1 && (
            <WizardStep title="What's your brand name?">
                <input type="text" placeholder="e.g., SparkleClean" value={logoData.name} onChange={e => setLogoData({...logoData, name: e.target.value})} className="w-full text-center text-xl bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
                <input type="text" placeholder="Slogan (optional)" value={logoData.slogan} onChange={e => setLogoData({...logoData, slogan: e.target.value})} className="w-full text-center text-lg bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
            </WizardStep>
        )}
        {step === 2 && (
            <WizardStep title="What's your industry?">
                <input type="text" placeholder="e.g., Technology, Restaurant, Cleaning Service" value={logoData.industry} onChange={e => setLogoData({...logoData, industry: e.target.value})} className="w-full text-center text-xl bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
            </WizardStep>
        )}
        {step === 3 && (
            <WizardStep title="Choose your logo style (up to 3)">
                <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Modern', 'Minimalist', 'Classic', 'Playful', 'Luxury', 'Bold'].map(style => (
                        <OptionButton key={style} text={style} isSelected={logoData.styles.includes(style)} onClick={() => handleStyleToggle(style)} disabled={!logoData.styles.includes(style) && logoData.styles.length >= 3} />
                    ))}
                </div>
            </WizardStep>
        )}
        {step === 4 && (
            <WizardStep title="Describe your color preferences">
                <input type="text" placeholder="e.g., 'shades of blue and silver' or 'warm earth tones'" value={logoData.colors} onChange={e => setLogoData({...logoData, colors: e.target.value})} className="w-full text-center text-xl bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
            </WizardStep>
        )}
        {step === 5 && (
            <WizardStep title="Choose an iconography style">
                <div className="w-full grid grid-cols-2 gap-2">
                    {['Abstract Shape', 'Literal Icon (e.g., a tooth for a dentist)', 'Letter Mark (using brand initials)', 'No icon, text only'].map(icon => (
                        <OptionButton key={icon} text={icon} isSelected={logoData.iconography === icon} onClick={() => setLogoData({...logoData, iconography: icon})} />
                    ))}
                </div>
            </WizardStep>
        )}

        <div className="flex items-center justify-between w-full mt-6">
            <button onClick={handleBack} disabled={step === 1} className="text-gray-400 hover:text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50">Back</button>
            {step < 5 && <button onClick={handleNext} disabled={!logoData.name} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:bg-blue-800">Next</button>}
            {step === 5 && <button onClick={handleGenerate} disabled={!logoData.iconography} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:bg-green-800">Generate Logos</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center gap-6 animate-fade-in bg-gray-800/50 border border-gray-700 rounded-xl p-8">
        {renderContent()}
    </div>
  );
};

export default LogoGenerator;
