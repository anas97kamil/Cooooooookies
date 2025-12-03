import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Recipe } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateRecipe = async (userRequest: string): Promise<Recipe | null> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are an expert pastry chef at 'Cookies Bakery'. The user wants a recipe for: "${userRequest}".
        
        Provide a delicious, precise recipe in Arabic.
        If the user asks for something not related to baking/desserts, politely steer them back to cookies/cakes in the description but still try to help if possible or provide a cookie alternative.

        Response Format: JSON object with:
        - title: Recipe name.
        - description: Short appetizing description (1-2 lines).
        - ingredients: List of ingredients with measurements.
        - instructions: Step-by-step cooking guide.
        - prepTime: Preparation and cooking time (e.g., "30 دقيقة").
        - difficulty: One of ['سهل', 'متوسط', 'صعب'].
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            prepTime: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["سهل", "متوسط", "صعب"] }
          },
          required: ["title", "description", "ingredients", "instructions", "prepTime", "difficulty"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as Recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    return null;
  }
};