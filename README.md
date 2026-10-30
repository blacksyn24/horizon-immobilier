# Horizon Immobilier — Site vitrine

Projet hackathon XHTML & CSS : site de présentation de l'agence immobilière fictive **Horizon** (sujet n°2).

## Pages
- `index.html` : accueil (carrousel hero, chiffres clés, services, biens à la une, avis)
- `a-propos.html` : histoire, valeurs, équipe
- `services.html` : services en cartes Bootstrap, méthode, FAQ
- `biens.html` : biens à vendre / à louer avec filtre et fiche détaillée (galerie, caractéristiques, demande de visite)
- `contact.html` : formulaire validé en JS, envoyé par e-mail via `api/contact.js` (Resend) + coordonnées

## Technologies
HTML5, CSS3 (`css/style.css`), Bootstrap 5, JavaScript (`js/script.js`), fonction serverless Vercel (`api/chat.js`) pour le chatbot Gemini.

## Chatbot (bonus)
Le navigateur appelle `/api/chat` ; c'est la fonction serveur qui contacte Gemini avec la clé stockée dans la variable d'environnement `GEMINI_API_KEY`. La clé n'apparaît jamais dans le code côté client.

## Déploiement sur Vercel
1. Créer une clé gratuite sur https://aistudio.google.com/apikey
2. Importer le projet sur Vercel (ou `vercel` en ligne de commande)
3. Ajouter `GEMINI_API_KEY`, `RESEND_API_KEY` et `CONTACT_EMAIL` dans Settings > Environment Variables, puis redéployer

## Crédits images
Toutes les photos sont libres de droits :
- Photos du Bénin : vue aérienne de Cotonou (Yanick Folly, [Unsplash](https://unsplash.com)), Ganvié et lac Nokoué (Iwaria, [Pexels](https://www.pexels.com)), rue de Cotonou (Vurzie Kim, Pexels), Ouidah vue du ciel (Adedoyin Aderomola, Pexels).
- Biens, intérieurs et portraits de l'équipe : [Unsplash](https://unsplash.com).
