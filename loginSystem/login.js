
class SCBoardAuth {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            console.log("🔥 Starting Firebase Auth initialization...");
            
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            this.auth = window.firebaseAuth;
            
            if (!this.auth) {
                throw new Error('Firebase Auth not available after initialization');
            }
            
            this.isInitialized = true;
            console.log(' Firebase Auth connected successfully');
            this.init();
            
        } catch (error) {
            console.error(' Firebase initialization error:', error);
            this.handleInitializationError();
        }
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            const handleFirebaseReady = () => {
                if (window.firebaseAuth) {
                    console.log(" Firebase ready via event");
                    resolve();
                    return;
                }
            };
            
            window.addEventListener('firebaseReady', handleFirebaseReady, { once: true });
            
            const maxAttempts = 100;
            let attempts = 0;
            
            const checkFirebase = () => {
                attempts++;
                console.log(`🔍 Checking Firebase... Attempt ${attempts}`);
                
                if (window.firebaseAuth) {
                    window.removeEventListener('firebaseReady', handleFirebaseReady);
                    console.log("✅ Firebase ready via polling");
                    resolve();
                } else if (attempts >= maxAttempts) {
                    window.removeEventListener('firebaseReady', handleFirebaseReady);
                    reject(new Error('Firebase Auth not loaded after maximum attempts'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            
            setTimeout(checkFirebase, 200);
        });
    }
    init() {
        if (!this.isInitialized || !this.auth) {
            console.error('Cannot initialize - Firebase Auth not ready');
            return;
        }
        
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        if (!document.getElementById('loginForm') || !document.getElementById('signupForm')) {
            console.log('📄 Not on login page - skipping UI event listeners');
            return;
        }

        try {
            document.querySelectorAll('.auth-tab').forEach(tab => {
                if (tab) {
                    tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
                }
            });

            // Form submissions with null checks
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');

            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            if (signupForm) {
                signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSignup();
                });
            }

            console.log('✅ Event listeners setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    async handleLogin() {
        if (!this.isInitialized || !this.auth) {
            this.showNotification('Authentication service not ready. Please wait and try again.', 'error');
            return;
        }

        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        if (!email || !password) {
            this.showNotification('Please enter both email and password', 'error');
            return;
        }
        this.showLoading(true);
        
        try {
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js");
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            
            localStorage.setItem('userMode', 'authenticated');
            localStorage.setItem('userId', userCredential.user.uid);
            localStorage.setItem('userName', userCredential.user.displayName || userCredential.user.email);
            localStorage.setItem('loginTimestamp', Date.now().toString());
            
            this.showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '../HomePage/home.html';
            }, 1500);
            
        }  catch (error) {
            console.error('Login error:', error);
            this.showNotification(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleSignup() {
        if (!this.auth) {
            this.showNotification('Authentication not ready. Please refresh page.', 'error');
            return;
        }

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js");
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            
            await updateProfile(userCredential.user, { displayName: name });
            
            await this.saveUserData(userCredential.user.uid, {
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('userMode', 'authenticated');
            localStorage.setItem('userId', userCredential.user.uid);
            localStorage.setItem('userName', name);
            localStorage.setItem('loginTimestamp', Date.now().toString());
            
            this.showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = '../HomePage/home.html';
            }, 1500);
            
        } catch (error) {
            this.showNotification(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async saveUserData(uid, userData) {
        try {
            const response = await fetch(`https://scboard-e36a4-default-rtdb.firebaseio.com/users/${uid}/profile.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                console.log('User data saved successfully');
            } else {
                console.error('Failed to save user data');
            }
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    checkAuthState() {
        // ✅ Only check auth state if Firebase is available
        if (!this.auth) {
            console.log('⚠️ Firebase Auth not available for state check');
            return;
        }

        try {
            import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js")
                .then(({ onAuthStateChanged }) => {
                    if (!onAuthStateChanged) {
                        throw new Error('onAuthStateChanged not available');
                    }

                    onAuthStateChanged(this.auth, (user) => {
                        if (user) {
                            localStorage.setItem('userMode', 'authenticated');
                            localStorage.setItem('userId', user.uid);
                            localStorage.setItem('userName', user.displayName || user.email);
                            localStorage.setItem('loginTimestamp', Date.now().toString());
                            this.currentUser = user;
                            console.log('✅ User is signed in:', user.email);
                        } else {
                            this.currentUser = null;
                            console.log('User is signed out');
                            
                            const guestSession = localStorage.getItem('guestSession');
                            if (!guestSession) {
                                localStorage.removeItem('userMode');
                                localStorage.removeItem('userId');
                                localStorage.removeItem('userName');
                                localStorage.removeItem('loginTimestamp');
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error loading auth state:', error);
                });
        } catch (error) {
            console.error('Error in checkAuthState:', error);
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type) {
        const existingNotifications = document.querySelectorAll('.auth-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideInRight 0.5s ease-out;
            background: ${type === 'success' ? 'linear-gradient(135deg, #00CC66, #00AA55)' : 'linear-gradient(135deg, #FF4444, #CC3333)'};
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        
        if (!document.querySelector('style[data-notification]')) {
            style.setAttribute('data-notification', 'true');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.5s ease-out reverse';
            setTimeout(() => notification.remove(), 500);
        }, 3500);
    }

    getErrorMessage(errorCode) {
        const errors = {
            'auth/email-already-in-use': 'Email already registered!',
            'auth/weak-password': 'Password should be at least 6 characters!',
            'auth/user-not-found': 'User not found!',
            'auth/wrong-password': 'Incorrect password!',
            'auth/invalid-email': 'Invalid email address!',
            'auth/invalid-credential': 'Invalid email or password!',
            'auth/too-many-requests': 'Too many attempts. Try again later!',
            'auth/network-request-failed': 'Network error. Check your connection!'
        };
        return errors[errorCode] || 'An error occurred. Please try again.';
    }
}

// Guest login function
async function guestLogin() {
    localStorage.setItem('userMode', 'guest');
    localStorage.setItem('guestSession', Date.now().toString());
    window.location.href = '../HomePage/home.html';
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM loaded, initializing authentication...");
    try {
        new SCBoardAuth();
    } catch (error) {
        console.error('SCBoardAuth initialization error:', error);
    }
});


async function validateUserSession() {
    const userId = localStorage.getItem('userId');
    const userMode = localStorage.getItem('userMode'); // ✅ Changed from userEmail to userMode
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
            
            console.log("✅ User session validated");
            return true;
            
        } catch (error) {
            console.error("❌ Session validation failed:", error);
            return 'expired';
        }
    }
    
    console.log("👻 Guest user - allow access");
    return true;
}

// Clear session function
function clearUserSession() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('userMode');
    // Redirect to login
    window.location.href = '/loginSystem/login.html';
}

// Loading overlay functions
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
                <div style="font-size: 2rem; margin-bottom: 20px;">🏏</div>
                <h2>Verifying Session...</h2>
                <div style="margin-top: 20px;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #fff; 
                                border-radius: 50%; width: 40px; height: 40px; 
                                animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
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
