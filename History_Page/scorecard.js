
async function initializeFirebaseForScorecard() {
    if (window.firebaseAuth) {
        return window.firebaseAuth;
    }
    
    try {

        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js");
        const { getAuth, signInWithCustomToken, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js");
        
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
        
        return new Promise((resolve) => {
            let resolved = false;
            
            const unsubscribe = onAuthStateChanged(window.firebaseAuth, (user) => {
                if (!resolved) {
                    console.log("🔐 Auth state ready:", user ? "authenticated" : "not authenticated");
                    resolved = true;
                    unsubscribe();
                    resolve(window.firebaseAuth);
                }
            });
            
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    unsubscribe();
                    resolve(window.firebaseAuth);
                }
            }, 5000);
        });
        
    } catch (error) {
        return null;
    }
}

window.onload = async function() {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("id");
    
    if (!matchId) {
        showError("Invalid Match ID");
        return;
    }

    try {
        console.log("Fetching match data for ID:", matchId);
        
        const userId = localStorage.getItem('userId');
        const userMode = localStorage.getItem('userMode');
        
        let data = null;
        
        if (userMode === 'authenticated' && userId) {
            try {
                const auth = await initializeFirebaseForScorecard();
                
                if (auth) {
                    let currentUser = auth.currentUser;
                    let attempts = 0;
                    const maxAttempts = 15;
                    
                    while (!currentUser && attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        currentUser = auth.currentUser;
                        attempts++;
                    }
                    
                    if (currentUser) {
                        try {
                            const idToken = await currentUser.getIdToken(true);
                            
                            const firebaseUrl = `https://scboard-e36a4-default-rtdb.firebaseio.com/users/${userId}/matches/${matchId}.json?auth=${idToken}`;
                            
                            const response = await fetch(firebaseUrl);
                            
                            if (response.ok) {
                                data = await response.json();
                            } 
                        } catch (tokenError) {
                        }
                    } else {
                    }
                }
            } catch (firebaseError) {
            }
        }
        
        if (!data) {
            data = getMatchFromLocalStorage(matchId);
        }
        
        if (!data) {
            showMatchNotFoundWithOptions(matchId);
            return;
        }
        
        renderFastScorecard(data);
        
    } catch (err) {
        showError(err.message);
    }
};

function getMatchFromLocalStorage(matchId) {
    try {
        
        const localMatches = JSON.parse(localStorage.getItem('localMatches')) || [];
        
        if (localMatches.length === 0) {
            return null;
        }
        
        let foundMatch = null;
        
        foundMatch = localMatches.find(match => match.id === matchId);
        if (foundMatch) {
            return foundMatch;
        }
        
        if (matchId.startsWith('local_')) {
            const index = parseInt(matchId.replace('local_', ''));
            if (localMatches[index]) {
                return localMatches[index];
            }
        }

        foundMatch = localMatches.find(match => 
            JSON.stringify(match).includes(matchId.substring(0, 10))
        );
        if (foundMatch) {
            return foundMatch;
        }
        return null;
        
    } catch (error) {
        return null;
    }
}

function showMatchNotFoundWithOptions(matchId) {
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                padding: 50px;
                border-radius: 20px;
                text-align: center;
                max-width: 600px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 1.8rem; font-weight: 700;">
                    Match Not Found
                </h1>
                <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px; color: #6b7280;">
                    Match ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${matchId}</code>
                </p>
                <p style="margin-bottom: 30px; color: #6b7280;">
                    This could happen if the match was saved locally or you don't have access to it.
                </p>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="history.back()" style="
                        background: linear-gradient(135deg, #575ce5, #4338ca);
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        box-shadow: 0 4px 15px rgba(87, 92, 229, 0.3);
                    ">← Back to History</button>
                    
                    <button onclick="window.location.href='../home.html'" style="
                        background: transparent;
                        color: #575ce5;
                        border: 2px solid #575ce5;
                        padding: 15px 25px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                    ">🏠 Home</button>
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                padding: 50px;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
                <h1 style="color: #1f2937; margin-bottom: 20px; font-size: 1.8rem; font-weight: 700;">
                    Something went wrong
                </h1>
                <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; color: #6b7280;">
                    ${message}
                </p>
                <button onclick="history.back()" style="
                    background: linear-gradient(135deg, #575ce5, #4338ca);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 1rem;
                    box-shadow: 0 4px 15px rgba(87, 92, 229, 0.3);
                ">← Back to History</button>
            </div>
        </div>
    `;
}

function renderFastScorecard(data) {
    try {
        document.getElementById("match-heading").textContent = 
            `${data.teamAName || 'Team A'} vs ${data.teamBName || 'Team B'}`;
        
        const matchDate = data.timestamp ? 
            new Date(data.timestamp).toLocaleString("en-IN", {
                dateStyle: "full",
                timeStyle: "short"
            }) : "Date not available";
        document.getElementById("match-date").textContent = matchDate;
        
        document.getElementById("result").textContent = 
            data.result || "Result not available";
        
        document.getElementById("toss-result").textContent = 
            data.tossResult || "Toss information not recorded";

        const motmElement = document.getElementById("man-of-the-match");
        if (motmElement && data.manOfTheMatch && data.manOfTheMatch !== "N/A") {
            motmElement.innerHTML = `
                <strong>Man of the Match:</strong> 
                <span style="color: #575ce5; font-weight: 700;">${data.manOfTheMatch}</span>
            `;
        } else if (motmElement) {
            motmElement.innerHTML = `
                <strong>Man of the Match:</strong> 
                <span style="color: #6b7280;">Not decided</span>
            `;
        }

        // Score summary
        const scoreSummary = document.getElementById("score-summary");
        if (scoreSummary) {
            scoreSummary.innerHTML = `
                <div class="detail-box">
                    <div class="detail-label">1st Innings</div>
                    <div>${data.firstInnings?.team || data.teamAName || 'TBD'} - ${data.firstInnings?.score || "0/0"}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">2nd Innings</div>
                    <div>${data.secondInnings?.team || data.teamBName || 'TBD'} - ${data.secondInnings?.score || "Yet to bat"}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Target</div>
                    <div>${data.secondInnings?.target || "TBD"}</div>
                </div>
            `;
        }

        // First innings rendering
        if (data.firstInnings) {
            const firstInningsTeamElement = document.getElementById("first-innings-team");
            if (firstInningsTeamElement) {
                firstInningsTeamElement.textContent = data.firstInnings.team || data.teamAName || "Team A";
            }
            renderInnings("first", data.firstInnings, data.teamBName || "Team B");
        }

        // Second innings rendering
        const secondInningsSection = document.getElementById("second-innings");
        if (secondInningsSection) {
            if (data.secondInnings) {
                secondInningsSection.style.display = 'block';
                const secondInningsTeamElement = document.getElementById("second-innings-team");
                if (secondInningsTeamElement) {
                    secondInningsTeamElement.textContent = data.secondInnings.team || data.teamBName || "Team B";
                }
                renderInnings("second", data.secondInnings, data.teamAName || "Team A");
            } else {
                secondInningsSection.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error("Error rendering scorecard:", error);
        showError("Failed to display match details. Please try again.");
    }
}

function renderInnings(inningsType, inningsData, bowlingTeamName) {
    if (!inningsData) {
        console.warn(`No ${inningsType} innings data available`);
        return;
    }
    
    try {
        const battingDiv = document.getElementById(`${inningsType}-innings-batting`);
        const bowlingDiv = document.getElementById(`${inningsType}-innings-bowling`);
        const bowlingHeader = document.getElementById(`${inningsType}-innings-bowling-team`);
        
        if (bowlingHeader) {
            bowlingHeader.textContent = bowlingTeamName;
        }
        
        if (battingDiv) {
            battingDiv.innerHTML = generateBattingTable(inningsData.batsmen || []);
        }
        
        if (bowlingDiv) {
            bowlingDiv.innerHTML = generateBowlingTable(inningsData.bowlers || []);
        }
        
    } catch (error) {
        console.error(`Error rendering ${inningsType} innings:`, error);
    }
}

function generateBattingTable(players) {
    if (!players || !Array.isArray(players) || players.length === 0) {
        return `<p style="text-align: center; padding: 20px; color: #6b7280; font-style: italic;">📊 No batting data available</p>`;
    }

    const battedPlayers = players.filter(p => {
        return p.isOut === true || 
               (p.balls > 0) || 
               (p.runs > 0) || 
               p.isOut === 'selected';
    });
    
    const didNotBatPlayers = players.filter(p => {
        return p.isOut !== true && 
               p.isOut !== 'selected' && 
               p.balls === 0 && 
               p.runs === 0;
    });
    
    let rows = battedPlayers.map(player => {
        const status = player.isOut === true
            ? `<span class="out">${player.dismissedBy ? `b ${player.dismissedBy}` : "Out"}</span>`
            : `<span class="not-out">Not Out</span>`;
        
        const strikeRate = (player.balls > 0) ? 
            ((player.runs / player.balls) * 100).toFixed(2) : "0.00";

        return `
            <tr>
                <td class="player-name">${player.name || "-"}</td>
                <td><strong>${player.runs || 0}</strong></td>
                <td>${player.balls || 0}</td>
                <td>${player.fours || 0}</td>
                <td>${player.sixes || 0}</td>
                <td>${strikeRate}</td>
                <td>${status}</td>
            </tr>`;
    }).join("");

    if (didNotBatPlayers.length > 0) {
        rows += `<tr class="dnb-header"><td colspan="7"><strong>⏳ Did Not Bat:</strong></td></tr>`;
        rows += didNotBatPlayers.map(p => `<tr class="dnb-row"><td colspan="7">${p.name}</td></tr>`).join("");
    }

    return `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Batter</th>
                    <th>R</th>
                    <th>B</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>SR</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function generateBowlingTable(players) {
    if (!players || !Array.isArray(players) || players.length === 0) {
        return `<p style="text-align: center; padding: 20px; color: #6b7280; font-style: italic;">⚡ No bowling data available</p>`;
    }
    
    const rows = players.map(player => {
        const totalOversAsBalls = (parseInt(player.overs.split('.')[0]) * 6) + (parseInt(player.overs.split('.')[1]) || 0);
        const economy = totalOversAsBalls > 0 ? 
            ((player.runs / totalOversAsBalls) * 6).toFixed(2) : "0.00";
        
        return `
            <tr>
                <td class="player-name">${player.name || "-"}</td>
                <td>${player.overs || "0.0"}</td>
                <td>${player.maidens || 0}</td>
                <td><strong>${player.runs || 0}</strong></td>
                <td><strong style="color: #dc2626;">${player.wickets || 0}</strong></td>
                <td>${economy}</td>
            </tr>`;
    }).join("");

    return `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Bowler</th>
                    <th>O</th>
                    <th>M</th>
                    <th>R</th>
                    <th>W</th>
                    <th>ECO</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}
