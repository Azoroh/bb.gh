import { packages, addons, destinations } from "./data.js";

const container = document.querySelector('.packages_container');
const dotsContainer = document.querySelector('.indicator_dots');

//wait for page to finish loading then render dropdowns n list
document.addEventListener('DOMContentLoaded', initializeApp)

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
        <p class="package_price">From <br><strong>${pkg.price}</strong></p>
      </div>
      <p class="package_description">${pkg.summary}</p>
      <div class="package_action">
        <a href="#" class="button primary">View Details</a>
        <a href="#" class="button secondary">Plan Trip</a>
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


const cards = document.querySelectorAll('.package_card');

// HORIZONTAL PACKAGES SCROLL
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

// SWIPER HOME
const swiperHome = new Swiper(".home_swiper", {
  loop: true,
  slidesPerView: "auto",
  grabCursor: true,

  // Navigation arrows
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  autoplay: {
    delay: 2000,
    disableOnInteraction: false,
  },
});

/*=============== CHANGE BACKGROUND HEADER ===============*/
const bgHeader = () => {
  const header = document.getElementById('header')
  // Add a class if the bottom offset is greater than 50 of the viewport
  window.scrollY >= 50 ? header.classList.add('bg-header')
    : header.classList.remove('bg-header')
}
window.addEventListener('scroll', bgHeader)

//SWIPER TESTIMONIAL
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
  renderDestinationDropdown()
  renderAddons()


  travelerValidation()
  dateValidation()
  bookingFormHandler()
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


  BookingForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (submitBtn.disabled) return;

    const originalHTML = submitBtn.innerHTML

    try {
      // disable button while processing
      submitBtn.disabled = true
      //     submitBtn.innerHTML = `
      //   <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
      //     <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
      //       <circle cx="12" cy="12" r="10" stroke="currentColor" 
      //               stroke-width="3" fill="none" 
      //               stroke-dasharray="31.4 31.4" 
      //               style="animation: rotate 1s linear infinite">
      //       </circle>
      //     </svg>
      //     Submitting...
      //   </span>
      // `

      submitBtn.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
      <div class="spinner"></div>
      Submitting...
      `

      const formData = new FormData(BookingForm)
      const payload = Object.fromEntries(formData.entries())

      console.log('form payload: ', payload);

      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'destination-dropdown', 'start-date', 'end-date', 'travelers'];
      const missingFields = requiredFields.filter(field => !payload[field] || payload[field].trim() === '');

      console.log('missing fields:', missingFields);

      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields`);
      }

      // send to backend endpoint
      const res = await fetch('https://formspree.io/f/mgvrnqbl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
        // throw new Error('Request failed')

      }

      showToast("Trip booked successfully, we'll get right back to Soon!", true)
      // BookingForm.reset()
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