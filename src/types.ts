export interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  suggestedPrompt: string;
  customPrompt?: string;
  generatedImage?: string; // base64 image URL
  isGenerating?: boolean;
  error?: string;
  
  // Customization options per dish
  selectedStyle: "rustic" | "bright" | "social";
  selectedSize: "1K" | "2K" | "4K";
  selectedAspectRatio: "1:1" | "3:4" | "4:3" | "16:9";
  selectedModel: "gemini-3-pro-image-preview" | "gemini-3.1-flash-image";
  
  // Interactive editing
  editHistory: string[]; // array of base64 images for undo/version tracking
  editPrompt?: string;
  isEditing?: boolean;
}

export type PhotorealisticStyle = "rustic" | "bright" | "social";
