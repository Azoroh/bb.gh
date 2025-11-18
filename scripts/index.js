import { packages, addons, destinations } from "./data.js";


const container = document.querySelector('.packages_container');
const dotsContainer = document.querySelector('.indicator_dots');

// container.innerHTML = ''

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






// render destination dropdown
const selectDropdown = document.querySelector('.dropdown-options')

// Add a default, disabled 'Choose...' option
const defaultOption = document.createElement('option');
defaultOption.textContent = 'Select a Destination'
defaultOption.value = ''
defaultOption.disabled = true
defaultOption.selected = true
defaultOption.hidden = true
selectDropdown.appendChild(defaultOption)


destinations.forEach(dest => {
  const newOption = document.createElement('option')

  newOption.textContent = dest.location
  newOption.value = dest.value

  if (!dest.available) {
    newOption.disabled = true;
    newOption.textContent += ' (Unavailable)';
  }

  selectDropdown.appendChild(newOption)
})


// FORM OUTPUT
const BookingForm = document.querySelector('#booking-form')
const submitBtn = BookingForm.querySelector('button[type="submit"]')


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
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}

BookingForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (submitBtn.disabled) return;

  const originalHTML = submitBtn.innerHTML

  try {
    // disable button while processing
    submitBtn.disabled = true
    submitBtn.innerHTML = 'Submitting...'

    const formData = new FormData(BookingForm)
    const payload = Object.fromEntries(formData.entries())

    // send to backend endpoint (create server endpoint in next steps)
    const res = await fetch('https://formspree.io/f/mgvrnqbl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error('Request failed')

    showToast("Trip booked successfully, we'll get right back to Soon!", true)
    BookingForm.reset()
  } catch (err) {
    console.error(err)
    showToast('Unsuccessful, try again later', false)
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = originalHTML
  }


})



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