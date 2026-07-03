import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for handling base64 food images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to get initialized Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please configure it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API: Parse text menu into structured dishes
app.post("/api/menu/parse", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ success: false, error: "Please provide a valid menu text." });
    }

    const ai = getGeminiClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Parse the following text-based menu into a structured JSON array of dishes.
For each dish, provide:
1. "name": The clear, standard name of the dish.
2. "description": A short, elegant, and appetizing description of the dish including key ingredients and characteristics.
3. "category": A food category like "Appetizers", "Main Courses", "Sides", "Desserts", "Beverages", or "Breakfast".
4. "suggestedPrompt": A highly detailed, realistic food photography prompt. Describe the dish's exact presentation on a premium plate/bowl, color contrast, professional garnishes, glossy sauces, fresh herbs on top, steam rising if hot, and delicate textures. DO NOT include style keywords like "rustic", "bright", or "flat lay" as these are selected dynamically. The prompt should be entirely focused on the dish's composition and ingredients.

Menu Text:
${text}
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["name", "description", "category", "suggestedPrompt"],
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              suggestedPrompt: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "[]");
    res.json({ success: true, dishes: parsedData });
  } catch (error: any) {
    console.error("Error parsing menu:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to parse the menu." });
  }
});

// API: Generate realistic food photo
app.post("/api/image/generate", async (req, res) => {
  try {
    const { prompt, style, imageSize, aspectRatio, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required." });
    }

    const ai = getGeminiClient();

    // Visual theme/style descriptions
    let styleText = "";
    if (style === "rustic") {
      styleText = "rustic, warm dark and moody food photography style, dark wood tabletop background, deep moody shadows, warm cinematic side lighting, rich organic textures, gourmet restaurant plating, shallow depth of field, 8k resolution, authentic culinary photoshoot";
    } else if (style === "bright") {
      styleText = "bright, airy, modern food photography, white marble tabletop, light minimalist clean background, soft natural diffused daylight, vibrant natural colors, sharp focus, high-key lighting, elegant premium plating, professional food stylist setup";
    } else if (style === "social") {
      styleText = "overhead view, top-down culinary flat lay, beautiful social media aesthetic food photography, flatlay composition, perfect neat arrangement, bright balanced lighting, crisp details, vibrant and highly appetizing look, colorful table setting";
    } else {
      styleText = "realistic premium food photography, clean background, natural appetizing lighting, sharp professional focus, magazine quality plating";
    }

    const fullPrompt = `${prompt}. Plated perfectly, ${styleText}. High-end culinary photography, delicious, 35mm lens, highly detailed.`;
    const modelToUse = model || "gemini-3-pro-image-preview";

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [
          {
            text: fullPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: imageSize || "1K",
        },
      },
    });

    let base64Image = null;
    let fallbackText = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
        } else if (part.text) {
          fallbackText = part.text;
        }
      }
    }

    if (base64Image) {
      res.json({ success: true, base64: base64Image });
    } else {
      res.status(400).json({ 
        success: false, 
        error: "No image generated by the model. Check that your API key supports this model.", 
        details: fallbackText 
      });
    }
  } catch (error: any) {
    console.error("Error generating food image:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate food photograph." });
  }
});

// API: Edit existing food photo
app.post("/api/image/edit", async (req, res) => {
  try {
    const { imageBase64, prompt, model, aspectRatio, imageSize } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Base image is required for editing." });
    }
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Edit instructions prompt is required." });
    }

    const ai = getGeminiClient();

    let cleanedBase64 = imageBase64;
    let mimeType = "image/png";
    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      cleanedBase64 = parts[1];
      const match = parts[0].match(/data:(image\/\w+)/);
      if (match) {
        mimeType = match[1];
      }
    }

    const modelToUse = model || "gemini-3.1-flash-image-preview";

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanedBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `${prompt}. Modify the existing food photograph to match this instructions. Retain the same food photography style, dish setup, and background, seamlessly inserting or modifying elements as instructed. High quality food styling, realistic, seamless blending.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: imageSize || "1K",
        },
      },
    });

    let base64Image = null;
    let fallbackText = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
        } else if (part.text) {
          fallbackText = part.text;
        }
      }
    }

    if (base64Image) {
      res.json({ success: true, base64: base64Image });
    } else {
      res.status(400).json({ 
        success: false, 
        error: "No edited image returned. Check that your API key supports image editing.", 
        details: fallbackText 
      });
    }
  } catch (error: any) {
    console.error("Error editing food image:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to edit food photograph." });
  }
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
