const THEME_KEY = "nutriglp-theme";
const BLOG_CONFIG = {
    owner: "rahuljassam",
    repo: "nutriglpwebsite",
    branch: "main",
    contentPath: "content/blog",
};

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initRevealAnimations();
    initSmoothScroll();
    initMobileMenu();
    initFaq();
    initNavbarScroll();
    renderHomeBlogCards();
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
                parent.classList.contains("faq-list") ||
                parent.classList.contains("blog-preview-grid"))
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

async function renderHomeBlogCards() {
    const container = document.getElementById("home-blog-grid");
    if (!container) {
        return;
    }

    try {
        const posts = await loadBlogPosts();
        const visiblePosts = posts.slice(0, 3);

        if (!visiblePosts.length) {
            container.innerHTML = `
                <article class="blog-card blog-card-placeholder">
                    <p>No blog posts are live yet. The first articles will appear here once they are published.</p>
                </article>
            `;
            return;
        }

        container.innerHTML = visiblePosts.map(renderHomeBlogCard).join("");
        container.querySelectorAll(".blog-card").forEach((card, index) => {
            card.classList.add("reveal");
            card.dataset.delay = String(index * 80);
            card.classList.add("visible");
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <article class="blog-card blog-card-placeholder">
                <p>The blog preview is temporarily unavailable. You can still visit the full blog section.</p>
            </article>
        `;
    }
}

function renderHomeBlogCard(post) {
    return `
        <article class="blog-card">
            <div class="blog-meta">
                <span>${escapeHtml(formatDate(post.publishedAt))}</span>
                <span>${escapeHtml(post.author)}</span>
            </div>
            <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.description)}</p>
            <a class="blog-card-link" href="blog/post.html?slug=${encodeURIComponent(post.slug)}">Read article</a>
        </article>
    `;
}

async function loadBlogPosts() {
    const apiUrl = `https://api.github.com/repos/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/contents/${BLOG_CONFIG.contentPath}?ref=${BLOG_CONFIG.branch}`;
    const response = await fetch(apiUrl, {
        headers: {
            Accept: "application/vnd.github+json",
        },
    });

    if (!response.ok) {
        throw new Error(`GitHub API request failed with ${response.status}`);
    }

    const entries = await response.json();
    const markdownFiles = entries.filter((entry) => entry.type === "file" && entry.name.endsWith(".md"));

    const posts = await Promise.all(
        markdownFiles.map(async (entry) => {
            const rawUrl =
                entry.download_url ||
                `https://raw.githubusercontent.com/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/${BLOG_CONFIG.branch}/${entry.path}`;
            const rawResponse = await fetch(rawUrl);

            if (!rawResponse.ok) {
                throw new Error(`Failed to load ${entry.name}`);
            }

            const raw = await rawResponse.text();
            const { frontMatter, body } = parseFrontMatter(raw);
            const slug = entry.name.replace(/\.md$/, "");

            return {
                slug,
                title: frontMatter.title || slugToTitle(slug),
                description: frontMatter.description || extractExcerpt(body),
                publishedAt: parsePostDate(frontMatter.date),
                author: frontMatter.author || "NutriGLP Team",
                draft: frontMatter.draft === true || frontMatter.draft === "true",
            };
        })
    );

    return posts
        .filter((post) => !post.draft)
        .sort((a, b) => b.publishedAt - a.publishedAt);
}

function parseFrontMatter(raw) {
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) {
        return {
            frontMatter: {},
            body: raw,
        };
    }

    const frontMatter = {};
    const lines = match[1].split("\n");
    let currentKey = null;

    lines.forEach((line) => {
        const listItemMatch = line.match(/^\s*-\s*(.+)$/);
        if (listItemMatch && currentKey) {
            if (!Array.isArray(frontMatter[currentKey])) {
                frontMatter[currentKey] = [];
            }
            frontMatter[currentKey].push(stripWrappingQuotes(listItemMatch[1].trim()));
            return;
        }

        const pairMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (!pairMatch) {
            return;
        }

        currentKey = pairMatch[1];
        const rawValue = pairMatch[2].trim();

        if (!rawValue) {
            frontMatter[currentKey] = [];
            return;
        }

        if (rawValue === "true" || rawValue === "false") {
            frontMatter[currentKey] = rawValue === "true";
            return;
        }

        frontMatter[currentKey] = stripWrappingQuotes(rawValue);
    });

    return {
        frontMatter,
        body: match[2].trim(),
    };
}

function stripWrappingQuotes(value) {
    return value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function parsePostDate(dateValue) {
    const parsed = Date.parse(dateValue || "");
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(timestamp) {
    if (!timestamp) {
        return "New post";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(timestamp));
}

function extractExcerpt(body) {
    return body
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*/g, "")
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean) || "Latest updates from NutriGLP.";
}

function slugToTitle(slug) {
    return slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
