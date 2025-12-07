import { blogPosts } from './blog-data.js'


// Initialize navigation
function initializeNavigation() {
    // const navMenu = document.getElementById("nav-menu");
    // const navToggle = document.getElementById("nav-toggle");
    // const navClose = document.getElementById("nav-close");
    // const navLinks = document.querySelectorAll(".nav_link");

    // if (navToggle) {
    //     navToggle.addEventListener("click", () => {
    //         navMenu.classList.add("show-menu");
    //     });
    // }

    // if (navClose) {
    //     navClose.addEventListener("click", () => {
    //         navMenu.classList.remove("show-menu");
    //     });
    // }

    // navLinks.forEach((n) => n.addEventListener("click", () => {
    //     navMenu.classList.remove("show-menu");
    // }));
}

// Render blog posts
function renderBlogPosts(posts = blogPosts, category = 'all') {
    const blogGrid = document.getElementById('blog-grid');
    const comingSoon = document.getElementById('coming-soon');

    // Filter posts by category
    const filteredPosts = category === 'all'
        ? posts
        : posts.filter(post => post.category === category);

    // Show/hide coming soon message
    if (filteredPosts.length === 0) {
        blogGrid.innerHTML = '';
        comingSoon.classList.add('show');
        return;
    }

    comingSoon.classList.remove('show');

    // Render posts
    blogGrid.innerHTML = filteredPosts.map(post => `
    <article class="blog-card" onclick="window.location.href='blog-post.html?slug=${post.slug}'">
      <div class="blog-card-image">
        <img src="${post.image}" alt="${post.title}" loading="lazy">
      </div>
      <div class="blog-card-content">
        <div class="post-meta">
          <span class="post-category">${post.categoryLabel}</span>
          <span class="post-date"><i class="ri-calendar-line"></i> ${formatDate(post.date)}</span>
        </div>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <a href="blog-post.html?slug=${post.slug}" class="read-more">
          Read More <i class="ri-arrow-right-line"></i>
        </a>
      </div>
    </article>
  `).join('');
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Render featured post
function renderFeaturedPost() {
    const featuredSection = document.getElementById('featured-section');
    const featuredContainer = document.getElementById('featured-post');

    // Find the featured post
    const featuredPost = blogPosts.find(post => post.featured === true);

    // If no featured post, hide the section
    if (!featuredPost) {
        featuredSection.style.display = 'none';
        return;
    }

    // Show the section
    featuredSection.style.display = 'block';

    // Render featured post
    featuredContainer.innerHTML = `
        <div class="featured-post-image">
            <img src="${featuredPost.image}" alt="${featuredPost.title}" loading="lazy">
            <span class="featured-badge">Featured</span>
        </div>
        <div class="featured-post-content">
            <div class="post-meta">
                <span class="post-category">${featuredPost.categoryLabel}</span>
                <span class="post-date"><i class="ri-calendar-line"></i> ${formatDate(featuredPost.date)}</span>
                <span class="post-read-time"><i class="ri-time-line"></i> ${featuredPost.readTime}</span>
            </div>
            <h2>${featuredPost.title}</h2>
            <p>${featuredPost.excerpt}</p>
            <a href="blog-post.html?slug=${featuredPost.slug}" class="button">
                Read Story <i class="ri-arrow-right-line"></i>
            </a>
        </div>
    `;
}

// Category filter functionality
function initializeCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter posts
            const category = button.dataset.category;
            renderBlogPosts(blogPosts, category);
        });
    });
}

// Newsletter form handler
function initializeNewsletterForm() {
    const form = document.getElementById('newsletter-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = form.querySelector('input[type="email"]').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;

            // Here you can add your newsletter subscription logic
            // For now, we'll simulate with a timeout
            await new Promise(resolve => setTimeout(resolve, 1000));

            showToast('Successfully subscribed! Check your email for confirmation.', true);
            form.reset();
        } catch (error) {
            showToast('Something went wrong. Please try again.', false);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Toast notification
function showToast(message, success = true) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: success ? '#2ecc71' : '#e74c3c',
        color: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '9999',
        maxWidth: '300px'
    });

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // initializeNavigation();
    renderFeaturedPost()
    renderBlogPosts();
    initializeCategoryFilters();
    initializeNewsletterForm();

    // Show coming soon if no posts
    if (blogPosts.length === 0) {
        document.getElementById('coming-soon').classList.add('show');
    }
});