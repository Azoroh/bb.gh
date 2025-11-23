import { packages, addons, destinations } from "./data.js";

let itiInstance = null; // Store the intl-tel-input instance
let container = null;
let dotsContainer = null;

//wait for page to finish loading then render dropdowns n list
document.addEventListener('DOMContentLoaded', initializeApp)

// INITIALIZE PHONE INPUT WITH COUNTRY CODE
function initializePhoneInput() {
  const phoneInput = document.querySelector("#phone");

  if (phoneInput) {
    itiInstance = window.intlTelInput(phoneInput, {
      initialCountry: "auto", // Set Ghana as default
      geoIpLookup: callback => {
        fetch("https://ipapi.co/json")
          .then(res => res.json())
          .then(data => callback(data.country_code))
          .catch(() => callback("gh")); // Default to Ghana if lookup fails
      },
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/js/utils.js",
      separateDialCode: true,
      preferredCountries: ["gh", "ng", "us", "gb"],
      autoPlaceholder: "polite",
      strictMode: false,
      formatOnDisplay: true
    });
  }
}



// PACKAGES CARDS 
function renderPackageCards() {

  console.log('renderPackageCards called');

  // Get the containers INSIDE the function after DOM is loaded
  container = document.querySelector('.packages_container');
  dotsContainer = document.querySelector('.indicator_dots');

  console.log('Container:', container);
  console.log('Dots container:', dotsContainer);


  if (!container || !dotsContainer) {
    console.error('Package containers not found!');
    return;
  }

  console.log('About to render', packages.length, 'packages');

  packages.forEach((pkg, i) => {
    console.log('Rendering package:', pkg.title);

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
          <p class="package_price">From <br><strong>${pkg.price}</strong></p>
        </div>
        <p class="package_description">${pkg.summary}</p>
        <div class="package_action">
          <button class="button primary view-details-btn" data-package-id="${pkg.id}">View Details</button>
          <button class="button secondary plan-trip-btn" data-package-id="${pkg.id}">Plan Trip</button>
        </div>
      </div>
    `;
    container.appendChild(card);

    // Add dot for each package
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  });

  // Initialize scroll functionality after cards are created
  initializePackageScroll();
}

// HORIZONTAL PACKAGES SCROLL
function initializePackageScroll() {
  const cards = document.querySelectorAll('.package_card');
  const dots = document.querySelectorAll('.dot');
  let currentIndex = 0;
  let isScrolling;

  function scrollToCard(index) {
    const cardWidth = cards[0].offsetWidth + 16;
    container.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
    cards.forEach(card => card.classList.remove('bounce'));
    cards[index].classList.add('bounce');
  }

  container.addEventListener('scroll', () => {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
      const cardWidth = cards[0].offsetWidth + 16;
      const newIndex = Math.round(container.scrollLeft / cardWidth);
      if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        scrollToCard(currentIndex);
      }
    }, 50);
  });
}



function initializeNavigation() {
  /*=============== SHOW MENU ===============*/
  const navMenu = document.getElementById("nav-menu"),
    navToggle = document.getElementById("nav-toggle"),
    navClose = document.getElementById("nav-close");

  /* Menu show */
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.add("show-menu");
    });
  }

  /* Menu hidden */
  if (navClose) {
    navClose.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
    });
  }

  /*=============== REMOVE MENU MOBILE ===============*/
  const navLink = document.querySelectorAll(".nav_link");

  const linkAction = () => {
    const navMenu = document.getElementById("nav-menu");
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove("show-menu");
  };
  navLink.forEach((n) => n.addEventListener("click", linkAction));

}

function initializeVideo() {
  // AUTO PLAY ON SCROLL
  const video = document.querySelector('.video-container video');

  if (video) {
    // Show video immediately once metadata is loaded
    video.addEventListener('loadedmetadata', () => {
      video.classList.add('loaded');
    });

    // Fallback: show video after a short delay if metadata event doesn't fire
    setTimeout(() => {
      video.classList.add('loaded');
    }, 100);

    // Autoplay when visible
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Video is in view - play it
          video.play().catch(err => {
            console.log('Video autoplay failed:', err);
          });
        } else {
          // Video is out of view - pause it
          video.pause();
        }
      });
    }, { threshold: 0.5 }); // Video needs to be 50% visible to trigger

    observer.observe(video);
  }
}

// INITIALIZE SWIPER AND HEADER
function initializeSwiperAndHeader() {
  console.log('initializeSwiperAndHeader called');

  // SWIPER HOME - only initialize if element exists
  const homeSwiperEl = document.querySelector(".home_swiper");
  if (homeSwiperEl) {
    console.log('Initializing home swiper');
    const swiperHome = new Swiper(".home_swiper", {
      loop: true,
      slidesPerView: "auto",
      grabCursor: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
      },
    });
  } else {
    console.warn('Home swiper element not found');
  }

  /*=============== CHANGE BACKGROUND HEADER ===============*/
  const bgHeader = () => {
    const header = document.getElementById('header')

    if (header) {
      // Add a class if the bottom offset is greater than 50 of the viewport
      window.scrollY >= 50 ? header.classList.add('bg-header')
        : header.classList.remove('bg-header')
    }
  }
  window.addEventListener('scroll', bgHeader)

  // SWIPER TESTIMONIAL - only initialize if element exists
  const testimonialSwiperEl = document.querySelector(".testimonial_swiper");
  if (testimonialSwiperEl) {
    console.log('initializing testimonial swiper');
    const swiperTestimonial = new Swiper(".testimonial_swiper", {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 48,
      grabCursor: true,

      // Navigation arrows
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },

      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        reverseDirection: true,
      },
      speed: 500,
      easing: 'linear',
      loop: true,
    });
  } else {
    console.warn('Testimonial swiper element not found');
  }

  console.log('initializeSwiperAndHeader completed');
};





// =============== DESTINATION DROPDOWN RENDERING ===============
function renderDestinationDropdown() {
  const dropdown = document.getElementById('destination-dropdown')
  if (!dropdown) {
    console.error("Destination dropdown element not found.");
    return;
  }

  // Clear any existing options (for safety)
  dropdown.innerHTML = '';

  // Add a default, disabled option as a placeholder
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a Destination';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  dropdown.appendChild(defaultOption);

  // Iterate over the imported 'destinations' array
  destinations.forEach(dest => {
    const option = document.createElement('option');
    option.value = dest.value;
    option.textContent = dest.label;

    // Disable the option if 'available' is false
    if (!dest.available) {
      option.disabled = true;
      option.textContent += ' (Coming Soon)'; // Visual cue for the user
    }

    dropdown.appendChild(option);
  });
}

//====================== ADD ON & ADD ON DROPDOWN =======================
function renderAddons() {

  //Add-on
  const addonBody = document.querySelector('.add-on_body')


  addons.forEach(addon => {
    const addonOption = document.createElement('div')
    addonOption.classList.add('add-on_option')
    addonOption.id = addon.id

    addonOption.innerHTML = `
    <p>${addon.label}</p>
    `

    addonBody.appendChild(addonOption)
  })

  //Addon form dropdown
  const addonDropdown = document.querySelector('#add-on-dropdown')

  const defaultAddon = document.createElement('option')

  defaultAddon.textContent = 'Add-on (Optional)'
  defaultAddon.value = ''
  defaultAddon.disabled = true
  defaultAddon.selected = true
  defaultAddon.hidden = true
  addonDropdown.appendChild(defaultAddon)

  addons.forEach(addon => {
    const newAddonOption = document.createElement('option')

    newAddonOption.textContent = addon.label
    newAddonOption.value = addon.id

    addonDropdown.appendChild(newAddonOption)
  })

}

function initializeApp() {

  console.log('=== INITIALIZE APP STARTED ===');
  console.log('Packages:', packages);
  console.log('Addons:', addons);
  console.log('Destinations:', destinations);


  // Initialize UI components
  initializeNavigation()
  initializeSwiperAndHeader()
  initializeVideo()
  initializeScrollActive()
  initializeScrollReveal()

  // Render content
  renderPackageCards()
  renderDestinationDropdown()
  renderAddons()

  // Initialize modal
  createPackageModal()
  initializeModal()
  initializePackageButtons()

  // Initialize forms
  initializePhoneInput()
  travelerValidation()
  dateValidation()
  bookingFormHandler()

  console.log('=== INITIALIZE APP COMPLETED ===');

}




// PACKAGE MODAL FUNCTIONALITY
let modalItiInstance = null; // Separate instance for modal phone input

function createPackageModal() {
  const modalHTML = `
    <div class="modal-overlay" id="package-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-package-title"></h2>
          <button class="modal-close" id="modal-close">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="modal-tabs">
          <button class="tab-button active" data-tab="details">Details</button>
          <button class="tab-button" data-tab="booking">Book Now</button>
        </div>
        <div class="modal-body">
          <div class="tab-content active" id="details-tab">
            <div class="package-details"></div>
          </div>
          <div class="tab-content" id="booking-tab">
            <form class="modal-booking-form" id="modal-booking-form">
              <input type="hidden" id="modal-package-name" name="packageName">
              
              <div>
                <label for="modal-firstName">First Name</label>
                <input type="text" id="modal-firstName" name="firstName" required>
              </div>

              <div>
                <label for="modal-lastName">Last Name</label>
                <input type="text" id="modal-lastName" name="lastName" required>
              </div>

              <div>
                <label for="modal-email">Email</label>
                <input type="email" id="modal-email" name="email" required>
              </div>

              <div>
                <label for="modal-phone">Phone Number</label>
                <input type="tel" id="modal-phone" name="phone" required>
              </div>

              <div class="start-end-date">
                <div>
                  <label for="modal-start-date">Start Date</label>
                  <input type="date" id="modal-start-date" name="startDate" required>
                </div>
                <div>
                  <label for="modal-end-date">End Date</label>
                  <input type="date" id="modal-end-date" name="endDate" required>
                </div>
              </div>

              <div>
                <label for="modal-travelers">Number of Travelers</label>
                <input type="number" id="modal-travelers" name="travelers" min="1" value="1" required>
              </div>

              <div>
                <label for="modal-addon">Add-on (Optional)</label>
                <select name="addon" id="modal-addon">
                  <option value="">Select an add-on (Optional)</option>
                </select>
              </div>

              <div>
                <label for="modal-message">Special Requests or Questions</label>
                <textarea id="modal-message" rows="4" name="message"
                  placeholder="Tell us your special requirements..."></textarea>
              </div>

              <div>
                <button type="submit" class="button">
                  Book Now
                  <i class="ri-send-plane-fill"></i>
                </button>
              </div>
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
  const closeBtn = document.getElementById('modal-close');
  const tabButtons = document.querySelectorAll('.tab-button');

  // Close modal
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      switchTab(tabName);
    });
  });

  // Initialize modal phone input
  initializeModalPhoneInput();

  // Initialize modal form
  initializeModalForm();

  // Populate addon dropdown
  populateModalAddons();
}

function initializeModalPhoneInput() {
  const phoneInput = document.querySelector("#modal-phone");

  if (phoneInput && window.intlTelInput) {
    modalItiInstance = window.intlTelInput(phoneInput, {
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
}

function populateModalAddons() {
  const addonDropdown = document.getElementById('modal-addon');
  addons.forEach(addon => {
    const option = document.createElement('option');
    option.value = addon.id;
    option.textContent = addon.label;
    addonDropdown.appendChild(option);
  });
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

function openModal(packageId, openBookingTab = false) {
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return;

  const modal = document.getElementById('package-modal');
  const title = document.getElementById('modal-package-title');
  const detailsContent = document.querySelector('.package-details');
  const packageNameInput = document.getElementById('modal-package-name');

  // Set title
  title.textContent = pkg.title;

  // Set package name in hidden input
  packageNameInput.value = pkg.title;

  // Populate details tab
  detailsContent.innerHTML = `
    <h3>Perfect For</h3>
    <p>${pkg.perfectFor}</p>
    
    <h3>Experience Summary</h3>
    <p>${pkg.fullDescription}</p>
    
    <h3>Highlights</h3>
    <ul>
      ${pkg.highlights.map(h => `<li>${h}</li>`).join('')}
    </ul>
    
    <h3>Duration & Location</h3>
    <p>${pkg.duration} | ${pkg.location}</p>
    
    <h3>Starting Price</h3>
    <p><strong>${pkg.price}</strong> per person</p>
  `;

  // Open the appropriate tab
  if (openBookingTab) {
    switchTab('booking');
  } else {
    switchTab('details');
  }

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Set date minimums
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('modal-start-date').setAttribute('min', today);
  document.getElementById('modal-end-date').setAttribute('min', today);
}

function closeModal() {
  const modal = document.getElementById('package-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';

  // Reset form
  document.getElementById('modal-booking-form').reset();
  document.getElementById('thank-you-message').style.display = 'none';
  document.getElementById('modal-booking-form').style.display = 'grid';

  if (modalItiInstance) {
    modalItiInstance.setNumber('');
  }
}

function initializePackageButtons() {
  console.log('initializePackageButtons called');

  // Event delegation for package buttons
  document.addEventListener('click', (e) => {
    console.log('Document clicked:', e.target);

    if (e.target.classList.contains('view-details-btn') || e.target.closest('.view-details-btn')) {
      console.log('View Details button clicked!');

      const btn = e.target.classList.contains('view-details-btn') ? e.target : e.target.closest('.view-details-btn');
      const packageId = btn.dataset.packageId;

      console.log('Package ID:', packageId);
      openModal(packageId, false);
    }

    if (e.target.classList.contains('plan-trip-btn') || e.target.closest('.plan-trip-btn')) {
      console.log('Plan Trip button clicked!');

      const btn = e.target.classList.contains('plan-trip-btn') ? e.target : e.target.closest('.plan-trip-btn');
      const packageId = btn.dataset.packageId;

      console.log('Package ID:', packageId);
      openModal(packageId, true);
    }
  });
}

function initializeModalForm() {
  const form = document.getElementById('modal-booking-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  const phoneInput = document.getElementById('modal-phone');
  const startDateInput = document.getElementById('modal-start-date');
  const endDateInput = document.getElementById('modal-end-date');

  // Date validation
  startDateInput.addEventListener('change', (e) => {
    endDateInput.setAttribute('min', e.target.value);
    if (endDateInput.value && endDateInput.value < e.target.value) {
      endDateInput.value = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
          <div class="spinner"></div>
          Submitting...
        </span>
      `;

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'startDate', 'endDate', 'travelers', 'packageName'];
      const missingFields = requiredFields.filter(field => !payload[field] || String(payload[field]).trim() === '');

      if (missingFields.length > 0) {
        throw new Error('Please fill in all required fields');
      }

      // Process phone number
      if (modalItiInstance && phoneInput) {
        const phoneValue = phoneInput.value.trim();

        if (!phoneValue) {
          throw new Error('Please enter a phone number');
        }

        const fullNumber = modalItiInstance.getNumber();
        const countryData = modalItiInstance.getSelectedCountryData();
        const digitCount = phoneValue.replace(/\D/g, '').length;

        if (digitCount < 5) {
          throw new Error('Please enter a valid phone number');
        }

        payload.phone = fullNumber;
        payload.phoneCountry = countryData.name;
        payload.phoneCountryCode = '+' + countryData.dialCode;
        payload.phoneLocalNumber = phoneValue;
      }

      // Send to Formspree
      const res = await fetch('https://formspree.io/f/xqanelpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }

      // Show thank you message
      form.style.display = 'none';
      document.getElementById('thank-you-message').style.display = 'block';

    } catch (err) {
      console.error('Booking error:', err);
      showToast(err.message || 'Unsuccessful, try again later', false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });
}









/**
 * Small toast helper (with inline css)
 */
function showToast(message, success = true) {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.position = 'fixed'
  toast.style.bottom = '1.5rem'
  toast.style.left = '50%'
  toast.style.transform = 'translateX(-50%)'
  toast.style.background = success ? '#2ecc71' : '#e74c3c'
  toast.style.color = '#fff'
  toast.style.padding = '0.75rem 1rem'
  toast.style.borderRadius = '6px'
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  toast.style.zIndex = '9999'
  toast.style.textAlign = 'center'

  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}

// FORM OUTPUT

function bookingFormHandler() {
  const BookingForm = document.querySelector('#booking-form')
  const submitBtn = BookingForm ? BookingForm.querySelector('button[type="submit"]') : null
  const phoneInput = document.querySelector('#phone');


  BookingForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (submitBtn.disabled) return;

    const originalHTML = submitBtn.innerHTML

    try {
      // disable button while processing
      submitBtn.disabled = true
      submitBtn.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
      <div class="spinner"></div>
      Submitting...
      `

      const formData = new FormData(BookingForm)
      const payload = Object.fromEntries(formData.entries())

      console.log('Initial payload:', payload); // Debug log

      // Validate required fields FIRST (before modifying payload)
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'destination-dropdown', 'start-date', 'end-date', 'travelers'];
      const missingFields = requiredFields.filter(field => {
        const value = payload[field];
        return !value || String(value).trim() === '';
      });

      console.log('Missing fields:', missingFields); // Debug log

      if (missingFields.length > 0) {
        throw new Error('Please fill in all required fields');
      }

      // NOW process phone number AFTER validation
      if (itiInstance && phoneInput) {
        const phoneValue = phoneInput.value.trim()

        // Check if any number was entered
        if (!phoneValue) {
          throw new Error('Please enter a phone number');
        }

        // Get the full number with country code
        const fullNumber = itiInstance.getNumber();
        const countryData = itiInstance.getSelectedCountryData();

        // Just check that we got some digits (very lenient - at least 5 digits)
        const digitCount = phoneValue.replace(/\D/g, '').length;
        if (digitCount < 5) {
          throw new Error('Please enter a valid phone number');
        }

        // Send all phone data to email
        payload.phone = fullNumber; // e.g., "+233245302636"
        payload.phoneCountry = countryData.name; // e.g., "Ghana"
        payload.phoneCountryCode = '+' + countryData.dialCode; // e.g., "+233"
        payload.phoneLocalNumber = phoneValue; // What user typed
      }

      console.log('Final payload:', payload); // Debug log

      // send to backend endpoint
      const res = await fetch('https://formspree.io/f/xqanelpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);

      }

      showToast("Trip booked successfully, we'll get right back to Soon!", true)
      BookingForm.reset()
      if (itiInstance) {
        itiInstance.setNumber(""); // Reset the phone input
      }
    } catch (err) {
      console.error('Booking error:', err)
      showToast(err.message || 'Unsuccessful, try again later', false)
    } finally {
      submitBtn.disabled = false
      submitBtn.innerHTML = originalHTML
    }
  })
}

// Date Validation
function dateValidation() {
  const startDateInput = document.querySelector('#start-date');
  const endDateInput = document.querySelector('#end-date');

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  startDateInput.setAttribute('min', today);
  endDateInput.setAttribute('min', today);

  // Update end date minimum when start date changes
  startDateInput.addEventListener('change', (e) => {
    endDateInput.setAttribute('min', e.target.value);
    if (endDateInput.value && endDateInput.value < e.target.value) {
      endDateInput.value = '';
    }
  });


}

// TRAVELER COUNT VALIDATION
function travelerValidation() {

  // Get the travelers input field
  const travelersInput = document.querySelector('#travelers');

  // Set minimum value attribute
  travelersInput.setAttribute('min', '1');
  travelersInput.setAttribute('value', '1'); // Set default value
  travelersInput.setAttribute('step', '1'); // Only allow whole numbers

  // Prevent negative numbers and zero from being typed or pasted
  travelersInput.addEventListener('input', (e) => {
    // Remove any non-numeric characters except for the minus sign temporarily
    let value = e.target.value.replace(/[^0-9]/g, '');

    // Convert to number
    let numValue = parseInt(value, 10);

    // Allow temporary empty string
    if (value === '') {
      e.target.value = '';
      return;
    }

    // If less than 1 or NaN, set to 1
    if (isNaN(numValue) || numValue < 1) {
      e.target.value = '1';
    } else {
      e.target.value = numValue;
    }
  });

  // Also prevent manual entry of invalid values on blur
  travelersInput.addEventListener('blur', (e) => {
    let value = parseInt(e.target.value, 10);

    if (isNaN(value) || value < 1) {
      e.target.value = '1';
    }
  });

  // Prevent keyboard shortcuts that might create negative numbers
  travelersInput.addEventListener('keydown', (e) => {
    // Prevent minus key and 'e' (scientific notation)
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
      e.preventDefault();
    }
  });

  // Prevent pasting negative numbers
  travelersInput.addEventListener('paste', (e) => {
    e.preventDefault();

    // Get pasted data
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');

    // Extract only positive numbers
    const numValue = parseInt(pastedText.replace(/[^0-9]/g, ''), 10);

    // Set value if valid, otherwise set to 1
    if (!isNaN(numValue) && numValue >= 1) {
      e.target.value = numValue;
    } else {
      e.target.value = '1';
    }
  });

}



function initializeScrollActive() {
  /*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
  const sections = document.querySelectorAll('section[id], footer[id]')

  const scrollActive = () => {
    const scrollDown = window.scrollY

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight,
        sectionTop = current.offsetTop - 58,
        sectionId = current.getAttribute('id')

      // select ALL nav links that point to this id
      const navAnchors = document.querySelectorAll('.nav_menu a[href*="#' + sectionId + '"]')
      if (!navAnchors.length) return

      if (scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight) {
        navAnchors.forEach(a => a.classList.add('active-link'))
      } else {
        navAnchors.forEach(a => a.classList.remove('active-link'))
      }
    })
  }
  window.addEventListener('scroll', scrollActive)
}



function initializeScrollReveal() {
  // SCROLL REVEAL ANIMATION 
  const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2000,
    delay: 300,
    // reset: true, //Animation repeat
  })

  sr.reveal(`.home_container`)
  sr.reveal(`.home_title`, { delay: 600 })
  sr.reveal(`.home_description`, { delay: 900 })
  sr.reveal(`.home_data .button`, { delay: 1100 })
}


