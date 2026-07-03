# 🍽️ Lumière – AI Virtual Food Photographer

Lumière is an AI-powered virtual food photography platform that transforms plain-text restaurant menus into stunning, photorealistic food images. Built with React, TypeScript, Express, and Google's Gemini API, it automates menu parsing, prompt generation, image creation, and AI-powered image editing—all within an intuitive web interface.

## ✨ Features

* 🤖 AI-powered menu parsing from plain text into structured dishes
* 🍕 Automatic generation of detailed food photography prompts
* 📸 Photorealistic food image generation using Google Gemini
* 🎨 Multiple photography styles (Rustic, Bright, Social Media)
* 🖼️ Configurable image resolution (1K, 2K, 4K) and aspect ratios
* ✏️ AI-based image editing with natural language instructions
* ↩️ Edit history with undo functionality
* 📂 Menu file upload support (.txt, .md, .json)
* 🍽️ Manual dish management and customization
* 💾 Download generated images
* 🎭 Ready-to-use restaurant menu templates

## 🛠️ Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript
* dotenv

### AI

* Google Gemini API
* Gemini 3 Pro Image
* Gemini 3.1 Flash Image

## 🚀 How It Works

1. Upload or paste a restaurant menu.
2. AI extracts and categorizes all dishes.
3. Automatically generates detailed food photography prompts.
4. Generate high-quality photorealistic food images.
5. Edit images using natural language (e.g., "Add steam" or "Change the background to wood").
6. Download the final images for menus, websites, or food delivery platforms.

## 📌 Use Cases

* Restaurants
* Cafés
* Food Bloggers
* Menu Designers
* Cloud Kitchens
* Food Delivery Platforms
* Digital Marketing Agencies

## 🔮 Future Improvements

* User authentication
* Cloud storage for generated images
* Batch image generation
* Multi-language menu support
* PDF menu export
* Restaurant branding and watermarking
* Prompt history and project management

---

An intelligent virtual food photography studio that helps restaurants create premium-quality menu visuals without the need for expensive photography equipment or professional photo shoots.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
