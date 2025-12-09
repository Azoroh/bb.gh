import { packages, addons, destinations } from "./data.js";
import { modalContent } from './modal-content.js';

let itiInstance = null;
let modalItiInstance = null;
let container = null;
let dotsContainer = null;
let phoneLibraryLoaded = false;

// ============================================
// LAZY LOAD FIREBASE (Only when form submitted)
// ============================================
async function saveToDashboard(formData) {
  try {
    const { db } = await import('./firebase-config.js');
    const { collection, addDoc, serverTimestamp } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const booking = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      phoneCountry: formData.phoneCountry || '',
      phoneCountryCode: formData.phoneCountryCode || '',
      phoneLocalNumber: formData.phoneLocalNumber || '',
      packageName: formData['destination-dropdown'] || formData.packageName,
      startDate: formData['start-date'] || formData.startDate,
      endDate: formData['end-date'] || formData.endDate,
      travelers: parseInt(formData.travelers),
      addon: formData['add-on-dropdown'] || formData.addon || 'None',
      message: formData.message || '',
      status: 'pending',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'bookings'), booking);
    console.log('✅ Booking saved to Firebase');
  } catch (err) {
    console.error('❌ Error saving to Firebase:', err);
  }
}

// ============================================
// LAZY LOAD PHONE INPUT LIBRARY
// ============================================
async function loadPhoneLibrary() {
  if (phoneLibraryLoaded) return;
  phoneLibraryLoaded = true;

  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/css/intlTelInput.css';
  document.head.appendChild(cssLink);

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/js/intlTelInput.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initializePhoneInput(phoneInput) {
  if (!phoneInput || !window.intlTelInput) return null;

  return window.intlTelInput(phoneInput, {
    initialCountry: "auto",
    geoIpLookup: callback => {
      fetch("https://ipapi.co/json")
        .then(res => res.json())
        .then(data => callback(data.country_code))
        .catch(() => callback("gh"));
    },
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/js/utils.js",
    separateDialCode: true,
    preferredCountries: ["gh", "ng", "us", "gb"],
    autoPlaceholder: "polite",
    strictMode: false,
    formatOnDisplay: true
  });
}

// ============================================
// PACKAGE CARDS - OPTIMIZED
// ============================================
function renderPackageCards() {
  container = document.querySelector('.packages_container');
  dotsContainer = document.querySelector('.indicator_dots');
  if (!container || !dotsContainer) return;

  packages.forEach((pkg, i) => {
    const card = document.createElement('div');
    card.classList.add('package_card');
    card.innerHTML = `
      <div class="package_image">
        <img src="${pkg.img}" loading="lazy" alt="${pkg.title}">
      </div>
      <div class="package_info">
        <div class="package_header">
          <div>
            <h3>${pkg.title}</h3>
            <p class="package_meta">${pkg.duration} | ${pkg.location}</p>
          </div>
        </div>
        <p class="package_description">${pkg.summary}</p>
        <div class="package_action">
          <button class="button primary view-details-btn" data-package-id="${pkg.id}">View Details</button>
          <button class="button secondary plan-trip-btn" data-package-id="${pkg.id}">Plan Trip</button>
        </div>
      </div>
    `;
    container.appendChild(card);

    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  });

  initializePackageScroll();
}

function initializePackageScroll() {
  const cards = document.querySelectorAll('.package_card');
  const dots = document.querySelectorAll('.dot');
  if (!cards.length || !dots.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(cards).indexOf(entry.target);
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
      }
    });
  }, { threshold: 0.6, root: container });

  cards.forEach(card => observer.observe(card));
}

function initializeNavigation() {
  const navMenu = document.getElementById("nav-menu");
  const navToggle = document.getElementById("nav-toggle");
  const navClose = document.getElementById("nav-close");
  const navLinks = document.querySelectorAll(".nav_link");

  if (navToggle) navToggle.addEventListener("click", () => navMenu.classList.add("show-menu"));
  if (navClose) navClose.addEventListener("click", () => navMenu.classList.remove("show-menu"));
  navLinks.forEach(n => n.addEventListener("click", () => navMenu.classList.remove("show-menu")));
}

function initializeVideo() {
  const video = document.querySelector('.video-container video');
  if (!video) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (video.readyState === 0) video.load();
        video.play().catch(err => console.log('Video autoplay failed:', err));
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5, rootMargin: '100px' });

  observer.observe(video);
}

function initializeSwiperAndHeader() {
  if (document.querySelector(".home_swiper")) {
    new Swiper(".home_swiper", {
      loop: true,
      slidesPerView: "auto",
      grabCursor: true,
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      autoplay: { delay: 2000, disableOnInteraction: false }
    });
  }

  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('bg-header', window.scrollY >= 50);
    }, { passive: true });
  }

  if (document.querySelector(".testimonial_swiper")) {
    new Swiper(".testimonial_swiper", {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 48,
      grabCursor: true,
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      autoplay: { delay: 5000, disableOnInteraction: false, reverseDirection: true },
      speed: 500
    });
  }
}

function renderDestinationDropdown() {
  const dropdown = document.getElementById('destination-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a Destination';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  dropdown.appendChild(defaultOption);

  destinations.forEach(dest => {
    const option = document.createElement('option');
    option.value = dest.value;
    option.textContent = dest.label + (!dest.available ? ' (Coming Soon)' : '');
    option.disabled = !dest.available;
    dropdown.appendChild(option);
  });
}

function renderAddons() {
  const addonBody = document.querySelector('.add-on_body');
  if (addonBody) {
    addons.forEach(addon => {
      const div = document.createElement('div');
      div.classList.add('add-on_option');
      div.id = addon.id;
      div.innerHTML = `<p>${addon.label}</p>`;
      addonBody.appendChild(div);
    });
  }

  const addonDropdown = document.querySelector('#add-on-dropdown');
  if (addonDropdown) {
    const defaultAddon = document.createElement('option');
    defaultAddon.textContent = 'Add-on (Optional)';
    defaultAddon.value = '';
    defaultAddon.disabled = true;
    defaultAddon.selected = true;
    defaultAddon.hidden = true;
    addonDropdown.appendChild(defaultAddon);

    addons.forEach(addon => {
      const option = document.createElement('option');
      option.textContent = addon.label;
      option.value = addon.id;
      addonDropdown.appendChild(option);
    });
  }
}

function createPackageModal() {
  const modalHTML = `
    <div class="modal-overlay" id="package-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-package-title"></h2>
          <button class="modal-close" id="modal-close"><i class="ri-close-line"></i></button>
        </div>
        <div class="modal-tabs">
          <button class="tab-button active" data-tab="details">Details</button>
          <button class="tab-button" data-tab="booking">Book Now</button>
        </div>
        <div class="modal-body">
          <div class="tab-content active" id="details-tab"><div class="package-details"></div></div>
          <div class="tab-content" id="booking-tab">
            <form class="modal-booking-form" id="modal-booking-form">
              <input type="hidden" id="modal-package-name" name="packageName">
              <div><label for="modal-firstName">First Name</label><input type="text" id="modal-firstName" name="firstName" required></div>
              <div><label for="modal-lastName">Last Name</label><input type="text" id="modal-lastName" name="lastName" required></div>
              <div><label for="modal-email">Email</label><input type="email" id="modal-email" name="email" required></div>
              <div><label for="modal-phone">Phone Number</label><input type="tel" id="modal-phone" name="phone" required></div>
              <div class="start-end-date">
                <div><label for="modal-start-date">Start Date</label><input type="date" id="modal-start-date" name="startDate" required></div>
                <div><label for="modal-end-date">End Date</label><input type="date" id="modal-end-date" name="endDate" required></div>
              </div>
              <div><label for="modal-travelers">Number of Travelers</label><input type="number" id="modal-travelers" name="travelers" min="1" value="1" required></div>
              <div><label for="modal-addon">Add-on (Optional)</label><select name="addon" id="modal-addon"><option value="">Select an add-on (Optional)</option></select></div>
              <div><label for="modal-message">Special Requests</label><textarea id="modal-message" rows="4" name="message" placeholder="Tell us your requirements..."></textarea></div>
              <div><button type="submit" class="button">Book Now<i class="ri-send-plane-fill"></i></button></div>
            </form>
            <div class="thank-you-message" id="thank-you-message" style="display: none;">
              <div class="happy-face">😊</div>
              <h3>Thank You!</h3>
              <p>Your booking has been submitted successfully. We'll get back to you soon!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function initializeModal() {
  const modal = document.getElementById('package-modal');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  populateModalAddons();
  setupModalPhoneInput();
  initializeModalForm();
}

async function setupModalPhoneInput() {
  const phoneInput = document.querySelector("#modal-phone");
  if (!phoneInput) return;
  phoneInput.addEventListener('focus', async function () {
    await loadPhoneLibrary();
    if (window.intlTelInput && !modalItiInstance) {
      modalItiInstance = initializePhoneInput(phoneInput);
    }
  }, { once: true });
}

function populateModalAddons() {
  const dropdown = document.getElementById('modal-addon');
  if (!dropdown) return;
  addons.forEach(addon => {
    const option = document.createElement('option');
    option.value = addon.id;
    option.textContent = addon.label;
    dropdown.appendChild(option);
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

function openModal(packageId, openBookingTab = false) {
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return;

  document.getElementById('modal-package-title').textContent = pkg.title;
  document.getElementById('modal-package-name').value = pkg.title;
  document.querySelector('.package-details').innerHTML = `
    <h3>Perfect For</h3><p>${pkg.perfectFor}</p>
    <h3>Experience Summary</h3><p>${pkg.fullDescription}</p>
    <h3>Highlights</h3><ul>${pkg.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    <h3>Duration & Location</h3><p>${pkg.duration} | ${pkg.location}</p>
    <h3>Starting Price</h3><p><strong>${pkg.price}</strong> per person</p>
  `;

  switchTab(openBookingTab ? 'booking' : 'details');
  document.getElementById('package-modal').classList.add('active');
  document.body.style.overflow = 'hidden';

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('modal-start-date').setAttribute('min', today);
  document.getElementById('modal-end-date').setAttribute('min', today);
}

function closeModal() {
  document.getElementById('package-modal').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('modal-booking-form').reset();
  document.getElementById('thank-you-message').style.display = 'none';
  document.getElementById('modal-booking-form').style.display = 'grid';
  if (modalItiInstance) modalItiInstance.setNumber('');
}

function initializePackageButtons() {
  document.addEventListener('click', e => {
    const viewBtn = e.target.closest('.view-details-btn');
    const planBtn = e.target.closest('.plan-trip-btn');
    if (viewBtn) openModal(viewBtn.dataset.packageId, false);
    if (planBtn) openModal(planBtn.dataset.packageId, true);
  });
}

function initializeModalForm() {
  const form = document.getElementById('modal-booking-form');
  const submitBtn = form.querySelector('button[type="submit"]');

  document.getElementById('modal-start-date').addEventListener('change', e => {
    const endDate = document.getElementById('modal-end-date');
    endDate.setAttribute('min', e.target.value);
    if (endDate.value && endDate.value < e.target.value) endDate.value = '';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 0.5rem;"><div class="spinner"></div>Submitting...</span>';

      const payload = Object.fromEntries(new FormData(form).entries());
      const required = ['firstName', 'lastName', 'email', 'phone', 'startDate', 'endDate', 'travelers', 'packageName'];
      if (required.some(f => !payload[f] || !payload[f].trim())) throw new Error('Please fill in all required fields');

      if (modalItiInstance) {
        const phoneValue = document.getElementById('modal-phone').value.trim();
        if (!phoneValue || phoneValue.replace(/\D/g, '').length < 5) throw new Error('Please enter a valid phone number');
        const countryData = modalItiInstance.getSelectedCountryData();
        payload.phone = modalItiInstance.getNumber();
        payload.phoneCountry = countryData.name;
        payload.phoneCountryCode = '+' + countryData.dialCode;
        payload.phoneLocalNumber = phoneValue;
      }

      const res = await fetch('https://formspree.io/f/xqanelpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await saveToDashboard(payload);
      form.style.display = 'none';
      document.getElementById('thank-you-message').style.display = 'block';
    } catch (err) {
      showToast(err.message || 'Unsuccessful, try again later', false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
}

function bookingFormHandler() {
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  const phoneInput = document.querySelector('#phone');

  if (phoneInput) {
    phoneInput.addEventListener('focus', async function () {
      await loadPhoneLibrary();
      if (window.intlTelInput && !itiInstance) itiInstance = initializePhoneInput(phoneInput);
    }, { once: true });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 0.5rem;"><div class="spinner"></div>Submitting...</span>';

      const payload = Object.fromEntries(new FormData(form).entries());
      const required = ['firstName', 'lastName', 'email', 'phone', 'destination-dropdown', 'start-date', 'end-date', 'travelers'];
      if (required.some(f => !payload[f] || !payload[f].trim())) throw new Error('Please fill in all required fields');

      if (itiInstance) {
        const phoneValue = phoneInput.value.trim();
        if (!phoneValue || phoneValue.replace(/\D/g, '').length < 5) throw new Error('Please enter a valid phone number');
        const countryData = itiInstance.getSelectedCountryData();
        payload.phone = itiInstance.getNumber();
        payload.phoneCountry = countryData.name;
        payload.phoneCountryCode = '+' + countryData.dialCode;
        payload.phoneLocalNumber = phoneValue;
      }

      const res = await fetch('https://formspree.io/f/xqanelpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await saveToDashboard(payload);
      showToast("Trip booked successfully, we'll get back to you soon!", true);
      form.reset();
      if (itiInstance) itiInstance.setNumber('');
    } catch (err) {
      showToast(err.message || 'Unsuccessful, try again later', false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
}

function dateValidation() {
  const startDate = document.querySelector('#start-date');
  const endDate = document.querySelector('#end-date');
  const today = new Date().toISOString().split('T')[0];
  startDate.setAttribute('min', today);
  endDate.setAttribute('min', today);
  startDate.addEventListener('change', e => {
    endDate.setAttribute('min', e.target.value);
    if (endDate.value && endDate.value < e.target.value) endDate.value = '';
  });
}

function travelerValidation() {
  const input = document.querySelector('#travelers');
  input.setAttribute('min', '1');
  input.setAttribute('value', '1');
  input.setAttribute('step', '1');
  input.addEventListener('input', e => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = val === '' ? '' : Math.max(1, parseInt(val, 10));
  });
  input.addEventListener('blur', e => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) e.target.value = '1';
  });
  input.addEventListener('keydown', e => {
    if (['-', 'e', 'E', '+', '.'].includes(e.key)) e.preventDefault();
  });
}

function showToast(message, success = true) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
    background: success ? '#2ecc71' : '#e74c3c', color: '#fff',
    padding: '0.75rem 1rem', borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: '9999'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function initializeScrollActive() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 58;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      const links = document.querySelectorAll(`.nav_menu a[href*="#${sectionId}"]`);
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        links.forEach(a => a.classList.add('active-link'));
      } else {
        links.forEach(a => a.classList.remove('active-link'));
      }
    });
  }, { passive: true });
}

function initializeScrollReveal() {
  const sr = ScrollReveal({ origin: 'top', distance: '60px', duration: 2000, delay: 300 });
  sr.reveal('.home_container');
  sr.reveal('.home_title', { delay: 600 });
  sr.reveal('.home_description', { delay: 900 });
  sr.reveal('.home_data .button', { delay: 1100 });
}





// ============================================
// INFO MODALS
// ============================================
function createInfoModal() {
  const modalHTML = `
    <div class="info-modal-overlay" id="info-modal">
      <div class="info-modal-content">
        <div class="info-modal-header">
          <h2 id="info-modal-title"></h2>
          <button class="info-modal-close" id="info-modal-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="info-modal-body" id="info-modal-body"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openInfoModal(type) {
  const modal = document.getElementById('info-modal');
  const title = document.getElementById('info-modal-title');
  const body = document.getElementById('info-modal-body');

  const content = modalContent[type];
  if (!content) return;

  title.textContent = content.title;
  body.innerHTML = content.content;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
  const modal = document.getElementById('info-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function initializeInfoModals() {
  createInfoModal();

  document.getElementById('info-modal-close').addEventListener('click', closeInfoModal);

  document.getElementById('info-modal').addEventListener('click', (e) => {
    if (e.target.id === 'info-modal') closeInfoModal();
  });

  document.querySelectorAll('.footer_link[data-modal]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const modalType = link.dataset.modal.toLowerCase();
      openInfoModal(modalType);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('info-modal');
      if (modal && modal.classList.contains('active')) closeInfoModal();
    }
  });
}


// ============================================
// GALLERY STACK
// ============================================
function initializeGalleryStack() {
  const section = document.getElementById("stackSection");
  if (!section) return;

  const stack = document.getElementById("stack");
  const cards = Array.from(stack.querySelectorAll(".stack-card"));
  const n = cards.length;
  const counter = document.getElementById("counter");
  const description = document.getElementById("description");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  let k = 0;
  let animating = false;

  function norm(i) {
    return ((i % n) + n) % n;
  }

  function setZIndices(currentIndex) {
    cards.forEach((card) => {
      const idx = +card.dataset.i;
      const dist = norm(idx - currentIndex);
      card.style.zIndex = (n - dist).toString();
    });
  }

  function updateTo(newIndex, dir = 1) {
    if (animating) return;
    newIndex = norm(newIndex);
    if (newIndex === k) return;

    animating = true;

    const previous = k;
    const next = newIndex;

    setZIndices(next);

    cards.forEach((c) =>
      c.classList.remove("visible", "hidden", "out-left", "out-right")
    );

    const outgoing = cards.find((c) => +c.dataset.i === previous);
    const incoming = cards.find((c) => +c.dataset.i === next);

    incoming.classList.add("visible");

    if (dir > 0) outgoing.classList.add("out-left");
    else outgoing.classList.add("out-right");

    cards.forEach((c) => {
      const i = +c.dataset.i;
      if (i !== next && i !== previous) c.classList.add("hidden");
    });

    counter.textContent = `${next + 1} / ${n}`;
    const incomingDesc = incoming.querySelector(".stack-info p");
    if (incomingDesc) description.textContent = incomingDesc.textContent;

    const duration = 400;
    setTimeout(() => {
      cards.forEach((c) => {
        c.classList.remove("out-left", "out-right");
        if (+c.dataset.i === next) {
          c.classList.add("visible");
          c.classList.remove("hidden");
        } else {
          c.classList.add("hidden");
          c.classList.remove("visible");
        }
      });

      k = next;
      animating = false;
    }, duration + 30);
  }

  function init() {
    section.style.setProperty("--n", n);

    // Remove all classes first
    cards.forEach((c) => {
      c.classList.remove("visible", "hidden", "out-left", "out-right");
    });

    // Set all cards to hidden except the first one
    cards.forEach((c) => {
      const idx = +c.dataset.i;
      if (idx === k) {
        c.classList.add("visible");
      } else {
        c.classList.add("hidden");
      }
    });

    setZIndices(k);

    counter.textContent = `${k + 1} / ${n}`;
    const topCard = cards.find((c) => +c.dataset.i === k);
    const desc = topCard ? topCard.querySelector(".stack-info p") : null;
    description.textContent = desc ? desc.textContent : "";
  }

  prevBtn.addEventListener("click", () => updateTo(k - 1, -1));
  nextBtn.addEventListener("click", () => updateTo(k + 1, 1));

  // Initialize immediately
  init();
}


// ============================================
// MAIN INIT - PRIORITIZED LOADING
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Phase 1: Critical (immediately)
  initializeNavigation();
  renderPackageCards();
  initializeSwiperAndHeader();

  // Phase 2: Important (slight delay)
  requestIdleCallback(() => {
    renderDestinationDropdown();
    renderAddons();
    initializeScrollActive();
  });

  // Phase 3: Below fold (lazy)
  requestIdleCallback(() => {
    initializeVideo();
    initializeScrollReveal();
    createPackageModal();
    initializeModal();
    initializePackageButtons();
    dateValidation();
    travelerValidation();
    bookingFormHandler();
    initializeInfoModals();
    initializeGalleryStack();
  });
});