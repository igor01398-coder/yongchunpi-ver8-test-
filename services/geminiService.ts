
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = 'gemini-2.5-flash-image';
// gemini-3-flash-preview is recommended for Basic Text Tasks like validation
const GEMINI_VALIDATION_MODEL = 'gemini-3-flash-preview';

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix if present (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1]; 
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to fetch URL to base64 (handling potential CORS issues gracefully)
const urlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
       const reader = new FileReader();
       reader.onloadend = () => {
           const res = reader.result as string;
           // Remove prefix if present
           const base64 = res.includes(',') ? res.split(',')[1] : res;
           resolve(base64);
       }
       reader.onerror = () => resolve(null);
       reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Skipping reference image due to fetch error (likely CORS):", url);
    return null;
  }
};

export interface ValidationResult {
  isValid: boolean;
  feedback: string;
}

export const validateImage = async (
  base64Image: string,
  missionTitle: string,
  uploadInstruction: string,
  referenceImageUrls: string[] = []
): Promise<ValidationResult> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // 1. Prepare User Image Part
    const parts: any[] = [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        }
    ];

    // 2. Fetch and Prepare Reference Images
    if (referenceImageUrls && referenceImageUrls.length > 0) {
        for (const url of referenceImageUrls) {
            const refBase64 = await urlToBase64(url);
            if (refBase64) {
                parts.push({
                    inlineData: {
                        data: refBase64,
                        mimeType: 'image/jpeg'
                    }
                });
            }
        }
    }

    // 3. Construct Prompt
    let prompt = `You are a geology field instructor for a student game called "Yongchun Pi Explorer". 
    
    The user has uploaded an image for the mission: "${missionTitle}".
    Mission Instruction: "${uploadInstruction}"
    
    Task:
    1. Analyze the FIRST image provided (this is the student's photo).
    2. Compare it with the subsequent reference images (if any provided).
    3. Determine if the student's photo reasonably matches the mission requirements and the geological features shown in the reference images.
    
    MATCHING RULE:
    - If reference images are provided, the student's image should generally match the geological features (texture, color, rock type) of the reference images.
    - Focus on identifying the correct geological subject (e.g., Sandstone, Retaining Wall) rather than demanding an exact pixel or strict high-fidelity match.
    - Reject selfies, wide landscape shots where the rock texture is invisible, or unrelated objects.
    - If no reference images are provided, judge based on the Mission Instruction.
    - Be encouraging but ensure the photo is relevant.
    
    Return a JSON object with:
    - isValid: boolean (true if the image is acceptable for this mission)
    - feedback: string (A short, 1-sentence comment to the student. If valid, praise the feature found. If invalid, explain what is missing or wrong.)`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: GEMINI_VALIDATION_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const json = JSON.parse(text);

    return {
        isValid: json.isValid ?? false,
        feedback: json.feedback || "Unable to validate image."
    };

  } catch (error) {
    console.error("Validation error:", error);
    // Fallback to true in case of API error to not block the user, but warn them.
    return {
        isValid: true,
        feedback: "Communications unstable. Data accepted manually. (Offline Protocol)"
    };
  }
};

export const editImageWithGemini = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Explicitly tell the model to return an image
  const fullPrompt = `Edit the attached image based on this instruction: ${prompt}. Return the modified image.`;

  try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let textFeedback = '';

      // Check for image part
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
        if (part.text) {
          textFeedback += part.text;
        }
      }

      // If we are here, no image was returned. 
      // It's likely the model returned a text refusal (e.g. safety blocking or misunderstanding).
      if (textFeedback) {
          console.warn("Gemini returned text instead of image:", textFeedback);
          throw new Error(`AI could not generate image: ${textFeedback.slice(0, 150)}...`);
      }

      throw new Error("No image generated in response. The model might have returned only text.");

  } catch (error: any) {
      console.error("Edit Image Error:", error);
      throw error; 
  }
};
