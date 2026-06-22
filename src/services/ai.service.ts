export interface NutritionGenerationResult {
  description: string;
  ingredients: string[];
  allergens: string[];
  nutrition: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sodiumMilligrams: number;
  };
}

export async function generateNutritionAndDescription(
  name: string,
  category?: string,
  userDescription?: string
): Promise<NutritionGenerationResult> {
  const normName = name.toLowerCase().trim();
  const normCat = (category || "").toLowerCase().trim();
  const normDesc = (userDescription || "").toLowerCase().trim();

  // 1. Initialize default values
  let description = userDescription || `Masarap at mainit na ${name} (Delicious, freshly prepared ${name}), made with premium ingredients.`;
  let ingredients: string[] = ["fresh ingredients", "seasonings", "vegetable oil"];
  let allergens: string[] = [];
  let calories = 350;
  let proteinGrams = 10;
  let carbsGrams = 45;
  let fatGrams = 12;
  let sodiumMilligrams = 450;

  // Flags for ingredients
  let isSpicy = normName.includes("spicy") || normName.includes("maanghang") || normDesc.includes("spicy") || normName.includes("chili");
  let hasCheese = normName.includes("cheese") || normName.includes("cheesy") || normName.includes("keso") || normDesc.includes("cheese");
  let hasChicken = normName.includes("chicken") || normName.includes("manok") || normDesc.includes("chicken");
  let hasEgg = normName.includes("egg") || normName.includes("itlog") || normDesc.includes("egg");
  let hasBeef = normName.includes("beef") || normName.includes("baka") || normName.includes("meat") || normDesc.includes("beef");
  let hasPork = normName.includes("pork") || normName.includes("baboy") || normName.includes("liempo") || normDesc.includes("pork");
  let hasFish = normName.includes("fish") || normName.includes("isda") || normName.includes("salmon") || normName.includes("tuna");
  let hasShrimp = normName.includes("shrimp") || normName.includes("hipon") || normName.includes("prawn") || normName.includes("seafood");

  // 2. Bilingual Tagalog & English Keyword Classification
  
  // -- A. Silog Dishes (Breakfast combo)
  if (normName.endsWith("silog") || normName.includes("silog") || normCat.includes("breakfast")) {
    description = `A classic Filipino breakfast combo featuring garlic fried rice (sinangag), fried egg (itlog), and a savory protein of choice. Perfect start to your day!`;
    ingredients = ["garlic fried rice (sinangag)", "fried egg (itlog)", "savory cured meat"];
    allergens = ["egg"];
    calories = 520;
    proteinGrams = 18;
    carbsGrams = 62;
    fatGrams = 20;
    sodiumMilligrams = 850;

    if (normName.includes("tap") || normName.includes("tapa")) {
      description = `Tapsilog - Mainit na sinangag at itlog na may kasamang malinamnam na tapa (beef slices cooked in soy sauce, calamansi, and garlic).`;
      ingredients = ["marinated beef slices (tapa)", "garlic fried rice (sinangag)", "fried egg (itlog)"];
      calories = 580;
      proteinGrams = 28;
    } else if (normName.includes("toc") || normName.includes("tosilog") || normName.includes("tocino")) {
      description = `Tosilog - Sweet cured pork (tocino) served with garlic fried rice (sinangag) and fried egg (itlog). Ang paboritong matamis-tamis na almusal!`;
      ingredients = ["sweet cured pork (tocino)", "garlic fried rice (sinangag)", "fried egg (itlog)"];
      calories = 620;
      proteinGrams = 22;
    } else if (normName.includes("long") || normName.includes("longsilog") || normName.includes("longganisa")) {
      description = `Longsilog - Local garlic pork sausage (longganisa) served with garlic fried rice (sinangag) and fried egg (itlog).`;
      ingredients = ["pork sausage (longganisa)", "garlic fried rice (sinangag)", "fried egg (itlog)"];
      calories = 590;
      proteinGrams = 19;
    } else if (normName.includes("bang") || normName.includes("bangsilog") || normName.includes("bangus")) {
      description = `Bangsilog - Crispy pan-fried marinated milkfish (bangus) served with garlic fried rice (sinangag) and fried egg (itlog).`;
      ingredients = ["marinated milkfish (bangus)", "garlic fried rice (sinangag)", "fried egg (itlog)"];
      allergens = ["egg", "fish"];
      calories = 490;
      proteinGrams = 24;
    } else if (normName.includes("spamsilog") || normName.includes("spam")) {
      description = `Spamsilog - Fried luncheon meat slices served with garlic fried rice (sinangag) and fried egg (itlog).`;
      ingredients = ["luncheon meat (spam)", "garlic fried rice (sinangag)", "fried egg (itlog)"];
      calories = 560;
      proteinGrams = 17;
    }
  }
  // -- B. Adobo
  else if (normName.includes("adobo") || normName.includes("inadobo")) {
    description = `A savory, tangy, and garlicky classic Filipino dish simmered slowly in soy sauce, vinegar, garlic, bay leaves, and black peppercorns.`;
    ingredients = ["soy sauce (toyo)", "cane vinegar (suka)", "garlic (bawang)", "bay leaves (dahon ng laurel)", "whole peppercorns (paminta)"];
    allergens = ["soy"];
    calories = 450;
    proteinGrams = 22;
    carbsGrams = 8;
    fatGrams = 35;
    sodiumMilligrams = 980;

    if (hasChicken) {
      description = `Chicken Adobo (Adobong Manok) - Tender chicken pieces simmered in garlic, vinegar, soy sauce, and aromatic spices.`;
      ingredients.unshift("chicken cuts");
      proteinGrams = 26;
      fatGrams = 24;
    } else if (hasPork) {
      description = `Pork Adobo (Adobong Baboy) - Melt-in-your-mouth pork belly simmered in soy sauce, vinegar, and garlic. Bestseller ulam!`;
      ingredients.unshift("pork belly chunks (liempo)");
      proteinGrams = 22;
      fatGrams = 40;
    }
  }
  // -- C. Sinigang
  else if (normName.includes("sinigang")) {
    description = `A traditional Filipino sour soup cooked in tamarind (sampalok) broth with mixed local vegetables like kangkong, radish, and taro. Napakasabaw at mapakla!`;
    ingredients = ["tamarind broth base", "kangkong (water spinach)", "radish slices (labanos)", "taro (gabi)", "green chili (siling haba)", "tomatoes", "onions"];
    allergens = [];
    calories = 240;
    proteinGrams = 16;
    carbsGrams = 14;
    fatGrams = 12;
    sodiumMilligrams = 1100;

    if (hasPork) {
      description = `Sinigang na Baboy - Pork ribs cooked in a sour tamarind broth with gabi, kangkong, and local vegetables. Mainit na sabaw para sa tanghalian!`;
      ingredients.unshift("pork cuts (ribs/belly)");
      calories = 380;
      proteinGrams = 20;
      fatGrams = 26;
    } else if (hasShrimp || normName.includes("hipon")) {
      description = `Sinigang na Hipon - Fresh shrimp cooked in a sour tamarind broth with fresh garden vegetables.`;
      ingredients.unshift("fresh shrimp (hipon)");
      allergens = ["shellfish"];
      calories = 190;
      proteinGrams = 18;
      fatGrams = 4;
    } else if (hasBeef) {
      description = `Sinigang na Baka - Tender beef chunks simmered in sour tamarind broth with vegetables.`;
      ingredients.unshift("beef short ribs");
      calories = 410;
      proteinGrams = 24;
      fatGrams = 28;
    }
  }
  // -- D. Pancit / Noodles
  else if (normName.includes("pancit") || normName.includes("pansit") || normName.includes("bihon") || normName.includes("canton") || normCat.includes("noodles") || normName.includes("noodle") || normName.includes("lomi") || normName.includes("pasta") || normName.includes("spaghetti")) {
    description = `Stir-fried noodles tossed with fresh shredded vegetables, soy sauce, calamansi, and choice of meat. Standard Pinoy celebration noodle!`;
    ingredients = ["noodles", "carrots", "cabbage", "soy sauce", "garlic", "onions", "calamansi"];
    allergens = ["wheat", "gluten", "soy"];
    calories = 380;
    proteinGrams = 12;
    carbsGrams = 58;
    fatGrams = 8;
    sodiumMilligrams = 950;

    if (normName.includes("bihon")) {
      description = `Pancit Bihon - Thin rice noodles stir-fried with mixed vegetables and pork/chicken.`;
      ingredients = ["rice noodles (bihon)", "cabbage", "carrots", "chicken breast strips", "soy sauce", "calamansi"];
    } else if (normName.includes("canton")) {
      description = `Pancit Canton - Egg noodles stir-fried with mixed vegetables, soy sauce, and meat.`;
      ingredients = ["egg noodles (canton)", "cabbage", "carrots", "pork slices", "soy sauce", "oyster sauce"];
      allergens = ["wheat", "gluten", "egg", "soy"];
    } else if (normName.includes("spaghetti") || normName.includes("filipino spaghetti")) {
      description = `Filipino Spaghetti - Sweet-style spaghetti topped with rich tomato-banana catsup sauce, ground pork, sliced red hotdogs, and cheddar cheese. Patok sa mga bata!`;
      ingredients = ["spaghetti pasta", "sweet tomato sauce", "ground pork", "red hotdogs", "cheddar cheese"];
      allergens = ["wheat", "gluten", "dairy"];
      calories = 490;
      proteinGrams = 18;
      carbsGrams = 64;
      fatGrams = 16;
      sodiumMilligrams = 780;
    } else if (normName.includes("lomi")) {
      description = `Batangas Lomi - Thick egg noodles served in a rich, slimy egg-drop broth topped with chicharon, meatballs, and sliced pork liver.`;
      ingredients = ["thick egg noodles", "egg-drop starch broth", "chicharon (pork cracklings)", "meatballs", "sliced pork liver"];
      allergens = ["wheat", "gluten", "egg"];
      calories = 540;
      proteinGrams = 22;
      fatGrams = 18;
    }
  }
  // -- E. Lumpia
  else if (normName.includes("lumpia")) {
    description = `Crispy deep-fried spring rolls filled with seasoned ground meat and minced vegetables. Served with sweet chili dipping sauce.`;
    ingredients = ["ground pork", "lumpia wrapper", "minced carrots", "onions", "garlic", "sweet chili sauce"];
    allergens = ["wheat", "gluten"];
    calories = 290;
    proteinGrams = 10;
    carbsGrams = 24;
    fatGrams = 14;
    sodiumMilligrams = 520;

    if (normName.includes("shanghai")) {
      description = `Lumpiang Shanghai - Crispy, bite-sized pork spring rolls. Pinakapaboritong handog sa handaan!`;
      ingredients = ["ground pork", "lumpia wrapper", "minced carrots", "onion", "garlic", "egg binder", "sweet chili sauce"];
      allergens = ["wheat", "gluten", "egg"];
    } else if (normName.includes("sariwa") || normName.includes("ubod")) {
      description = `Lumpiang Sariwa (Fresh Spring Roll) - Soft crepe wrapper filled with sautéed vegetables, topped with sweet garlic peanut sauce.`;
      ingredients = ["soft crepe wrapper", "heart of palm (ubod) or cabbage", "carrots", "sweet peanut sauce", "crushed peanuts", "minced garlic"];
      allergens = ["wheat", "gluten", "peanuts"];
      calories = 210;
      proteinGrams = 6;
      carbsGrams = 28;
      fatGrams = 8;
      sodiumMilligrams = 420;
    }
  }
  // -- F. Sisig
  else if (normName.includes("sisig")) {
    description = `A sizzling Kapampangan specialty made of chopped pork face, belly, and chicken liver, seasoned with calamansi, onions, and chili peppers. topped with fresh egg.`;
    ingredients = ["chopped pork head/ears", "pork belly (liempo)", "onions (sibuyas)", "calamansi juice", "chili peppers (siling labuyo)", "egg", "mayonnaise"];
    allergens = ["egg"];
    calories = 620;
    proteinGrams = 24;
    carbsGrams = 6;
    fatGrams = 52;
    sodiumMilligrams = 1120;
  }
  // -- G. Kare-Kare
  else if (normName.includes("kare-kare") || normName.includes("karekare")) {
    description = `A rich and thick Filipino stew cooked in a savory peanut sauce, served with vegetables like eggplant and string beans, paired with shrimp paste (bagoong).`;
    ingredients = ["beef tripe/oxtail", "ground peanuts (peanut butter)", "eggplant (talong)", "string beans (sitaw)", "banana blossom", "shrimp paste (bagoong)"];
    allergens = ["peanuts", "shellfish"];
    calories = 540;
    proteinGrams = 28;
    carbsGrams = 18;
    fatGrams = 38;
    sodiumMilligrams = 1050;
  }
  // -- H. Bicol Express / Spicy Gising-Gising
  else if (normName.includes("bicol express") || normName.includes("gising")) {
    description = `A fiery Filipino dish made of pork strips, green chilies, and shrimp paste slowly simmered in rich coconut milk. Sobrang anghang at gata!`;
    ingredients = ["pork strips", "coconut cream (gata)", "green finger chilies (siling haba)", "shrimp paste (bagoong)", "garlic", "onions"];
    allergens = ["shellfish"];
    calories = 490;
    proteinGrams = 18;
    carbsGrams = 10;
    fatGrams = 42;
    sodiumMilligrams = 950;
  }
  // -- I. Desserts (Halo-halo, Turon, Bibingka, Puto, Sweets)
  else if (normName.includes("halo-halo") || normName.includes("halohalo") || normName.includes("turon") || normName.includes("puto") || normName.includes("bibingka") || normCat.includes("dessert") || normCat.includes("sweets") || normName.includes("leche flan") || normName.includes("ube")) {
    description = `Mainam na panghimagas (delightful Filipino sweet dessert) cooked with sugar, milk, and traditional ingredients.`;
    ingredients = ["white sugar", "evaporated milk", "coconut milk"];
    allergens = ["dairy"];
    calories = 310;
    proteinGrams = 4;
    carbsGrams = 58;
    fatGrams = 8;
    sodiumMilligrams = 120;

    if (normName.includes("halo-halo") || normName.includes("halohalo")) {
      description = `Special Halo-Halo - A refreshing mixture of shaved ice, milk, sweet beans, jellies, tapioca pearls, topped with ube halaya, leche flan, and ice cream.`;
      ingredients = ["shaved ice", "evaporated milk", "ube halaya", "leche flan slice", "sweetened saba banana", "nata de coco", "sweet beans", "ube ice cream"];
      calories = 380;
      proteinGrams = 6;
      carbsGrams = 72;
      fatGrams = 9;
    } else if (normName.includes("turon")) {
      description = `Turon - Crispy deep-fried banana spring rolls wrapped in lumpia pastry, coated in caramelized brown sugar and filled with jackfruit.`;
      ingredients = ["saba banana slices", "brown sugar", "jackfruit (langka) strips", "lumpia wrapper", "deep frying oil"];
      allergens = ["wheat", "gluten"];
      calories = 240;
      proteinGrams = 2;
      carbsGrams = 48;
      fatGrams = 6;
    } else if (normName.includes("leche flan") || normName.includes("flan")) {
      description = `Leche Flan - A rich and creamy caramel custard made with egg yolks, condensed milk, evaporated milk, and caramelized sugar glaze. Meltingly smooth!`;
      ingredients = ["egg yolks", "condensed milk", "evaporated milk", "sugar syrup"];
      allergens = ["dairy", "egg"];
      calories = 320;
      proteinGrams = 7;
      carbsGrams = 44;
      fatGrams = 13;
    } else if (normName.includes("bibingka")) {
      description = `Bibingka - Traditional baked rice cake cooked in clay pots lined with banana leaves, topped with salted egg, butter, and grated coconut.`;
      ingredients = ["rice flour (galapong)", "coconut milk", "sugar", "salted egg slices", "butter", "grated coconut"];
      allergens = ["dairy", "egg"];
      calories = 350;
      proteinGrams = 6;
      carbsGrams = 54;
      fatGrams = 12;
    }
  }
  // -- J. Street Foods & Snacks (Fishballs, Kikiam, Kwek-kwek, Calamares)
  else if (normName.includes("fishball") || normName.includes("kikiam") || normName.includes("kwek") || normName.includes("tokneneng") || normCat.includes("street food") || normCat.includes("snack") || normName.includes("calamares") || normName.includes("tempura")) {
    description = `A popular crispy Filipino street food snack fried to a golden finish. Served with sweet, spicy, or vinegar dipping sauce.`;
    ingredients = ["street food mix", "frying oil", "spicy vinegar or sweet brown dipping sauce"];
    allergens = ["wheat", "gluten"];
    calories = 260;
    proteinGrams = 8;
    carbsGrams = 32;
    fatGrams = 12;
    sodiumMilligrams = 680;

    if (normName.includes("kwek") || normName.includes("tokneneng")) {
      description = `Kwek-Kwek - Crispy, orange-battered deep-fried hard-boiled eggs (or quail eggs), served with spiced vinegar dipping sauce. Bestseller street food!`;
      ingredients = ["boiled quail eggs (or chicken eggs)", "orange food batter mix", "spiced vinegar sauce", "cooking oil"];
      allergens = ["egg", "wheat", "gluten"];
      calories = 290;
      proteinGrams = 12;
    } else if (normName.includes("calamares")) {
      description = `Calamares - Crispy deep-fried breaded squid rings seasoned with spices and served with a garlic mayo dipping sauce.`;
      ingredients = ["squid rings", "breadcrumbs batter", "garlic mayonnaise", "spices", "cooking oil"];
      allergens = ["wheat", "gluten", "shellfish", "egg"];
      calories = 340;
      proteinGrams = 16;
      carbsGrams = 28;
      fatGrams = 18;
    }
  }
  // -- K. Beverages / Drinks
  else if (normCat.includes("beverage") || normCat.includes("drinks") || normName.includes("juice") || normName.includes("tea") || normName.includes("gulaman") || normName.includes("coffee") || normName.includes("shake")) {
    description = `Mainam at malamig na inumin (Refreshing cold beverage), perfect to wash down your heavy canteen meals.`;
    ingredients = ["purified water", "refined sugar", "crushed ice"];
    allergens = [];
    calories = 120;
    proteinGrams = 0;
    carbsGrams = 30;
    fatGrams = 0;
    sodiumMilligrams = 15;

    if (normName.includes("buko") || normName.includes("coconut")) {
      description = `Buko Juice - Refreshing sweet coconut water with tender young coconut meat scrapings.`;
      ingredients = ["fresh coconut water (buko)", "coconut meat strips", "sugar syrup", "ice cubes"];
    } else if (normName.includes("sago") || normName.includes("gulaman")) {
      description = `Sago't Gulaman - A sweet, cold beverage made of brown sugar syrup (arnibal), gelatin cubes (gulaman), and tapioca pearls (sago).`;
      ingredients = ["brown sugar syrup (arnibal)", "gelatin jelly cubes (gulaman)", "tapioca pearls (sago)", "water", "crushed ice"];
    } else if (normName.includes("mango shake") || normName.includes("shake")) {
      description = `Mango Shake - Chilled, blended smoothie made with sweet ripe mangoes, milk, and shaved ice. Pang-alis ng init!`;
      ingredients = ["sweet ripe mango pulp", "condensed milk", "evaporated milk", "shaved ice"];
      allergens = ["dairy"];
      calories = 220;
      proteinGrams = 3;
      carbsGrams = 42;
      fatGrams = 4;
    }
  }
  // -- L. Standard Western Burgers / Sandwiches
  else if (normName.includes("burger") || normName.includes("slider") || normName.includes("sandwich") || normName.includes("sub") || normName.includes("panini")) {
    description = `A satisfying sandwich served inside bread/toasted bun with crispy lettuce, fresh tomatoes, dressing, and choice of meat.`;
    ingredients = ["sandwich bread / bun", "lettuce", "sliced tomato", "mayonnaise sauce"];
    allergens = ["wheat", "gluten"];
    calories = 420;
    proteinGrams = 18;
    carbsGrams = 38;
    fatGrams = 16;
    sodiumMilligrams = 790;
  }
  // -- M. General Stews / Rice Meals
  else if (normCat.includes("meals") || normCat.includes("ulam") || normName.includes("stew") || normName.includes("curry") || normName.includes("caldereta") || normName.includes("mechado") || normName.includes("menudo")) {
    description = `A rich and savory Filipino meat stew cooked in a thick tomato-based gravy with potatoes, carrots, and bell peppers. Standard ulam partner for rice!`;
    ingredients = ["tomato sauce base", "potatoes", "carrots", "bell peppers", "garlic", "onions"];
    allergens = [];
    calories = 380;
    proteinGrams = 18;
    carbsGrams = 16;
    fatGrams = 22;
    sodiumMilligrams = 720;

    if (normName.includes("caldereta") || normName.includes("kaldereta")) {
      description = `Beef Caldereta (Kalderetang Baka) - Sautéed beef stew cooked in tomato sauce, liver spread, cheese, and hot chilies. Very rich and savory!`;
      ingredients.unshift("beef chunks");
      ingredients.push("liver spread", "cheddar cheese");
      allergens = ["dairy"];
      calories = 480;
      proteinGrams = 24;
      fatGrams = 32;
    } else if (normName.includes("menudo")) {
      description = `Pork Menudo - A traditional Filipino stew with cubed pork, pork liver, hotdogs, potatoes, and carrots cooked in tomato sauce.`;
      ingredients = ["cubed pork", "pork liver", "sliced red hotdogs", "potatoes", "carrots", "tomato sauce"];
      calories = 420;
      proteinGrams = 22;
      fatGrams = 26;
    }
  }

  // 3. Category & Ingredient Modifier Overlap Logic
  if (hasChicken) {
    ingredients = ingredients.filter(i => i !== "fresh ingredients" && i !== "savory cured meat");
    if (!ingredients.includes("chicken cuts") && !ingredients.includes("chicken breast")) {
      ingredients.unshift("chicken breast");
    }
    calories += 60;
    proteinGrams += 12;
    fatGrams += 3;
  }
  
  if (hasBeef) {
    ingredients = ingredients.filter(i => i !== "fresh ingredients" && i !== "savory cured meat");
    if (!ingredients.includes("ground beef") && !ingredients.includes("beef chunks")) {
      ingredients.unshift("beef short ribs / chunks");
    }
    calories += 100;
    proteinGrams += 15;
    fatGrams += 7;
  }

  if (hasPork) {
    ingredients = ingredients.filter(i => i !== "fresh ingredients" && i !== "savory cured meat");
    if (!ingredients.includes("pork belly chunks (liempo)") && !ingredients.includes("ground pork") && !ingredients.includes("pork cuts")) {
      ingredients.unshift("pork cuts");
    }
    calories += 110;
    proteinGrams += 13;
    fatGrams += 9;
  }

  if (hasEgg) {
    if (!ingredients.includes("eggs") && !ingredients.includes("fried egg (itlog)")) {
      ingredients.push("eggs");
    }
    if (!allergens.includes("egg")) {
      allergens.push("egg");
    }
    calories += 70;
    proteinGrams += 6;
    fatGrams += 5;
  }

  if (hasCheese) {
    if (!ingredients.includes("cheddar cheese") && !ingredients.includes("mozzarella cheese")) {
      ingredients.push("cheddar cheese");
    }
    if (!allergens.includes("dairy")) {
      allergens.push("dairy");
    }
    calories += 90;
    proteinGrams += 6;
    fatGrams += 8;
    sodiumMilligrams += 160;
  }

  if (hasFish) {
    ingredients = ingredients.filter(i => i !== "fresh ingredients");
    if (!ingredients.includes("fresh fish fillet") && !ingredients.includes("marinated milkfish (bangus)")) {
      ingredients.unshift("fresh fish fillet");
    }
    if (!allergens.includes("fish")) {
      allergens.push("fish");
    }
    calories += 50;
    proteinGrams += 10;
    fatGrams += 2;
  }

  if (hasShrimp) {
    ingredients = ingredients.filter(i => i !== "fresh ingredients");
    if (!ingredients.includes("shrimp") && !ingredients.includes("fresh shrimp (hipon)")) {
      ingredients.unshift("shrimp");
    }
    if (!allergens.includes("shellfish")) {
      allergens.push("shellfish");
    }
    calories += 40;
    proteinGrams += 8;
    fatGrams += 1;
    sodiumMilligrams += 90;
  }

  if (isSpicy) {
    if (!ingredients.includes("chili flakes") && !ingredients.includes("green chili (siling haba)")) {
      ingredients.push("chili flakes (siling labuyo)");
    }
    if (!description.includes("Spicy") && !description.includes("spicy") && !description.includes("Maanghang") && !description.includes("maanghang")) {
      description = `May kaunting anghang! (Spicy & flavorful!) ${description}`;
    }
    sodiumMilligrams += 90;
  }

  // Deduplicate lists
  ingredients = Array.from(new Set(ingredients));
  allergens = Array.from(new Set(allergens));

  return {
    description,
    ingredients,
    allergens,
    nutrition: {
      calories: Math.max(0, calories),
      proteinGrams: Math.max(0, proteinGrams),
      carbsGrams: Math.max(0, carbsGrams),
      fatGrams: Math.max(0, fatGrams),
      sodiumMilligrams: Math.max(0, sodiumMilligrams)
    }
  };
}
