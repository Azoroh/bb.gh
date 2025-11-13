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
// const addonDropdown = document.querySelector('.add-on-dropdown')

// const defaultAddon = document.createElement('option')

// defaultAddon.textContent = 'Add-on'
// defaultAddon.value = ''
// defaultAddon.disabled = true
// defaultAddon.selected = true
// defaultAddon.hidden = true
// addonDropdown.appendChild(defaultAddon)

// addons.forEach(addon => {
//   const newAddonOption = document.createElement('option')

//   newAddonOption.textContent = addon.label
//   newAddonOption.value = addon.id

//   addonDropdown.appendChild(newAddonOption)
// })


addons.forEach(addon => {
  const addonOption = document.createElement('div')
  addonOption.classList.add('add-on_option')
  addonOption.id = addon.id

  addonOption.innerHTML = `
  <p>${addon.label}</p>
  `

  addonBody.appendChild('addonOption')
})

// addonBody.innerHTML = addons.map(ad =>
//   `
//     <div class="add-on_option" id="${ad.id}">
//       <p>${ad.label}</p>
//     </div>
//   `).join('');





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

  //   autoplay: {
  //     delay: 2000,
  //     disableOnInteraction: false,
  //   },
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

// Fade in when the video starts playing
video.addEventListener('playing', () => {
  video.classList.add('loaded');
});

// Autoplay when visible
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      video.play();
    } else {
      video.pause();
    }
  });
}, { threshold: 0.5 });

observer.observe(video);








// render destination dropdown
const selectDropdown = document.querySelector('.dropdown-options')

// Optional: Add a default, disabled 'Choose...' option
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