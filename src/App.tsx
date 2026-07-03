import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  Download, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Utensils, 
  RefreshCw, 
  Maximize2, 
  Compass, 
  Plus, 
  Undo, 
  Flame, 
  Trash2,
  BookOpen,
  Info
} from "lucide-react";
import { Dish, PhotorealisticStyle } from "./types";
import { MENU_TEMPLATES, MenuTemplate } from "./data";

export default function App() {
  // Application State
  const [menuText, setMenuText] = useState<string>(MENU_TEMPLATES[0].menuText);
  const [dishes, setDishes] = useState<Dish[]>(MENU_TEMPLATES[0].dishes);
  const [selectedDishId, setSelectedDishId] = useState<string>("ital-1");
  const [isParsingMenu, setIsParsingMenu] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Quick-select template state
  const [activeTemplateIndex, setActiveTemplateIndex] = useState<number>(0);

  // Global defaults that can be applied to all dishes
  const [globalStyle, setGlobalStyle] = useState<PhotorealisticStyle>("rustic");
  const [globalSize, setGlobalSize] = useState<"1K" | "2K" | "4K">("1K");
  const [globalAspectRatio, setGlobalAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "16:9">("1:1");
  const [globalModel, setGlobalModel] = useState<"gemini-3-pro-image-preview" | "gemini-3.1-flash-image">("gemini-3-pro-image-preview");

  // Modal for high-res photo viewing
  const [activeZoomedImage, setActiveZoomedImage] = useState<string | null>(null);
  
  // Custom manual dish adding
  const [newDishName, setNewDishName] = useState("");
  const [newDishCategory, setNewDishCategory] = useState("Main Courses");
  const [newDishDescription, setNewDishDescription] = useState("");

  // UI Toast message
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Find the currently selected dish
  const selectedDish = dishes.find(d => d.id === selectedDishId) || dishes[0];

  // Sync selected dish if dishes list changes and the previous one is gone
  useEffect(() => {
    if (dishes.length > 0 && !dishes.some(d => d.id === selectedDishId)) {
      setSelectedDishId(dishes[0].id);
    }
  }, [dishes, selectedDishId]);

  // Load a preset template
  const handleLoadTemplate = (index: number) => {
    setActiveTemplateIndex(index);
    const template = MENU_TEMPLATES[index];
    setMenuText(template.menuText);
    setDishes(template.dishes);
    if (template.dishes.length > 0) {
      setSelectedDishId(template.dishes[0].id);
    }
    showToast(`Loaded ${template.name} menu template`, "info");
  };

  // Parse text menu via backend API
  const handleParseMenu = async () => {
    if (!menuText.trim()) {
      setParseError("Please provide some menu text to parse.");
      return;
    }

    setIsParsingMenu(true);
    setParseError(null);

    try {
      const response = await fetch("/api/menu/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: menuText })
      });

      const data = await response.json();
      if (data.success && data.dishes) {
        const parsedDishes: Dish[] = data.dishes.map((d: any, idx: number) => ({
          id: `parsed-${Date.now()}-${idx}`,
          name: d.name,
          description: d.description,
          category: d.category || "Main Courses",
          suggestedPrompt: d.suggestedPrompt,
          selectedStyle: globalStyle,
          selectedSize: globalSize,
          selectedAspectRatio: globalAspectRatio,
          selectedModel: globalModel,
          editHistory: [],
        }));

        setDishes(parsedDishes);
        if (parsedDishes.length > 0) {
          setSelectedDishId(parsedDishes[0].id);
        }
        showToast(`Successfully parsed ${parsedDishes.length} dishes from your menu!`);
      } else {
        setParseError(data.error || "Failed to parse menu text.");
      }
    } catch (err: any) {
      console.error(err);
      setParseError("Failed to reach server. Please try again.");
    } finally {
      setIsParsingMenu(false);
    }
  };

  // Generate image for a specific dish
  const handleGenerateImage = async (dishId: string) => {
    const dishIndex = dishes.findIndex(d => d.id === dishId);
    if (dishIndex === -1) return;

    const dish = dishes[dishIndex];
    
    // Set loading state
    const updatedDishes = [...dishes];
    updatedDishes[dishIndex] = { ...dish, isGenerating: true, error: undefined };
    setDishes(updatedDishes);

    try {
      const promptToUse = dish.customPrompt || dish.suggestedPrompt;
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          style: dish.selectedStyle,
          imageSize: dish.selectedSize,
          aspectRatio: dish.selectedAspectRatio,
          model: dish.selectedModel
        })
      });

      const data = await response.json();
      if (data.success && data.base64) {
        const freshDishes = [...dishes];
        const currentDish = freshDishes[dishIndex];
        
        // Push previous photo to history if it exists
        const newHistory = [...(currentDish.editHistory || [])];
        if (currentDish.generatedImage) {
          newHistory.push(currentDish.generatedImage);
        }

        freshDishes[dishIndex] = {
          ...currentDish,
          generatedImage: `data:image/png;base64,${data.base64}`,
          editHistory: newHistory,
          isGenerating: false,
        };
        setDishes(freshDishes);
        showToast(`Glistening photo generated for "${dish.name}"!`);
      } else {
        const freshDishes = [...dishes];
        freshDishes[dishIndex] = {
          ...dish,
          isGenerating: false,
          error: data.error || "Failed to generate photo."
        };
        setDishes(freshDishes);
        showToast(data.error || "Failed to generate photograph.", "error");
      }
    } catch (err: any) {
      console.error(err);
      const freshDishes = [...dishes];
      freshDishes[dishIndex] = {
        ...dish,
        isGenerating: false,
        error: "Server connection failed."
      };
      setDishes(freshDishes);
      showToast("Server connection error.", "error");
    }
  };

  // Perform interactive editing (Inpainting/refining)
  const handleEditImage = async (dishId: string) => {
    const dishIndex = dishes.findIndex(d => d.id === dishId);
    if (dishIndex === -1) return;

    const dish = dishes[dishIndex];
    if (!dish.generatedImage) {
      showToast("Please generate an initial photo first before editing.", "info");
      return;
    }
    if (!dish.editPrompt?.trim()) {
      showToast("Please describe the edit instructions.", "info");
      return;
    }

    const updatedDishes = [...dishes];
    updatedDishes[dishIndex] = { ...dish, isEditing: true };
    setDishes(updatedDishes);

    try {
      const response = await fetch("/api/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dish.generatedImage,
          prompt: dish.editPrompt,
          model: "gemini-3.1-flash-image-preview",
          aspectRatio: dish.selectedAspectRatio,
          imageSize: dish.selectedSize
        })
      });

      const data = await response.json();
      if (data.success && data.base64) {
        const freshDishes = [...dishes];
        const currentDish = freshDishes[dishIndex];
        
        // Push current photo to undo history
        const newHistory = [...(currentDish.editHistory || [])];
        newHistory.push(currentDish.generatedImage!);

        freshDishes[dishIndex] = {
          ...currentDish,
          generatedImage: `data:image/png;base64,${data.base64}`,
          editHistory: newHistory,
          isEditing: false,
          editPrompt: "", // clear input on success
        };
        setDishes(freshDishes);
        showToast("Image customized successfully!");
      } else {
        const freshDishes = [...dishes];
        freshDishes[dishIndex] = {
          ...dish,
          isEditing: false,
        };
        setDishes(freshDishes);
        showToast(data.error || "Failed to edit photo.", "error");
      }
    } catch (err: any) {
      console.error(err);
      const freshDishes = [...dishes];
      freshDishes[dishIndex] = {
        ...dish,
        isEditing: false,
      };
      setDishes(freshDishes);
      showToast("Connection failed during editing.", "error");
    }
  };

  // Undo edit (revert to previous image in history)
  const handleUndoEdit = (dishId: string) => {
    const dishIndex = dishes.findIndex(d => d.id === dishId);
    if (dishIndex === -1) return;

    const dish = dishes[dishIndex];
    if (!dish.editHistory || dish.editHistory.length === 0) {
      showToast("No further edits to undo.", "info");
      return;
    }

    const newHistory = [...dish.editHistory];
    const previousImage = newHistory.pop(); // grab last image

    const freshDishes = [...dishes];
    freshDishes[dishIndex] = {
      ...dish,
      generatedImage: previousImage,
      editHistory: newHistory
    };
    setDishes(freshDishes);
    showToast("Reverted to previous photograph version.");
  };

  // Apply style/size/etc. individually
  const updateDishConfig = (dishId: string, updates: Partial<Dish>) => {
    setDishes(prev => prev.map(d => d.id === dishId ? { ...d, ...updates } : d));
  };

  // Apply a styling style to all dishes globally
  const applyStyleGlobally = (style: PhotorealisticStyle) => {
    setGlobalStyle(style);
    setDishes(prev => prev.map(d => ({ ...d, selectedStyle: style })));
    showToast(`Applied "${style.toUpperCase()}" style to all dishes`);
  };

  // Apply a size globally
  const applySizeGlobally = (size: "1K" | "2K" | "4K") => {
    setGlobalSize(size);
    setDishes(prev => prev.map(d => ({ ...d, selectedSize: size })));
    showToast(`Configured output size to ${size} for all dishes`);
  };

  // Apply model globally
  const applyModelGlobally = (model: "gemini-3-pro-image-preview" | "gemini-3.1-flash-image") => {
    setGlobalModel(model);
    setDishes(prev => prev.map(d => ({ ...d, selectedModel: model })));
    showToast(`Configured generation engine for all dishes`);
  };

  // Apply aspect ratio globally
  const applyAspectRatioGlobally = (ratio: "1:1" | "3:4" | "4:3" | "16:9") => {
    setGlobalAspectRatio(ratio);
    setDishes(prev => prev.map(d => ({ ...d, selectedAspectRatio: ratio })));
    showToast(`Set global photo aspect ratio to ${ratio}`);
  };

  // Manually add a dish to the list
  const handleAddManualDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const newDish: Dish = {
      id: `manual-${Date.now()}`,
      name: newDishName,
      category: newDishCategory,
      description: newDishDescription || "Exquisite culinary preparation crafted with passion.",
      suggestedPrompt: `Gourmet plating of ${newDishName}. ${newDishDescription || "Professional food styling on a designer plate"}. Glistening, appetizing, macro lens.`,
      selectedStyle: globalStyle,
      selectedSize: globalSize,
      selectedAspectRatio: globalAspectRatio,
      selectedModel: globalModel,
      editHistory: []
    };

    setDishes(prev => [...prev, newDish]);
    setSelectedDishId(newDish.id);
    setNewDishName("");
    setNewDishDescription("");
    showToast(`Added "${newDishName}" to your studio list!`);
  };

  // Delete a dish from list
  const handleDeleteDish = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dishes.length <= 1) {
      showToast("Your studio list needs at least one dish.", "info");
      return;
    }
    const filtered = dishes.filter(d => d.id !== id);
    setDishes(filtered);
    if (selectedDishId === id) {
      setSelectedDishId(filtered[0].id);
    }
    showToast("Dish removed from workspace");
  };

  // File Upload emulation for menu parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setMenuText(text);
        showToast("Menu file loaded into text desk. Click 'Parse Menu' to process!");
      }
    };
    reader.readAsText(file);
  };

  // Categorize dishes
  const categories = Array.from(new Set(dishes.map(d => d.category)));

  return (
    <div id="app-viewport" className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] font-sans flex flex-col antialiased">
      
      {/* Toast Alert */}
      {toast && (
        <div id="studio-toast" className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 shadow-xl transition-all duration-300 border ${
          toast.type === "success" ? "bg-[#1A1A1A] text-white border-black" : 
          toast.type === "error" ? "bg-red-50 text-red-900 border-red-200" : 
          "bg-[#F2EFE9] text-[#1A1A1A] border-[#E0DCCF]"
        }`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Sparkles className="w-4 h-4 text-[#D4AF37]" />}
          <span className="text-xs uppercase tracking-wider font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Elegant Editorial Header Navigation */}
      <header id="editorial-header" className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-6 border-b border-[#E0DCCF] bg-white/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center md:items-baseline gap-6 md:gap-12 flex-wrap justify-center md:justify-start">
          <h1 className="text-3.5xl font-display font-bold italic tracking-tight text-[#1A1A1A]">Lumière</h1>
          <div className="h-4 w-[1px] bg-[#E0DCCF] hidden md:block"></div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C887D]">
            Virtual Food Photography Suite
          </p>
        </div>
        
        <div className="flex items-center gap-6 mt-4 md:mt-0 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8C887D]">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Studio Engine Live
          </span>
          <span className="hidden sm:inline border-l border-[#E0DCCF] pl-6">
            Developer License
          </span>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main id="studio-workspace" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* LEFT COLUMN: Menu Desk & Item List (Span 5) */}
        <section id="menu-desk" className="lg:col-span-5 border-r border-[#E0DCCF] bg-white/50 p-6 md:p-8 flex flex-col space-y-8 overflow-y-auto max-h-[calc(100vh-88px)]">
          
          {/* Header section with template switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C887D]">
                01. Input Menu
              </label>
              <div className="flex items-center gap-2 text-xs text-[#8C887D]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Presets:</span>
              </div>
            </div>
            
            {/* Quick Presets Carousel */}
            <div className="grid grid-cols-3 gap-2">
              {MENU_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadTemplate(idx)}
                  className={`px-3 py-2 text-left border transition-all duration-200 ${
                    activeTemplateIndex === idx
                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                      : "border-[#E0DCCF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A]"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider truncate">{template.name}</p>
                  <p className={`text-[9px] truncate ${activeTemplateIndex === idx ? "text-amber-200/90" : "text-[#8C887D]"}`}>
                    {template.cuisine}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Menu input editor */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={menuText}
                onChange={(e) => setMenuText(e.target.value)}
                placeholder="Paste your raw text menu or dish list here..."
                rows={8}
                className="w-full p-4 border border-[#E0DCCF] bg-[#FAF9F5] focus:border-[#1A1A1A] focus:outline-none font-mono text-xs leading-relaxed"
              />
              
              {/* Drag/drop input trigger */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <label className="cursor-pointer bg-white border border-[#E0DCCF] hover:border-[#1A1A1A] text-[#1A1A1A] p-2 hover:bg-[#FAF9F5] transition-colors shadow-sm flex items-center justify-center">
                  <Upload className="w-3.5 h-3.5" />
                  <input 
                    type="file" 
                    accept=".txt,.md,.json" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Error indicator if parse fails */}
            {parseError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Parsing Error</p>
                  <p>{parseError}</p>
                </div>
              </div>
            )}

            {/* Parse triggers */}
            <button
              onClick={handleParseMenu}
              disabled={isParsingMenu || !menuText.trim()}
              className="w-full bg-[#1A1A1A] hover:bg-[#333] disabled:bg-[#CCC] disabled:cursor-not-allowed text-white py-3.5 text-xs uppercase tracking-[0.25em] font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
            >
              {isParsingMenu ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Scanning & Generating Prompts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Parse Menu with AI</span>
                </>
              )}
            </button>
          </div>

          <hr className="border-[#E0DCCF]" />

          {/* Global config quick-toggle bar */}
          <div className="bg-[#F2EFE9] p-4 border border-[#E0DCCF] space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C887D] flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#1A1A1A]" />
              Global Studio Presets (Apply to All)
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Global Style */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[#8C887D]">Photography Style</span>
                <select 
                  value={globalStyle}
                  onChange={(e) => applyStyleGlobally(e.target.value as PhotorealisticStyle)}
                  className="w-full bg-white border border-[#E0DCCF] p-1.5 text-xs focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="rustic">Rustic / Dark Moody</option>
                  <option value="bright">Bright / Modern</option>
                  <option value="social">Social Media (Top-down)</option>
                </select>
              </div>

              {/* Global Size */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[#8C887D]">Image Resolution</span>
                <select 
                  value={globalSize}
                  onChange={(e) => applySizeGlobally(e.target.value as "1K" | "2K" | "4K")}
                  className="w-full bg-white border border-[#E0DCCF] p-1.5 text-xs focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="1K">1K Standard (Fast)</option>
                  <option value="2K">2K High-End (Sharp)</option>
                  <option value="4K">4K Editorial (Supreme)</option>
                </select>
              </div>

              {/* Global Aspect Ratio */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[#8C887D]">Aspect Ratio</span>
                <select 
                  value={globalAspectRatio}
                  onChange={(e) => applyAspectRatioGlobally(e.target.value as "1:1" | "3:4" | "4:3" | "16:9")}
                  className="w-full bg-white border border-[#E0DCCF] p-1.5 text-xs focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Portrait</option>
                  <option value="16:9">16:9 Landscape</option>
                </select>
              </div>

              {/* Global Model */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[#8C887D]">AI Photo Engine</span>
                <select 
                  value={globalModel}
                  onChange={(e) => applyModelGlobally(e.target.value as any)}
                  className="w-full bg-white border border-[#E0DCCF] p-1.5 text-xs focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="gemini-3-pro-image-preview">Gemini 3 Pro (High Quality)</option>
                  <option value="gemini-3.1-flash-image">Gemini 3.1 Flash (Fast)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workspace Item Count and Dish List */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C887D]">
                02. Plates in Studio ({dishes.length})
              </label>
              <span className="text-[9px] italic text-[#8C887D]">Select to shoot or customize</span>
            </div>

            {/* Dishes list by categories */}
            <div className="space-y-6">
              {categories.map(category => {
                const categoryDishes = dishes.filter(d => d.category === category);
                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] border-b border-[#E0DCCF] pb-1">
                      {category}
                    </h4>
                    
                    <div className="space-y-1.5">
                      {categoryDishes.map((dish) => {
                        const isSelected = dish.id === selectedDishId;
                        return (
                          <div
                            key={dish.id}
                            onClick={() => setSelectedDishId(dish.id)}
                            className={`group relative flex items-center justify-between p-3.5 border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "border-[#1A1A1A] bg-white shadow-sm"
                                : "border-transparent hover:border-[#E0DCCF] bg-white/30"
                            }`}
                          >
                            {/* Selected bar indicator */}
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A1A1A]" />
                            )}
                            
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-serif text-sm font-medium ${isSelected ? "text-[#1A1A1A]" : "text-[#555]"}`}>
                                  {dish.name}
                                </span>
                                {dish.generatedImage && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Photo generated" />
                                )}
                              </div>
                              <p className="text-[11px] text-[#8C887D] truncate mt-0.5">
                                {dish.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-[#8C887D] px-1.5 py-0.5 bg-[#FAF9F5] border border-[#E0DCCF]">
                                {dish.selectedStyle}
                              </span>
                              
                              {/* Delete button */}
                              <button
                                onClick={(e) => handleDeleteDish(dish.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-150"
                                title="Remove dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <ChevronRight className={`w-4 h-4 text-[#8C887D] transition-transform ${isSelected ? "translate-x-1 text-[#1A1A1A]" : ""}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Manual Dish Add Form */}
            <form onSubmit={handleAddManualDish} className="p-4 border border-dashed border-[#E0DCCF] bg-[#F9F7F2]/40 space-y-3">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-[#8C887D]">
                Add custom plate to menu
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Dish Name (e.g. Lobster Thermidor)"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="col-span-2 p-2 border border-[#E0DCCF] bg-white text-xs focus:outline-none focus:border-[#1A1A1A]"
                />
                <select
                  value={newDishCategory}
                  onChange={(e) => setNewDishCategory(e.target.value)}
                  className="p-2 border border-[#E0DCCF] bg-white text-xs focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="Appetizers">Appetizers</option>
                  <option value="Main Courses">Main Courses</option>
                  <option value="Sides">Sides</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Breakfast">Breakfast/Brunch</option>
                </select>
                <button
                  type="submit"
                  className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold hover:bg-[#333] transition-colors py-2 px-3 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Plate
                </button>
              </div>
              <input
                type="text"
                placeholder="Brief ingredients (e.g. Creamy cognac reduction, parmesan, chives)"
                value={newDishDescription}
                onChange={(e) => setNewDishDescription(e.target.value)}
                className="w-full p-2 border border-[#E0DCCF] bg-white text-xs focus:outline-none focus:border-[#1A1A1A]"
              />
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Photography Stage & Results (Span 7) */}
        <section id="photography-stage" className="lg:col-span-7 bg-[#F2EFE9] p-6 md:p-8 flex flex-col space-y-6 overflow-y-auto max-h-[calc(100vh-88px)]">
          
          {selectedDish ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Dish Metadata Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#E0DCCF] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C887D]">
                      Active Camera Plate
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-[#E0DCCF] rounded-full text-[9px] uppercase font-semibold text-[#8C887D]">
                      {selectedDish.category}
                    </span>
                  </div>
                  <h2 className="text-3xl font-serif leading-tight text-[#1A1A1A]">
                    {selectedDish.name}
                  </h2>
                  <p className="text-xs text-[#666258] italic mt-1 leading-relaxed max-w-xl">
                    "{selectedDish.description}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-white border border-[#E0DCCF] shadow-sm">
                    {selectedDish.selectedSize}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-white border border-[#E0DCCF] shadow-sm">
                    {selectedDish.selectedAspectRatio}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-[#1A1A1A] text-white shadow-sm">
                    {selectedDish.selectedStyle.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Central Panel: Customization on left, photo on right */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
                
                {/* Configuration controls for the specific plate */}
                <div className="xl:col-span-4 space-y-5 bg-white/50 p-4 border border-[#E0DCCF]">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C887D] border-b border-[#E0DCCF] pb-2">
                    Plate Art Styling
                  </h3>

                  {/* Photography Style Selector */}
                  <div className="space-y-2">
                    <span className="block text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]">Aesthetic Theme</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: "rustic", label: "Rustic / Dark", desc: "Dark woods, rich shadows, warm tones" },
                        { id: "bright", label: "Bright / Modern", desc: "Marble tables, light, morning sun" },
                        { id: "social", label: "Social Media", desc: "Top-down overhead flat lay angle" }
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateDishConfig(selectedDish.id, { selectedStyle: s.id as PhotorealisticStyle })}
                          className={`w-full text-left p-2.5 border transition-all ${
                            selectedDish.selectedStyle === s.id
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                              : "border-[#E0DCCF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                            <div className={`w-2 h-2 rounded-full ${selectedDish.selectedStyle === s.id ? "bg-amber-300" : "bg-[#E0DCCF]"}`}></div>
                          </div>
                          <span className={`block text-[9px] mt-0.5 ${selectedDish.selectedStyle === s.id ? "text-[#CFCAC0]" : "text-[#8C887D]"}`}>
                            {s.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimension / Resolution Selection */}
                  <div className="space-y-2">
                    <span className="block text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]">Resolution Scale</span>
                    <div className="grid grid-cols-3 gap-1">
                      {["1K", "2K", "4K"].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateDishConfig(selectedDish.id, { selectedSize: sz as any })}
                          className={`p-1.5 text-xs text-center border transition-all ${
                            selectedDish.selectedSize === sz
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold"
                              : "border-[#E0DCCF] hover:border-[#1A1A1A] bg-white"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="space-y-2">
                    <span className="block text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]">Aspect Framing</span>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        { ratio: "1:1", label: "Square" },
                        { ratio: "4:3", label: "Standard" },
                        { ratio: "3:4", label: "Portrait" },
                        { ratio: "16:9", label: "Widescreen" }
                      ].map((r) => (
                        <button
                          key={r.ratio}
                          type="button"
                          onClick={() => updateDishConfig(selectedDish.id, { selectedAspectRatio: r.ratio as any })}
                          className={`p-1.5 border text-center transition-all ${
                            selectedDish.selectedAspectRatio === r.ratio
                              ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                              : "border-[#E0DCCF] hover:border-[#1A1A1A] bg-white"
                          }`}
                        >
                          {r.ratio} <span className="text-[9px] block text-[#8C887D]">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Fine Tuning */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="block text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]">Ingredient Layout</span>
                      <button 
                        onClick={() => updateDishConfig(selectedDish.id, { customPrompt: undefined })}
                        className="text-[9px] text-[#8C887D] underline hover:text-black"
                      >
                        Reset Prompt
                      </button>
                    </div>
                    <textarea
                      value={selectedDish.customPrompt !== undefined ? selectedDish.customPrompt : selectedDish.suggestedPrompt}
                      onChange={(e) => updateDishConfig(selectedDish.id, { customPrompt: e.target.value })}
                      rows={4}
                      className="w-full p-2.5 border border-[#E0DCCF] bg-[#FAF9F5] focus:border-[#1A1A1A] text-xs leading-relaxed"
                    />
                  </div>
                </div>

                {/* Photography Stage Preview (Span 8) */}
                <div className="xl:col-span-8 flex flex-col space-y-4">
                  
                  {/* Image render frame */}
                  <div className="relative border border-[#E0DCCF] bg-[#E5E2D9] overflow-hidden min-h-[380px] flex flex-col items-center justify-center group shadow-sm">
                    {selectedDish.generatedImage ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3">
                        <img
                          src={selectedDish.generatedImage}
                          alt={selectedDish.name}
                          className="max-h-[460px] object-contain shadow-lg transition-transform duration-300"
                        />
                        
                        {/* Hover Overlay buttons */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => setActiveZoomedImage(selectedDish.generatedImage!)}
                            className="p-2.5 bg-[#1A1A1A]/80 hover:bg-[#1A1A1A] text-white backdrop-blur-sm transition-colors shadow"
                            title="Zoom High Res"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <a
                            href={selectedDish.generatedImage}
                            download={`${selectedDish.name.replace(/\s+/g, "_")}.png`}
                            className="p-2.5 bg-[#1A1A1A]/80 hover:bg-[#1A1A1A] text-white backdrop-blur-sm transition-colors shadow flex items-center justify-center"
                            title="Download Photo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>

                        {/* Back-plate label */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-sm text-white p-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold uppercase tracking-wider">{selectedDish.name}</p>
                            <p className="text-[10px] text-gray-300 truncate max-w-sm">Prompt: {selectedDish.customPrompt || selectedDish.suggestedPrompt}</p>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/20 border border-white/10 rounded">
                            {selectedDish.selectedSize} Quality
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Empty Setup State */
                      <div className="p-8 text-center max-w-sm space-y-4">
                        <div className="w-16 h-16 rounded-full border border-[#8C887D]/30 flex items-center justify-center mx-auto bg-white/40">
                          <ImageIcon className="w-7 h-7 text-[#8C887D]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-widest">Plate Camera Unloaded</h4>
                          <p className="text-xs text-[#8C887D] mt-1">
                            Choose settings for your gourmet preparation, then fire up the virtual DSLR photographer to render beautiful visuals.
                          </p>
                        </div>
                        <button
                          onClick={() => handleGenerateImage(selectedDish.id)}
                          disabled={selectedDish.isGenerating}
                          className="bg-[#1A1A1A] hover:bg-[#333] text-white text-[11px] uppercase tracking-[0.2em] font-bold py-3 px-6 transition-colors shadow-md"
                        >
                          {selectedDish.isGenerating ? "Setting up gourmet studio..." : "Shoot Food Photo"}
                        </button>
                      </div>
                    )}

                    {/* Rendering spinner overlay */}
                    {selectedDish.isGenerating && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full border-4 border-[#E0DCCF] border-t-[#1A1A1A] animate-spin" />
                          <Utensils className="w-5 h-5 absolute inset-0 m-auto text-[#1A1A1A]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
                            Rendering Food Shot...
                          </h4>
                          <p className="text-[10px] text-[#8C887D] max-w-xs leading-relaxed">
                            Fine-tuning lighting, laying out garnishes, oil mists, plate steam and micro-lens depth of field config.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shoot trigger button if image already exists */}
                  {selectedDish.generatedImage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateImage(selectedDish.id)}
                        disabled={selectedDish.isGenerating}
                        className="flex-1 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs uppercase tracking-[0.25em] font-bold py-3.5 transition-colors flex items-center justify-center gap-2 shadow"
                      >
                        <RefreshCw className={`w-4 h-4 ${selectedDish.isGenerating ? "animate-spin" : ""}`} />
                        <span>Reshoot / Generate New Version</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM PANEL: Smart AI Retouch & Editing Panel (using gemini-3.1-flash-image-preview) */}
              <div className="border-t border-[#E0DCCF] pt-6 mt-6">
                <div className="bg-white p-5 border border-[#E0DCCF] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#F2EFE9] pb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        AI Retouch Desk & Food Customization
                      </h4>
                      <p className="text-[10px] text-[#8C887D] mt-0.5">
                        Retouch ingredients, add steam, modify plating, or change the table background using Gemini smart edits.
                      </p>
                    </div>
                    
                    {/* Undo and version counter buttons */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#8C887D]">
                        Versions: <strong className="text-black font-semibold">{(selectedDish.editHistory?.length || 0) + (selectedDish.generatedImage ? 1 : 0)}</strong>
                      </span>
                      
                      <button
                        onClick={() => handleUndoEdit(selectedDish.id)}
                        disabled={!selectedDish.editHistory || selectedDish.editHistory.length === 0}
                        className="flex items-center gap-1 px-2 py-1 border border-[#E0DCCF] hover:border-black disabled:opacity-30 disabled:hover:border-[#E0DCCF] text-[10px] uppercase font-bold transition-colors bg-white text-[#1A1A1A]"
                      >
                        <Undo className="w-3 h-3" />
                        Undo Retouch
                      </button>
                    </div>
                  </div>

                  {/* Interactive Prompting Box for editing */}
                  {selectedDish.generatedImage ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={selectedDish.editPrompt || ""}
                          onChange={(e) => updateDishConfig(selectedDish.id, { editPrompt: e.target.value })}
                          placeholder="e.g., 'Add a fresh lemon slice next to the plate' or 'Make background wooden and add some red chili flakes'"
                          className="flex-1 p-3 border border-[#E0DCCF] bg-[#FAF9F5] text-xs focus:outline-none focus:border-black placeholder:text-[#8C887D]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditImage(selectedDish.id);
                          }}
                        />
                        <button
                          onClick={() => handleEditImage(selectedDish.id)}
                          disabled={selectedDish.isEditing || !selectedDish.editPrompt?.trim()}
                          className="bg-[#1A1A1A] hover:bg-[#333] disabled:bg-[#CCC] disabled:cursor-not-allowed text-white text-[10px] uppercase tracking-wider font-bold px-5 transition-colors flex items-center gap-1.5"
                        >
                          {selectedDish.isEditing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Compass className="w-3.5 h-3.5" />
                              Apply Retouch
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Popular presets */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="text-[#8C887D]">Quick Ideas:</span>
                        {[
                          "Add tiny rising steam",
                          "Sprinkle finely chopped chives on top",
                          "Darken the background table shadow",
                          "Add a glass of sparkling water next to the dish"
                        ].map((idea) => (
                          <button
                            key={idea}
                            type="button"
                            onClick={() => updateDishConfig(selectedDish.id, { editPrompt: idea })}
                            className="bg-[#F2EFE9] hover:bg-[#E0DCCF] text-[#1A1A1A] px-2 py-1 transition-colors"
                          >
                            + {idea}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 text-[11px] text-[#8C887D] italic">
                      Please generate your initial food photograph above to activate the Retouch Desk.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#8C887D] space-y-4">
              <Compass className="w-12 h-12 stroke-1" />
              <div>
                <p className="font-serif italic text-lg">No Plate Selected</p>
                <p className="text-xs">Add dishes or parse a menu from the left panel to begin.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* GALLERY SHOWCASE OVERVIEW: Bottom visual grid */}
      <section id="gallery-showcase" className="border-t border-[#E0DCCF] bg-[#F9F7F2] p-8 md:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#8C887D]">
              Photographed Masterpieces
            </span>
            <h3 className="text-3xl font-display font-medium italic mt-1 text-[#1A1A1A]">
              Culinary Art Collection
            </h3>
          </div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8C887D] bg-white border border-[#E0DCCF] px-4 py-2 shadow-sm">
            Total Captured: {dishes.filter(d => d.generatedImage).length} / {dishes.length} items
          </div>
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dishes.map((dish) => {
            const hasImage = !!dish.generatedImage;
            return (
              <div
                key={dish.id}
                onClick={() => setSelectedDishId(dish.id)}
                className={`group border border-[#E0DCCF] bg-white overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  selectedDishId === dish.id ? "ring-1 ring-[#1A1A1A]" : ""
                }`}
              >
                {/* Photo space */}
                <div className="relative bg-[#FAF9F5] aspect-square overflow-hidden border-b border-[#E0DCCF] flex items-center justify-center">
                  {hasImage ? (
                    <img
                      src={dish.generatedImage}
                      alt={dish.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="p-6 text-center space-y-2 text-[#8C887D]">
                      <div className="w-10 h-10 rounded-full border border-[#E0DCCF] flex items-center justify-center mx-auto bg-white/40">
                        <ImageIcon className="w-4 h-4 text-[#8C887D]" />
                      </div>
                      <span className="text-[9px] uppercase tracking-wider block font-bold">Unshot</span>
                    </div>
                  )}

                  {/* Floating style tag */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-[9px] text-white uppercase font-semibold">
                    {dish.selectedStyle}
                  </span>
                </div>

                {/* Info block */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C887D]">
                      {dish.category}
                    </span>
                    <h4 className="font-serif font-medium text-[#1A1A1A] text-sm mt-1 group-hover:text-[#8C887D] transition-colors line-clamp-1">
                      {dish.name}
                    </h4>
                    <p className="text-[11px] text-[#666258] mt-1 line-clamp-2 italic leading-relaxed">
                      "{dish.description}"
                    </p>
                  </div>

                  <div className="border-t border-[#F2EFE9] pt-3 mt-3 flex items-center justify-between text-[10px] text-[#8C887D]">
                    <span>Format: {dish.selectedAspectRatio}</span>
                    <span className="font-bold text-[#1A1A1A] group-hover:underline">
                      {hasImage ? "Retouch Shot →" : "Take Photo →"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FULL SCREEN LIGHTBOX MODAL */}
      {activeZoomedImage && (
        <div
          id="lightbox-backdrop"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setActiveZoomedImage(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col bg-white border border-[#E0DCCF] shadow-2xl p-3 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeZoomedImage}
              alt="High resolution render"
              className="max-h-[80vh] object-contain mx-auto"
            />
            
            <div className="flex justify-between items-center text-xs text-[#1A1A1A] font-semibold uppercase tracking-wider px-2 border-t border-[#F2EFE9] pt-3">
              <span>Virtual Studio Render Master</span>
              <div className="flex gap-4">
                <a
                  href={activeZoomedImage}
                  download="lumiere_food_photo.png"
                  className="flex items-center gap-1 text-[#1A1A1A] hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Save Photo
                </a>
                <button
                  onClick={() => setActiveZoomedImage(null)}
                  className="text-red-600 hover:underline"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Editorial Footer */}
      <footer id="editorial-footer" className="mt-auto border-t border-[#E0DCCF] bg-white py-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-widest font-bold text-[#8C887D] gap-4">
        <div>
          <span>Studio Suite: </span>
          <span className="text-[#1A1A1A]">Lumière Premium v2.5.0</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <span>Renderer: Gemini 3 Pro</span>
          <span>Editor: Gemini 3.1 Flash Image</span>
          <span>Host: Google Cloud Secure Run</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} Lumière Food Photography.</span>
        </div>
      </footer>

    </div>
  );
}
