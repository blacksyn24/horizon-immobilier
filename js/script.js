/* ==========================================================
   HORIZON IMMOBILIER — Script principal
   Sommaire :
   1. Activation du mode JavaScript
   2. Navbar qui change au scroll + bouton retour en haut
   3. Apparition des éléments au scroll
   4. Compteurs animés (page d'accueil)
   5. Filtre des biens (page « Nos biens »)
   6. Validation du formulaire de contact
   7. Fermeture du menu mobile après un clic
   8. Chatbot « Hugo », l'assistant d'Horizon
   9. Données des biens immobiliers
   10. Fenêtre de détail d'un bien
   11. Formulaire pré-rempli depuis une fiche de bien
   ========================================================== */

/* ========== 1. ACTIVATION DU MODE JAVASCRIPT ========== */
// Permet au CSS de cacher les éléments .reveal uniquement si le JS fonctionne
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
    initNavbarScroll();
    initReveal();
    initCounters();
    initFilters();
    initContactForm();
    initMobileMenu();
    initChatbot();
    initBienDetails();
    initVisitRequest();
});

/* ========== 2. NAVBAR AU SCROLL + RETOUR EN HAUT ========== */
function initNavbarScroll() {
    const nav = document.getElementById("mainNav");

    // Création du bouton « retour en haut »
    const backToTop = document.createElement("button");
    backToTop.id = "backToTop";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Retour en haut de la page");
    backToTop.innerHTML = '<i class="bi bi-arrow-up"></i>';
    document.body.appendChild(backToTop);

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const onScroll = () => {
        const scrolled = window.scrollY > 60;
        nav.classList.toggle("scrolled", scrolled);
        backToTop.classList.toggle("show", window.scrollY > 500);
    };

    window.addEventListener("scroll", onScroll);
    onScroll(); // état correct si la page est rechargée en bas
}

/* ========== 3. APPARITION AU SCROLL ========== */
function initReveal() {
    const elements = document.querySelectorAll(".reveal");

    // IntersectionObserver : détecte quand un élément entre dans l'écran
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target); // animation jouée une seule fois
            }
        });
    }, { threshold: 0.15 });

    elements.forEach((el) => observer.observe(el));
}

/* ========== 4. COMPTEURS ANIMÉS ========== */
function initCounters() {
    const counters = document.querySelectorAll(".stat-number");
    if (counters.length === 0) return;

    const animate = (counter) => {
        const target = Number(counter.dataset.target);
        const duration = 1800; // en millisecondes
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            counter.textContent = Math.floor(progress * target).toLocaleString("fr-FR");
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animate(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach((c) => observer.observe(c));
}

/* ========== 5. FILTRE DES BIENS ========== */
function initFilters() {
    const buttons = document.querySelectorAll(".btn-filter");
    const items = document.querySelectorAll(".property-item");
    if (buttons.length === 0) return;

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            // Mise à jour du bouton actif
            buttons.forEach((b) => b.classList.remove("active"));
            button.classList.add("active");

            // Affiche uniquement les biens du type choisi
            const filter = button.dataset.filter;
            items.forEach((item) => {
                const match = filter === "tous" || item.dataset.type === filter;
                item.classList.toggle("hide", !match);
            });
        });
    });
}

/* ========== 6. VALIDATION DU FORMULAIRE DE CONTACT ========== */
function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const success = document.getElementById("formSuccess");
    const failure = document.getElementById("formError");
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn.innerHTML;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Règles de validation pour chaque champ
    const rules = {
        nom: (value) => value.trim().length >= 2,
        email: (value) => emailRegex.test(value.trim()),
        message: (value) => value.trim().length >= 10
    };

    // Vérifie un champ et affiche l'erreur Bootstrap si besoin
    const checkField = (field) => {
        const valid = rules[field.name](field.value);
        field.classList.toggle("is-invalid", !valid);
        field.classList.toggle("is-valid", valid);
        return valid;
    };

    // Validation en direct pendant la saisie
    Object.keys(rules).forEach((name) => {
        form.elements[name].addEventListener("input", (e) => checkField(e.target));
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        failure.classList.add("d-none");

        const allValid = Object.keys(rules)
            .map((name) => checkField(form.elements[name]))
            .every(Boolean);

        if (!allValid) {
            success.classList.add("d-none");
            form.querySelector(".is-invalid").focus();
            return;
        }

        // Bouton désactivé pendant l'envoi (évite les doubles clics)
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Envoi en cours...';

        try {
            // Envoi à NOTRE fonction serveur (api/contact.js), qui transmet l'e-mail
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            });
            if (!response.ok) throw new Error(`Erreur ${response.status}`);

            success.classList.remove("d-none");
            form.reset();
            form.querySelectorAll(".is-valid").forEach((f) => f.classList.remove("is-valid"));
        } catch (error) {
            success.classList.add("d-none");
            failure.classList.remove("d-none");
            console.error("Formulaire :", error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitLabel;
        }
    });
}

/* ========== 7. MENU MOBILE ========== */
function initMobileMenu() {
    const menu = document.getElementById("menu");
    if (!menu) return;

    // Referme le menu hamburger quand on clique sur un lien
    menu.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
            if (menu.classList.contains("show")) {
                bootstrap.Collapse.getOrCreateInstance(menu).hide();
            }
        });
    });
}

/* ========== 8. CHATBOT ========== */
function initChatbot() {
    // --- Création de l'interface (injectée sur toutes les pages) ---
    const toggle = document.createElement("button");
    toggle.className = "chat-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Ouvrir l'assistant Horizon");
    toggle.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';

    const chat = document.createElement("section");
    chat.className = "chat-window";
    chat.setAttribute("aria-label", "Assistant virtuel Horizon");
    chat.innerHTML = `
        <div class="chat-header">
            <div class="chat-avatar"><i class="bi bi-robot"></i></div>
            <div>
                <p><strong>Hugo</strong></p>
                <small><i class="bi bi-circle-fill"></i> En ligne</small>
            </div>
            <button type="button" class="chat-close" aria-label="Fermer"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="chat-messages" aria-live="polite"></div>
        <form class="chat-form">
            <input type="text" placeholder="Posez votre question..." aria-label="Votre message" maxlength="500" required>
            <button type="submit" aria-label="Envoyer"><i class="bi bi-send-fill"></i></button>
        </form>`;

    document.body.append(toggle, chat);

    const messages = chat.querySelector(".chat-messages");
    const form = chat.querySelector(".chat-form");
    const input = form.querySelector("input");

    // Historique de la conversation envoyé à l'API (pour garder le contexte)
    const history = [];

    // Ajoute une bulle de message dans la fenêtre
    const addMessage = (text, author) => {
        const bubble = document.createElement("div");
        bubble.className = `msg msg-${author}`;
        bubble.textContent = text; // textContent : évite toute injection HTML
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
        return bubble;
    };

    addMessage("Bonjour, je suis Hugo, l'assistant d'Horizon Immobilier ! 🏡\nComment puis-je vous aider dans votre projet ?", "bot");

    // Ouverture / fermeture
    const setOpen = (open) => {
        chat.classList.toggle("open", open);
        toggle.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-chat-dots-fill"></i>';
        if (open) input.focus();
    };
    toggle.addEventListener("click", () => setOpen(!chat.classList.contains("open")));
    chat.querySelector(".chat-close").addEventListener("click", () => setOpen(false));

    // Envoi d'un message
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "user");
        input.value = "";
        input.disabled = true;
        const typing = addMessage("Hugo écrit...", "bot msg-typing");

        try {
            // Appel de NOTRE fonction serveur (api/chat.js) : la clé API
            // reste cachée côté serveur, elle n'apparaît jamais ici.
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erreur serveur");

            typing.remove();
            addMessage(data.reply, "bot");

            // Mémorise l'échange pour les prochaines questions
            history.push({ role: "user", text }, { role: "model", text: data.reply });
        } catch (error) {
            typing.remove();
            addMessage("Désolé, je rencontre un petit souci technique. Vous pouvez nous joindre au +229 01 00 11 22 33.", "bot");
            console.error("Chatbot :", error);
        } finally {
            input.disabled = false;
            input.focus();
        }
    });
}

/* ========== 9. DONNÉES DES BIENS IMMOBILIERS ========== */
// Chaque bien est identifié par la valeur de l'attribut data-bien de sa carte
const BIENS = {
    "villa-haie-vive": {
        ref: "HZ-V001",
        titre: "Villa contemporaine avec piscine",
        statut: "À vendre",
        prix: "350 000 000 FCFA",
        lieu: "Haie Vive, Cotonou",
        photos: [
            { src: "img/bien3.jpg", alt: "Façade de la villa et sa piscine" },
            { src: "img/det-salon2.jpg", alt: "Grand salon moderne et lumineux" },
            { src: "img/det-cuisine1.jpg", alt: "Cuisine équipée" },
            { src: "img/det-sdb.jpg", alt: "Salle de bain" }
        ],
        description: "Superbe villa d'architecte dans le quartier prisé de Haie Vive, à deux pas des restaurants et des ambassades. Grandes baies vitrées, piscine à débordement et finitions haut de gamme. Idéale pour une famille ou un investissement locatif de standing.",
        caracteristiques: [
            ["Type", "Villa duplex"],
            ["Chambres", "5 (dont 3 avec salle d'eau)"],
            ["Superficie du terrain", "600 m²"],
            ["Surface habitable", "380 m²"],
            ["Situation foncière", "Titre foncier"],
            ["Disponibilité", "Immédiate"]
        ],
        equipements: ["Piscine", "Groupe électrogène", "Forage et château d'eau", "Climatisation dans toutes les chambres", "Garage 2 voitures", "Dépendance pour gardien"]
    },
    "appart-fidjrosse": {
        ref: "HZ-L002",
        titre: "Appartement 3 chambres",
        statut: "À louer",
        prix: "350 000 FCFA / mois",
        lieu: "Fidjrossè, Cotonou",
        photos: [
            { src: "img/bien2.jpg", alt: "Séjour de l'appartement" },
            { src: "img/det-cuisine2.jpg", alt: "Cuisine moderne" },
            { src: "img/det-chambre1.jpg", alt: "Chambre principale" },
            { src: "img/bj-voie-fidjrosse.jpg", alt: "La voie de Fidjrossè, à proximité" }
        ],
        description: "Appartement neuf au 2e étage d'une résidence calme et sécurisée, à 5 minutes de la plage de Fidjrossè. Séjour lumineux, cuisine équipée et balcon. Parfait pour une famille ou des professionnels.",
        caracteristiques: [
            ["Type", "Appartement"],
            ["Chambres", "3 (dont 1 avec salle d'eau)"],
            ["Surface", "140 m²"],
            ["Étage", "2e sur 3"],
            ["Conditions", "Caution + 3 mois d'avance"],
            ["Disponibilité", "1er décembre"]
        ],
        equipements: ["Parking sécurisé", "Gardien 24 h/24", "Compteurs SBEE et SONEB individuels", "Climatisation", "Balcon"]
    },
    "villa-togbin": {
        ref: "HZ-V003",
        titre: "Villa basse 4 chambres",
        statut: "À vendre",
        prix: "85 000 000 FCFA",
        lieu: "Cité résidentielle, Ouidah",
        photos: [
            { src: "img/bj-ouidah-cite.jpg", alt: "Les villas de la cité résidentielle" },
            { src: "img/det-salon1.jpg", alt: "Salon spacieux" },
            { src: "img/det-cuisine1.jpg", alt: "Cuisine" }
        ],
        description: "Villa de plain-pied dans une cité résidentielle calme de Ouidah, à 40 minutes de Cotonou. Construction récente et solide, toiture en tuiles, grande cour et espace pour agrandir. Documents fonciers vérifiés par notre équipe.",
        caracteristiques: [
            ["Type", "Villa basse (plain-pied)"],
            ["Chambres", "4"],
            ["Superficie du terrain", "400 m²"],
            ["Surface habitable", "180 m²"],
            ["Situation foncière", "Titre foncier"],
            ["Accès", "À 40 min de Cotonou"]
        ],
        equipements: ["Parcelle clôturée", "Portail automatique", "Forage", "Cour pavée", "Dépendance"]
    },
    "duplex-fidjrosse-plage": {
        ref: "HZ-L004",
        titre: "Villa duplex meublée vue mer",
        statut: "À louer",
        prix: "1 200 000 FCFA / mois",
        lieu: "Fidjrossè Plage, Cotonou",
        photos: [
            { src: "img/bj-maison-cotonou.jpg", alt: "La villa et ses balcons" },
            { src: "img/bj-plage-fidjrosse.jpg", alt: "La plage de Fidjrossè, à deux minutes" },
            { src: "img/det-chambre2.jpg", alt: "Chambre meublée" },
            { src: "img/det-piscine.jpg", alt: "Terrasse et piscine" }
        ],
        description: "Villa à étage entièrement meublée, à deux minutes de la plage de Fidjrossè. Piscine, grande terrasse et jardin tropical. Idéale pour une famille expatriée, un diplomate ou une location de standing.",
        caracteristiques: [
            ["Type", "Villa duplex meublée"],
            ["Chambres", "6"],
            ["Superficie du terrain", "500 m²"],
            ["Ameublement", "Entièrement meublée"],
            ["Conditions", "Caution + 3 mois d'avance"],
            ["Disponibilité", "Immédiate"]
        ],
        equipements: ["Piscine", "Vue mer", "Groupe électrogène", "Internet fibre", "Climatisation", "Gardien et jardinier"]
    },
    "parcelle-pahou": {
        ref: "HZ-T005",
        titre: "Parcelle de 500 m²",
        statut: "À vendre",
        prix: "15 000 000 FCFA",
        lieu: "Pahou, Ouidah",
        photos: [
            { src: "img/bj-ouidah-parcelle.jpg", alt: "La parcelle et les villas voisines" },
            { src: "img/ouidah.jpg", alt: "Vue aérienne de la zone de Ouidah" }
        ],
        description: "Parcelle plate et sèche dans une cité résidentielle déjà construite de Ouidah, en bordure de goudron. Idéale pour construire une maison familiale ou réaliser un investissement. Le titre foncier a été vérifié auprès de l'ANDF.",
        caracteristiques: [
            ["Type", "Terrain constructible"],
            ["Superficie", "500 m²"],
            ["Situation foncière", "Titre foncier"],
            ["Accès", "Bord goudron"],
            ["Viabilisation", "Électricité à proximité"],
            ["Prix au m²", "30 000 FCFA"]
        ],
        equipements: ["Terrain plat et non inondable", "Bornage effectué", "Quartier calme", "À 15 min de Ouidah centre"]
    },
    "studio-cadjehoun": {
        ref: "HZ-L006",
        titre: "Studio meublé",
        statut: "À louer",
        prix: "150 000 FCFA / mois",
        lieu: "Cadjèhoun, Cotonou",
        photos: [
            { src: "img/hero3.jpg", alt: "Pièce de vie du studio" },
            { src: "img/det-salon3.jpg", alt: "Coin salon" },
            { src: "img/det-sdb.jpg", alt: "Salle d'eau" }
        ],
        description: "Studio moderne et entièrement meublé, proche de l'aéroport et des commerces de Cadjèhoun. Parfait pour un étudiant, un jeune actif ou un séjour professionnel.",
        caracteristiques: [
            ["Type", "Studio meublé"],
            ["Chambres", "1"],
            ["Surface", "35 m²"],
            ["Ameublement", "Entièrement meublé"],
            ["Conditions", "Caution + 2 mois d'avance"],
            ["Disponibilité", "Immédiate"]
        ],
        equipements: ["Climatisation", "Internet Wi-Fi", "Cuisine équipée", "Eau chaude", "Gardien"]
    }
};

/* ========== 10. FENÊTRE DE DÉTAIL D'UN BIEN ========== */
function initBienDetails() {
    const modalEl = document.getElementById("bienModal");
    if (!modalEl) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const el = (id) => document.getElementById(id);

    // Crée un élément HTML avec du texte (textContent : pas d'injection possible)
    const create = (tag, text, className) => {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
    };

    const ouvrir = (id) => {
        const bien = BIENS[id];
        if (!bien) return;

        el("bienModalRef").textContent = `${bien.statut} · Réf. ${bien.ref}`;
        el("bienModalTitle").textContent = bien.titre;
        el("bienPrix").textContent = bien.prix;
        el("bienLieu").textContent = bien.lieu;
        el("bienDescription").textContent = bien.description;

        // Galerie : une diapositive par photo
        const photos = el("bienPhotos");
        photos.replaceChildren(...bien.photos.map((photo, i) => {
            const slide = create("div", "", i === 0 ? "carousel-item active" : "carousel-item");
            const img = create("img", "", "d-block w-100");
            img.src = photo.src;
            img.alt = photo.alt;
            slide.appendChild(img);
            return slide;
        }));
        bootstrap.Carousel.getOrCreateInstance(el("bienCarousel")).to(0);

        // Caractéristiques sous forme de liste de définitions
        el("bienCaracteristiques").replaceChildren(...bien.caracteristiques.flatMap(([label, valeur]) => [
            create("dt", label),
            create("dd", valeur)
        ]));

        // Équipements avec une icône de validation
        el("bienEquipements").replaceChildren(...bien.equipements.map((equipement) => {
            const li = create("li");
            li.appendChild(create("i", "", "bi bi-check-circle-fill"));
            li.append(" " + equipement);
            return li;
        }));

        // Le bouton « Demander une visite » transmet la référence à la page contact
        el("bienVisite").href = `contact.html?bien=${encodeURIComponent(id)}`;

        modal.show();
    };

    document.querySelectorAll(".btn-details").forEach((button) => {
        button.addEventListener("click", () => ouvrir(button.dataset.bien));
    });
}

/* ========== 11. FORMULAIRE PRÉ-REMPLI DEPUIS UNE FICHE ========== */
function initVisitRequest() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    // Exemple d'adresse : contact.html?bien=villa-haie-vive
    const id = new URLSearchParams(window.location.search).get("bien");
    const bien = BIENS[id];
    if (!bien) return; // référence inconnue : on ne pré-remplit rien

    form.elements.sujet.value = bien.statut === "À louer" ? "location" : "achat";
    form.elements.message.value =
        `Bonjour, je souhaite organiser une visite du bien « ${bien.titre} » ` +
        `(réf. ${bien.ref}, ${bien.lieu}). Merci de me recontacter.`;
}
