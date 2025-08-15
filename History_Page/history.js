
class HistoryManager {
    constructor() {
        this.initializeFirebase();
    }
    
    async initializeFirebase() {
        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js");
            const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js");
            
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
            this.auth = getAuth(app);
            
            // Wait for auth state and then load matches
            onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    this.loadUserMatches(user.uid);
                } else {
                    this.checkAuthentication();
                }
            });
            
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
            this.checkAuthentication();
        }
    }
    
    checkAuthentication() {
        const userMode = localStorage.getItem('userMode');
        const userId = localStorage.getItem('userId');
        
        if (userMode !== 'authenticated' || !userId) {
            this.loadLocalMatches(); // Try local first, then show login
            return;
        }
        
        this.loadUserMatches(userId);
    }
    
    showLoginRequired() {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #575ce5;">
                <i class="fas fa-lock" style="font-size: 3rem; margin-bottom: 20px; color: #575ce5;"></i>
                <h2>🔒 Login Required</h2>
                <p style="color: #666; margin: 20px 0;">Please login to view your personal match history.</p>
                <button onclick="window.location.href='../loginSystem/login.html'" 
                        style="background: linear-gradient(135deg, #575ce5, #4338ca); 
                               color: white; padding: 12px 24px; border: none; 
                               border-radius: 8px; font-size: 1rem; cursor: pointer; 
                               margin: 10px; box-shadow: 0 4px 15px rgba(87, 92, 229, 0.3);">
                    <i class="fas fa-sign-in-alt"></i> Go to Login
                </button>
                <br>
                <button onclick="window.location.href='../home.html'" 
                        style="background: transparent; color: #575ce5; padding: 12px 24px; 
                               border: 2px solid #575ce5; border-radius: 8px; font-size: 1rem; 
                               cursor: pointer; margin: 10px;">
                    <i class="fas fa-home"></i> Back to Homepage
                </button>
            </div>
        `;
    }
    
    async loadUserMatches(userId) {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #575ce5;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 20px;"></i>
                <h3>Loading your matches...</h3>
            </div>
        `;
        
        try {
            let data = null;
            
            // Try Firebase with authentication
            if (this.auth && this.auth.currentUser) {
                const idToken = await this.auth.currentUser.getIdToken(true);
                const response = await fetch(`https://scboard-e36a4-default-rtdb.firebaseio.com/users/${userId}/matches.json?auth=${idToken}`);
                
                if (response.ok) {
                    data = await response.json();
                } else {
                    console.warn(`⚠️ Firebase request failed: ${response.status}`);
                }
            }
            
            if (!data) {
                console.log("🔄 Falling back to localStorage");
                this.loadLocalMatches();
                return;
            }
            
            if (data && Object.keys(data).length > 0) {
                this.displayMatches(data);
            } else {
                this.showNoMatches();
            }
            
        } catch (error) {
            console.error('❌ Error loading matches:', error);
            this.loadLocalMatches(); // Fallback to local storage
        }
    }
    
    loadLocalMatches() {
        try {
            const localMatches = JSON.parse(localStorage.getItem('localMatches')) || [];
            
            if (localMatches.length > 0) {
                
                const matchesData = {};
                localMatches.forEach((match, index) => {
                    matchesData[`local_${index}`] = match;
                });
                
                this.displayMatches(matchesData);
                
                this.showLocalMatchesNotification();
            } else {
                const userMode = localStorage.getItem('userMode');
                if (userMode === 'authenticated') {
                    this.showNoMatches();
                } else {
                    this.showLoginRequired();
                }
            }
        } catch (error) {
            console.error(' Error loading local matches:', error);
            this.showError();
        }
    }
    
    showLocalMatchesNotification() {
        const container = document.querySelector('.container');
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: #fef7ed; border: 1px solid #fed7aa; color: #9a3412;
            padding: 12px 20px; border-radius: 8px; margin-bottom: 20px;
            display: flex; align-items: center; gap: 10px;
        `;
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>Showing locally saved matches. Login to access your cloud history.</span>
        `;
        container.insertBefore(notification, container.firstChild.nextSibling);
    }
    
    displayMatches(matchesData) {
        const historyList = document.getElementById('historyList');
        const matches = Object.entries(matchesData).map(([id, match]) => ({id, ...match}));
        
        // Sort by timestamp (newest first)
        matches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (matches.length === 0) {
            this.showNoMatches();
            return;
        }
        
        const pageTitle = document.querySelector('h1');
        if (pageTitle) {
            pageTitle.textContent = `📜 Match History (${matches.length} matches)`;
        }
        
        historyList.innerHTML = matches.map(match => this.createMatchCard(match)).join('');
    }
    
    createMatchCard(match) {
        const date = new Date(match.timestamp).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const time = new Date(match.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const teamAName = match.teamAName || match.firstInnings?.team || "Team A";
        const teamBName = match.teamBName || match.secondInnings?.team || "Team B";
        
        // Handle scores safely
        const firstInningsScore = match.firstInnings?.score || "0/0";
        const firstInningsOvers = match.firstInnings?.overs || "0.0";
        const secondInningsScore = match.secondInnings?.score || "Yet to bat";
        const secondInningsOvers = match.secondInnings?.overs || "0.0";
        
        // Handle result
        const result = match.result || "Match in progress";
        const motm = match.manOfTheMatch || "Not decided";
        
        // Determine result color
        let resultColor = "#666";
        if (result.includes("won")) {
            resultColor = "#059669";
        } else if (result.includes("Tied")) {
            resultColor = "#d97706";
        }
        
        return `
            <div class="match-card" onclick="viewMatchDetails('${match.id}')">
                <div class="match-header">
                    <div class="match-title">
                        <h3>${teamAName} vs ${teamBName}</h3>
                        <div class="match-badges">
                            <span class="badge">${match.oversLimit || 20} Overs</span>
                        </div>
                    </div>
                    <div class="match-date">
                        <div class="date">${date}</div>
                        <div class="time">${time}</div>
                    </div>
                </div>
                
                <div class="match-content">
                    <div class="toss-info">
                        <i class="fas fa-coins"></i>
                        ${match.tossResult || "Toss information not available"}
                    </div>
                    
                    <div class="match-score">
                        <div class="innings">
                            <div class="team-name">${match.firstInnings?.team || teamAName}</div>
                            <div class="score-info">
                                <span class="score">${firstInningsScore}</span>
                                <span class="overs">(${firstInningsOvers} ov)</span>
                            </div>
                        </div>
                        
                        ${match.secondInnings ? `
                            <div class="innings">
                                <div class="team-name">${match.secondInnings?.team || teamBName}</div>
                                <div class="score-info">
                                    <span class="score">${secondInningsScore}</span>
                                    <span class="overs">(${secondInningsOvers} ov)</span>
                                    ${match.secondInnings?.target ? `
                                        <span class="target">Target: ${match.secondInnings.target}</span>
                                    ` : ''}
                                </div>
                            </div>
                        ` : `
                            <div class="innings pending">
                                <div class="team-name">${teamBName}</div>
                                <div class="score-info">
                                    <span class="score">Yet to bat</span>
                                </div>
                            </div>
                        `}
                    </div>
                    
                    <div class="match-footer">
                        <div class="match-result" style="color: ${resultColor};">
                            <i class="fas fa-trophy"></i>
                            <strong>${result}</strong>
                        </div>
                        
                        <div class="match-motm">
                            <i class="fas fa-star"></i>
                            <strong>MOTM:</strong> ${motm}
                        </div>
                    </div>
                </div>
                
                <div class="card-action">
                    <span><i class="fas fa-eye"></i> Click to view full scorecard</span>
                </div>
            </div>
        `;
    }
    
    showNoMatches() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; color: #666;">
                <i class="fas fa-cricket-ball" style="font-size: 4rem; margin-bottom: 30px; color: #cbd5e1;"></i>
                <h3 style="color: #374151; margin-bottom: 15px;">🏏 No Matches Yet</h3>
                <p style="margin-bottom: 30px; font-size: 1.1rem;">Start your first match to see history here!</p>
                <button onclick="window.location.href='../index.html'" 
                        style="background: linear-gradient(135deg, #575ce5, #4338ca); 
                               color: white; padding: 15px 30px; border: none; 
                               border-radius: 10px; font-size: 1.1rem; cursor: pointer;
                               box-shadow: 0 4px 15px rgba(87, 92, 229, 0.3);">
                    <i class="fas fa-play"></i> Start New Match
                </button>
            </div>
        `;
    }
    
    showError() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #dc2626;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #dc2626;"></i>
                <h3>⚠️ Error Loading History</h3>
                <p style="margin: 20px 0;">Unable to load your match history. Please check your connection and try again.</p>
                <button onclick="location.reload()" 
                        style="background: #dc2626; color: white; padding: 12px 24px; 
                               border: none; border-radius: 8px; font-size: 1rem; 
                               cursor: pointer; margin: 10px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
                <button onclick="window.location.href='../home.html'" 
                        style="background: transparent; color: #575ce5; padding: 12px 24px; 
                               border: 2px solid #575ce5; border-radius: 8px; font-size: 1rem; 
                               cursor: pointer; margin: 10px;">
                    <i class="fas fa-home"></i> Back to Homepage
                </button>
            </div>
        `;
    }
}

function viewMatchDetails(matchId) {
    window.location.href = `scorecard.html?id=${matchId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    new HistoryManager();
});
