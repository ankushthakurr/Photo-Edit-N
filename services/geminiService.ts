/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- YOU MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Generates a marketing advertisement/flyer using a logo and a detailed text prompt.
 * @param logoImage The logo image file.
 * @param adPrompt The text prompt describing the desired advertisement.
 * @param brandColors An array of hex color codes to be used in the ad.
 * @returns A promise that resolves to the data URL of the generated ad image.
 */
export const generateAdImage = async (
    logoImage: File,
    adPrompt: string,
    brandColors: string[],
): Promise<string> => {
    console.log(`Starting ad generation with prompt and ${brandColors.length} colors.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const logoImagePart = await fileToPart(logoImage);
    const prompt = `You are a professional graphic designer AI. Your task is to create a visually appealing and professional advertisement flyer based on the provided logo and user specifications.

User Specifications:
---
${adPrompt}
---

Brand Colors:
- The primary colors for this design MUST be: ${brandColors.join(', ')}. Use these colors for backgrounds, text, and accents as appropriate to create a cohesive and on-brand design.

Design Instructions:
- Use the provided image as the primary logo for the clinic. Integrate it naturally into the design.
- Strictly follow all layout, color theme, and content requirements mentioned in the specifications. The specified brand colors are the most important constraint.
- Generate a complete, high-quality flyer as a single image.

Output: Return ONLY the final generated advertisement image. Do not return text.`;

    const textPart = { text: prompt };

    console.log('Sending logo and ad prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [logoImagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for ad.', response);
    
    return handleApiResponse(response, 'ad');
};

/**
 * Generates multiple logo concepts based on user specifications.
 * @param logoData An object containing user preferences for the logo.
 * @returns A promise that resolves to an array of data URLs for the generated logos.
 */
export const generateLogos = async (
    logoData: { [key: string]: any }
): Promise<string[]> => {
    console.log(`Starting logo generation with data:`, logoData);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const prompt = `
        You are an expert logo designer AI. Your task is to generate 4 unique, professional logo concepts for a brand based on the following specifications.
        Each logo should be presented on a clean, plain, light grey background (hex #f0f0f0). Do not include any text other than the brand name and slogan if provided.

        **Brand Specifications:**
        - **Brand Name:** ${logoData.name}
        - **Slogan (optional):** ${logoData.slogan || 'None'}
        - **Industry:** ${logoData.industry}
        - **Preferred Styles:** ${logoData.styles.join(', ')}
        - **Color Preferences:** ${logoData.colors}
        - **Iconography Style:** ${logoData.iconography}

        **Output Instructions:**
        - Create 4 distinct logo variations.
        - Ensure high-quality, modern design principles.
        - The logos must be clear and legible.
        - Do not show the logos on mockups (like business cards or signs), just the logo itself on the plain background.
    `;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 4,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });
    
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("The AI model did not return any images. This could be due to safety filters or a complex prompt. Please try again with different keywords.");
    }
    
    // The response has a different structure, so we extract the base64 string differently.
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

/**
 * Generates a photorealistic mockup by placing a user's asset into a described scene.
 * @param assetFile The user's logo or design file.
 * @param mockupPrompt The text prompt describing the desired mockup scene.
 * @returns A promise that resolves to the data URL of the generated mockup image.
 */
export const generateMockup = async (
    assetFile: File,
    mockupPrompt: string,
): Promise<string> => {
    console.log(`Starting mockup generation with prompt: ${mockupPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const assetPart = await fileToPart(assetFile);
    const prompt = `You are a photorealistic mockup generator AI. Your task is to take the provided image asset (e.g., a logo) and seamlessly place it onto the scene described by the user.

User Scene Description: "${mockupPrompt}"

**Instructions:**
- The final image must be photorealistic.
- Pay close attention to perspective, lighting, shadows, and textures to make the asset look like it's naturally part of the scene.
- Do not add any text or annotations unless requested in the scene description.

Output: Return ONLY the final generated mockup image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending asset and mockup prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [assetPart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for mockup.', response);
    
    return handleApiResponse(response, 'mockup');
};
