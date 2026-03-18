const BLOG_CONFIG = {
    owner: "rahuljassam",
    repo: "nutriglpwebsite",
    branch: "main",
    contentPath: "content/blog",
};

const THEME_KEY = "nutriglp-theme";

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();

    if (document.body.dataset.page === "index") {
        renderBlogIndex();
    }

    if (document.body.dataset.page === "post") {
        renderBlogPost();
    }
});

function initThemeToggle() {
    const savedTheme = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    setTheme(savedTheme);

    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) {
        return;
    }

    toggle.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
    });
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);

    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) {
        return;
    }

    const icon = toggle.querySelector(".theme-toggle__icon");
    const label = toggle.querySelector(".theme-toggle__label");
    const isDark = theme === "dark";

    toggle.setAttribute("aria-pressed", String(isDark));
    if (icon) {
        icon.textContent = isDark ? "☀" : "◐";
    }
    if (label) {
        label.textContent = isDark ? "Light mode" : "Dark mode";
    }
}

async function renderBlogIndex() {
    const status = document.getElementById("status");
    const featured = document.getElementById("featured-post");
    const grid = document.getElementById("post-grid");

    try {
        const posts = await loadPosts();
        if (!posts.length) {
            status.textContent = "No published posts yet.";
            featured.innerHTML = emptyStateMarkup("There are no published posts yet.");
            grid.innerHTML = "";
            return;
        }

        const [spotlight, ...rest] = posts;
        status.textContent = `${posts.length} published post${posts.length === 1 ? "" : "s"}.`;
        featured.innerHTML = renderFeaturedCard(spotlight);
        grid.innerHTML = rest.map(renderPostCard).join("");
    } catch (error) {
        console.error(error);
        status.textContent = "Could not load posts from GitHub.";
        featured.innerHTML = emptyStateMarkup("The blog is offline for now. Try again in a moment.");
        grid.innerHTML = "";
    }
}

async function renderBlogPost() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const titleEl = document.getElementById("post-title");
    const metaEl = document.getElementById("post-meta");
    const heroEl = document.getElementById("post-hero");
    const bodyEl = document.getElementById("post-body");
    const relatedEl = document.getElementById("related-grid");

    if (!slug) {
        titleEl.textContent = "Missing post";
        metaEl.innerHTML = `<span>Use a blog URL such as <code>?slug=welcome-to-nutriglp</code>.</span>`;
        bodyEl.innerHTML = emptyStateMarkup("No slug was provided in the URL.");
        relatedEl.innerHTML = "";
        return;
    }

    try {
        const posts = await loadPosts();
        const currentPost = posts.find((post) => post.slug === slug);

        if (!currentPost) {
            titleEl.textContent = "Post not found";
            metaEl.innerHTML = "";
            bodyEl.innerHTML = emptyStateMarkup("That post does not exist yet.");
            relatedEl.innerHTML = posts.slice(0, 3).map(renderPostCard).join("");
            return;
        }

        document.title = `${currentPost.title} | NutriGLP Journal`;
        updateMetaDescription(currentPost.description || currentPost.excerpt);

        titleEl.textContent = currentPost.title;
        metaEl.innerHTML = renderMeta(currentPost, false);
        heroEl.innerHTML = currentPost.featured_image
            ? `<img src="${currentPost.featured_image}" alt="${escapeHtml(currentPost.title)}">`
            : placeholderMarkup(currentPost.title);
        bodyEl.innerHTML = renderMarkdown(currentPost.body);

        const relatedPosts = posts.filter((post) => post.slug !== currentPost.slug).slice(0, 3);
        relatedEl.innerHTML = relatedPosts.length
            ? relatedPosts.map(renderPostCard).join("")
            : emptyStateMarkup("More posts will appear here once the owner publishes them.");
    } catch (error) {
        console.error(error);
        titleEl.textContent = "Unable to load this post";
        metaEl.innerHTML = "";
        bodyEl.innerHTML = emptyStateMarkup("The blog entry could not be loaded from GitHub.");
        relatedEl.innerHTML = "";
    }
}

async function loadPosts() {
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
            const rawUrl = entry.download_url || `https://raw.githubusercontent.com/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/${BLOG_CONFIG.branch}/${entry.path}`;
            const rawResponse = await fetch(rawUrl);
            if (!rawResponse.ok) {
                throw new Error(`Failed to load ${entry.name}`);
            }

            const raw = await rawResponse.text();
            const { frontMatter, body } = parseFrontMatter(raw);
            const slug = entry.name.replace(/\.md$/, "");
            const title = frontMatter.title || slugToTitle(slug);
            const description = frontMatter.description || extractExcerpt(body);
            const publishedAt = parsePostDate(frontMatter.date);
            const tags = normalizeTags(frontMatter.tags);
            const draft = Boolean(frontMatter.draft);

            return {
                slug,
                title,
                description,
                body,
                publishedAt,
                author: frontMatter.author || "NutriGLP Team",
                featured_image: frontMatter.featured_image || "",
                tags,
                draft,
                excerpt: description,
            };
        })
    );

    return posts
        .filter((post) => !post.draft)
        .sort((a, b) => b.publishedAt - a.publishedAt);
}

function renderFeaturedCard(post) {
    return `
        <article class="featured-card">
            <a class="featured-card__media" href="post.html?slug=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}">
                ${post.featured_image ? `<img src="${post.featured_image}" alt="${escapeHtml(post.title)}">` : placeholderMarkup(post.title)}
            </a>
            <div class="featured-card__content">
                ${renderMeta(post, true)}
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.description)}</p>
                ${renderTags(post.tags)}
                <a class="card-link" href="post.html?slug=${encodeURIComponent(post.slug)}">Read post <span aria-hidden="true">→</span></a>
            </div>
        </article>
    `;
}

function renderPostCard(post) {
    return `
        <article class="post-card">
            <a class="post-card__media" href="post.html?slug=${encodeURIComponent(post.slug)}" aria-label="${escapeHtml(post.title)}">
                ${post.featured_image ? `<img src="${post.featured_image}" alt="${escapeHtml(post.title)}">` : placeholderMarkup(post.title)}
            </a>
            <div class="post-card__content">
                ${renderMeta(post, false)}
                <h3><a href="post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
                <p>${escapeHtml(post.description)}</p>
                ${renderTags(post.tags)}
                <a class="card-link" href="post.html?slug=${encodeURIComponent(post.slug)}">Read post <span aria-hidden="true">→</span></a>
            </div>
        </article>
    `;
}

function renderMeta(post, featured) {
    const dateLabel = formatDate(post.publishedAt);
    const timeLabel = readingTime(post.body);
    const featuredLabel = featured ? `<span class="tag">Featured</span>` : "";

    return `
        <div class="post-meta">
            ${featuredLabel}
            <span>${escapeHtml(dateLabel)}</span>
            <span class="meta-dot">${escapeHtml(post.author)}</span>
            <span class="meta-dot">${escapeHtml(timeLabel)}</span>
        </div>
    `;
}

function renderTags(tags) {
    if (!tags.length) {
        return "";
    }

    return `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function renderMarkdown(source) {
    if (window.marked) {
        window.marked.setOptions({
            breaks: true,
            gfm: true,
        });
        return window.marked.parse(source);
    }

    return `<p>${escapeHtml(source).replace(/\n+/g, "<br>")}</p>`;
}

function parseFrontMatter(raw) {
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) {
        return {
            frontMatter: {},
            body: raw.trim(),
        };
    }

    return {
        frontMatter: parseYamlLite(match[1]),
        body: match[2].trim(),
    };
}

function parseYamlLite(input) {
    const data = {};
    let currentListKey = null;

    input.split("\n").forEach((line) => {
        if (!line.trim()) {
            return;
        }

        const listMatch = line.match(/^\s*-\s*(.*)$/);
        if (listMatch && currentListKey) {
            data[currentListKey].push(parseScalar(listMatch[1]));
            return;
        }

        const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!fieldMatch) {
            return;
        }

        const key = fieldMatch[1];
        const value = fieldMatch[2];
        currentListKey = null;

        if (value === "") {
            data[key] = [];
            currentListKey = key;
            return;
        }

        data[key] = parseScalar(value);
    });

    return data;
}

function parseScalar(value) {
    const trimmed = value.trim();

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        return trimmed
            .slice(1, -1)
            .split(",")
            .map((item) => parseScalar(item))
            .filter(Boolean);
    }

    return trimmed;
}

function normalizeTags(tags) {
    if (!tags) {
        return [];
    }

    if (Array.isArray(tags)) {
        return tags.map((tag) => String(tag)).filter(Boolean);
    }

    return String(tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
}

function extractExcerpt(body) {
    return body
        .replace(/^#+\s.+$/gm, "")
        .split(/\n{2,}/)
        .map((segment) => segment.trim())
        .find(Boolean)
        ?.replace(/\s+/g, " ")
        .slice(0, 160) || "A fresh post from the NutriGLP journal.";
}

function readingTime(body) {
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min read`;
}

function parsePostDate(value) {
    if (!value) {
        return new Date(0);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function slugToTitle(slug) {
    return slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function updateMetaDescription(description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
    }
    meta.content = description;
}

function emptyStateMarkup(message) {
    return `<div class="post-card" style="padding: 24px; min-height: 180px; justify-content: center;"><p>${escapeHtml(message)}</p></div>`;
}

function placeholderMarkup(title) {
    const safeTitle = escapeHtml(title);
    return `
        <div aria-hidden="true" style="width:100%;height:100%;display:grid;place-items:center;padding:28px;background:linear-gradient(135deg, rgba(15,118,110,0.16), rgba(15,23,42,0.04));">
            <span style="max-width:12ch;text-align:center;font-weight:800;line-height:1.1;color:var(--text);font-size:1.2rem;">${safeTitle}</span>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
