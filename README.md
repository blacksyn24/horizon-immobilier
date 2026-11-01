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
Toutes les photos sont libres de droits.

**Photos prises au Bénin**
| Fichier | Sujet | Auteur | Licence |
|---|---|---|---|
| `bj-ouidah-cite.jpg` | Cité résidentielle à Ouidah | Ji-Elle (Wikimedia Commons) | CC BY-SA 4.0 |
| `bj-ouidah-parcelle.jpg` | Parcelle et villas à Ouidah | Ji-Elle (Wikimedia Commons) | CC BY-SA 4.0 |
| `bj-amazone.jpg` | Statue de l'Amazone, Cotonou | Yemi festus (Wikimedia Commons) | CC BY-SA 4.0 |
| `bj-avenue-steinmetz.jpg` | Avenue Steinmetz, Cotonou | Adoscam (Wikimedia Commons) | CC BY-SA 4.0 |
| `villa-piscine-ghana.jpg` | Villa avec piscine, sud du Ghana (photo d'illustration) | Remy Mboku (Wikimedia Commons) | CC BY 2.0 |
| `bj-plage-fidjrosse.jpg` | Plage de Fidjrossè, Cotonou | MyLady333 (Wikimedia Commons) | CC0 |
| `bj-voie-fidjrosse.jpg` | Voie de Fidjrossè, Cotonou | Jean-Baptiste Amagbegnon (Wikimedia Commons) | CC BY-SA 4.0 |
| `bj-calavi.jpg` | Vue d'Abomey-Calavi | Élisée.Adad (Wikimedia Commons) | CC BY-SA 4.0 |
| `cotonou.jpg` | Vue aérienne de Cotonou | Yanick Folly (Unsplash) | Licence Unsplash |
| `ganvie.jpg` | Ganvié, lac Nokoué | Iwaria (Pexels) | Licence Pexels |
| `cotonou-rue.jpg` | Rue de Cotonou | Vurzie Kim (Pexels) | Licence Pexels |
| `ouidah.jpg` | Ouidah vue du ciel | Adedoyin Aderomola (Pexels) | Licence Pexels |

**Autres photos** (villa de Haie Vive, intérieurs) : [Unsplash](https://unsplash.com), licence Unsplash.

Les fichiers Wikimedia Commons sont consultables sur https://commons.wikimedia.org (rechercher le titre de la photo).
