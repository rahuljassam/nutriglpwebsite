const THEME_KEY = "nutriglp-theme";

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initRevealAnimations();
    initSmoothScroll();
    initMobileMenu();
    initFaq();
    initNavbarScroll();
});

function initThemeToggle() {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    setTheme(savedTheme);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
            setTheme(nextTheme);
        });
    });
}

function setTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const text = button.querySelector(".theme-toggle-text");
        button.setAttribute("aria-pressed", String(isDark));
        button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        if (text) {
            text.textContent = isDark ? "Light mode" : "Dark mode";
        }
    });
}

function initRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");
    if (!revealElements.length) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const delay = Number(entry.target.dataset.delay || 0);
                window.setTimeout(() => entry.target.classList.add("visible"), delay);
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px",
        }
    );

    revealElements.forEach((element) => {
        const parent = element.parentElement;
        if (
            parent &&
            (parent.classList.contains("features-grid") ||
                parent.classList.contains("steps-grid") ||
                parent.classList.contains("faq-list"))
        ) {
            const siblings = Array.from(parent.children);
            const index = siblings.indexOf(element);
            element.dataset.delay = String(index * 80);
        }

        observer.observe(element);
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);
            if (!target) {
                return;
            }

            event.preventDefault();
            const top = target.getBoundingClientRect().top + window.scrollY - 110;
            window.scrollTo({ top, behavior: "smooth" });
            closeMobileMenu();
        });
    });
}

function initMobileMenu() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    if (!hamburger || !navLinks) {
        return;
    }

    hamburger.addEventListener("click", () => {
        const isActive = navLinks.classList.toggle("active");
        hamburger.classList.toggle("active", isActive);
        hamburger.setAttribute("aria-expanded", String(isActive));
        document.body.classList.toggle("menu-open", isActive);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => closeMobileMenu());
    });
}

function closeMobileMenu() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    if (!hamburger || !navLinks) {
        return;
    }

    navLinks.classList.remove("active");
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
}

function initFaq() {
    document.querySelectorAll(".faq-question").forEach((button) => {
        button.addEventListener("click", () => {
            const item = button.closest(".faq-item");
            if (!item) {
                return;
            }

            const isOpen = item.classList.contains("open");

            document.querySelectorAll(".faq-item.open").forEach((openItem) => {
                if (openItem === item) {
                    return;
                }

                openItem.classList.remove("open");
                const openButton = openItem.querySelector(".faq-question");
                const icon = openItem.querySelector(".faq-icon");
                if (openButton) {
                    openButton.setAttribute("aria-expanded", "false");
                }
                if (icon) {
                    icon.textContent = "+";
                }
            });

            item.classList.toggle("open", !isOpen);
            button.setAttribute("aria-expanded", String(!isOpen));
            const icon = item.querySelector(".faq-icon");
            if (icon) {
                icon.textContent = isOpen ? "+" : "-";
            }
        });
    });
}

function initNavbarScroll() {
    const navbar = document.getElementById("navbar");
    if (!navbar) {
        return;
    }

    const updateState = () => {
        navbar.classList.toggle("is-scrolled", window.scrollY > 18);
    };

    updateState();
    window.addEventListener("scroll", updateState, { passive: true });
}
