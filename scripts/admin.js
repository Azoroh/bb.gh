// Admin Dashboard JavaScript
// This file handles all admin functionality

import { auth, db } from "./firebase-config.js";
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  setDoc,
  addDoc,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Initialize EmailJS (REPLACE WITH YOUR PUBLIC KEY)
// Example: emailjs.init("YOUR_PUBLIC_KEY");
// functionality wraps in a robust try-catch block so absence of keys won't break app
const EMAILJS_PUBLIC_KEY = "pUWgkHt03tRmdHViF";
const EMAILJS_SERVICE_ID = "service_87qli4u";
const EMAILJS_TEMPLATE_ID = "template_kokdvvm";

try {
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
} catch (e) {
  console.warn("EmailJS not initialized:", e);
}

// Helper: Send Email Notification
async function sendTaskEmail(taskData, driverId, actionType = "assigned") {
  try {
    if (typeof emailjs === "undefined" || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY_HERE") {
      console.log("EmailJS not configured, skipping email.");
      return false;
    }

    // 1. Get Driver Details
    const driverDoc = await getDoc(doc(db, "users", driverId));
    if (!driverDoc.exists()) return false;

    const driverData = driverDoc.data();

    // 2. Prepare Template Params
    const templateParams = {
      driver_name: driverData.name,
      driver_email: driverData.email,
      title: taskData.title,
      date: taskData.date,
      time: taskData.time,
      pickup: taskData.pickupLocation,
      destination: taskData.destination,
      client_name: taskData.clientName || "N/A",
      notes: taskData.notes || "None",
      action_type: actionType // Optional: Use in template if you want to distinguish "New" vs "Update"
    };

    // 3. Send Email
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log(`Email (${actionType}) sent to:`, driverData.email);
    return true;

  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

// Import countries list
const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

// Function to populate country dropdown in admin booking form
function renderAdminCountryDropdown() {
  const dropdown = document.getElementById("add-booking-country");
  if (!dropdown) return;

  // Clear existing options except the default one
  dropdown.innerHTML = '<option value="">Select a country...</option>';

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    dropdown.appendChild(option);
  });
}

// Check authentication and authorization
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // If we are in the middle of creating a user (driver/admin), ignore the temporary logout
    if (window.isCreatingUser) {
      console.log("Ignoring auth state change during user creation");
      return;
    }

    // Not logged in, redirect to login
    window.location.href = "admin.html";
    return;
  }

  // Check if user is admin
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("User profile not found. Please contact administrator.");
      await signOut(auth);
      window.location.href = "admin.html";
      return;
    }

    const userData = userDoc.data();

    if (userData.role !== "admin" && userData.role !== "super") {
      alert("Access denied. Admin privileges required.");
      await signOut(auth);
      window.location.href = "admin.html";
      return;
    }

    // User is authenticated and authorized
    document.getElementById("user-name").textContent =
      userData.name || user.email;

    // Update role label
    const roleLabel = document.querySelector(".user-role");
    if (roleLabel) {
      roleLabel.textContent = userData.role === "super" ? "SUPER" : "Admin";
    }

    // Show/Hide Manage Admins link
    const adminLink = document.querySelector(".admin-link");
    if (adminLink) {
      adminLink.style.display = userData.role === "super" ? "flex" : "none";
    }

    // Load dashboard data
    initDashboard();
  } catch (error) {
    console.error("Auth check error:", error);
    alert("Error checking permissions. Please try again.");
    window.location.href = "admin.html";
  }
});

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", async () => {
  console.log("log out clicked");
  if (confirm("Are you sure you want to logout?")) {
    try {
      await signOut(auth);
      window.location.href = "admin.html";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error logging out. Please try again.");
    }
  }
});

// Navigation functionality
const navItems = document.querySelectorAll(".nav-item");
const contentSections = document.querySelectorAll(".content-section");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const sectionName = item.dataset.section;

    // Update active nav item
    navItems.forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");

    // Show corresponding content section
    contentSections.forEach((section) => section.classList.remove("active"));
    document.getElementById(`${sectionName}-section`).classList.add("active");

    // Load section data if needed
    loadSectionData(sectionName);
  });
});

// Initialize dashboard
async function initDashboard() {
  try {
    await loadOverviewData();
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

// Load overview data
async function loadOverviewData() {
  try {
    // Load bookings
    // Load bookings sorted by creation time
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const bookingsSnapshot = await getDocs(q);
    const bookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update stats
    document.getElementById("total-bookings").textContent = bookings.length;

    // Get unique clients
    const uniqueClients = new Set(bookings.map((b) => b.email));
    document.getElementById("total-clients").textContent = uniqueClients.size;

    /// Load drivers count
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      orderBy("createdAt", "desc"),
    );
    const driversSnapshot = await getDocs(driversQuery);
    document.getElementById("total-drivers").textContent = driversSnapshot.size;

    // Load tasks count
    const tasksSnapshot = await getDocs(collection(db, "tasks"));
    const pendingTasks = tasksSnapshot.docs.filter(
      (doc) => doc.data().status === "pending",
    );
    document.getElementById("total-tasks").textContent = pendingTasks.length;

    // Display recent bookings (last 5)
    displayRecentBookings(bookings.slice(0, 5));
  } catch (error) {
    console.error("Error loading overview:", error);
    showEmptyState("recent-bookings-table", "Error loading data");
  }
}

// Display recent bookings
function displayRecentBookings(bookings) {
  const tbody = document.getElementById("recent-bookings-table");

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i class="ri-inbox-line"></i>
            <p>No bookings yet. Bookings from your website will appear here.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings
    .map(
      (booking) => `
    <tr>
      <td>
        <strong>${booking.firstName} ${booking.lastName}</strong><br>
        <small style="color: #718096;">${booking.email}</small>
      </td>
      <td>${booking.packageName || "N/A"}</td>
      <td>${formatDateRange(booking.startDate, booking.endDate)}</td>
      <td><span class="status-badge status-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
      <td>
        <button class="action-btn" onclick="viewBooking('${booking.id}')" title="View Details">
          <i class="ri-eye-line"></i>
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}

// Load section-specific data
async function loadSectionData(section) {
  switch (section) {
    case "bookings":
      await loadAllBookings();
      break;
    case "clients":
      await loadClients();
      break;
    case "drivers":
      await loadDrivers();
      break;
    case "tasks":
      await loadTasks();
      break;
    case "payments":
      await loadPayments();
      break;
    case "newsletter":
      await loadNewsletter();
      break;
  }
}

// Load all bookings
let allBookings = [];

async function loadAllBookings() {
  try {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const bookingsSnapshot = await getDocs(q);
    allBookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    renderBookings(allBookings);
  } catch (error) {
    console.error("Error loading bookings:", error);
    showEmptyState("bookings-table", "Error loading bookings");
  }
}

function renderBookings(bookings) {
  const tbody = document.getElementById("bookings-table");

  if (bookings.length === 0) {
    showEmptyState("bookings-table", "No bookings found");
    return;
  }

  tbody.innerHTML = bookings
    .map(
      (booking) => `
      <tr>
        <td><strong>${booking.firstName} ${booking.lastName}</strong></td>
        <td>${booking.email}</td>
        <td>${booking.phoneCountryCode ? booking.phoneCountryCode + " " + booking.phoneLocalNumber : booking.phoneLocalNumber || booking.phone || "N/A"}</td>
        <td>${booking.packageName || "N/A"}</td>
        <td>${formatDateRange(booking.startDate, booking.endDate)}</td>
        <td>${booking.travelers}</td>
        <td><span class="status-badge status-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
        <td>
          <button class="action-btn" onclick="viewBooking('${booking.id}')" title="View">
            <i class="ri-eye-line"></i>
          </button>
          <button class="action-btn" onclick="editBooking('${booking.id}')" title="Edit">
            <i class="ri-edit-line"></i>
          </button>
          <button class="action-btn" onclick="deleteBooking('${booking.id}')" title="Delete" style="color: #e74c3c;">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `,
    )
    .join("");
}

// Delete Booking
window.deleteBooking = async function (id) {
  if (
    confirm(
      "Are you sure you want to delete this booking? This action cannot be undone.",
    )
  ) {
    try {
      await deleteDoc(doc(db, "bookings", id));
      allBookings = allBookings.filter((b) => b.id !== id);
      renderBookings(allBookings);
      showToast("Booking deleted successfully", true);
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Error deleting booking");
    }
  }
};

// Load clients
let allClients = [];

async function loadClients() {
  try {
    // Load bookings sorted by date for client history
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const bookingsSnapshot = await getDocs(q);
    const bookings = bookingsSnapshot.docs.map((doc) => doc.data());

    // Group by email
    const clientsMap = {};
    bookings.forEach((booking) => {
      if (!clientsMap[booking.email]) {
        clientsMap[booking.email] = {
          name: `${booking.firstName} ${booking.lastName}`,
          email: booking.email,
          phone: booking.phoneCountryCode
            ? booking.phoneCountryCode + " " + booking.phoneLocalNumber
            : booking.phoneLocalNumber || booking.phone || "N/A",
          bookingCount: 0,
          lastBookingDate: booking.createdAt,
        };
      }
      clientsMap[booking.email].bookingCount++;
    });

    // Sort clients by most recent booking (using lastBookingDate)
    allClients = Object.values(clientsMap);

    allClients = Object.values(clientsMap);
    // Sort by lastBookingDate desc
    allClients.sort((a, b) => {
      const dateA = a.lastBookingDate ? a.lastBookingDate.seconds || 0 : 0;
      const dateB = b.lastBookingDate ? b.lastBookingDate.seconds || 0 : 0;
      return dateB - dateA;
    });

    renderClients(allClients);
  } catch (error) {
    console.error("Error loading clients:", error);
    showEmptyState("clients-table", "Error loading clients");
  }
}

function renderClients(clients) {
  const tbody = document.getElementById("clients-table");

  if (clients.length === 0) {
    showEmptyState("clients-table", "No clients found");
    return;
  }

  tbody.innerHTML = clients
    .map(
      (client) => `
      <tr>
        <td><strong>${client.name}</strong></td>
        <td>${client.email}</td>
        <td>${client.phone || "N/A"}</td>
        <td>${client.bookingCount}</td>
        <td>
          <button class="action-btn" onclick="viewClient('${client.email}')" title="View">
            <i class="ri-eye-line"></i>
          </button>
          <button class="action-btn" onclick="deleteClient('${client.email}')" title="Delete" style="color: #e74c3c;">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `,
    )
    .join("");
}

// Search Clients
document.getElementById("clients-search")?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm),
  );
  renderClients(filtered);
});

// Delete Client (Deletes all bookings for this client)
window.deleteClient = async function (email) {
  if (
    confirm(
      `Are you sure you want to delete client ${email}? This will DELETE ALL BOOKINGS associated with this email.`,
    )
  ) {
    try {
      const q = query(collection(db, "bookings"), where("email", "==", email));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      allClients = allClients.filter((c) => c.email !== email);
      renderClients(allClients);
      showToast("Client and associated bookings deleted", true);
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client");
    }
  }
};

// Updated loadDrivers function with Edit and Delete buttons
let allDrivers = [];

async function loadDrivers() {
  try {
    // Show loading state
    const tbody = document.getElementById("drivers-table");
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem;">
          <div class="spinner"></div>
        </td>
      </tr>
    `;

    // Query users collection where role = 'driver'
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      orderBy("createdAt", "desc"),
    );

    const driversSnapshot = await getDocs(driversQuery);
    allDrivers = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    renderDrivers(allDrivers);
  } catch (error) {
    console.error("Error loading drivers:", error);
    const tbody = document.getElementById("drivers-table");
    if (error.message.includes("index")) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #e74c3c; padding: 2rem;">
            <i class="ri-error-warning-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            <p><strong>Missing Database Index</strong></p>
            <p>To sort by date, a Firestore index is required.</p>
            <p>Please open the browser console (F12) and click the link provided by Firebase to create it.</p>
          </td>
        </tr>
      `;
    }
  }
}

function renderDrivers(drivers) {
  const tbody = document.getElementById("drivers-table");

  if (drivers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i class="ri-car-line"></i>
            <p>No drivers found.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = drivers
    .map(
      (driver) => `
    <tr>
      <td>
        <strong>${driver.name}</strong>
        ${driver.vehicle ? `<br><small style="color: #718096;">${driver.vehicle}</small>` : ""}
      </td>
      <td>${driver.email}</td>
      <td>${driver.phone || "N/A"}</td>
      <td><span class="status-badge status-${driver.status || "active"}">${capitalizeFirst(driver.status || "active")}</span></td>
      <td>
        <button class="action-btn" onclick="editDriver('${driver.id}')" title="Edit Driver">
          <i class="ri-edit-line"></i>
        </button>
        <button class="action-btn" onclick="viewDriverDetails('${driver.id}')" title="View Details" style="color: #2ecc71;">
          <i class="ri-eye-line"></i>
        </button>
        <button class="action-btn" onclick="deleteDriver('${driver.id}')" title="Delete Driver" style="color: #e74c3c;">
          <i class="ri-delete-bin-line"></i>
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}

// Search Drivers
document.getElementById("drivers-search")?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allDrivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm) ||
      driver.email.toLowerCase().includes(searchTerm),
  );
  renderDrivers(filtered);
});

// ==================== VIEW DRIVER DETAILS FUNCTIONALITY ====================

let currentViewDriverId = null;

// View Driver Details Function (replaces the alert version)
window.viewDriverDetails = async function (id) {
  currentViewDriverId = id;

  try {
    // Open modal FIRST so elements exist
    openModal("view-driver-modal");

    // Small delay to ensure DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch driver data
    const driverDoc = await getDoc(doc(db, "users", id));

    if (!driverDoc.exists()) {
      alert("Driver not found");
      closeModal("view-driver-modal");
      return;
    }

    const driver = driverDoc.data();

    // Fetch driver's tasks
    const tasksQuery = query(
      collection(db, "tasks"),
      where("driverId", "==", id),
      orderBy("date", "desc"),
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "in-progress",
    ).length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Helper function to safely set text
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    // Populate driver info
    setText("view-driver-name", driver.name || "N/A");
    setText("view-driver-email", driver.email || "N/A");
    setText("view-driver-phone", driver.phone || "N/A");

    // Status with color coding
    const statusElement = document.getElementById("view-driver-status");
    if (statusElement) {
      const status = driver.status || "active";
      statusElement.innerHTML = `<span class="status-badge status-${status}">${capitalizeFirst(status)}</span>`;
    }

    setText("view-driver-license", driver.license || "Not provided");
    setText("view-driver-vehicle", driver.vehicle || "Not provided");

    // Created date
    let createdDate = "N/A";
    if (driver.createdAt) {
      if (driver.createdAt.toDate) {
        createdDate = formatFullDate(
          driver.createdAt.toDate().toISOString().split("T")[0],
        );
      } else if (typeof driver.createdAt === "string") {
        createdDate = formatFullDate(driver.createdAt.split("T")[0]);
      }
    }
    setText("view-driver-created", createdDate);

    // Task statistics
    setText("view-driver-total-tasks", totalTasks);
    setText("view-driver-completed-tasks", completedTasks);
    setText("view-driver-pending-tasks", pendingTasks);
    setText("view-driver-inprogress-tasks", inProgressTasks);
    setText("view-driver-completion-rate", `${completionRate}%`);

    // Last task
    if (tasks.length > 0) {
      const lastTask = tasks[0];
      setText(
        "view-driver-last-task",
        `${lastTask.title} (${formatDate(lastTask.date)})`,
      );
    } else {
      setText("view-driver-last-task", "No tasks yet");
    }

    // Notes
    setText("view-driver-notes", driver.notes || "No notes available");

    // Populate recent tasks table (last 5)
    const tasksTable = document.getElementById("view-driver-tasks-table");
    if (tasks.length === 0) {
      tasksTable.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #a0aec0; padding: 2rem;">
            <i class="ri-task-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.3;"></i>
            No tasks assigned yet
          </td>
        </tr>
      `;
    } else {
      tasksTable.innerHTML = tasks
        .slice(0, 5)
        .map(
          (task) => `
        <tr style="cursor: pointer;" onclick="viewTask('${task.id}')">
          <td>
            <strong>${task.title || "Untitled"}</strong><br>
            <small style="color: #718096;">${task.pickupLocation || "N/A"} → ${task.destination || "N/A"}</small>
          </td>
          <td>${formatFullDate(task.date)}<br><small style="color: #718096;">${task.time || "N/A"}</small></td>
          <td>${task.clientName || "N/A"}</td>
          <td><span class="status-badge status-${task.status}">${capitalizeFirst(task.status || "pending")}</span></td>
        </tr>
      `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Error loading driver details:", error);
    alert("Error loading driver details. Please try again.");
    closeModal("view-driver-modal");
  }
};

// Handle "Edit Driver" button from view modal
document
  .getElementById("edit-from-view-driver-btn")
  ?.addEventListener("click", () => {
    if (currentViewDriverId) {
      closeModal("view-driver-modal");
      // Small delay to allow first modal to close
      setTimeout(() => {
        editDriver(currentViewDriverId);
      }, 300);
    }
  });

// Load tasks
let allTasks = [];

async function loadTasks() {
  try {
    const tbody = document.getElementById("tasks-table");
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem;">
          <div class="spinner"></div>
        </td>
      </tr>
    `;

    const tasksSnapshot = await getDocs(collection(db, "tasks"));
    allTasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all drivers to show names instead of IDs
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
    );
    const driversSnapshot = await getDocs(driversQuery);
    const driversMap = {};
    driversSnapshot.docs.forEach((doc) => {
      driversMap[doc.id] = doc.data().name;
    });

    renderTasks(allTasks, driversMap);
  } catch (error) {
    console.error("Error loading tasks:", error);
    showEmptyState("tasks-table", "Error loading tasks");
  }
}

function renderTasks(tasks, driversMap) {
  const tbody = document.getElementById("tasks-table");

  if (tasks.length === 0) {
    showEmptyState("tasks-table", "No tasks found");
    return;
  }

  tbody.innerHTML = tasks
    .map(
      (task) => `
    <tr>
      <td><strong>${task.title}</strong></td>
      <td>${driversMap[task.driverId] || "Unknown Driver"}</td>
      <td>
        ${task.clientName || "N/A"}<br>
        <small style="color: #718096;">${task.pickupLocation} → ${task.destination}</small>
      </td>
      <td>${formatDate(task.date)} ${task.time}</td>
      <td><span class="status-badge status-${task.status}">${capitalizeFirst(task.status)}</span></td>
      <td>
        <button class="action-btn" onclick="viewTask('${task.id}')" title="View">
          <i class="ri-eye-line"></i>
        </button>
        <button class="action-btn" onclick="editTask('${task.id}')" title="Edit">
          <i class="ri-edit-line"></i>
        </button>
        <button class="action-btn" onclick="deleteTask('${task.id}')" title="Delete" style="color: #e74c3c;">
          <i class="ri-delete-bin-line"></i>
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}

// Delete Task
window.deleteTask = async function (id) {
  if (confirm("Are you sure you want to delete this task?")) {
    try {
      await deleteDoc(doc(db, "tasks", id));
      allTasks = allTasks.filter((t) => t.id !== id);
      // We need to re-fetch drivers map or store it globally.
      // For simplicity, let's just reload the section or store driversMap globally.
      // Reloading section is safer.
      loadTasks();
      showToast("Task deleted successfully", true);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task");
    }
  }
};

// ==================== PAYMENT MANAGEMENT FUNCTIONALITY ====================

// Load payments function
let allPayments = [];

async function loadPayments() {
  try {
    const tbody = document.getElementById("payments-table");
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem;">
          <div class="spinner"></div>
        </td>
      </tr>
    `;

    const q = query(collection(db, "payments"), orderBy("date", "desc"));
    const paymentsSnapshot = await getDocs(q);
    allPayments = paymentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all bookings to show booking details
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    const bookingsMap = {};
    bookingsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      bookingsMap[doc.id] = {
        clientName: `${data.firstName} ${data.lastName}`,
        packageName: data.packageName,
      };
    });

    renderPayments(allPayments, bookingsMap);
  } catch (error) {
    console.error("Error loading payments:", error);
    showEmptyState("payments-table", "Error loading payments");
  }
}

function renderPayments(payments, bookingsMap) {
  const tbody = document.getElementById("payments-table");

  if (payments.length === 0) {
    showEmptyState("payments-table", "No payments found");
    return;
  }

  tbody.innerHTML = payments
    .map((payment) => {
      const booking = bookingsMap[payment.bookingId] || {
        clientName: "Unknown",
        packageName: "N/A",
      };

      return `
      <tr>
        <td><strong>${booking.packageName}</strong></td>
        <td>${booking.clientName}</td>
        <td style="font-weight: 700; color: #2ecc71;">${payment.currency} ${parseFloat(payment.amount).toFixed(2)}</td>
        <td>${payment.method}</td>
        <td>${formatDate(payment.date)}</td>
        <td><span class="status-badge status-${payment.status}">${capitalizeFirst(payment.status)}</span></td>
        <td>
          <button class="action-btn" onclick="viewPayment('${payment.id}')" title="View">
            <i class="ri-eye-line"></i>
          </button>
          <button class="action-btn" onclick="deletePayment('${payment.id}')" title="Delete" style="color: #e74c3c;">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Search Payments
document
  .getElementById("payments-search")
  ?.addEventListener("input", async (e) => {
    const searchTerm = e.target.value.toLowerCase();

    // We need bookingsMap for filtering by client name
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    const bookingsMap = {};
    bookingsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      bookingsMap[doc.id] = {
        clientName: `${data.firstName} ${data.lastName}`,
        packageName: data.packageName,
      };
    });

    const filtered = allPayments.filter((payment) => {
      const booking = bookingsMap[payment.bookingId] || { clientName: "" };
      return (
        booking.clientName.toLowerCase().includes(searchTerm) ||
        payment.amount.toString().includes(searchTerm) ||
        payment.method.toLowerCase().includes(searchTerm)
      );
    });
    renderPayments(filtered, bookingsMap);
  });

// Add Payment Button Handler - Replace the placeholder
document
  .getElementById("add-payment-btn")
  ?.addEventListener("click", async () => {
    // Load bookings into dropdown
    await loadBookingsDropdown();

    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("payment-date").value = today;

    // Open modal
    openModal("add-payment-modal");
  });

// Load bookings into payment form dropdown
async function loadBookingsDropdown() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    const bookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const select = document.getElementById("payment-booking");

    // Clear existing options
    select.innerHTML = '<option value="">Select a booking...</option>';

    if (bookings.length === 0) {
      select.innerHTML = '<option value="">No bookings available</option>';
      return;
    }

    // Sort bookings by date (newest first)
    bookings.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    // Add booking options
    bookings.forEach((booking) => {
      const option = document.createElement("option");
      option.value = booking.id;
      option.textContent = `${booking.firstName} ${booking.lastName} - ${booking.packageName} (${formatDate(booking.startDate)})`;
      // Store booking data as data attributes
      option.setAttribute(
        "data-client-name",
        `${booking.firstName} ${booking.lastName}`,
      );
      option.setAttribute("data-client-email", booking.email);
      option.setAttribute("data-package", booking.packageName);
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading bookings:", error);
  }
}

// Handle Add Payment Form Submission
document
  .getElementById("add-payment-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-payment-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Saving...';

      // Get form data
      const formData = new FormData(e.target);

      // Get selected booking details
      const bookingSelect = document.getElementById("payment-booking");
      const selectedOption = bookingSelect.options[bookingSelect.selectedIndex];
      const clientName = selectedOption.getAttribute("data-client-name");
      const clientEmail = selectedOption.getAttribute("data-client-email");
      const packageName = selectedOption.getAttribute("data-package");

      const paymentData = {
        bookingId: formData.get("bookingId"),
        clientName: clientName,
        clientEmail: clientEmail,
        packageName: packageName,
        amount: parseFloat(formData.get("amount")),
        currency: formData.get("currency"),
        method: formData.get("method"),
        date: formData.get("date"),
        reference: formData.get("reference")?.trim() || "",
        status: formData.get("status"),
        notes: formData.get("notes")?.trim() || "",
        createdAt: serverTimestamp(),
      };

      // Validate
      if (
        !paymentData.bookingId ||
        !paymentData.amount ||
        !paymentData.method ||
        !paymentData.date ||
        !paymentData.status
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (paymentData.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Create payment in Firestore
      await addDoc(collection(db, "payments"), paymentData);

      // Show success message
      const successDiv = document.getElementById("add-payment-success");
      successDiv.textContent = "✓ Payment recorded successfully!";
      successDiv.classList.add("show");

      // Hide success message after 2 seconds and close modal
      setTimeout(() => {
        successDiv.classList.remove("show");
        closeModal("add-payment-modal");

        // Reload payments list
        loadPayments();
      }, 2000);
    } catch (error) {
      console.error("Error adding payment:", error);
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
      alert(error.message);
    }
  });

// ==================== NEWSLETTER MANAGEMENT FUNCTIONALITY ====================

let allSubscribers = []; // Store for search filtering

async function loadNewsletter() {
  try {
    const tbody = document.getElementById("newsletter-table");
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 2rem;">
          <div class="spinner"></div>
        </td>
      </tr>
    `;

    const subscribersSnapshot = await getDocs(collection(db, "subscribers"));
    allSubscribers = subscribersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by date (newest first)
    allSubscribers.sort((a, b) => {
      const dateA = a.date
        ? a.date.toDate
          ? a.date.toDate()
          : new Date(a.date)
        : new Date(0);
      const dateB = b.date
        ? b.date.toDate
          ? b.date.toDate()
          : new Date(b.date)
        : new Date(0);
      return dateB - dateA;
    });

    document.getElementById("total-subscribers").textContent =
      allSubscribers.length;

    renderSubscribers(allSubscribers);
  } catch (error) {
    console.error("Error loading subscribers:", error);
    showEmptyState("newsletter-table", "Error loading subscribers");
  }
}

function renderSubscribers(subscribers) {
  const tbody = document.getElementById("newsletter-table");

  if (subscribers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3">
          <div class="empty-state">
            <i class="ri-mail-line"></i>
            <p>No subscribers found.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = subscribers
    .map((sub) => {
      let dateStr = "N/A";
      if (sub.date) {
        if (sub.date.toDate) {
          dateStr = formatDate(sub.date.toDate());
        } else {
          dateStr = formatDate(sub.date);
        }
      }

      return `
      <tr>
        <td><strong>${sub.email}</strong></td>
        <td>${dateStr}</td>
        <td>
          <button class="action-btn" onclick="deleteSubscriber('${sub.id}')" title="Delete" style="color: #e74c3c;">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

// Search functionality
document.getElementById("newsletter-search")?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = allSubscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm),
  );
  renderSubscribers(filtered);
});

// Download CSV functionality
document.getElementById("download-csv-btn")?.addEventListener("click", () => {
  if (allSubscribers.length === 0) {
    alert("No subscribers to download.");
    return;
  }

  const headers = ["Email", "Date Joined"];
  const csvContent = [
    headers.join(","),
    ...allSubscribers.map((sub) => {
      let dateStr = "";
      if (sub.date) {
        if (sub.date.toDate) {
          dateStr = sub.date.toDate().toISOString();
        } else {
          dateStr = new Date(sub.date).toISOString();
        }
      }
      return [sub.email, dateStr].join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Delete Subscriber
window.deleteSubscriber = async function (id) {
  if (confirm("Are you sure you want to delete this subscriber?")) {
    try {
      await deleteDoc(doc(db, "subscribers", id));

      // Remove from local array
      allSubscribers = allSubscribers.filter((s) => s.id !== id);

      // Re-render
      renderSubscribers(allSubscribers);

      // Update count
      document.getElementById("total-subscribers").textContent =
        allSubscribers.length;
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      alert("Error deleting subscriber. Please try again.");
    }
  }
};

// View Payment Details
let currentPaymentId = null;

window.viewPayment = async function (id) {
  currentPaymentId = id;

  try {
    openModal("view-payment-modal");
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch payment data
    const paymentDoc = await getDoc(doc(db, "payments", id));

    if (!paymentDoc.exists()) {
      alert("Payment not found");
      closeModal("view-payment-modal");
      return;
    }

    const payment = paymentDoc.data();

    // Fetch booking data
    let bookingData = null;
    if (payment.bookingId) {
      const bookingDoc = await getDoc(doc(db, "bookings", payment.bookingId));
      if (bookingDoc.exists()) {
        bookingData = bookingDoc.data();
      }
    }

    // Helper function to set text
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    };

    // Populate payment info
    setText(
      "view-payment-amount",
      `${payment.currency} ${parseFloat(payment.amount).toFixed(2)}`,
    );
    setText("view-payment-method", payment.method || "N/A");
    setText("view-payment-date", formatFullDate(payment.date));
    setText(
      "view-payment-reference",
      payment.reference || "No reference provided",
    );

    // Status with badge
    const statusElement = document.getElementById("view-payment-status");
    if (statusElement) {
      statusElement.innerHTML = `<span class="status-badge status-${payment.status}">${capitalizeFirst(payment.status)}</span>`;
    }

    // Client info
    setText("view-payment-client-name", payment.clientName || "N/A");
    setText("view-payment-client-email", payment.clientEmail || "N/A");

    if (bookingData) {
      setText(
        "view-payment-client-phone",
        `${bookingData.phoneCountryCode || ""} ${bookingData.phoneLocalNumber || "N/A"}`,
      );
      setText("view-payment-package", bookingData.packageName || "N/A");
      setText(
        "view-payment-dates",
        formatDateRange(bookingData.startDate, bookingData.endDate),
      );
      setText("view-payment-travelers", bookingData.travelers || "N/A");
    } else {
      setText("view-payment-client-phone", "N/A");
      setText("view-payment-package", payment.packageName || "N/A");
      setText("view-payment-dates", "N/A");
      setText("view-payment-travelers", "N/A");
    }

    // Notes
    setText("view-payment-notes", payment.notes || "No notes available");
  } catch (error) {
    console.error("Error loading payment:", error);
    alert("Error loading payment details. Please try again.");
    closeModal("view-payment-modal");
  }
};

// Delete Payment
window.deletePayment = async function (id) {
  if (
    !confirm(
      "Are you sure you want to delete this payment record? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    await deleteDoc(doc(db, "payments", id));
    showToast("Payment deleted successfully", true);
    await loadPayments();
  } catch (error) {
    console.error("Error deleting payment:", error);
    showToast("Failed to delete payment", false);
  }
};

// Delete payment from view modal
document
  .getElementById("delete-payment-btn")
  ?.addEventListener("click", async () => {
    if (!currentPaymentId) return;

    if (
      !confirm(
        "Are you sure you want to delete this payment record? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "payments", currentPaymentId));
      showToast("Payment deleted successfully", true);
      closeModal("view-payment-modal");
      await loadPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      showToast("Failed to delete payment", false);
    }
  });

// function showEmptyState(tableId, message) {
//   const tbody = document.getElementById(tableId);
//   const colspan = tbody.closest('table').querySelectorAll('th').length;
//   tbody.innerHTML = `
//     <tr>
//       <td colspan="${colspan}">
//         <div class="empty-state">
//           <i class="ri-inbox-line"></i>
//           <p>${message}</p>
//         </div>
//       </td>
//     </tr>
//   `;
// }

// Make functions globally available for onclick handlers
window.viewBooking = function (id) {
  alert(
    `View booking: ${id}\nThis will open a modal with full booking details.\nWe'll implement this in the next step!`,
  );
};

window.editBooking = function (id) {
  alert(
    `Edit booking: ${id}\nThis will open a form to edit the booking.\nComing in next step!`,
  );
};

// View Client Modal Functionality
window.viewClient = async function (email) {
  try {
    // Fetch all bookings for this client
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    const allBookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter bookings for this client
    const clientBookings = allBookings.filter((b) => b.email === email);

    if (clientBookings.length === 0) {
      alert("No bookings found for this client");
      return;
    }

    // Get client info from first booking
    // Assuming client details (name, phone) are consistent across their bookings
    const firstBooking = clientBookings[0];

    // Populate modal
    document.getElementById("view-client-name").textContent =
      `${firstBooking.firstName} ${firstBooking.lastName}`;
    document.getElementById("view-client-email").textContent = email;
    document.getElementById("view-client-phone").textContent =
      `${firstBooking.phoneCountryCode || ""} ${firstBooking.phoneLocalNumber || ""}`;
    document.getElementById("view-client-booking-count").textContent =
      clientBookings.length;

    // Populate bookings table
    const tbody = document.getElementById("view-client-bookings-table");
    tbody.innerHTML = clientBookings
      .map(
        (booking) => `
            <tr>
                <td>${booking.packageName || "N/A"}</td>
                <td>${formatDateRange(booking.startDate, booking.endDate)}</td>
                <td>${booking.travelers}</td>
                <td><span class="status-badge status-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
            </tr>
        `,
      )
      .join("");

    // Open modal
    openModal("view-client-modal");
  } catch (error) {
    console.error("Error loading client:", error);
    alert("Error loading client details");
  }
};

window.editDriver = function (id) {
  alert(`Edit driver: ${id}\nComing soon!`);
};

// ==================== ADD NEW BOOKING FUNCTIONALITY ====================

// Update the button handler - Replace the placeholder around line 700
document.getElementById("add-booking-btn")?.addEventListener("click", () => {
  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("add-booking-startdate").setAttribute("min", today);
  document.getElementById("add-booking-enddate").setAttribute("min", today);

  // Populate country dropdown
  renderAdminCountryDropdown();

  // Open modal
  openModal("add-booking-modal");
});

// Date validation for add booking form
document
  .getElementById("add-booking-startdate")
  ?.addEventListener("change", (e) => {
    const endDateInput = document.getElementById("add-booking-enddate");
    endDateInput.setAttribute("min", e.target.value);
    if (endDateInput.value && endDateInput.value < e.target.value) {
      endDateInput.value = "";
    }
  });

// Handle Add Booking Form Submission
document
  .getElementById("add-booking-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("create-booking-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Creating...';

      // Get form data
      const formData = new FormData(e.target);
      const phone = formData.get("phone").trim();

      // Simple phone parsing - extract country code and local number
      let phoneCountryCode = "";
      let phoneLocalNumber = phone;

      // If phone starts with +, try to extract country code
      if (phone.startsWith("+")) {
        // Simple extraction: take first 4 characters as country code
        const match = phone.match(/^(\+\d{1,4})\s*(.+)$/);
        if (match) {
          phoneCountryCode = match[1];
          phoneLocalNumber = match[2].replace(/\s/g, "");
        }
      }

      const bookingData = {
        firstName: formData.get("firstName").trim(),
        lastName: formData.get("lastName").trim(),
        email: formData.get("email").trim(),
        phone: phone,
        phoneCountryCode: phoneCountryCode,
        phoneLocalNumber: phoneLocalNumber,
        country: formData.get("country"),
        packageName: formData.get("packageName"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        travelers: parseInt(formData.get("travelers")),
        addon: formData.get("addon") || "None",
        status: formData.get("status"),
        message: formData.get("message")?.trim() || "",
        createdAt: serverTimestamp(),
      };

      // Validate required fields
      if (
        !bookingData.firstName ||
        !bookingData.lastName ||
        !bookingData.email ||
        !bookingData.phone ||
        !bookingData.country ||
        !bookingData.packageName ||
        !bookingData.startDate ||
        !bookingData.endDate ||
        !bookingData.travelers
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Validate dates
      if (new Date(bookingData.endDate) < new Date(bookingData.startDate)) {
        throw new Error("End date must be after start date");
      }

      // Validate travelers
      if (bookingData.travelers < 1) {
        throw new Error("Number of travelers must be at least 1");
      }

      // Create booking in Firestore
      const docRef = await addDoc(collection(db, "bookings"), bookingData);
      console.log("Booking created with ID:", docRef.id);

      // Show success message
      const successDiv = document.getElementById("add-booking-success");
      successDiv.textContent = "✓ Booking created successfully!";
      successDiv.classList.add("show");

      // Hide success message and close modal after 2 seconds
      setTimeout(() => {
        successDiv.classList.remove("show");
        closeModal("add-booking-modal");

        // Refresh bookings list
        const activeSection = document.querySelector(".content-section.active");
        if (activeSection.id === "bookings-section") {
          loadAllBookings();
        } else if (activeSection.id === "overview-section") {
          loadOverviewData();
        }

        // Show toast
        showToast("Booking created successfully!", true);
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);

      const errorDiv = document.getElementById("add-booking-error");
      errorDiv.textContent =
        "✗ " + (error.message || "Failed to create booking. Please try again.");
      errorDiv.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });

// document.getElementById('add-driver-btn')?.addEventListener('click', () => {
//   alert('Add driver form coming soon!');
// });

// document.getElementById('add-task-btn')?.addEventListener('click', () => {
//   alert('Create task form coming soon!');
// });

// document.getElementById('add-payment-btn')?.addEventListener('click', () => {
//   alert('Record payment form coming soon!');
// });

// ==================== MODAL FUNCTIONS ====================

// // Open modal
// function openModal(modalId) {
//   const modal = document.getElementById(modalId);
//   if (modal) {
//     modal.classList.add('active');
//     document.body.style.overflow = 'hidden';
//   }
// }

// // Close modal
window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";

    // Reset form
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }

    // Clear error messages
    const errorDiv = modal.querySelector(".form-error");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      errorDiv.textContent = "";
    }
  }
};

// ==================== ADD DRIVER FUNCTIONALITY (FIXED) ====================

// Update the button handler
document.getElementById("add-driver-btn")?.addEventListener("click", () => {
  openModal("add-driver-modal");
});

// Handle Add Driver Form Submission
document
  .getElementById("add-driver-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-driver-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Creating...';

      // Get form data
      const formData = new FormData(e.target);
      const driverData = {
        name: formData.get("name").trim(),
        email: formData.get("email").trim(),
        password: formData.get("password"),
        phone: formData.get("phone").trim(),
        license: formData.get("license")?.trim() || "",
        vehicle: formData.get("vehicle")?.trim() || "",
        notes: formData.get("notes")?.trim() || "",
      };

      // Validate
      if (
        !driverData.name ||
        !driverData.email ||
        !driverData.password ||
        !driverData.phone
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (driverData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Use a secondary app to create the user so we don't get logged out
      const { initializeApp, getApp, getApps } =
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
      const {
        getAuth,
        createUserWithEmailAndPassword: createSecondaryUser,
        signOut: signSecondaryOut,
        setPersistence,
        inMemoryPersistence,
      } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      const { firebaseConfig } = await import("./firebase-config.js");

      // Initialize secondary app with a unique name
      const secondaryAppName = "secondaryApp";
      let secondaryApp;

      // Check if already initialized
      const existingApps = getApps();
      const foundApp = existingApps.find(
        (app) => app.name === secondaryAppName,
      );

      if (foundApp) {
        secondaryApp = foundApp;
      } else {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      }

      const secondaryAuth = getAuth(secondaryApp);

      // CRITICAL: Set persistence to NONE (in-memory) so it doesn't affect the main auth session
      await setPersistence(secondaryAuth, inMemoryPersistence);

      // Set flag to prevent redirect
      window.isCreatingUser = true;

      try {
        // Create user using the secondary auth instance
        const userCredential = await createSecondaryUser(
          secondaryAuth,
          driverData.email,
          driverData.password,
        );

        const driverId = userCredential.user.uid;
        console.log("Driver created with ID:", driverId);

        // Save to Firestore using the MAIN app's db (which has the admin authenticated)
        await setDoc(doc(db, "users", driverId), {
          role: "driver",
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          license: driverData.license,
          vehicle: driverData.vehicle,
          notes: driverData.notes,
          status: "active",
          createdAt: serverTimestamp(),
        });

        console.log("Driver profile saved to Firestore");

        // Sign out the secondary user to clean up
        await signSecondaryOut(secondaryAuth);
      } finally {
        // Reset flag
        window.isCreatingUser = false;
      }

      // Close modal and show instructions
      closeModal("add-driver-modal");

      // Show detailed alert
      alert(
        `✓ Driver "${driverData.name}" created successfully!\n\nYou will now be redirected to login page.\nPlease log back in as admin to see the new driver.`,
      );

      // Redirect to login
      window.location.href = "admin.html";
    } catch (error) {
      console.error("Error creating driver:", error);

      let errorMessage = "Failed to create driver. ";

      if (error.code === "auth/email-already-in-use") {
        errorMessage += "This email exists in Firebase Authentication. Go to Firebase Console > Authentication to delete it completely.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage += "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage += "Password is too weak.";
      } else {
        errorMessage += error.message;
      }

      showFormError("add-driver-modal", errorMessage);

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });

// ==================== CREATE TASK FUNCTIONALITY ====================

// Update the button handler
document.getElementById("add-task-btn")?.addEventListener("click", async () => {
  openModal("create-task-modal");

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("task-date").setAttribute("min", today);

  // Load drivers into dropdown
  await loadDriversDropdown();
});

// Load drivers into task form dropdown
async function loadDriversDropdown() {
  try {
    // Query users collection where role = 'driver'
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
    );

    const driversSnapshot = await getDocs(driversQuery);
    const drivers = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const select = document.getElementById("task-driver");

    // Clear existing options except first one
    select.innerHTML = '<option value="">Select a driver...</option>';

    if (drivers.length === 0) {
      select.innerHTML =
        '<option value="">No drivers available - Add a driver first</option>';
      return;
    }

    // Add driver options
    drivers.forEach((driver) => {
      const option = document.createElement("option");
      option.value = driver.id;
      option.textContent = `${driver.name} - ${driver.phone}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading drivers:", error);
  }
}

// Handle Create Task Form Submission
document
  .getElementById("create-task-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-task-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Creating...';

      // Get form data
      const formData = new FormData(e.target);
      const taskData = {
        title: formData.get("title").trim(),
        driverId: formData.get("driverId"),
        date: formData.get("date"),
        time: formData.get("time"),
        clientName: formData.get("clientName")?.trim() || "",
        clientPhone: formData.get("clientPhone")?.trim() || "",
        pickupLocation: formData.get("pickupLocation").trim(),
        destination: formData.get("destination").trim(),
        priority: formData.get("priority"),
        notes: formData.get("notes")?.trim() || "",
        status: "pending",
        createdAt: serverTimestamp(),
      };

      // Validate required fields
      if (
        !taskData.title ||
        !taskData.driverId ||
        !taskData.date ||
        !taskData.time ||
        !taskData.pickupLocation ||
        !taskData.destination
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Create task in Firestore
      await addDoc(collection(db, "tasks"), taskData);

      // SEND EMAIL NOTIFICATION
      const emailSent = await sendTaskEmail(taskData, taskData.driverId, "assigned");
      if (emailSent) {
        showToast("Task created & Driver notified!", true);
      } else {
        showToast("Task created (Email skipped/failed)", true);
      }

      closeModal("create-task-modal");

      // Reload tasks list
      await loadTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      showFormError(
        "create-task-modal",
        error.message || "Failed to create task",
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });

// // Add CSS animation for toast
// const style = document.createElement('style');
// style.textContent = `
//   @keyframes slideInRight {
//     from {
//       transform: translateX(400px);
//       opacity: 0;
//     }
//     to {
//       transform: translateX(0);
//       opacity: 1;
//     }
//   }

//   @keyframes slideOutRight {
//     from {
//       transform: translateX(0);
//       opacity: 1;
//     }
//     to {
//       transform: translateX(400px);
//       opacity: 0;
//     }
//   }
// `;
// document.head.appendChild(style);

// Task actions (placeholders)
window.viewTask = function (id) {
  alert(`View task: ${id}\nTask details modal coming soon!`);
};

window.editTask = function (id) {
  alert(`Edit task: ${id}\nEdit task form coming soon!`);
};

// ==================== VIEW BOOKING MODAL ====================

let currentBookingId = null;

// Update the viewBooking function that's already in your code
window.viewBooking = async function (id) {
  currentBookingId = id;

  try {
    // Fetch booking data
    const bookingDoc = await getDoc(doc(db, "bookings", id));

    if (!bookingDoc.exists()) {
      alert("Booking not found");
      return;
    }

    const booking = bookingDoc.data();

    // Populate modal with booking data
    document.getElementById("booking-client-name").textContent =
      `${booking.firstName} ${booking.lastName}`;
    document.getElementById("booking-client-email").textContent = booking.email;
    document.getElementById("booking-client-phone").textContent =
      `${booking.phoneCountryCode || ""} ${booking.phoneLocalNumber || booking.phone || "N/A"}`;

    document.getElementById("booking-package").textContent =
      booking.packageName || "N/A";
    document.getElementById("booking-start-date").textContent = formatFullDate(
      booking.startDate,
    );
    document.getElementById("booking-end-date").textContent = formatFullDate(
      booking.endDate,
    );
    document.getElementById("booking-travelers").textContent =
      booking.travelers;
    document.getElementById("booking-addon").textContent =
      booking.addon || "None";

    document.getElementById("booking-message").textContent =
      booking.message || "No special requests";

    // Set current status in dropdown
    document.getElementById("booking-status-select").value =
      booking.status || "pending";

    // Show booking creation date
    const createdDate = booking.createdAt?.toDate
      ? formatFullDate(booking.createdAt.toDate().toISOString().split("T")[0])
      : "N/A";
    document.getElementById("booking-created-date").textContent = createdDate;

    // Clear any previous messages
    document.getElementById("booking-update-success").classList.remove("show");
    document.getElementById("booking-update-error").classList.remove("show");

    // Open modal
    openModal("view-booking-modal");
  } catch (error) {
    console.error("Error loading booking:", error);
    alert("Error loading booking details. Please try again.");
  }
};

// Handle status update
document
  .getElementById("update-status-btn")
  ?.addEventListener("click", async () => {
    if (!currentBookingId) return;

    const updateBtn = document.getElementById("update-status-btn");
    const originalHTML = updateBtn.innerHTML;
    const newStatus = document.getElementById("booking-status-select").value;

    try {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<div class="spinner"></div> Updating...';

      // Update status in Firestore
      await updateDoc(doc(db, "bookings", currentBookingId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Show success message
      const successDiv = document.getElementById("booking-update-success");
      successDiv.textContent = `✓ Status updated to "${capitalizeFirst(newStatus)}"`;
      successDiv.classList.add("show");

      // Hide after 3 seconds
      setTimeout(() => {
        successDiv.classList.remove("show");
      }, 3000);

      // Refresh the bookings list
      const activeSection = document.querySelector(".content-section.active");
      if (activeSection.id === "bookings-section") {
        await loadAllBookings();
      } else if (activeSection.id === "overview-section") {
        await loadOverviewData();
      }
    } catch (error) {
      console.error("Error updating status:", error);

      const errorDiv = document.getElementById("booking-update-error");
      errorDiv.textContent = "✗ Failed to update status. Please try again.";
      errorDiv.classList.add("show");
    } finally {
      updateBtn.disabled = false;
      updateBtn.innerHTML = originalHTML;
    }
  });

// ==================== VIEW TASK MODAL ====================

let currentTaskId = null;

// Update the viewTask function
window.viewTask = async function (id) {
  currentTaskId = id;

  try {
    // Open modal FIRST so elements exist
    openModal("view-task-modal");

    // Small delay to ensure DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch task data
    const taskDoc = await getDoc(doc(db, "tasks", id));

    if (!taskDoc.exists()) {
      alert("Task not found");
      closeModal("view-task-modal");
      return;
    }

    const task = taskDoc.data();
    console.log("Task data:", task);

    // Fetch driver data
    let driverData = { name: "Unknown", email: "N/A", phone: "N/A" };
    if (task.driverId) {
      const driverDoc = await getDoc(doc(db, "users", task.driverId));
      if (driverDoc.exists()) {
        driverData = driverDoc.data();
      }
    }

    // Helper function to safely set text
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        console.log(`Set ${id} to:`, value);
      } else {
        console.error(`Element not found: ${id}`);
      }
    };

    // Populate modal with task data using the NEW IDs with "view-" prefix
    setText("view-task-title", task.title || "No title");
    setText("view-task-date", task.date ? formatFullDate(task.date) : "N/A");
    setText("view-task-time", task.time || "N/A");

    // Priority with color coding
    const priorityElement = document.getElementById("view-task-priority");
    if (priorityElement) {
      const priority = task.priority || "normal";
      priorityElement.textContent = capitalizeFirst(priority);
      priorityElement.style.color =
        priority === "high"
          ? "#e74c3c"
          : priority === "low"
            ? "#2ecc71"
            : "#f59e0b";
      priorityElement.style.fontWeight = "600";
    }

    // Driver info
    setText("view-task-driver-name", driverData.name || "Unknown");
    setText("view-task-driver-email", driverData.email || "N/A");
    setText("view-task-driver-phone", driverData.phone || "N/A");

    // Client info
    setText("view-task-client-name", task.clientName || "Not provided");
    setText("view-task-client-phone", task.clientPhone || "Not provided");

    // Location
    setText("view-task-pickup", task.pickupLocation || "Not specified");
    setText("view-task-destination", task.destination || "Not specified");

    // Notes
    setText("view-task-notes", task.notes || "No notes provided");

    // Status
    const statusSelect = document.getElementById("task-status-select");
    if (statusSelect) {
      statusSelect.value = task.status || "pending";
    }

    // Created date
    let createdDate = "N/A";
    if (task.createdAt) {
      if (task.createdAt.toDate) {
        createdDate = formatFullDate(
          task.createdAt.toDate().toISOString().split("T")[0],
        );
      } else if (typeof task.createdAt === "string") {
        createdDate = formatFullDate(task.createdAt.split("T")[0]);
      }
    }
    setText("task-created-date", createdDate);

    // Completed date
    const completedContainer = document.getElementById(
      "task-completed-container",
    );
    if (completedContainer) {
      if (task.status === "completed" && task.completedAt) {
        const completedDate = formatFullDate(task.completedAt.split("T")[0]);
        setText("task-completed-date", completedDate);
        completedContainer.style.display = "flex";
      } else {
        completedContainer.style.display = "none";
      }
    }

    // Clear any previous messages
    document.getElementById("task-update-success")?.classList.remove("show");
    document.getElementById("task-update-error")?.classList.remove("show");
  } catch (error) {
    console.error("Error loading task:", error);
    alert("Error loading task details. Please try again.");
    closeModal("view-task-modal");
  }
};

// Handle task status update
document
  .getElementById("update-task-status-btn")
  ?.addEventListener("click", async () => {
    if (!currentTaskId) return;

    const updateBtn = document.getElementById("update-task-status-btn");
    const originalHTML = updateBtn.innerHTML;
    const newStatus = document.getElementById("task-status-select").value;

    try {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<div class="spinner"></div> Updating...';

      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      // If marking as completed, add completedAt timestamp
      if (newStatus === "completed") {
        updateData.completedAt = new Date().toISOString();
      }

      // Update status in Firestore
      await updateDoc(doc(db, "tasks", currentTaskId), updateData);

      // Show success message
      const successDiv = document.getElementById("task-update-success");
      if (successDiv) {
        successDiv.textContent = `✓ Task status updated to "${capitalizeFirst(newStatus)}"`;
        successDiv.classList.add("show");

        // Hide after 3 seconds
        setTimeout(() => {
          successDiv.classList.remove("show");
        }, 3000);
      }

      // Refresh the tasks list
      await loadTasks();

      // Update completed date display if applicable
      if (newStatus === "completed") {
        const completedContainer = document.getElementById(
          "task-completed-container",
        );
        const completedDate = formatFullDate(
          new Date().toISOString().split("T")[0],
        );
        document.getElementById("task-completed-date").textContent =
          completedDate;
        if (completedContainer) {
          completedContainer.style.display = "flex";
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);

      const errorDiv = document.getElementById("task-update-error");
      if (errorDiv) {
        errorDiv.textContent = "✗ Failed to update status. Please try again.";
        errorDiv.classList.add("show");
      }
    } finally {
      updateBtn.disabled = false;
      updateBtn.innerHTML = originalHTML;
    }
  });

// Handle task deletion
document
  .getElementById("delete-task-btn")
  ?.addEventListener("click", async () => {
    if (!currentTaskId) return;

    if (
      !confirm(
        "Are you sure you want to delete this task? This action cannot be undone.",
      )
    ) {
      return;
    }

    const deleteBtn = document.getElementById("delete-task-btn");
    const originalHTML = deleteBtn.innerHTML;

    try {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<div class="spinner"></div> Deleting...';

      // Delete task from Firestore
      await deleteDoc(doc(db, "tasks", currentTaskId));

      showToast("Task deleted successfully", true);
      closeModal("view-task-modal");

      // Refresh the tasks list
      await loadTasks();

      // Update stats
      await loadOverviewData();
    } catch (error) {
      console.error("Error deleting task:", error);

      const errorDiv = document.getElementById("task-update-error");
      if (errorDiv) {
        errorDiv.textContent = "✗ Failed to delete task. Please try again.";
        errorDiv.classList.add("show");
      }

      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalHTML;
    }
  });

// ==================== EDIT BOOKING FUNCTIONALITY ====================

let currentEditingBookingId = null;

// Update the editBooking function
window.editBooking = async function (id) {
  currentEditingBookingId = id;

  try {
    // Fetch booking data
    const bookingDoc = await getDoc(doc(db, "bookings", id));

    if (!bookingDoc.exists()) {
      alert("Booking not found");
      return;
    }

    const booking = bookingDoc.data();

    // Pre-fill form fields
    document.getElementById("edit-booking-firstname").value =
      booking.firstName || "";
    document.getElementById("edit-booking-lastname").value =
      booking.lastName || "";
    document.getElementById("edit-booking-email").value = booking.email || "";
    document.getElementById("edit-booking-phone").value = booking.phone || "";
    document.getElementById("edit-booking-package").value =
      booking.packageName || "";
    document.getElementById("edit-booking-startdate").value =
      booking.startDate || "";
    document.getElementById("edit-booking-enddate").value =
      booking.endDate || "";
    document.getElementById("edit-booking-travelers").value =
      booking.travelers || 1;
    document.getElementById("edit-booking-addon").value = booking.addon || "";
    document.getElementById("edit-booking-status").value =
      booking.status || "pending";
    document.getElementById("edit-booking-message").value =
      booking.message || "";

    // Clear any previous messages
    document.getElementById("edit-booking-error").classList.remove("show");
    document.getElementById("edit-booking-success").classList.remove("show");

    // Open modal
    openModal("edit-booking-modal");
  } catch (error) {
    console.error("Error loading booking for edit:", error);
    alert("Error loading booking. Please try again.");
  }
};

// Handle Edit Booking Form Submission
document
  .getElementById("edit-booking-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentEditingBookingId) {
      alert("No booking selected for editing");
      return;
    }

    const submitBtn = document.getElementById("update-booking-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Updating...';

      // Get form data
      const formData = new FormData(e.target);
      const phone = formData.get("phone").trim();

      // Parse phone number into country code and local number
      let phoneCountryCode = "";
      let phoneLocalNumber = phone;

      // If phone starts with +, try to extract country code
      if (phone.startsWith("+")) {
        const match = phone.match(/^(\+\d{1,4})\s*(.+)$/);
        if (match) {
          phoneCountryCode = match[1];
          phoneLocalNumber = match[2].replace(/\s/g, "");
        }
      }

      const updatedData = {
        firstName: formData.get("firstName").trim(),
        lastName: formData.get("lastName").trim(),
        email: formData.get("email").trim(),
        phone: phone,
        phoneCountryCode: phoneCountryCode,
        phoneLocalNumber: phoneLocalNumber,
        packageName: formData.get("packageName").trim(),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        travelers: parseInt(formData.get("travelers")),
        addon: formData.get("addon")?.trim() || "",
        status: formData.get("status"),
        message: formData.get("message")?.trim() || "",
        updatedAt: serverTimestamp(),
      };

      // Validate
      if (
        !updatedData.firstName ||
        !updatedData.lastName ||
        !updatedData.email ||
        !updatedData.phone ||
        !updatedData.packageName ||
        !updatedData.startDate ||
        !updatedData.endDate ||
        !updatedData.travelers
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Validate dates
      if (new Date(updatedData.endDate) < new Date(updatedData.startDate)) {
        throw new Error("End date must be after start date");
      }

      // Update booking in Firestore
      await updateDoc(
        doc(db, "bookings", currentEditingBookingId),
        updatedData,
      );

      // Show success message
      const successDiv = document.getElementById("edit-booking-success");
      successDiv.textContent = "✓ Booking updated successfully!";
      successDiv.classList.add("show");

      // Hide success message after 2 seconds and close modal
      setTimeout(() => {
        successDiv.classList.remove("show");
        closeModal("edit-booking-modal");

        // Refresh the bookings list
        const activeSection = document.querySelector(".content-section.active");
        if (activeSection.id === "bookings-section") {
          loadAllBookings();
        } else if (activeSection.id === "overview-section") {
          loadOverviewData();
        }
      }, 2000);
    } catch (error) {
      console.error("Error updating booking:", error);

      const errorDiv = document.getElementById("edit-booking-error");
      errorDiv.textContent =
        "✗ " + (error.message || "Failed to update booking. Please try again.");
      errorDiv.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });

// Date validation for edit form
document
  .getElementById("edit-booking-startdate")
  ?.addEventListener("change", (e) => {
    const endDateInput = document.getElementById("edit-booking-enddate");
    endDateInput.setAttribute("min", e.target.value);
    if (endDateInput.value && endDateInput.value < e.target.value) {
      endDateInput.value = "";
    }
  });

// ==================== EDIT TASK FUNCTIONALITY ====================

let currentEditingTaskId = null;

// Update the editTask function
window.editTask = async function (id) {
  currentEditingTaskId = id;

  try {
    // Fetch task data
    const taskDoc = await getDoc(doc(db, "tasks", id));

    if (!taskDoc.exists()) {
      alert("Task not found");
      return;
    }

    const task = taskDoc.data();

    // Load drivers into dropdown first
    await loadEditTaskDriversDropdown();

    // Pre-fill form fields
    document.getElementById("edit-task-title").value = task.title || "";
    document.getElementById("edit-task-driver").value = task.driverId || "";
    document.getElementById("edit-task-date").value = task.date || "";
    document.getElementById("edit-task-time").value = task.time || "";
    document.getElementById("edit-task-client-name").value =
      task.clientName || "";
    document.getElementById("edit-task-client-phone").value =
      task.clientPhone || "";
    document.getElementById("edit-task-pickup").value =
      task.pickupLocation || "";
    document.getElementById("edit-task-destination").value =
      task.destination || "";
    document.getElementById("edit-task-priority").value =
      task.priority || "normal";
    document.getElementById("edit-task-status").value =
      task.status || "pending";
    document.getElementById("edit-task-notes").value = task.notes || "";

    // Set minimum date to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("edit-task-date").setAttribute("min", today);

    // Clear any previous messages
    document.getElementById("edit-task-error").classList.remove("show");
    document.getElementById("edit-task-success").classList.remove("show");

    // Open modal
    openModal("edit-task-modal");
  } catch (error) {
    console.error("Error loading task for edit:", error);
    alert("Error loading task. Please try again.");
  }
};

// Load drivers into edit task form dropdown
async function loadEditTaskDriversDropdown() {
  try {
    const driversQuery = query(
      collection(db, "users"),
      where("role", "==", "driver"),
    );

    const driversSnapshot = await getDocs(driversQuery);
    const drivers = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const select = document.getElementById("edit-task-driver");

    // Clear existing options except first one
    select.innerHTML = '<option value="">Select a driver...</option>';

    if (drivers.length === 0) {
      select.innerHTML = '<option value="">No drivers available</option>';
      return;
    }

    // Add driver options
    drivers.forEach((driver) => {
      const option = document.createElement("option");
      option.value = driver.id;
      option.textContent = `${driver.name} - ${driver.phone}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading drivers:", error);
  }
}

// Handle Edit Task Form Submission
document
  .getElementById("edit-task-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentEditingTaskId) {
      alert("No task selected for editing");
      return;
    }

    const submitBtn = document.getElementById("update-task-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Updating...';

      // Get form data
      const formData = new FormData(e.target);
      const updatedData = {
        title: formData.get("title").trim(),
        driverId: formData.get("driverId"),
        date: formData.get("date"),
        time: formData.get("time"),
        clientName: formData.get("clientName")?.trim() || "",
        clientPhone: formData.get("clientPhone")?.trim() || "",
        pickupLocation: formData.get("pickupLocation").trim(),
        destination: formData.get("destination").trim(),
        priority: formData.get("priority"),
        status: formData.get("status"),
        notes: formData.get("notes")?.trim() || "",
        updatedAt: serverTimestamp(),
      };

      // Validate required fields
      if (
        !updatedData.title ||
        !updatedData.driverId ||
        !updatedData.date ||
        !updatedData.time ||
        !updatedData.pickupLocation ||
        !updatedData.destination
      ) {
        throw new Error("Please fill in all required fields");
      }

      // If status changed to completed, add completedAt timestamp
      if (updatedData.status === "completed") {
        const currentTask = await getDoc(
          doc(db, "tasks", currentEditingTaskId),
        );
        if (currentTask.exists() && currentTask.data().status !== "completed") {
          updatedData.completedAt = new Date().toISOString();
        }
      }

      // Update task in Firestore
      await updateDoc(doc(db, "tasks", currentEditingTaskId), updatedData);

      // SEND EMAIL NOTIFICATION (Assign/Update)
      // We pass the updated data and the assigned driver ID
      const emailSent = await sendTaskEmail(updatedData, updatedData.driverId, "updated");
      const successMsg = emailSent ? "Task updated & Driver notified!" : "Task updated (Email skipped)";

      // Show success message
      const successDiv = document.getElementById("edit-task-success");
      successDiv.textContent = `✓ ${successMsg}`;
      successDiv.classList.add("show");

      // Hide success message after 2 seconds and close modal
      setTimeout(() => {
        successDiv.classList.remove("show");
        closeModal("edit-task-modal");

        // Refresh the tasks list
        loadTasks();

        // Update stats
        loadOverviewData();
      }, 2000);
    } catch (error) {
      console.error("Error updating task:", error);

      const errorDiv = document.getElementById("edit-task-error");
      errorDiv.textContent =
        "✗ " + (error.message || "Failed to update task. Please try again.");
      errorDiv.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });

// ==================== EDIT DRIVER FUNCTIONALITY ====================

let currentEditingDriverId = null;

// Update the editDriver function in admin.js
window.editDriver = async function (id) {
  currentEditingDriverId = id;

  try {
    // Fetch driver data
    const driverDoc = await getDoc(doc(db, "users", id));

    if (!driverDoc.exists()) {
      alert("Driver not found");
      return;
    }

    const driver = driverDoc.data();

    // Pre-fill form fields
    document.getElementById("edit-driver-name").value = driver.name || "";
    document.getElementById("edit-driver-email").value = driver.email || "";
    document.getElementById("edit-driver-phone").value = driver.phone || "";
    document.getElementById("edit-driver-license").value = driver.license || "";
    document.getElementById("edit-driver-vehicle").value = driver.vehicle || "";
    document.getElementById("edit-driver-status").value =
      driver.status || "active";
    document.getElementById("edit-driver-notes").value = driver.notes || "";

    // Clear any previous messages
    document.getElementById("edit-driver-error").classList.remove("show");
    document.getElementById("edit-driver-success").classList.remove("show");

    // Open modal
    openModal("edit-driver-modal");
  } catch (error) {
    console.error("Error loading driver for edit:", error);
    alert("Error loading driver. Please try again.");
  }
};

// Handle Edit Driver Form Submission
document
  .getElementById("edit-driver-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentEditingDriverId) {
      alert("No driver selected for editing");
      return;
    }

    const submitBtn = document.getElementById("update-driver-btn");
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Updating...';

      // Get form data
      const formData = new FormData(e.target);
      const updatedData = {
        name: formData.get("name").trim(),
        phone: formData.get("phone").trim(),
        license: formData.get("license")?.trim() || "",
        vehicle: formData.get("vehicle")?.trim() || "",
        status: formData.get("status"),
        notes: formData.get("notes")?.trim() || "",
        updatedAt: serverTimestamp(),
      };

      // Validate required fields
      if (!updatedData.name || !updatedData.phone) {
        throw new Error("Please fill in all required fields");
      }

      // Update driver in Firestore (users collection)
      await updateDoc(doc(db, "users", currentEditingDriverId), updatedData);

      // Also update in drivers collection if it exists
      try {
        await updateDoc(
          doc(db, "drivers", currentEditingDriverId),
          updatedData,
        );
      } catch (err) {
        // Drivers collection might not exist for older entries
        console.log("Drivers collection not updated:", err);
      }

      // Show success message
      const successDiv = document.getElementById("edit-driver-success");
      successDiv.textContent = "✓ Driver updated successfully!";
      successDiv.classList.add("show");

      // Hide success message after 2 seconds and close modal
      setTimeout(() => {
        successDiv.classList.remove("show");
        closeModal("edit-driver-modal");

        // Refresh the drivers list
        loadDrivers();
      }, 2000);
    } catch (error) {
      console.error("Error updating driver:", error);

      const errorDiv = document.getElementById("edit-driver-error");
      errorDiv.textContent =
        "✗ " + (error.message || "Failed to update driver. Please try again.");
      errorDiv.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  });

// Optional: Delete Driver Function
window.deleteDriver = async function (id) {
  if (
    !confirm(
      "Are you sure? This deletes the Driver Data but NOT their Login Account.\n\nTo re-register this email later, you MUST also delete them in the Firebase Console.",
    )
  ) {
    return;
  }

  try {
    // Delete from users collection
    await deleteDoc(doc(db, "users", id));

    // Delete from drivers collection if it exists
    try {
      await deleteDoc(doc(db, "drivers", id));
    } catch (err) {
      console.log("Driver doc not in drivers collection");
    }

    // Optional: Delete or reassign their tasks
    const tasksQuery = query(
      collection(db, "tasks"),
      where("driverId", "==", id),
    );
    const tasksSnapshot = await getDocs(tasksQuery);

    const deletePromises = tasksSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    showToast("Driver and associated tasks deleted successfully", true);

    // Refresh drivers list
    await loadDrivers();
  } catch (error) {
    console.error("Error deleting driver:", error);
    showToast("Failed to delete driver", false);
  }
};

// ==================== HELPER FUNCTIONS (CONSOLIDATED) ====================
// Place these at the very bottom of your admin.js file
// Remove any duplicate versions of these functions from above

// Format date range (e.g., "Jan 5 - Jan 10")
function formatDateRange(start, end) {
  if (!start || !end) return "N/A";
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options = { month: "short", day: "numeric" };
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  } catch (error) {
    // Return original strings if date parsing fails
    return `${start} - ${end}`;
  }
}

// Format single date with day (e.g., "Mon, Jan 5, 2024")
function formatFullDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return dateString;
  }
}

// Format single date without day (e.g., "Jan 5, 2024")
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return dateString;
  }
}

// Capitalize first letter and replace hyphens with spaces
function capitalizeFirst(str) {
  if (!str) return "";
  // Capitalize the first letter and replace hyphens with spaces (e.g., 'in-progress' -> 'In Progress')
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

// Show empty state in tables
function showEmptyState(tableId, message) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;

  const colspan = tbody.closest("table")?.querySelectorAll("th").length || 5;
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}">
        <div class="empty-state">
          <i class="ri-inbox-line"></i>
          <p>${message}</p>
        </div>
      </td>
    </tr>
  `;
}

// Toast notification
function showToast(message, success = true) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "2rem";
  toast.style.right = "2rem";
  toast.style.background = success ? "#2ecc71" : "#e74c3c";
  toast.style.color = "white";
  toast.style.padding = "1rem 1.5rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.zIndex = "10000";
  toast.style.fontWeight = "600";
  toast.style.animation = "slideInRight 0.3s ease-out";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show form error
function showFormError(modalId, message) {
  const errorDiv = document.querySelector(`#${modalId} .form-error`);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add("show");
    errorDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// Open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Close modal
window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";

    // Reset form
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }

    // Clear error messages
    const errorDiv = modal.querySelector(".form-error");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      errorDiv.textContent = "";
    }

    // Clear success messages
    const successDiv = modal.querySelector(".form-success");
    if (successDiv) {
      successDiv.classList.remove("show");
      successDiv.textContent = "";
    }
  }
};
