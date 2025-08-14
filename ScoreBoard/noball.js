
let isNoBallActive = false;
let isFreeHitActive = false;

function handleNoBall() {
    // Apply penalty run based on settings
    if (matchSettings.noballFreeHitPlusOne || matchSettings.noballPlusOneNoFreeHit) {
        totalRuns += 1;
        extras += 1;
        if (bowlers[currentBowlerIndex]) {
            bowlers[currentBowlerIndex].runs += 1;
        }
    }
    
    // Set flags
    isNoBallActive = true;
    
    // Set notification
    let notificationMessage = "NO BALL!";
    let notificationColor = "orange";
    
    if (matchSettings.noballFreeHitPlusOne) {
        notificationMessage += " +1 Run. Next ball is FREE HIT";
        notificationColor = "gold";
        isFreeHitActive = true;
    } else if (matchSettings.noballPlusOneNoFreeHit) {
        notificationMessage += " +1 Run (No Free Hit)";
    } else if (matchSettings.noballBatsmanHitOnly) {
        notificationMessage = "NO BALL! (Batsman Hit Only)";
    }
    
    showNotification(notificationMessage, notificationColor);
    updateScoreboard();
    
    // Check if penalty run reached target
    if (!isFirstInnings && totalRuns >= target) {
        checkTargetReached();
    }
}

function checkOverCompletion() {
    if (balls >= 6) {
        overs++;
        balls = 0;
        
        if (matchSettings && overs >= matchSettings.oversLimit) {
            alert("Innings over: Maximum overs reached.");
            endInnings();
            return;
        }
        
        if (!wicketFellOnLastBall) {
            setTimeout(() => showPlayerPopup("newBowler"), 200);
        }
    }
}
function checkTargetReached() {
    // !isMatchOver चेक यह सुनिश्चित करता है कि यह लॉजिक सिर्फ एक बार चले
    if (!isFirstInnings && totalRuns >= target && !isMatchOver) { 
        
        // एक छोटा डिले ताकि UI अपडेट हो जाए
        setTimeout(() => {
            const wicketsLeft = batsmen.filter(b => !b.isOut).length;
            const resultText = `${battingTeam} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
            alert(resultText);

            disableAllControls();
            saveMatchData();
        }, 150);
        
        return true; // हाँ, टारगेट पूरा हो गया है
    }
    return false; // नहीं, टारगेट पूरा नहीं हुआ है
}
// Add this notification f not already present:
function showNotification(message, color) {
    const notif = document.createElement("div");
    notif.className = "cricket-notification";
    notif.innerHTML = `
        <div class="notification-content" style="background:${color}">
            ${message}
        </div>
    `;
    document.body.appendChild(notif);
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notif.classList.add("fade-out");
        setTimeout(() => notif.remove(), 500);
    }, 2500);
}


function saveMatchToFirebase(matchData) {
    const userMode = localStorage.getItem('userMode');
    const userId = localStorage.getItem('userId');
    
    let savePath = '';
    if (userMode === 'authenticated' && userId) {
        savePath = `users/${userId}/matches`;
    } else {
        savePath = 'guestMatches';
    }
    
    fetch(`https://scboard-e36a4-default-rtdb.firebaseio.com/${savePath}.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(matchData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Match saved to Firebase:", data);
        showNotification("Match saved successfully!", "#00CC66");
    })
    .catch(error => {
        console.error("Firebase save error:", error);
        showNotification("Failed to save match!", "#FF4444");
    });
}


// man of the match 
function calculateManOfTheMatch(batsmenStats, bowlersStats) {
    const playerPoints = {};

    // Points system
    const RUN_POINT = 1;
    const WICKET_POINT = 25;
    const CENTURY_BONUS = 50;
    const HALF_CENTURY_BONUS = 25;
    const FIVE_WICKET_HAUL_BONUS = 50;

    // Har player ke liye ek entry banayein
    batsmenStats.forEach(p => {
        if (!playerPoints[p.name]) playerPoints[p.name] = { name: p.name, points: 0, runs: 0, wickets: 0 };
    });
    bowlersStats.forEach(p => {
        if (!playerPoints[p.name]) playerPoints[p.name] = { name: p.name, points: 0, runs: 0, wickets: 0 };
    });

    // Batsmen ke points calculate karein
    batsmenStats.forEach(batsman => {
        if (batsman.runs > 0) {
            playerPoints[batsman.name].runs = (playerPoints[batsman.name].runs || 0) + batsman.runs;
            playerPoints[batsman.name].points += batsman.runs * RUN_POINT;

            // Bonus points
            if (batsman.runs >= 100) {
                playerPoints[batsman.name].points += CENTURY_BONUS;
            } else if (batsman.runs >= 50) {
                playerPoints[batsman.name].points += HALF_CENTURY_BONUS;
            }
        }
    });

    // Bowlers ke points calculate karein
    bowlersStats.forEach(bowler => {
        if (bowler.wickets > 0) {
            playerPoints[bowler.name].wickets = (playerPoints[bowler.name].wickets || 0) + bowler.wickets;
            playerPoints[bowler.name].points += bowler.wickets * WICKET_POINT;

            // Bonus points
            if (bowler.wickets >= 5) {
                playerPoints[bowler.name].points += FIVE_WICKET_HAUL_BONUS;
            }
        }
    });

    // Sabse zyada points wala player dhundein
    let manOfTheMatch = "N/A";
    let maxPoints = 0;

    for (const playerName in playerPoints) {
        const player = playerPoints[playerName];
        if (player.points > maxPoints) {
            maxPoints = player.points;
            manOfTheMatch = `${player.name} (${player.runs} runs & ${player.wickets} wkts)`;
        }
    }
    
    // Agar koi performance nahi hai
    if(maxPoints === 0){
        // Agar koi point nahi bana, to sabse zyada run banane wale ko de dein
        let topScorer = { name: "N/A", runs: -1 };
        batsmenStats.forEach(b => {
            if(b.runs > topScorer.runs){
                topScorer = { name: b.name, runs: b.runs };
            }
        });
        if(topScorer.runs > 0) return `${topScorer.name} (${topScorer.runs} runs)`;
    }

    return manOfTheMatch;
}

function initializeRunOutButtons() {
    document.querySelector(".runout-btn")?.addEventListener("click", initiateRunOut);
    document.getElementById('bowler-end-btn')?.addEventListener('click', handleBowlerEndRunOut);
    document.getElementById('keeper-end-btn')?.addEventListener('click', handleKeeperEndRunOut);
}
// Notification function for better UX
function showNotification(message, color = "#4CAF50") {
    // Create or update notification element
    let notification = document.getElementById('game-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'game-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.backgroundColor = color;
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}

// Global variable for winner team
let matchWinnerTeam = "";

// Modified saveMatchData function
function saveMatchData() {
    console.log("saveMatchData function successfully called.");

    const matchData = createMatchDataObject();
    if (matchData) {
        // Set winner team for next match
        if (matchData.result.includes(battingTeam)) {
            matchWinnerTeam = battingTeam;
        } else if (matchData.result.includes(bowlingTeam)) {
            matchWinnerTeam = bowlingTeam;
        } else {
            // For tie, use first innings winner
            const firstInningsData = JSON.parse(localStorage.getItem('firstInningsData')) || {};
            matchWinnerTeam = firstInningsData.teamName || battingTeam;
        }

        // Show match complete modal instead of alert
        showMatchCompleteModal(matchData);
        
        saveMatchToFirebase(matchData);
    } else {
        console.error("Match data object could not be created.");
    }
}

// New function to show match complete modal
function showMatchCompleteModal(matchData) {
    // Blur background
    document.getElementById('scoreBoard').classList.add('scoreboard-blur');
    
    // Set match result text
    document.getElementById('match-result-text').textContent = matchData.result;
    document.getElementById('motm-text').textContent = `Man of the Match: ${matchData.manOfTheMatch}`;
    
    // Update winner team name in next match options
    document.getElementById('winner-team-name').textContent = matchWinnerTeam;
    
    // Show modal
    document.getElementById('match-complete-modal').style.display = 'flex';
}

// Navigation functions
function navigateToHome() {
    window.location.href = '/HomePage/home.html';
}

function navigateToHistory() {
    const userMode = localStorage.getItem('userMode');
    
    if (userMode === 'authenticated') {
        window.location.href = '/History_Page/history.html';
    } else {
        alert('Please login first to view match history');
        window.location.href = '/loginSystem/login.html';
    }
}

// Show next match options
function showNextMatchOptions() {
    document.getElementById('match-complete-modal').style.display = 'none';
    document.getElementById('next-match-options-modal').style.display = 'flex';
}

// Back to match complete modal
function backToMatchComplete() {
    document.getElementById('next-match-options-modal').style.display = 'none';
    document.getElementById('match-complete-modal').style.display = 'flex';
}

// Start next match with different options
function startNextMatch(option) {
    const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
    
    if (option === 'winnerBats') {
        // Winner bats first
        if (savedMatchData) {
            // Update saved settings - winner bats first
            if (matchWinnerTeam === savedMatchData.teamA?.name) {
                savedMatchData.tossWinner = 'A';
                savedMatchData.tossDecision = 'bat';
            } else {
                savedMatchData.tossWinner = 'B';  
                savedMatchData.tossDecision = 'bat';
            }
            
            // Update batting/bowling teams
            savedMatchData.battingTeam = matchWinnerTeam === savedMatchData.teamA?.name ? savedMatchData.teamA : savedMatchData.teamB;
            savedMatchData.bowlingTeam = matchWinnerTeam === savedMatchData.teamA?.name ? savedMatchData.teamB : savedMatchData.teamA;
            
            localStorage.setItem('matchSettings', JSON.stringify(savedMatchData));
        }
        
        // Reset and start new match
        resetForNewMatch();
        
    } else if (option === 'fromToss') {
        // Go to toss page
        window.location.href = '/Flip-A-Coin/index.html';
        
    } else if (option === 'fromBeginning') {
        // Go to team setup page
        window.location.href = '/Flip-A-Coin/input-team-name/index.html';
    }
}

// Reset for new match function
function resetForNewMatch() {
    // Clear first innings data
    localStorage.removeItem('firstInningsData');
    
    // Reset all match variables
    totalRuns = 0;
    wickets = 0;
    overs = 0;
    balls = 0;
    extras = 0;
    isFirstInnings = true;
    target = 0;
    isMatchOver = false;
    playersSelected = false;
    
    // Reset player indices
    strikerIndex = -1;
    nonStrikerIndex = -1;
    currentBowlerIndex = -1;
    
    // Re-initialize with new settings
    const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
    if (savedMatchData) {
        battingTeam = savedMatchData.battingTeam.name;
        bowlingTeam = savedMatchData.bowlingTeam.name;
        
        // Reset player stats
        batsmen = savedMatchData.battingTeam.players.map(p => ({
            name: p, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false
        }));
        
        bowlers = savedMatchData.bowlingTeam.players.map(p => ({
            name: p, overs: 0, maidens: 0, runs: 0, wickets: 0, balls: 0
        }));
    }
    
    // Remove blur effect
    document.getElementById('scoreBoard').classList.remove('scoreboard-blur');
    
    // Hide modals
    document.getElementById('match-complete-modal').style.display = 'none';
    document.getElementById('next-match-options-modal').style.display = 'none';
    
    // Update UI
    document.getElementById("batting-team-name").textContent = battingTeam;
    document.getElementById("bowling-team-name").textContent = bowlingTeam;
    document.getElementById("target-score").textContent = "-";
    document.getElementById("bowling-score").textContent = "-";
    
    // Enable controls
    document.querySelectorAll('.run-btn').forEach(btn => btn.disabled = false);
    document.querySelectorAll('.extra-btn').forEach(btn => btn.disabled = false);
    document.querySelectorAll('.wicket-btn').forEach(btn => btn.disabled = false);
    document.querySelector('.controls').style.opacity = '1';
    document.querySelector('.controls').style.cursor = 'default';
    
    updateScoreboard();
    
    // Show player selection popup
    setTimeout(() => showPlayerPopup("start"), 500);
}

// Update disableAllControls to not show alert
function disableAllControls() {
    console.log("Match has ended. Disabling controls.");
    isMatchOver = true;

    // Disable all buttons
    document.querySelectorAll('.run-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.extra-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.wicket-btn').forEach(btn => btn.disabled = true);
    
    // Style disabled controls
    document.querySelector('.controls').style.opacity = '0.6';
    document.querySelector('.controls').style.cursor = 'not-allowed';
}
