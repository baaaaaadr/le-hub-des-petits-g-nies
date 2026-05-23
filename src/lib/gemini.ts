import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateDetectiveQuestion = async (gradeLevel: string, language: 'fr' | 'ar' = 'fr', exclude: string[] = []) => {
  let prompt = '';
  if (language === 'ar') {
    prompt = `
      Tu es un professeur d'arabe pour enfants. Crée une question pour le jeu "Le Détective des Mots" (dans la version langue arabe) pour un enfant de niveau ${gradeLevel}.
      
      IMPORTANT : La phrase générée ainsi que toutes les réponses doivent être rédigées entièrement en Arabe (avec les voyelles/diacritiques - Harakat - pour faciliter la lecture pour l'enfant).
      
      Règles pour les niveaux de difficulté en arabe (spécifiquement adaptés et décalés vers la facilité car l'enfant est moins avancé en arabe qu'en français) :
      - CP (~niveau 1 / Trés Facile) : Très, très facile. Des phrases très simples de 3-4 mots seulement avec des mots et concepts très familiers pour un petit enfant débutant en arabe. Le mot manquant doit être extrêmement simple (ex: "الْقِطُّ يَشْرَبُ ____.", mot manquant: "الْحَلِيبَ", ou "أَنَا أُحِبُّ ____.", mot manquant: "أُمِّي").
      - CM1 (~niveau 2 / Facile) : Facile. Des phrases simples et directes de 4-6 mots de vocabulaire du quotidien, d'animaux ou d'objets de l'école (ex: "الْوَلَدُ يَذْهَبُ إِلَى ____.", mot manquant: "الْمَدْرَسَةِ").
      - 1ère Année Collège (~niveau 3 / Moyen) : Difficulté moyenne standard. Phrases de longueur moyenne (5-8 mots) utilisant des verbes, noms ou adjectifs courants avec des structures grammaticales élémentaires de base.
      
      ${exclude.length > 0 ? `IMPORTANT : Ne génère PAS de questions portant sur les mots arabes suivants (déjà utilisés) : ${exclude.join(', ')}.` : ''}
      
      Génère une courte phrase en arabe avec un mot manquant représenté par "____".
      Fournis la bonne réponse (correctAnswer) en arabe et 3 mauvaises réponses (wrongAnswers) plausibles en arabe.
    `;
  } else {
    prompt = `
      Tu es un professeur pour enfants. Crée une question pour le jeu "Le Détective des Mots" pour un enfant de niveau ${gradeLevel} (système marocain).
      
      Règles pour le niveau :
      - CP (~6 ans) : L'enfant est très avancé et lit déjà des livres entiers. Ne te limite pas à des phrases basiques comme "le chat boit du lait". Utilise un vocabulaire riche, des adjectifs descriptifs et des structures de phrases complètes. Le mot manquant doit être un nom, un verbe ou un adjectif intéressant (ex: "étincelant", "bondir", "mystérieux").
      - CM1 (~9-10 ans) : Grammaire intermédiaire, vocabulaire plus riche, expressions idiomatiques simples.
      - 1ère Année Collège (~12-13 ans) : Vocabulaire avancé, logique abstraite, nuances de sens.

      ${exclude.length > 0 ? `IMPORTANT : Ne génère PAS de questions portant sur les mots suivants (déjà utilisés) : ${exclude.join(', ')}.` : ''}

      Génère une courte phrase en français avec un mot manquant représenté par "____".
      Fournis la bonne réponse (correctAnswer) et 3 mauvaises réponses (wrongAnswers).
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING, description: "La phrase avec le mot manquant '____'" },
          correctAnswer: { type: Type.STRING, description: "Le mot correct" },
          wrongAnswers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 mots incorrects"
          }
        },
        required: ["sentence", "correctAnswer", "wrongAnswers"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateMarketItem = async (gradeLevel: string, exclude: string[] = []) => {
  const prompt = `
    Tu es un marchand dans un souk amusant. Génère un objet à acheter pour le jeu "Le Marché de l'Atlas" pour un enfant de niveau ${gradeLevel}.
    
    Règles pour le prix en Dirhams (DH) :
    - CP (~6 ans) : Prix entier simple (ex: 5, 12, 20 DH).
    - CM1 (~9-10 ans) : Prix plus grand (ex: 45, 120, 250 DH).
    - 1ère Année Collège (~12-13 ans) : Prix complexe avec des centimes (ex: 48.50, 120.75 DH).

    ${exclude.length > 0 ? `IMPORTANT : Ne génère PAS les objets suivants (déjà vendus) : ${exclude.join(', ')}.` : ''}

    Génère un nom d'objet amusant ou typique (ex: "Tapis volant", "Tajine magique", "Livre de sorts") et son prix.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING, description: "Nom de l'objet amusant" },
          price: { type: Type.NUMBER, description: "Prix en Dirhams (DH)" }
        },
        required: ["itemName", "price"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateButterflyPattern = async (gridSize: number, colors: string[]) => {
  const prompt = `
    Tu es un artiste. Génère un motif abstrait et joli pour la première moitié d'un papillon sur une grille de ${gridSize}x${gridSize}.
    Les couleurs disponibles sont: ${colors.join(', ')}.
    Utilise 'empty' pour une case vide (transparente).
    Le motif doit avoir une forme organique ou géométrique intéressante, avec plus de cases vides sur les bords extérieurs.
    Renvoie un tableau plat de ${gridSize * gridSize} chaînes de caractères représentant les couleurs de chaque case, de gauche à droite, de haut en bas.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tableau de couleurs"
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateArabicWord = async (gradeLevel: string, exclude: string[] = []) => {
  const prompt = `
    Tu es un professeur d'arabe pour enfants. Génère un mot en arabe pour le jeu "Le Train de l'Arabe" pour un enfant de niveau ${gradeLevel}.
    
    Règles :
    - Le mot doit être un nom commun simple (animal, objet, fruit, etc.).
    - Fournis la traduction en français.
    - Fournis un emoji correspondant.
    - Le mot arabe doit être court (3 à 6 lettres).
    
    ${exclude.length > 0 ? `IMPORTANT : Ne génère PAS les mots suivants (déjà vus) : ${exclude.join(', ')}.` : ''}

    Niveau CP : Mots très simples (ex: chat, chien, pomme).
    Niveau CM1 : Mots plus variés (ex: éléphant, cartable, montagne).
    Niveau 1ère Année Collège : Mots plus complexes (ex: bibliothèque, ordinateur, environnement).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fr: { type: Type.STRING, description: "Traduction en français" },
          ar: { type: Type.STRING, description: "Mot en arabe" },
          emoji: { type: Type.STRING, description: "Emoji correspondant" }
        },
        required: ["fr", "ar", "emoji"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateMazeLevel = async (gradeLevel: string, gridSize: number) => {
  const prompt = `
    Tu es un concepteur de niveaux pour un jeu de labyrinthe éducatif.
    Génère un NOUVEAU niveau UNIQUE pour un enfant de niveau ${gradeLevel} (système éducatif français/marocain).
    
    Graine aléatoire pour garantir un niveau différent à chaque fois : ${Math.random()}
    
    Règles :
    - La grille fait ${gridSize}x${gridSize} cases (de 0 à ${gridSize - 1}).
    - Le robot commence TOUJOURS à la position (0, 0).
    - Tu dois fournir la position de la cible (le cadeau) avec des coordonnées x et y.
    - Tu dois fournir une liste d'obstacles (murs) avec leurs coordonnées x et y.
    - IMPORTANT : Il DOIT y avoir un chemin valide et possible entre (0, 0) et la cible. Ne bloque pas complètement le robot.
    - Ne place pas de mur sur (0, 0) ni sur la position de la cible.
    
    Difficulté selon le niveau :
    - CP (~6 ans) : Très facile. Cible proche (ex: x:2, y:2). Peu de murs (1 à 3 murs maximum). Chemin direct.
    - CM1 (~9-10 ans) : Moyen. Cible plus éloignée. Plus de murs (4 à 8 murs). Le chemin nécessite de tourner plusieurs fois.
    - 1ère Année Collège (~12-13 ans) : Difficile. Cible très éloignée. Beaucoup de murs (8 à 12 murs). Le labyrinthe ressemble à un vrai casse-tête avec des impasses.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.9,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          target: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.INTEGER, description: "Position X de la cible" },
              y: { type: Type.INTEGER, description: "Position Y de la cible" }
            },
            required: ["x", "y"]
          },
          walls: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER, description: "Position X du mur" },
                y: { type: Type.INTEGER, description: "Position Y du mur" }
              },
              required: ["x", "y"]
            },
            description: "Liste des coordonnées des murs"
          }
        },
        required: ["target", "walls"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
export const generatePolyglotWord = async (gradeLevel: string, exclude: string[] = []) => {
  const prompt = `
    Tu es un professeur de langues. Génère un mot pour le jeu "Le Polyglotte" pour un enfant de niveau ${gradeLevel}.
    - Fournis le mot en Français (fr), Anglais (en) et Arabe (ar).
    - Fournis 3 mauvaises options en Anglais et 3 mauvaises options en Arabe.
    - Les mauvaises options doivent être plausibles mais clairement différentes.
    
    ${exclude.length > 0 ? `IMPORTANT : Ne génère PAS les mots suivants (déjà vus) : ${exclude.join(', ')}.` : ''}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fr: { type: Type.STRING, description: "Le mot en Français" },
          en: { type: Type.STRING, description: "Le mot en Anglais" },
          ar: { type: Type.STRING, description: "Le mot en Arabe" },
          wrongEn: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 options incorrectes en Anglais"
          },
          wrongAr: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 options incorrectes en Arabe"
          }
        },
        required: ["fr", "en", "ar", "wrongEn", "wrongAr"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
