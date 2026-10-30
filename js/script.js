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

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const allValid = Object.keys(rules)
            .map((name) => checkField(form.elements[name]))
            .every(Boolean);

        if (!allValid) {
            success.classList.add("d-none");
            form.querySelector(".is-invalid").focus();
            return;
        }

        // Site vitrine : pas de serveur d'envoi, on simule la réussite
        success.classList.remove("d-none");
        form.reset();
        form.querySelectorAll(".is-valid").forEach((f) => f.classList.remove("is-valid"));
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
