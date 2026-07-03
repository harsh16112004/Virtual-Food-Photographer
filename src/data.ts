import { Dish } from "./types";

export interface MenuTemplate {
  name: string;
  cuisine: string;
  description: string;
  menuText: string;
  dishes: Dish[];
}

export const MENU_TEMPLATES: MenuTemplate[] = [
  {
    name: "La Piazza Trattoria",
    cuisine: "Rustic Italian",
    description: "Authentic, warm, wood-fired flavors from Southern Italy.",
    menuText: `--- LA PIAZZA TRATTORIA MENU ---

APPETIZERS:
- Wood-fired Garlic Focaccia: Crispy, sea salt, fresh rosemary, extra virgin olive oil drizzle.
- Burrata Caprese: Heirloom cherry tomatoes, creamy burrata cheese, wild basil pesto, balsamic glaze.

MAIN COURSES:
- Hand-Rolled Truffle Tagliolini: Fresh egg pasta tossed in a creamy black truffle butter sauce, shaved parmigiano-reggiano, wild mushrooms.
- Margherita Pizza: Neapolitan sourdough, San Marzano tomato sauce, fresh mozzarella di bufala, basil, charred puffy crust.

DESSERTS:
- Espresso Tiramisu: Ladyfingers soaked in dark espresso and amaretto, layered with rich mascarpone cream, dark cocoa dust.
`,
    dishes: [
      {
        id: "ital-1",
        name: "Wood-Fired Garlic Focaccia",
        description: "Crispy, sea salt, fresh rosemary, extra virgin olive oil drizzle.",
        category: "Appetizers",
        suggestedPrompt: "A close-up shot of freshly baked, warm Italian focaccia bread with charred golden edges on a rustic paper wrap. Drizzles of glistening extra virgin olive oil run down the soft, dimpled crust. Coarse grains of sea salt and vibrant green rosemary needles are scattered artistically on top. Tiny wisps of hot steam are visible.",
        selectedStyle: "rustic",
        selectedSize: "1K",
        selectedAspectRatio: "4:3",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      },
      {
        id: "ital-2",
        name: "Burrata Caprese",
        description: "Heirloom cherry tomatoes, creamy burrata cheese, wild basil pesto, balsamic glaze.",
        category: "Appetizers",
        suggestedPrompt: "A vibrant caprese salad centering a plump, glistening sphere of fresh burrata cheese just starting to split, revealing a rich, creamy interior. Artfully arranged around it are colorful heirloom cherry tomatoes (red, yellow, and purple) tossed in extra virgin olive oil. Splashes of bright green wild basil pesto and dark, glossy balsamic glaze are drizzled eleganty over the plate.",
        selectedStyle: "bright",
        selectedSize: "1K",
        selectedAspectRatio: "1:1",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      },
      {
        id: "ital-3",
        name: "Hand-Rolled Truffle Tagliolini",
        description: "Fresh egg pasta tossed in a creamy black truffle butter sauce, shaved parmigiano-reggiano, wild mushrooms.",
        category: "Main Courses",
        suggestedPrompt: "A gourmet presentation of hand-rolled tagliolini pasta swirled into an elegant nest inside a shallow dark ceramic bowl. The pasta is coated in a velvety truffle butter sauce. Finely shaved black truffle carpaccio and paper-thin shards of parmigiano-reggiano sit on top, alongside golden pan-seared wild chanterelle mushrooms. A micro-herb garnish adds a touch of fresh green.",
        selectedStyle: "rustic",
        selectedSize: "1K",
        selectedAspectRatio: "16:9",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      },
      {
        id: "ital-4",
        name: "Espresso Tiramisu",
        description: "Ladyfingers soaked in dark espresso and amaretto, layered with rich mascarpone cream, dark cocoa dust.",
        category: "Desserts",
        suggestedPrompt: "A perfect square slice of classic tiramisu served on a clean modern plate. Clearly defined, beautiful layers of espresso-soaked ladyfingers and whipped mascarpone cream. The top layer is beautifully dusted with fine, dark cocoa powder. A single mint leaf and a few dark chocolate curls sit delicately on top. Captured with a professional shallow depth of field.",
        selectedStyle: "bright",
        selectedSize: "1K",
        selectedAspectRatio: "1:1",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      }
    ]
  },
  {
    name: "Satsuma Ramen & Sushi",
    cuisine: "Modern Japanese",
    description: "Vibrant, precise, and contemporary Tokyo-style dining.",
    menuText: `--- SATSUMA RAMEN ---

APPETIZERS:
- Pan-Seared Gyoza: Crispy pork dumplings served with ginger-soy dipping sauce.

MAINS:
- Signature Tonkotsu Ramen: 16-hour pork bone broth, thin straight noodles, tender chashu belly, soft-boiled ajitama egg, black garlic oil, scallions.
- Rainbow Dragon Roll: Spicy tuna roll topped with layered salmon, yellowtail, avocado, unagi glaze, and tobiko.

DRINKS:
- Ceremonial Matcha Latte: Iced organic matcha green tea with oat milk and a touch of sweet vanilla syrup.
`,
    dishes: [
      {
        id: "jap-1",
        name: "Pan-Seared Gyoza",
        description: "Crispy pork dumplings served with ginger-soy dipping sauce.",
        category: "Appetizers",
        suggestedPrompt: "A row of five golden-brown pan-seared gyoza dumplings, showing the crispy lacy skirt where they were seared. Served on a rectangular black slate plate. A small ceramic bowl containing dark soy-ginger sauce sits next to them, with red chili flakes floating on top. Finely slivered green scallions are scattered over the dumplings.",
        selectedStyle: "social",
        selectedSize: "1K",
        selectedAspectRatio: "4:3",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      },
      {
        id: "jap-2",
        name: "Signature Tonkotsu Ramen",
        description: "16-hour pork bone broth, thin straight noodles, tender chashu belly, soft-boiled ajitama egg, black garlic oil, scallions.",
        category: "Main Courses",
        suggestedPrompt: "A premium Japanese ceramic bowl filled with steaming Tonkotsu Ramen. The rich, milky pork broth is drizzled with dark black garlic oil. Beautifully arranged on top are two thick slices of seared chashu pork belly, a perfect soft-boiled ramen egg cut in half with a jammy orange yolk, fresh green onions, a sheet of crisp nori seaweed, and a sprinkle of black sesame seeds. Wisps of steam rise from the hot bowl.",
        selectedStyle: "rustic",
        selectedSize: "1K",
        selectedAspectRatio: "1:1",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      },
      {
        id: "jap-3",
        name: "Ceremonial Matcha Latte",
        description: "Iced organic matcha green tea with oat milk and a touch of sweet vanilla syrup.",
        category: "Beverages",
        suggestedPrompt: "An elegant ribbed highball glass filled with a double-layered iced matcha latte. The bottom layer is creamy white oat milk with ice cubes, while the top layer is a vibrant, rich green organic matcha liquid, slowly swirling and bleeding into the milk. The glass sits on a light ash wood table next to a traditional bamboo whisk.",
        selectedStyle: "bright",
        selectedSize: "1K",
        selectedAspectRatio: "3:4",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      }
    ]
  },
  {
    name: "Bloom & Basil Bistro",
    cuisine: "Contemporary French & Garden",
    description: "Lively, botanical, bright morning and lunch fare.",
    menuText: `--- BLOOM & BASIL ---

BRUNCH:
- Avocado Garden Toast: Grilled sourdough, mashed avocado, pickled radishes, edible flowers, poached egg, micro-greens.
- Lemon Blueberry Soufflé Pancakes: Fluffy soufflé-style pancakes, fresh blueberries, zesty lemon curd, maple glaze.
`,
    dishes: [
      {
        id: "fr-1",
        name: "Avocado Garden Toast",
        description: "Grilled sourdough, mashed avocado, pickled radishes, edible flowers, poached egg, micro-greens.",
        category: "Brunch",
        suggestedPrompt: "A top-down overhead shot of artisan grilled sourdough toast topped with a thick layer of creamy, textured mashed avocado. Slices of pink pickled radish are arranged neatly on top, accompanied by a perfectly poached egg with its golden yolk just beginning to run. Scattered colorful edible flower petals (pansies) and fresh green micro-greens cover the dish, served on a modern pastel plate.",
        selectedStyle: "social",
        selectedSize: "1K",
        selectedAspectRatio: "1:1",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      },
      {
        id: "fr-2",
        name: "Lemon Blueberry Soufflé Pancakes",
        description: "Fluffy soufflé-style pancakes, fresh blueberries, zesty lemon curd, maple glaze.",
        category: "Brunch",
        suggestedPrompt: "A stack of three extremely fluffy, thick soufflé pancakes on a decorative vintage plate. Dustings of powdered sugar cover the top. Generous spoonfuls of vibrant yellow lemon curd run down the sides, topped with a heap of fresh, juicy dark-blue blueberries. Warm amber maple syrup is being poured from a small pitcher, creating a shining glaze. Soft, glowing morning light illuminates the setup.",
        selectedStyle: "bright",
        selectedSize: "1K",
        selectedAspectRatio: "16:9",
        selectedModel: "gemini-3-pro-image-preview",
        editHistory: [],
      }
    ]
  }
];
