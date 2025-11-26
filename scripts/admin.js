// Admin Dashboard JavaScript
// This file handles all admin functionality

import { auth, db } from './firebase-config.js';
import {
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Check authentication and authorization
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in, redirect to login
    window.location.href = 'login.html';
    return;
  }

  // Check if user is admin
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      alert('User profile not found. Please contact administrator.');
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }

    const userData = userDoc.data();

    if (userData.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      await signOut(auth);
      window.location.href = 'login.html';
      return;
    }

    // User is authenticated and authorized
    document.getElementById('user-name').textContent = userData.name || user.email;

    // Load dashboard data
    initDashboard();

  } catch (error) {
    console.error('Auth check error:', error);
    alert('Error checking permissions. Please try again.');
    window.location.href = 'login.html';
  }
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', async () => {
  console.log('log out clicked');
  if (confirm('Are you sure you want to logout?')) {
    try {
      await signOut(auth);
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  }
});

// Navigation functionality
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const sectionName = item.dataset.section;

    // Update active nav item
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    // Show corresponding content section
    contentSections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // Load section data if needed
    loadSectionData(sectionName);
  });
});

// Initialize dashboard
async function initDashboard() {
  try {
    await loadOverviewData();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Load overview data
async function loadOverviewData() {
  try {
    // Load bookings
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Update stats
    document.getElementById('total-bookings').textContent = bookings.length;

    // Get unique clients
    const uniqueClients = new Set(bookings.map(b => b.email));
    document.getElementById('total-clients').textContent = uniqueClients.size;

    // Load drivers count
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    document.getElementById('total-drivers').textContent = driversSnapshot.size;

    // Load tasks count
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const pendingTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'pending');
    document.getElementById('total-tasks').textContent = pendingTasks.length;

    // Display recent bookings (last 5)
    displayRecentBookings(bookings.slice(0, 5));

  } catch (error) {
    console.error('Error loading overview:', error);
    showEmptyState('recent-bookings-table', 'Error loading data');
  }
}

// Display recent bookings
function displayRecentBookings(bookings) {
  const tbody = document.getElementById('recent-bookings-table');

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

  tbody.innerHTML = bookings.map(booking => `
    <tr>
      <td>
        <strong>${booking.firstName} ${booking.lastName}</strong><br>
        <small style="color: #718096;">${booking.email}</small>
      </td>
      <td>${booking.packageName || 'N/A'}</td>
      <td>${formatDateRange(booking.startDate, booking.endDate)}</td>
      <td><span class="status-badge status-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
      <td>
        <button class="action-btn" onclick="viewBooking('${booking.id}')" title="View Details">
          <i class="ri-eye-line"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Load section-specific data
async function loadSectionData(section) {
  switch (section) {
    case 'bookings':
      await loadAllBookings();
      break;
    case 'clients':
      await loadClients();
      break;
    case 'drivers':
      await loadDrivers();
      break;
    case 'tasks':
      await loadTasks();
      break;
    case 'payments':
      await loadPayments();
      break;
  }
}

// Load all bookings
async function loadAllBookings() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const tbody = document.getElementById('bookings-table');

    if (bookings.length === 0) {
      showEmptyState('bookings-table', 'No bookings yet');
      return;
    }

    tbody.innerHTML = bookings.map(booking => `
      <tr>
        <td><strong>${booking.firstName} ${booking.lastName}</strong></td>
        <td>${booking.email}</td>
        <td>${booking.phoneCountryCode + '-' + booking.phoneLocalNumber || 'N/A'}</td>
        <td>${booking.packageName || 'N/A'}</td>
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
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading bookings:', error);
    showEmptyState('bookings-table', 'Error loading bookings');
  }
}

// Load clients
async function loadClients() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnapshot.docs.map(doc => doc.data());

    // Group by email
    const clientsMap = {};
    bookings.forEach(booking => {
      if (!clientsMap[booking.email]) {
        clientsMap[booking.email] = {
          name: `${booking.firstName} ${booking.lastName}`,
          email: booking.email,
          phone: booking.phoneCountryCode + '-' + booking.phoneLocalNumber,
          bookingCount: 0
        };
      }
      clientsMap[booking.email].bookingCount++;
    });

    const clients = Object.values(clientsMap);
    const tbody = document.getElementById('clients-table');

    if (clients.length === 0) {
      showEmptyState('clients-table', 'No clients yet');
      return;
    }

    tbody.innerHTML = clients.map(client => `
      <tr>
        <td><strong>${client.name}</strong></td>
        <td>${client.email}</td>
        <td>${client.phone || 'N/A'}</td>
        <td>${client.bookingCount}</td>
        <td>
          <button class="action-btn" onclick="viewClient('${client.email}')" title="View">
            <i class="ri-eye-line"></i>
          </button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading clients:', error);
    showEmptyState('clients-table', 'Error loading clients');
  }
}

// Load drivers (placeholder - you'll add drivers manually)
async function loadDrivers() {
  try {
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const tbody = document.getElementById('drivers-table');

    if (drivers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="ri-car-line"></i>
              <p>No drivers yet. Click "Add Driver" to create one.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = drivers.map(driver => `
      <tr>
        <td><strong>${driver.name}</strong></td>
        <td>${driver.email}</td>
        <td>${driver.phone || 'N/A'}</td>
        <td><span class="status-badge status-${driver.status}">${capitalizeFirst(driver.status)}</span></td>
        <td>
          <button class="action-btn" onclick="editDriver('${driver.id}')" title="Edit">
            <i class="ri-edit-line"></i>
          </button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading drivers:', error);
  }
}

// Load tasks (placeholder)
async function loadTasks() {
  try {
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const tbody = document.getElementById('tasks-table');

    if (tasks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="ri-task-line"></i>
              <p>No tasks yet. Click "Create Task" to assign work to drivers.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Display tasks (you'll implement this based on your task structure)

  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

// Load payments (placeholder)
async function loadPayments() {
  // Placeholder - you'll implement this
  console.log('Loading payments...');
}

// Helper functions
function formatDateRange(start, end) {
  if (!start || !end) return 'N/A';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showEmptyState(tableId, message) {
  const tbody = document.getElementById(tableId);
  const colspan = tbody.closest('table').querySelectorAll('th').length;
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

// Make functions globally available for onclick handlers
window.viewBooking = function (id) {
  alert(`View booking: ${id}\nThis will open a modal with full booking details.\nWe'll implement this in the next step!`);
}

window.editBooking = function (id) {
  alert(`Edit booking: ${id}\nThis will open a form to edit the booking.\nComing in next step!`);
}

window.viewClient = function (email) {
  alert(`View client: ${email}\nThis will show all bookings for this client.\nComing soon!`);
}

window.editDriver = function (id) {
  alert(`Edit driver: ${id}\nComing soon!`);
}

// Button handlers (placeholders for now)
document.getElementById('add-booking-btn')?.addEventListener('click', () => {
  alert('Add booking form coming soon!');
});

document.getElementById('add-driver-btn')?.addEventListener('click', () => {
  alert('Add driver form coming soon!');
});

document.getElementById('add-task-btn')?.addEventListener('click', () => {
  alert('Create task form coming soon!');
});

document.getElementById('add-payment-btn')?.addEventListener('click', () => {
  alert('Record payment form coming soon!');
});