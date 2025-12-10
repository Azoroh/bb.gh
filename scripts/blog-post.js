import { blogPosts } from "./blog-data.js";

// Get blog post from URL
function getCurrentPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  if (!slug) {
    window.location.href = "blog.html";
    return null;
  }

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    window.location.href = "blog.html";
    return null;
  }

  return post;
}

// Format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Render blog post
function renderBlogPost(post) {
  // Update page title
  document.title = `${post.title} - Beyond Borders`;

  // Update post header
  document.getElementById("post-category").textContent = post.categoryLabel;
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = formatDate(post.date);
  document.getElementById("post-read-time").textContent = post.readTime;

  // Update featured image
  const postImage = document.getElementById("post-image");
  postImage.src = post.image;
  postImage.alt = post.title;

  // Update content
  document.getElementById("post-content").innerHTML = post.content;

  // Setup share buttons
  setupShareButtons(post);
}

// Setup share buttons
function setupShareButtons(post) {
  const currentUrl = window.location.href;
  const title = post.title;

  // WhatsApp
  const whatsappBtn = document.getElementById("share-whatsapp");
  whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(title + " - " + currentUrl)}`;

  // Twitter
  const twitterBtn = document.getElementById("share-twitter");
  twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;

  // Facebook
  const facebookBtn = document.getElementById("share-facebook");
  facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;

  // Copy link
  const copyBtn = document.getElementById("copy-link");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="ri-check-line"></i> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    });
  });
}

// Render related posts
function renderRelatedPosts(currentPost) {
  const relatedContainer = document.getElementById("related-posts");

  // Get posts from same category, excluding current post
  let relatedPosts = blogPosts
    .filter(
      (post) =>
        post.id !== currentPost.id && post.category === currentPost.category,
    )
    .slice(0, 3);

  // If not enough posts in same category, add others
  if (relatedPosts.length < 3) {
    const additionalPosts = blogPosts
      .filter(
        (post) => post.id !== currentPost.id && !relatedPosts.includes(post),
      )
      .slice(0, 3 - relatedPosts.length);
    relatedPosts = [...relatedPosts, ...additionalPosts];
  }

  if (relatedPosts.length === 0) {
    relatedContainer.parentElement.style.display = "none";
    return;
  }

  relatedContainer.innerHTML = relatedPosts
    .map(
      (post) => `
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
    `,
    )
    .join("");
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  const currentPost = getCurrentPost();

  if (currentPost) {
    renderBlogPost(currentPost);
    renderRelatedPosts(currentPost);
  }

  // Scroll to top
  window.scrollTo(0, 0);
});
