import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Toggle password visibility
const togglePassword = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;

  const icon = togglePassword.querySelector("i");
  icon.className = type === "password" ? "ri-eye-line" : "ri-eye-off-line";
});

// Handle login form submission
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<div class="spinner"></div><span>Signing in...</span>';
  errorMessage.classList.remove("show");

  try {
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User profile not found. Please contact admin.");
    }

    const userData = userDoc.data();
    const role = userData.role;

    // Store role in sessionStorage for quick access
    sessionStorage.setItem("userRole", role);
    sessionStorage.setItem("userName", userData.name || email);

    // Redirect based on role
    // Redirect based on role
    if (role === "admin" || role === "super") {
      window.location.href = "admin-dashboard.html";
    } else if (role === "driver") {
      window.location.href = "driver-dashboard.html";
    } else {
      throw new Error("Invalid user role. Please contact admin.");
    }
  } catch (error) {
    console.error("Login error:", error);

    // Show user-friendly error messages
    let message = "An error occurred. Please try again.";

    if (error.code === "auth/invalid-credential") {
      message = "Invalid email or password. Please try again.";
    } else if (error.code === "auth/user-not-found") {
      message = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      message = "Incorrect password. Please try again.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many failed attempts. Please try again later.";
    } else if (error.code === "auth/network-request-failed") {
      message = "Network error. Please check your internet connection.";
    } else if (error.message) {
      message = error.message;
    }

    errorMessage.textContent = message;
    errorMessage.classList.add("show");

    // Reset button
    loginBtn.disabled = false;
    loginBtn.innerHTML =
      '<span>Sign In</span><i class="ri-arrow-right-line"></i>';
  }
});

// Check if user is already logged in
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // User is signed in, check their role and redirect
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === "admin" || role === "super") {
          window.location.href = "admin-dashboard.html";
        } else if (role === "driver") {
          window.location.href = "driver-dashboard.html";
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    }
  }
});

// // Add to login.js to check disabled status:
// if (userData.status === "disabled") {
//   alert("Your account has been disabled.");
//   await signOut(auth);
//   return;
// }
