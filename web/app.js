import { auth, provider } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js';

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Handle Google login
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log('User signed in: ', user);
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';

            // Redirect to dashboard page after successful login
            window.location.href = "dashboard.html";  // Redirect to dashboard
        })
        .catch((error) => {
            console.error('Error during login: ', error);
        });
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log('User signed out');
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';

            // Redirect to login page after logout
            window.location.href = "index.html";  // Redirect to login page
        })
        .catch((error) => {
            console.error('Error during logout: ', error);
        });
});

// Monitor user authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);
        // If user is logged in, hide login button and show logout button
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';

        // Optionally, redirect to dashboard page if user is logged in
        if (window.location.pathname === '/index.html') {
            window.location.href = 'dashboard.html';
        }
    } else {
        console.log('No user is logged in');
        // If no user is logged in, show login button and hide logout button
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
});
