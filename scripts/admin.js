// Admin Dashboard JavaScript
// This file handles all admin functionality

import { auth, db } from './firebase-config.js';
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
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
  deleteDoc
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

    /// Load drivers count
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );
    const driversSnapshot = await getDocs(driversQuery);
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
    // Query users collection where role = 'driver'
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );

    const driversSnapshot = await getDocs(driversQuery);
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

// Load tasks
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

    // Get all drivers to show names instead of IDs
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );
    const driversSnapshot = await getDocs(driversQuery);
    const driversMap = {};
    driversSnapshot.docs.forEach(doc => {
      driversMap[doc.id] = doc.data().name;
    });

    // Display tasks
    tbody.innerHTML = tasks.map(task => `
      <tr>
        <td><strong>${task.title}</strong></td>
        <td>${driversMap[task.driverId] || 'Unknown Driver'}</td>
        <td>
          ${task.clientName || 'N/A'}<br>
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
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading tasks:', error);
    showEmptyState('tasks-table', 'Error loading tasks');
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

// View Client Modal Functionality
window.viewClient = async function (email) {
  try {
    // Fetch all bookings for this client
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const allBookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter bookings for this client
    const clientBookings = allBookings.filter(b => b.email === email);

    if (clientBookings.length === 0) {
      alert('No bookings found for this client');
      return;
    }

    // Get client info from first booking
    // Assuming client details (name, phone) are consistent across their bookings
    const firstBooking = clientBookings[0];

    // Populate modal
    document.getElementById('view-client-name').textContent =
      `${firstBooking.firstName} ${firstBooking.lastName}`;
    document.getElementById('view-client-email').textContent = email;
    document.getElementById('view-client-phone').textContent =
      `${firstBooking.phoneCountryCode || ''} ${firstBooking.phoneLocalNumber || ''}`;
    document.getElementById('view-client-booking-count').textContent =
      clientBookings.length;

    // Populate bookings table
    const tbody = document.getElementById('view-client-bookings-table');
    tbody.innerHTML = clientBookings.map(booking => `
            <tr>
                <td>${booking.packageName || 'N/A'}</td>
                <td>${formatDateRange(booking.startDate, booking.endDate)}</td>
                <td>${booking.travelers}</td>
                <td><span class="status-badge status-${booking.status}">${capitalizeFirst(booking.status)}</span></td>
            </tr>
        `).join('');

    // Open modal
    openModal('view-client-modal');

  } catch (error) {
    console.error('Error loading client:', error);
    alert('Error loading client details');
  }
}

window.editDriver = function (id) {
  alert(`Edit driver: ${id}\nComing soon!`);
}

// Button handlers (placeholders for now)
document.getElementById('add-booking-btn')?.addEventListener('click', () => {
  alert('Add booking form coming soon!');
});

// document.getElementById('add-driver-btn')?.addEventListener('click', () => {
//   alert('Add driver form coming soon!');
// });

// document.getElementById('add-task-btn')?.addEventListener('click', () => {
//   alert('Create task form coming soon!');
// });

document.getElementById('add-payment-btn')?.addEventListener('click', () => {
  alert('Record payment form coming soon!');
});




// ==================== MODAL FUNCTIONS ====================

// Open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Close modal
window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    const form = modal.querySelector('form');
    if (form) {
      form.reset();
    }

    // Clear error messages
    const errorDiv = modal.querySelector('.form-error');
    if (errorDiv) {
      errorDiv.classList.remove('show');
      errorDiv.textContent = '';
    }
  }
}

// Show form error
function showFormError(modalId, message) {
  const errorDiv = document.querySelector(`#${modalId} .form-error`);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ==================== ADD DRIVER FUNCTIONALITY ====================

// Update the button handler you added earlier
document.getElementById('add-driver-btn')?.addEventListener('click', () => {
  openModal('add-driver-modal');
  // Set minimum date to today
  document.getElementById('task-date').setAttribute('min', new Date().toISOString().split('T')[0]);
});

// Handle Add Driver Form Submission
document.getElementById('add-driver-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-driver-btn');
  const originalHTML = submitBtn.innerHTML;

  try {
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Creating...';

    // Get form data
    const formData = new FormData(e.target);
    const driverData = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      password: formData.get('password'),
      phone: formData.get('phone').trim(),
      license: formData.get('license')?.trim() || '',
      vehicle: formData.get('vehicle')?.trim() || '',
      notes: formData.get('notes')?.trim() || ''
    };

    // Validate
    if (!driverData.name || !driverData.email || !driverData.password || !driverData.phone) {
      throw new Error('Please fill in all required fields');
    }

    if (driverData.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create Firebase Authentication user
    // NOTE: This will temporarily log you out as admin!
    // We need a workaround for this
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      driverData.email,
      driverData.password
    );

    const driverId = userCredential.user.uid;

    // Create driver profile in Firestore
    await setDoc(doc(db, 'users', driverId), {
      role: 'driver',
      name: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      license: driverData.license,
      vehicle: driverData.vehicle,
      notes: driverData.notes,
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Create driver document in drivers collection (for easier querying)
    await setDoc(doc(db, 'drivers', driverId), {
      name: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      license: driverData.license,
      vehicle: driverData.vehicle,
      notes: driverData.notes,
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Success!
    showToast('Driver created successfully!', true);
    closeModal('add-driver-modal');

    // Reload drivers list
    await loadDrivers();

    // WARNING: User might be logged out, need to log back in
    alert('Driver created! You may need to log back in as admin.');

  } catch (error) {
    console.error('Error creating driver:', error);

    let errorMessage = 'Failed to create driver. ';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage += 'This email is already registered.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage += 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage += 'Password is too weak.';
    } else {
      errorMessage += error.message;
    }

    showFormError('add-driver-modal', errorMessage);

  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
});

// ==================== CREATE TASK FUNCTIONALITY ====================

// Update the button handler
document.getElementById('add-task-btn')?.addEventListener('click', async () => {
  openModal('create-task-modal');

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('task-date').setAttribute('min', today);

  // Load drivers into dropdown
  await loadDriversDropdown();
});

// Load drivers into task form dropdown
async function loadDriversDropdown() {
  try {
    // Query users collection where role = 'driver'
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );

    const driversSnapshot = await getDocs(driversQuery);
    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const select = document.getElementById('task-driver');

    // Clear existing options except first one
    select.innerHTML = '<option value="">Select a driver...</option>';

    if (drivers.length === 0) {
      select.innerHTML = '<option value="">No drivers available - Add a driver first</option>';
      return;
    }

    // Add driver options
    drivers.forEach(driver => {
      const option = document.createElement('option');
      option.value = driver.id;
      option.textContent = `${driver.name} - ${driver.phone}`;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading drivers:', error);
  }
}

// Handle Create Task Form Submission
document.getElementById('create-task-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-task-btn');
  const originalHTML = submitBtn.innerHTML;

  try {
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Creating...';

    // Get form data
    const formData = new FormData(e.target);
    const taskData = {
      title: formData.get('title').trim(),
      driverId: formData.get('driverId'),
      date: formData.get('date'),
      time: formData.get('time'),
      clientName: formData.get('clientName')?.trim() || '',
      clientPhone: formData.get('clientPhone')?.trim() || '',
      pickupLocation: formData.get('pickupLocation').trim(),
      destination: formData.get('destination').trim(),
      priority: formData.get('priority'),
      notes: formData.get('notes')?.trim() || '',
      status: 'pending',
      createdAt: serverTimestamp()
    };

    // Validate required fields
    if (!taskData.title || !taskData.driverId || !taskData.date || !taskData.time ||
      !taskData.pickupLocation || !taskData.destination) {
      throw new Error('Please fill in all required fields');
    }

    // Create task in Firestore
    await addDoc(collection(db, 'tasks'), taskData);

    // Success!
    showToast('Task created successfully!', true);
    closeModal('create-task-modal');

    // Reload tasks list
    await loadTasks();

  } catch (error) {
    console.error('Error creating task:', error);
    showFormError('create-task-modal', error.message || 'Failed to create task');

  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
});

// Toast notification helper
function showToast(message, success = true) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.background = success ? '#2ecc71' : '#e74c3c';
  toast.style.color = 'white';
  toast.style.padding = '1rem 1.5rem';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.zIndex = '10000';
  toast.style.fontWeight = '600';
  toast.style.animation = 'slideInRight 0.3s ease-out';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);


// Format single date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
}

// Task actions (placeholders)
window.viewTask = function (id) {
  alert(`View task: ${id}\nTask details modal coming soon!`);
}

window.editTask = function (id) {
  alert(`Edit task: ${id}\nEdit task form coming soon!`);
}





// ==================== VIEW BOOKING MODAL ====================

let currentBookingId = null;

// Update the viewBooking function that's already in your code
window.viewBooking = async function (id) {
  currentBookingId = id;

  try {
    // Fetch booking data
    const bookingDoc = await getDoc(doc(db, 'bookings', id));

    if (!bookingDoc.exists()) {
      alert('Booking not found');
      return;
    }

    const booking = bookingDoc.data();

    // Populate modal with booking data
    document.getElementById('booking-client-name').textContent =
      `${booking.firstName} ${booking.lastName}`;
    document.getElementById('booking-client-email').textContent = booking.email;
    document.getElementById('booking-client-phone').textContent =
      `${booking.phoneCountryCode || ''} ${booking.phoneLocalNumber || booking.phone || 'N/A'}`;

    document.getElementById('booking-package').textContent = booking.packageName || 'N/A';
    document.getElementById('booking-start-date').textContent =
      formatFullDate(booking.startDate);
    document.getElementById('booking-end-date').textContent =
      formatFullDate(booking.endDate);
    document.getElementById('booking-travelers').textContent = booking.travelers;
    document.getElementById('booking-addon').textContent = booking.addon || 'None';

    document.getElementById('booking-message').textContent =
      booking.message || 'No special requests';

    // Set current status in dropdown
    document.getElementById('booking-status-select').value = booking.status || 'pending';

    // Show booking creation date
    const createdDate = booking.createdAt?.toDate ?
      formatFullDate(booking.createdAt.toDate().toISOString().split('T')[0]) :
      'N/A';
    document.getElementById('booking-created-date').textContent = createdDate;

    // Clear any previous messages
    document.getElementById('booking-update-success').classList.remove('show');
    document.getElementById('booking-update-error').classList.remove('show');

    // Open modal
    openModal('view-booking-modal');

  } catch (error) {
    console.error('Error loading booking:', error);
    alert('Error loading booking details. Please try again.');
  }
}

// Handle status update
document.getElementById('update-status-btn')?.addEventListener('click', async () => {
  if (!currentBookingId) return;

  const updateBtn = document.getElementById('update-status-btn');
  const originalHTML = updateBtn.innerHTML;
  const newStatus = document.getElementById('booking-status-select').value;

  try {
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<div class="spinner"></div> Updating...';

    // Update status in Firestore
    await updateDoc(doc(db, 'bookings', currentBookingId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // Show success message
    const successDiv = document.getElementById('booking-update-success');
    successDiv.textContent = `✓ Status updated to "${capitalizeFirst(newStatus)}"`;
    successDiv.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
      successDiv.classList.remove('show');
    }, 3000);

    // Refresh the bookings list
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection.id === 'bookings-section') {
      await loadAllBookings();
    } else if (activeSection.id === 'overview-section') {
      await loadOverviewData();
    }

  } catch (error) {
    console.error('Error updating status:', error);

    const errorDiv = document.getElementById('booking-update-error');
    errorDiv.textContent = '✗ Failed to update status. Please try again.';
    errorDiv.classList.add('show');

  } finally {
    updateBtn.disabled = false;
    updateBtn.innerHTML = originalHTML;
  }
});

// Format single date helper function
function formatFullDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
}

// ==================== VIEW TASK MODAL ====================

let currentTaskId = null;

// Update the viewTask function
window.viewTask = async function (id) {
  currentTaskId = id;

  try {
    // Open modal FIRST so elements exist
    openModal('view-task-modal');

    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch task data
    const taskDoc = await getDoc(doc(db, 'tasks', id));

    if (!taskDoc.exists()) {
      alert('Task not found');
      closeModal('view-task-modal');
      return;
    }

    const task = taskDoc.data();
    console.log('Task data:', task);

    // Fetch driver data
    let driverData = { name: 'Unknown', email: 'N/A', phone: 'N/A' };
    if (task.driverId) {
      const driverDoc = await getDoc(doc(db, 'users', task.driverId));
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
    setText('view-task-title', task.title || 'No title');
    setText('view-task-date', task.date ? formatFullDate(task.date) : 'N/A');
    setText('view-task-time', task.time || 'N/A');

    // Priority with color coding
    const priorityElement = document.getElementById('view-task-priority');
    if (priorityElement) {
      const priority = task.priority || 'normal';
      priorityElement.textContent = capitalizeFirst(priority);
      priorityElement.style.color =
        priority === 'high' ? '#e74c3c' :
          priority === 'low' ? '#2ecc71' : '#f59e0b';
      priorityElement.style.fontWeight = '600';
    }

    // Driver info
    setText('view-task-driver-name', driverData.name || 'Unknown');
    setText('view-task-driver-email', driverData.email || 'N/A');
    setText('view-task-driver-phone', driverData.phone || 'N/A');

    // Client info
    setText('view-task-client-name', task.clientName || 'Not provided');
    setText('view-task-client-phone', task.clientPhone || 'Not provided');

    // Location
    setText('view-task-pickup', task.pickupLocation || 'Not specified');
    setText('view-task-destination', task.destination || 'Not specified');

    // Notes
    setText('view-task-notes', task.notes || 'No notes provided');

    // Status
    const statusSelect = document.getElementById('task-status-select');
    if (statusSelect) {
      statusSelect.value = task.status || 'pending';
    }

    // Created date
    let createdDate = 'N/A';
    if (task.createdAt) {
      if (task.createdAt.toDate) {
        createdDate = formatFullDate(task.createdAt.toDate().toISOString().split('T')[0]);
      } else if (typeof task.createdAt === 'string') {
        createdDate = formatFullDate(task.createdAt.split('T')[0]);
      }
    }
    setText('task-created-date', createdDate);

    // Completed date
    const completedContainer = document.getElementById('task-completed-container');
    if (completedContainer) {
      if (task.status === 'completed' && task.completedAt) {
        const completedDate = formatFullDate(task.completedAt.split('T')[0]);
        setText('task-completed-date', completedDate);
        completedContainer.style.display = 'flex';
      } else {
        completedContainer.style.display = 'none';
      }
    }

    // Clear any previous messages
    document.getElementById('task-update-success')?.classList.remove('show');
    document.getElementById('task-update-error')?.classList.remove('show');

  } catch (error) {
    console.error('Error loading task:', error);
    alert('Error loading task details. Please try again.');
    closeModal('view-task-modal');
  }
};

// Handle task status update
document.getElementById('update-task-status-btn')?.addEventListener('click', async () => {
  if (!currentTaskId) return;

  const updateBtn = document.getElementById('update-task-status-btn');
  const originalHTML = updateBtn.innerHTML;
  const newStatus = document.getElementById('task-status-select').value;

  try {
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<div class="spinner"></div> Updating...';

    const updateData = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    // If marking as completed, add completedAt timestamp
    if (newStatus === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    // Update status in Firestore
    await updateDoc(doc(db, 'tasks', currentTaskId), updateData);

    // Show success message
    const successDiv = document.getElementById('task-update-success');
    if (successDiv) {
      successDiv.textContent = `✓ Task status updated to "${capitalizeFirst(newStatus)}"`;
      successDiv.classList.add('show');

      // Hide after 3 seconds
      setTimeout(() => {
        successDiv.classList.remove('show');
      }, 3000);
    }

    // Refresh the tasks list
    await loadTasks();

    // Update completed date display if applicable
    if (newStatus === 'completed') {
      const completedContainer = document.getElementById('task-completed-container');
      const completedDate = formatFullDate(new Date().toISOString().split('T')[0]);
      document.getElementById('task-completed-date').textContent = completedDate;
      if (completedContainer) {
        completedContainer.style.display = 'flex';
      }
    }

  } catch (error) {
    console.error('Error updating task status:', error);

    const errorDiv = document.getElementById('task-update-error');
    if (errorDiv) {
      errorDiv.textContent = '✗ Failed to update status. Please try again.';
      errorDiv.classList.add('show');
    }

  } finally {
    updateBtn.disabled = false;
    updateBtn.innerHTML = originalHTML;
  }
});

// Handle task deletion
document.getElementById('delete-task-btn')?.addEventListener('click', async () => {
  if (!currentTaskId) return;

  if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
    return;
  }

  const deleteBtn = document.getElementById('delete-task-btn');
  const originalHTML = deleteBtn.innerHTML;

  try {
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<div class="spinner"></div> Deleting...';

    // Delete task from Firestore
    await deleteDoc(doc(db, 'tasks', currentTaskId));

    showToast('Task deleted successfully', true);
    closeModal('view-task-modal');

    // Refresh the tasks list
    await loadTasks();

    // Update stats
    await loadOverviewData();

  } catch (error) {
    console.error('Error deleting task:', error);

    const errorDiv = document.getElementById('task-update-error');
    if (errorDiv) {
      errorDiv.textContent = '✗ Failed to delete task. Please try again.';
      errorDiv.classList.add('show');
    }

    deleteBtn.disabled = false;
    deleteBtn.innerHTML = originalHTML;
  }
});