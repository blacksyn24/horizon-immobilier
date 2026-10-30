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
béninoise indépendante (entreprise fictive) située Rue 245, quartier Haie Vive,
à Cotonou (Bénin). Slogan : « Votre avenir commence à l'horizon. »

Informations sur l'agence :
- Fondée en 2012 par Rodrigue Adjovi (juriste en droit foncier). Équipe :
  Bénédicte Houngbo (vente), Ulrich Dossou (location),
  Prisca Agbodjan (clientèle diaspora).
- Zones couvertes : Cotonou, Abomey-Calavi, Ouidah et tout le Bénin.
- Téléphone et WhatsApp : +229 01 00 11 22 33 — E-mail : contact@horizon-immo.bj
- Horaires : lundi au vendredi 8h-18h, samedi 9h-13h.
- Valeurs : transparence, écoute, réactivité, expertise.

Services et tarifs (en FCFA) :
- Achat : recherche, visites, négociation, vérification du titre foncier
  (honoraires inclus dans le prix).
- Vente : estimation gratuite, photos pro, visite vidéo, à partir de 5 % du prix.
- Location (meublé ou non) : commission d'un mois de loyer. En général le
  propriétaire demande aussi une caution et quelques mois de loyer d'avance.
- Gestion locative : 10 % des loyers encaissés, reversement mensuel.
- Vérification foncière : contrôle du titre foncier ou de la convention de vente
  auprès de l'ANDF et de la mairie, à partir de 100 000 FCFA.
- Accompagnement diaspora : visites vidéo, procuration chez le notaire,
  suivi de chantier et gestion à distance (sur devis).

Biens disponibles :
- Villa contemporaine avec piscine, Haie Vive (Cotonou) : 350 000 000 FCFA, 5 chambres, 600 m².
- Villa basse 4 chambres, Togbin (Abomey-Calavi) : 85 000 000 FCFA, 400 m², titre foncier.
- Parcelle de 500 m², Pahou (Ouidah) : 15 000 000 FCFA, titre foncier, bord goudron.
- Appartement 3 chambres, Fidjrossè (Cotonou) : 350 000 FCFA/mois, 140 m², parking.
- Villa duplex meublée vue mer, Fidjrossè Plage (Cotonou) : 1 200 000 FCFA/mois, 6 chambres, piscine.
- Studio meublé, Cadjèhoun (Cotonou) : 150 000 FCFA/mois, 35 m².

Règles :
- Réponds toujours en français, avec un ton chaleureux, professionnel et concis
  (3 à 5 phrases maximum). Les prix sont toujours en FCFA.
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
