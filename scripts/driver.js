// Driver Dashboard JavaScript
// This file handles driver-specific functionality

import { auth, db } from "./firebase-config.js";
import {
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentDriverId = null;

// Check authentication and authorization
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in, redirect to login
    window.location.href = "admin.html";
    return;
  }

  // Check if user is driver
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("User profile not found. Please contact administrator.");
      await signOut(auth);
      window.location.href = "admin.html";
      return;
    }

    const userData = userDoc.data();

    if (userData.role !== "driver") {
      alert("Access denied. Driver privileges required.");
      await signOut(auth);
      window.location.href = "admin.html";
      return;
    }

    // User is authenticated and authorized
    currentDriverId = user.uid;
    document.getElementById("user-name").textContent =
      userData.name || user.email;
    document.getElementById("welcome-message").textContent =
      `Welcome back, ${userData.name || "Driver"}!`;

    // Load driver tasks
    await loadDriverTasks();
  } catch (error) {
    console.error("Auth check error:", error);
    alert("Error checking permissions. Please try again.");
    window.location.href = "admin.html";
  }
});

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", async () => {
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

// Load driver's assigned tasks
async function loadDriverTasks() {
  try {
    const tasksContainer = document.getElementById("tasks-container");

    // Query tasks assigned to this driver
    const tasksQuery = query(
      collection(db, "tasks"),
      where("driverId", "==", currentDriverId),
      orderBy("date", "asc"),
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update stats
    updateStats(tasks);

    // Display tasks
    if (tasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="empty-state">
          <i class="ri-task-line"></i>
          <h3>No Tasks Assigned</h3>
          <p>You don't have any tasks assigned yet. Check back later!</p>
        </div>
      `;
      return;
    }

    // Render task cards
    tasksContainer.innerHTML = tasks
      .map((task) => renderTaskCard(task))
      .join("");

    // Add event listeners to buttons
    attachTaskEventListeners();
  } catch (error) {
    console.error("Error loading tasks:", error);
    const tasksContainer = document.getElementById("tasks-container");
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <i class="ri-error-warning-line"></i>
        <h3>Error Loading Tasks</h3>
        <p>${error.message || "Please try refreshing the page"}</p>
      </div>
    `;
  }
}

// Update stats
function updateStats(tasks) {
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in-progress",
  ).length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  document.getElementById("total-tasks").textContent = totalTasks;
  document.getElementById("pending-tasks").textContent = pendingTasks;
  document.getElementById("completed-tasks").textContent = completedTasks;
}

// Render task card
function renderTaskCard(task) {
  const priorityClass = `priority-${task.priority || "normal"}`;
  const cardClass =
    task.status === "completed"
      ? "task-card completed"
      : task.priority === "high"
        ? "task-card urgent"
        : "task-card";

  return `
    <div class="${cardClass}" data-task-id="${task.id}">
      <div class="task-header">
        <div>
          <h3 class="task-title">${task.title || "Task"}</h3>
          <p class="task-meta">
            <i class="ri-calendar-line"></i> ${formatDate(task.date)}
          </p>
        </div>
        <span class="task-priority ${priorityClass}">
          ${capitalizeFirst(task.priority || "normal")}
        </span>
      </div>

      <div class="task-details">
        <div class="task-detail-item">
          <i class="ri-map-pin-line"></i>
          <div>
            <span class="task-detail-label">Pickup:</span>
            <span class="task-detail-value">${task.pickupLocation || "N/A"}</span>
          </div>
        </div>
        <div class="task-detail-item">
          <i class="ri-map-pin-2-line"></i>
          <div>
            <span class="task-detail-label">Destination:</span>
            <span class="task-detail-value">${task.destination || "N/A"}</span>
          </div>
        </div>
        <div class="task-detail-item">
          <i class="ri-time-line"></i>
          <div>
            <span class="task-detail-label">Time:</span>
            <span class="task-detail-value">${task.time || "N/A"}</span>
          </div>
        </div>
        <div class="task-detail-item">
          <i class="ri-user-line"></i>
          <div>
            <span class="task-detail-label">Client:</span>
            <span class="task-detail-value">${task.clientName || "N/A"}</span>
          </div>
        </div>
      </div>

      ${
        task.notes
          ? `
        <div class="task-description">
          <strong>Notes:</strong> ${task.notes}
        </div>
      `
          : ""
      }

      <div class="task-actions">
        <span class="status-badge status-${task.status}">
          ${task.status === "completed" ? '<i class="ri-checkbox-circle-line"></i>' : ""}
          ${capitalizeFirst(task.status || "pending")}
        </span>

        ${
          task.status !== "completed"
            ? `
          <button class="btn btn-complete" data-task-id="${task.id}">
            <i class="ri-checkbox-circle-line"></i>
            Mark Complete
          </button>
        `
            : ""
        }

        ${
          task.clientPhone
            ? `
          <button class="btn btn-contact" onclick="window.open('tel:${task.clientPhone}')">
            <i class="ri-phone-line"></i>
            Call Client
          </button>
        `
            : ""
        }

        ${
          task.clientPhone
            ? `
          <button class="btn btn-contact" onclick="window.open('https://wa.me/${task.clientPhone.replace(/\D/g, "")}')">
            <i class="ri-whatsapp-line"></i>
            WhatsApp
          </button>
        `
            : ""
        }
      </div>
    </div>
  `;
}

// Attach event listeners to task buttons
function attachTaskEventListeners() {
  const completeButtons = document.querySelectorAll(".btn-complete");

  completeButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      const taskId = e.currentTarget.dataset.taskId;
      await markTaskComplete(taskId);
    });
  });
}

// Mark task as complete
async function markTaskComplete(taskId) {
  if (!confirm("Mark this task as completed?")) {
    return;
  }

  try {
    // Update task status in Firestore
    await updateDoc(doc(db, "tasks", taskId), {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    // Show success message
    showToast("Task marked as completed!", true);

    // Reload tasks
    await loadDriverTasks();
  } catch (error) {
    console.error("Error completing task:", error);
    showToast("Error updating task. Please try again.", false);
  }
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return dateString;
  }
}

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

function showToast(message, success = true) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "1.5rem";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = success ? "#2ecc71" : "#e74c3c";
  toast.style.color = "#fff";
  toast.style.padding = "0.75rem 1.5rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.zIndex = "9999";
  toast.style.textAlign = "center";
  toast.style.fontWeight = "500";

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
