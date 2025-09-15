/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { MockupIcon, UploadIcon } from '../components/icons';
import { generateMockup } from '../services/geminiService';
import Spinner from '../components/Spinner';


const MockupGenerator: React.FC<{onNavigateHome: () => void}> = ({ onNavigateHome }) => {
    const [assetFile, setAssetFile] = useState<File | null>(null);
    const [assetPreviewUrl, setAssetPreviewUrl] = useState<string | null>(null);
    const [mockupPrompt, setMockupPrompt] = useState('');
    const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        if (assetFile) {
            const url = URL.createObjectURL(assetFile);
            setAssetPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setAssetPreviewUrl(null);
    }, [assetFile]);

    const handleFileSelect = (files: FileList | null) => {
        if (files && files[0]) {
            setAssetFile(files[0]);
            setGeneratedMockup(null); // Clear previous result
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!assetFile || !mockupPrompt) return;
        setIsLoading(true);
        setError(null);
        setGeneratedMockup(null);
        try {
            const mockupUrl = await generateMockup(assetFile, mockupPrompt);
            setGeneratedMockup(mockupUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedMockup) return;
        const link = document.createElement('a');
        link.href = generatedMockup;
        link.download = `mockup-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const AssetUploader = () => (
        <div 
            className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isDraggingOver ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); handleFileSelect(e.dataTransfer.files); }}
            onClick={() => document.getElementById('asset-upload-input')?.click()}
        >
            <UploadIcon className="w-8 h-8 text-gray-400 mb-2"/>
            <p className="text-gray-300 font-semibold">Upload an Asset</p>
            <p className="text-sm text-gray-500">Upload a logo or design (PNG with transparency recommended)</p>
            <input id="asset-upload-input" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} />
        </div>
    );
    
    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
            <div className="w-16 h-16 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center text-blue-400">
                <MockupIcon className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold text-gray-100">Mockup Generator</h2>
            <p className="text-gray-400 text-lg max-w-2xl text-center">
                Upload your logo or design, then describe the scene you want to see it in. The AI will create a photorealistic mockup for you.
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-4">
                {/* Left Side: Controls */}
                <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col gap-4">
                    {assetFile && assetPreviewUrl ? (
                        <div className="flex flex-col items-center gap-4">
                            <img src={assetPreviewUrl} alt="Asset Preview" className="max-h-32 object-contain rounded-md bg-white/5 p-2" />
                            <button onClick={() => setAssetFile(null)} className="text-sm text-gray-400 hover:text-white hover:underline">
                                Replace asset
                            </button>
                        </div>
                    ) : (
                        <AssetUploader />
                    )}
                    
                    <textarea
                        value={mockupPrompt}
                        onChange={(e) => setMockupPrompt(e.target.value)}
                        placeholder="Describe the mockup scene... e.g., 'On a black t-shirt worn by a model' or 'Embossed on a leather-bound journal on a wooden desk'"
                        className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[150px] resize-y"
                        disabled={isLoading || !assetFile}
                    />
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !assetFile || !mockupPrompt.trim()}
                        className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none mt-2"
                    >
                        Generate Mockup
                    </button>
                </div>
                
                {/* Right Side: Output */}
                <div className="w-full aspect-square bg-gray-900/50 border border-gray-700 rounded-xl p-4 flex items-center justify-center">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Spinner />
                            <p className="text-gray-300">AI is creating your mockup...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-6 rounded-lg max-w-md mx-auto flex flex-col items-center gap-2">
                            <h3 className="text-xl font-bold text-red-300">Generation Failed</h3>
                            <p className="text-sm text-red-400">{error}</p>
                            <button onClick={() => setError(null)} className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-4 rounded-lg text-sm transition-colors">
                                OK
                            </button>
                        </div>
                    )}
                    {!isLoading && !error && generatedMockup && (
                        <div className="w-full h-full flex flex-col gap-4 animate-fade-in">
                            <img src={generatedMockup} alt="Generated Mockup" className="w-full h-full object-contain rounded-lg" />
                            <button
                                onClick={handleDownload}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-base"
                            >
                                Download Mockup
                            </button>
                        </div>
                    )}
                    {!isLoading && !error && !generatedMockup && (
                        <p className="text-gray-500">Your generated mockup will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MockupGenerator;
