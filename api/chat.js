/* ==========================================================
   HORIZON IMMOBILIER — Fonction serveur du chatbot (Vercel)
   Rôle : recevoir la question du visiteur, ajouter le contexte
   de l'entreprise, interroger l'API Gemini et renvoyer la réponse.
   La clé API est lue dans une variable d'environnement Vercel
   (GEMINI_API_KEY) : elle n'est JAMAIS envoyée au navigateur.
   ========================================================== */

// Contexte transmis à l'IA : présentation, services, ton de l'agence
const CONTEXTE_ENTREPRISE = `
Tu es Hugo, l'assistant virtuel d'Horizon Immobilier, une agence immobilière
indépendante (entreprise fictive) située 18 boulevard de l'Horizon, à Belle-Rive.
Slogan : « Votre avenir commence à l'horizon. »

Informations sur l'agence :
- Fondée en 2009 par Karim Benali (ancien notaire). Équipe : Léa Martin (vente),
  Thomas Roche (location), Emma Girard (gestion de patrimoine).
- Téléphone : 01 23 45 67 89 — E-mail : contact@horizon-immo.fr
- Horaires : lundi au vendredi 9h-19h, samedi 9h-13h.
- Valeurs : transparence, écoute, réactivité, expertise.

Services et tarifs :
- Achat : recherche, visites, négociation (honoraires inclus dans le prix).
- Vente : photos pro, visite virtuelle 360°, à partir de 4 % du prix de vente.
- Location : sélection des locataires, bail, état des lieux (1 mois de loyer HC).
- Gestion locative : 6 % des loyers encaissés, garantie loyers impayés.
- Estimation gratuite et sans engagement, avis de valeur sous 48 h.
- Conseil en investissement : sur devis.

Biens disponibles :
- Villa contemporaine, Quartier des Dunes : 685 000 €, 6 pièces, 210 m², piscine.
- Maison avec piscine, Bord de mer : 540 000 €, 5 pièces, 170 m².
- Maison familiale, Les Collines : 398 000 €, 5 pièces, 145 m², jardin.
- Appartement T3, Centre-ville : 950 €/mois, 68 m², parking.
- Chalet en bois, Forêt des Pins : 1 650 €/mois, 4 pièces, 120 m², cheminée.
- Studio meublé, Quartier universitaire : 580 €/mois, 28 m².

Règles :
- Réponds toujours en français, avec un ton chaleureux, professionnel et concis
  (3 à 5 phrases maximum).
- Ne parle que de l'agence et de l'immobilier. Si la question est hors sujet,
  ramène poliment la conversation vers les services d'Horizon.
- N'invente jamais de bien, de prix ou d'information absents de ce contexte :
  propose plutôt de contacter un conseiller ou de remplir le formulaire de contact.
`;

// Modèle rapide : répond en 2-3 secondes (les modèles « flash » complets sont trop lents ici)
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

// Temps maximum d'attente de la réponse de Gemini (en millisecondes)
const TIMEOUT_MS = 20000;

export default async function handler(req, res) {
    // Seules les requêtes POST sont acceptées
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Clé API non configurée sur le serveur" });
    }

    const { message, history = [] } = req.body || {};

    // Vérification des données reçues
    if (typeof message !== "string" || message.trim() === "" || message.length > 500) {
        return res.status(400).json({ error: "Message invalide" });
    }

    // Conversion de l'historique au format Gemini (10 derniers échanges max)
    const contents = history
        .filter((m) => (m.role === "user" || m.role === "model") && typeof m.text === "string")
        .slice(-10)
        .map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, 1000) }] }));

    contents.push({ role: "user", parts: [{ text: message }] });

    // Annule la requête si Gemini met trop de temps à répondre
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Requête vers Gemini (fonction réutilisée pour pouvoir réessayer)
    const appelGemini = () => fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey // clé envoyée uniquement de serveur à serveur
            },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: CONTEXTE_ENTREPRISE }] },
                contents,
                generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
            }),
            signal: controller.signal
        }
    );

    try {
        let response = await appelGemini();

        // Gemini est parfois surchargé (erreur 429 ou 5xx) : on réessaie une fois
        if (response.status === 429 || response.status >= 500) {
            response = await appelGemini();
        }

        const data = await response.json();

        if (!response.ok) {
            console.error("Erreur Gemini :", data);
            return res.status(502).json({ error: "Le service IA est indisponible" });
        }

        // On garde uniquement le texte de la réponse (pas les « pensées » du modèle)
        const reply = data.candidates?.[0]?.content?.parts
            ?.filter((p) => p.text && !p.thought)
            .map((p) => p.text)
            .join("")
            || "Je n'ai pas bien compris, pouvez-vous reformuler ?";

        return res.status(200).json({ reply });
    } catch (error) {
        if (error.name === "AbortError") {
            return res.status(504).json({ error: "Le service IA met trop de temps à répondre" });
        }
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur interne" });
    } finally {
        clearTimeout(timer);
    }
}
