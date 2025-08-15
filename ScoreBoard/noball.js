
let isNoBallActive = false;
let isFreeHitActive = false;

function handleNoBall() {
    if (matchSettings.noballFreeHitPlusOne || matchSettings.noballPlusOneNoFreeHit) {
        totalRuns += 1;
        extras += 1;
        if (bowlers[currentBowlerIndex]) {
            bowlers[currentBowlerIndex].runs += 1;
        }
    }
    isNoBallActive = true;
    
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
    if (!isFirstInnings && totalRuns >= target && !isMatchOver) { 
        
        setTimeout(() => {
            const wicketsLeft = batsmen.filter(b => !b.isOut).length;
            const resultText = `${battingTeam} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}!`;
            alert(resultText);

            disableAllControls();
            saveMatchData();
        }, 150);
        
        return true; 
    }
    return false; 
}

function showNotification(message, color) {
    const notif = document.createElement("div");
    notif.className = "cricket-notification";
    notif.innerHTML = `
        <div class="notification-content" style="background:${color}">
            ${message}
        </div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.classList.add("fade-out");
        setTimeout(() => notif.remove(), 500);
    }, 2500);
}

async function saveMatchToFirebase(matchData) {
    const userMode = localStorage.getItem('userMode');
    const userId = localStorage.getItem('userId');
    
    if (userMode === 'authenticated' && userId) {
        try {
            if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                const idToken = await window.firebaseAuth.currentUser.getIdToken(true);
                
                const response = await fetch(`https://scboard-e36a4-default-rtdb.firebaseio.com/users/${userId}/matches.json?auth=${idToken}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(matchData)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    showNotification("Match saved successfully!", "#00CC66");
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                throw new Error("User not authenticated");
            }
        } catch (error) {
            console.error("❌ Firebase save error:", error);
            showNotification("Failed to save match!", "#FF4444");
            saveMatchToLocalStorage(matchData);
        }
    } else {
        saveMatchToLocalStorage(matchData);
        showNotification("Match saved locally!", "#FFA500");
    }
}
function saveMatchToLocalStorage(matchData) {
    try {
        let savedMatches = JSON.parse(localStorage.getItem('localMatches')) || [];
        savedMatches.push(matchData);
        localStorage.setItem('localMatches', JSON.stringify(savedMatches));
        
    } catch (error) {
        console.error("❌ LocalStorage save error:", error);
    }
}

function calculateManOfTheMatch(batsmenStats, bowlersStats) {
    const playerPoints = {};

    const RUN_POINT = 1;
    const WICKET_POINT = 25;
    const CENTURY_BONUS = 50;
    const HALF_CENTURY_BONUS = 25;
    const FIVE_WICKET_HAUL_BONUS = 50;

    batsmenStats.forEach(p => {
        if (!playerPoints[p.name]) playerPoints[p.name] = { name: p.name, points: 0, runs: 0, wickets: 0 };
    });
    bowlersStats.forEach(p => {
        if (!playerPoints[p.name]) playerPoints[p.name] = { name: p.name, points: 0, runs: 0, wickets: 0 };
    });

    batsmenStats.forEach(batsman => {
        if (batsman.runs > 0) {
            playerPoints[batsman.name].runs = (playerPoints[batsman.name].runs || 0) + batsman.runs;
            playerPoints[batsman.name].points += batsman.runs * RUN_POINT;

            if (batsman.runs >= 100) {
                playerPoints[batsman.name].points += CENTURY_BONUS;
            } else if (batsman.runs >= 50) {
                playerPoints[batsman.name].points += HALF_CENTURY_BONUS;
            }
        }
    });

    bowlersStats.forEach(bowler => {
        if (bowler.wickets > 0) {
            playerPoints[bowler.name].wickets = (playerPoints[bowler.name].wickets || 0) + bowler.wickets;
            playerPoints[bowler.name].points += bowler.wickets * WICKET_POINT;

            if (bowler.wickets >= 5) {
                playerPoints[bowler.name].points += FIVE_WICKET_HAUL_BONUS;
            }
        }
    });

    let manOfTheMatch = "N/A";
    let maxPoints = 0;

    for (const playerName in playerPoints) {
        const player = playerPoints[playerName];
        if (player.points > maxPoints) {
            maxPoints = player.points;
            manOfTheMatch = `${player.name} (${player.runs} runs & ${player.wickets} wkts)`;
        }
    }
    
    if(maxPoints === 0){
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

function showNotification(message, color = "#4CAF50") {
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
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
    }, 3000);
}

let matchWinnerTeam = "";

function saveMatchData() {
    console.log("saveMatchData function successfully called.");

    const matchData = createMatchDataObject();
    if (matchData) {
        if (matchData.result.includes(battingTeam)) {
            matchWinnerTeam = battingTeam;
        } else if (matchData.result.includes(bowlingTeam)) {
            matchWinnerTeam = bowlingTeam;
        } else {
            const firstInningsData = JSON.parse(localStorage.getItem('firstInningsData')) || {};
            matchWinnerTeam = firstInningsData.teamName || battingTeam;
        }

        showMatchCompleteModal(matchData);
        
        saveMatchToFirebase(matchData);
    } else {
        console.error("Match data object could not be created.");
    }
}

function showMatchCompleteModal(matchData) {
    document.getElementById('scoreBoard').classList.add('scoreboard-blur');
    
    const resultElement = document.getElementById('match-result-text');
    if (resultElement) {
        resultElement.textContent = matchData.result;
    }
    const motmElement = document.getElementById('motm-text');
    if (motmElement) {
        motmElement.textContent = `Man of the Match: ${matchData.manOfTheMatch}`;
    }
    const winnerTeamElement = document.getElementById('winner-team-name');
    if (winnerTeamElement) {
        winnerTeamElement.textContent = matchWinnerTeam;
    }

    const modal = document.getElementById('match-complete-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
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

function showNextMatchOptions() {
    document.getElementById('match-complete-modal').style.display = 'none';
    document.getElementById('next-match-options-modal').style.display = 'flex';
}

function backToMatchComplete() {
    document.getElementById('next-match-options-modal').style.display = 'none';
    document.getElementById('match-complete-modal').style.display = 'flex';
}

function startNextMatch(option) {
    const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
    
    if (option === 'winnerBats') {
        if (savedMatchData) {
            if (matchWinnerTeam === savedMatchData.teamA?.name) {
                savedMatchData.tossWinner = 'A';
                savedMatchData.tossDecision = 'bat';
            } else {
                savedMatchData.tossWinner = 'B';  
                savedMatchData.tossDecision = 'bat';
            }
            
            savedMatchData.battingTeam = matchWinnerTeam === savedMatchData.teamA?.name ? savedMatchData.teamA : savedMatchData.teamB;
            savedMatchData.bowlingTeam = matchWinnerTeam === savedMatchData.teamA?.name ? savedMatchData.teamB : savedMatchData.teamA;
            
            localStorage.setItem('matchSettings', JSON.stringify(savedMatchData));
        }
        
        resetForNewMatch();
        
    } else if (option === 'fromToss') {
        window.location.href = '/Flip-A-Coin/index.html';
        
    } else if (option === 'fromBeginning') {
        window.location.href = '/Flip-A-Coin/input-team-name/index.html';
    }
}

function resetForNewMatch() {
    localStorage.removeItem('firstInningsData');
     
    totalRuns = 0;
    wickets = 0;
    overs = 0;
    balls = 0;
    extras = 0;
    isFirstInnings = true;
    target = 0;
    isMatchOver = false;
    playersSelected = false;
     
    strikerIndex = -1;
    nonStrikerIndex = -1;
    currentBowlerIndex = -1;
     
    const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
    if (savedMatchData) {
        battingTeam = savedMatchData.battingTeam.name;
        bowlingTeam = savedMatchData.bowlingTeam.name;
         
        batsmen = savedMatchData.battingTeam.players.map(p => ({
            name: p, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false
        }));
        
        bowlers = savedMatchData.bowlingTeam.players.map(p => ({
            name: p, overs: 0, maidens: 0, runs: 0, wickets: 0, balls: 0
        }));
    }
     
    document.getElementById('scoreBoard').classList.remove('scoreboard-blur');
     
    document.getElementById('match-complete-modal').style.display = 'none';
    document.getElementById('next-match-options-modal').style.display = 'none';
    
    document.getElementById("batting-team-name").textContent = battingTeam;
    document.getElementById("bowling-team-name").textContent = bowlingTeam;
    document.getElementById("target-score").textContent = "-";
    document.getElementById("bowling-score").textContent = "-";
     
    document.querySelectorAll('.run-btn').forEach(btn => btn.disabled = false);
    document.querySelectorAll('.extra-btn').forEach(btn => btn.disabled = false);
    document.querySelectorAll('.wicket-btn').forEach(btn => btn.disabled = false);
    document.querySelector('.controls').style.opacity = '1';
    document.querySelector('.controls').style.cursor = 'default';
    
    updateScoreboard();
     
    setTimeout(() => showPlayerPopup("start"), 500);
}
 
function disableAllControls() {
    console.log("Match has ended. Disabling controls.");
    isMatchOver = true;
 
    document.querySelectorAll('.run-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.extra-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.wicket-btn').forEach(btn => btn.disabled = true);
     
    document.querySelector('.controls').style.opacity = '0.6';
    document.querySelector('.controls').style.cursor = 'not-allowed';
}
