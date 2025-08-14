
function initializeFirebaseForHome() {
    if (typeof window.firebaseAuth === 'undefined') {
        console.log("🔥 Initializing Firebase for home page...");
        
        // Use dynamic import to avoid module conflicts
        import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js")
            .then(({ initializeApp }) => {
                return import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js")
                    .then(({ getAuth }) => {
                        const firebaseConfig = {
                            apiKey: "AIzaSyAjDrhV_xsfta2oo85Oi9owmGC6UH3my28",
                            authDomain: "scboard-e36a4.firebaseapp.com",
                            projectId: "scboard-e36a4",
                            storageBucket: "scboard-e36a4.firebasestorage.app",
                            messagingSenderId: "896640295836",
                            appId: "1:896640295836:web:282eb3b625e7e05070de59",
                            measurementId: "G-JW47M9LDHL"
                        };
                        
                        const app = initializeApp(firebaseConfig);
                        window.firebaseAuth = getAuth(app);
                        window.firebaseApp = app;
                        
                        console.log("✅ Firebase initialized for home page");
                    });
            })
            .catch(error => {
                console.warn("⚠️ Firebase initialization failed for home page:", error);
            });
    } else {
        console.log("🔥 Firebase already initialized");
    }
}

initializeFirebaseForHome();

window.onload = async function() {
    showLoadingOverlay();
    
    const sessionStatus = await validateUserSession();
    
    if (sessionStatus === 'expired') {
        hideLoadingOverlay();
        cleanupExpiredSession();
        showSessionExpiredNotification();
        updateUIForLoggedOutState();
        return;
    }
    
    if (sessionStatus === true) {
        hideLoadingOverlay();
        initializeHomePage();
    } else {
        hideLoadingOverlay();
        initializeHomePage();
    }
};

// ✅ Enhanced validateUserSession function (Add this)
async function validateUserSession() {
    const userId = localStorage.getItem('userId');
    const userMode = localStorage.getItem('userMode');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    
    // Check if user has ever been authenticated
    if (!userId && !userMode) {
        console.log("👤 New user - no authentication check needed");
        return true;
    }
    
    // If user was authenticated before, validate session
    if (userMode === 'authenticated' && userId) {
        // Session expiry check (24 hours)
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        if (loginTimestamp && (currentTime - parseInt(loginTimestamp)) > sessionDuration) {
            console.log("⏰ Session expired for authenticated user");
            return 'expired';
        }
        
        try {
            // Verify user still exists in Firebase
            const userCheckUrl = `https://scboard-e36a4-default-rtdb.firebaseio.com/users/${userId}.json`;
            const response = await fetch(userCheckUrl);
            
            if (!response.ok || !await response.json()) {
                console.log("❌ User not found in database");
                return 'expired';
            }
            
            console.log("✅ Valid authenticated session");
            return true;
            
        } catch (error) {
            console.error("❌ Session validation failed:", error);
            return 'expired';
        }
    }
    
    console.log("👻 Guest user - allow access");
    return true;
}

// ✅ Session cleanup function (Add this)
function cleanupExpiredSession() {
    ['userMode', 'userId', 'userName', 'loginTimestamp', 'userEmail']
        .forEach(key => localStorage.removeItem(key));
    console.log("🧹 Expired session cleaned up");
}

// ✅ Loading overlay functions (Add these)
function showLoadingOverlay() {
    window.originalBodyContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div id="auth-loading-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        ">
            <div style="text-align: center; color: white;">
                <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce 1s infinite;">🏏</div>
                <h2 style="margin-bottom: 10px;">SCBoard</h2>
                <p style="opacity: 0.8; margin-bottom: 20px;">Preparing your experience...</p>
                <div style="
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                "></div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
}

function hideLoadingOverlay() {
    if (window.originalBodyContent) {
        document.body.innerHTML = window.originalBodyContent;
    } else {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// ✅ Session expired notification (Add this)
function showSessionExpiredNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 20px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        z-index: 10000;
        font-weight: 600;
        max-width: 350px;
        animation: slideInRight 0.5s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-clock" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-size: 1rem; margin-bottom: 5px;">Session Expired</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Please login again to access your features</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function updateUIForLoggedOutState() {
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.innerHTML = `
            <a class="nav-link" href="loginSystem/login.html" style="
                background: linear-gradient(135deg, #575ce5, #4338ca);
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
            ">Login / Sign Up</a>
        `;
    }
    
    const historyLink = document.getElementById('historyLink');
    if (historyLink) {
        historyLink.style.display = 'none';
    }
    
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
}


// ✅ Your existing initializeHomePage function
function initializeHomePage() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });

    const hamburger  = document.querySelector('.hamburger');
    const navMenu    = document.querySelector('.nav-menu');
    const navOverlay = document.querySelector('.nav-overlay');

    function toggleMobileMenu() {
      navMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
      navOverlay.classList.toggle('active');
    }

    if (hamburger) hamburger.addEventListener('click', toggleMobileMenu);
    if (navOverlay) navOverlay.addEventListener('click', toggleMobileMenu);

    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        navOverlay.classList.remove('active');
      });
    });

    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        }
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // ✅ Removed DOMContentLoaded - moved inside initializeHomePage
    const urlParams = new URLSearchParams(window.location.search);
    const fromMatch = urlParams.get('from');
    
    if (fromMatch === 'match-complete') {
        setTimeout(() => {
            alert('🏏 Match completed successfully! Check out your match in the History section.');
        }, 1000);
    }

    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ✅ Call authentication check and UI setup
    console.log('DOM loaded, checking authentication...');
    checkUserAuthAndShowNav();
    updateFeatureCards();
}

// ✅ Keep your existing functions with fixes
function checkUserAuthAndShowNav() {
    const userMode = localStorage.getItem('userMode');
    const userId = localStorage.getItem('userId');
    
    const historyLink = document.getElementById('historyLink');
    const loginLink = document.getElementById('loginLink');
    
    if (userMode === 'authenticated' && userId) {
        if (historyLink) historyLink.style.display = 'block';
        updateUserNavigation(true);
    } else {
        if (historyLink) historyLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'block';
        updateUserNavigation(false);
    }
}

function updateUserNavigation(isAuthenticated) {
    const loginLink = document.getElementById('loginLink');
    if (!loginLink) return;

    if (isAuthenticated) {
        const userName = localStorage.getItem('userName') || 'User';
        const firstName = userName.split('@')[0].split(' ')[0];

        loginLink.innerHTML = `
          <a href="#" onclick="showUserMenu(event)" class="user-link">
            <i class="fas fa-user-circle"></i> ${firstName}
          </a>`;
    } else {
        loginLink.innerHTML = `
          <a class="nav-link" href="/loginSystem/login.html">
            Login / Sign Up
          </a>`;
    }
}

function showUserMenu(event) {
    event.preventDefault();
    
    const existingMenu = document.querySelector('.user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-item" onclick="navigateToHistory()">
            <i class="fas fa-history"></i> Match History
        </div>
        <div class="dropdown-item" onclick="navigateToSettings()">
            <i class="fas fa-cog"></i> Settings
        </div>
        <div class="dropdown-item" onclick="logoutUser()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </div>
    `;
    
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.appendChild(dropdown);
        
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!loginLink.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            }, 200);
        }, 100);
    }
}

function navigateToHistory() {
    const userMode = localStorage.getItem('userMode');
    
    if (userMode === 'authenticated') {
        window.location.href = 'ScoreBoard/history.html';
    } else {
        alert('Please login first to view your match history');
        window.location.href = '/loginSystem/login.html'; //  Fixed path
    }
}

function navigateToSettings() {
    alert('Settings page coming soon!');
}

async function logoutUser() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        // Try Firebase sign out only if Firebase is available
        if (window.firebaseAuth) {
            const { signOut } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js");
            await signOut(window.firebaseAuth);
            console.log("✅ Firebase sign out successful");
        } else {
            console.log("⚠️ Firebase not available - local logout only");
        }
    } catch (err) {
        console.warn("Firebase sign-out failed:", err);
    }
    ['userMode','userId','userName','guestSession','loginTimestamp','userEmail']
        .forEach(k => localStorage.removeItem(k));

    checkUserAuthAndShowNav();
    document.querySelector('.user-dropdown')?.remove();
    alert('Logged out successfully!');
}
function updateFeatureCards() {
    const historyCard = document.querySelector('.feature-card a[href*="History_Page"]');
    if (historyCard) {
        historyCard.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToHistory();
        });
    }
}

const dropdownStyle = document.createElement('style');
dropdownStyle.textContent = `
    .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        min-width: 180px;
        z-index: 1000;
        overflow: hidden;
        margin-top: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .dropdown-item {
        padding: 12px 16px;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #374151;
        font-size: 0.9rem;
    }
    
    .dropdown-item:hover {
        background-color: #f8fafc;
        color: #575ce5;
    }
    
    .dropdown-item i {
        width: 16px;
        text-align: center;
    }
    
    #loginLink {
        position: relative;
    }
    
    .user-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #575ce5;
        font-weight: 600;
    }
`;
document.head.appendChild(dropdownStyle);
