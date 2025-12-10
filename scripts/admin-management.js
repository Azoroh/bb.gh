import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Check if user is authenticated
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadAdmins();
  }
});

// Add new admin
const addAdminForm = document.getElementById("add-admin-form");
addAdminForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = addAdminForm.querySelector(".add-btn");
  const originalText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Adding...';

    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;
    const name = document.getElementById("admin-name").value.trim();
    const role = document.getElementById("admin-role").value;

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const uid = userCredential.user.uid;

    // Add to Firestore admins collection
    await addDoc(collection(db, "admins"), {
      uid: uid,
      email: email,
      name: name,
      role: role,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.email,
    });

    showToast("Admin added successfully!", true);
    addAdminForm.reset();
    loadAdmins(); // Refresh the list
  } catch (error) {
    console.error("Error adding admin:", error);
    let errorMessage = "Failed to add admin";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }

    showToast(errorMessage, false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Load all admins
async function loadAdmins() {
  const container = document.getElementById("admins-list-container");

  try {
    const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-user-line" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>No admins found. Add your first admin above.</p>
                </div>
            `;
      return;
    }

    const admins = [];
    querySnapshot.forEach((doc) => {
      admins.push({ id: doc.id, ...doc.data() });
    });

    container.innerHTML = `
            <table class="admins-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Added</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${admins
                      .map(
                        (admin) => `
                        <tr>
                            <td>${admin.name || "N/A"}</td>
                            <td>${admin.email}</td>
                            <td>
                                <span class="role-badge ${admin.role}">
                                    ${admin.role === "super" ? "Super Admin" : "Admin"}
                                </span>
                            </td>
                            <td>${admin.createdAt ? formatDate(admin.createdAt.toDate()) : "N/A"}</td>
                            <td>
                                <button
                                    class="delete-btn"
                                    onclick="deleteAdmin('${admin.id}', '${admin.email}')"
                                    ${admin.email === auth.currentUser.email ? "disabled" : ""}
                                >
                                    <i class="ri-delete-bin-line"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error("Error loading admins:", error);
    container.innerHTML = `
            <div class="empty-state">
                <p style="color: #e74c3c;">Error loading admins. Please refresh the page.</p>
            </div>
        `;
  }
}

// Delete admin
window.deleteAdmin = async function (adminId, email) {
  if (!confirm(`Are you sure you want to delete admin: ${email}?`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "admins", adminId));

    // Note: This only removes from Firestore
    // To fully delete from Firebase Auth, you'd need Firebase Admin SDK (backend)
    // For now, they just won't be in the admins list

    showToast("Admin deleted successfully!", true);
    loadAdmins();
  } catch (error) {
    console.error("Error deleting admin:", error);
    showToast("Failed to delete admin", false);
  }
};

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Toast notification
function showToast(message, success = true) {
  const toast = document.createElement("div");
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    background: success ? "#2ecc71" : "#e74c3c",
    color: "#fff",
    padding: "1rem 1.5rem",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: "9999",
    maxWidth: "400px",
    animation: "slideIn 0.3s ease",
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Add CSS animation
const style = document.createElement("style");
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
