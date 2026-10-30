/* ==========================================================
   HORIZON IMMOBILIER — Fonction serveur du formulaire de contact (Vercel)
   Rôle : vérifier le message reçu puis l'envoyer par e-mail à l'agence
   grâce au service Resend. La clé API (RESEND_API_KEY) et l'adresse
   de réception (CONTACT_EMAIL) sont des variables d'environnement Vercel :
   elles ne sont JAMAIS visibles dans le navigateur.
   ========================================================== */

// Libellés lisibles pour l'objet de la demande
const SUJETS = {
    achat: "Achat",
    vente: "Vente",
    location: "Location",
    estimation: "Estimation gratuite",
    foncier: "Vérification foncière",
    diaspora: "Client de la diaspora",
    autre: "Autre demande"
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const destinataire = process.env.CONTACT_EMAIL;
    if (!apiKey || !destinataire) {
        return res.status(500).json({ error: "Envoi d'e-mail non configuré sur le serveur" });
    }

    const { nom = "", email = "", sujet = "autre", message = "", website = "" } = req.body || {};

    // Champ piège invisible : un humain le laisse vide, un robot le remplit
    if (website) {
        return res.status(200).json({ ok: true });
    }

    // Même vérification que dans le navigateur (on ne fait jamais confiance au client)
    if (typeof nom !== "string" || nom.trim().length < 2 || nom.length > 100 ||
        typeof email !== "string" || !EMAIL_REGEX.test(email.trim()) || email.length > 150 ||
        typeof message !== "string" || message.trim().length < 10 || message.length > 3000) {
        return res.status(400).json({ error: "Formulaire invalide" });
    }

    const libelleSujet = SUJETS[sujet] || SUJETS.autre;

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}` // clé envoyée uniquement de serveur à serveur
            },
            body: JSON.stringify({
                from: "Site Horizon Immobilier <onboarding@resend.dev>",
                to: [destinataire],
                reply_to: email.trim(), // « Répondre » écrit directement au visiteur
                subject: `[Horizon] ${libelleSujet} — message de ${nom.trim()}`,
                // Texte brut uniquement : aucun HTML du visiteur n'est interprété
                text:
                    `Nouveau message depuis le site Horizon Immobilier\n\n` +
                    `Nom : ${nom.trim()}\n` +
                    `E-mail : ${email.trim()}\n` +
                    `Objet : ${libelleSujet}\n\n` +
                    `Message :\n${message.trim()}\n`
            }),
            signal: AbortSignal.timeout(15000) // abandon après 15 secondes
        });

        if (!response.ok) {
            console.error("Erreur Resend :", await response.text());
            return res.status(502).json({ error: "Le service d'envoi est indisponible" });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur interne" });
    }
}
