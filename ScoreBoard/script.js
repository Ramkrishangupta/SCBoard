// Settings Configuration Object
let matchSettings = {};
let battingTeam = "";
let bowlingTeam = "";
let totalRuns = 0;
let wickets = 0;
let overs = 0;
let balls = 0;
let extras = 0;
let isFirstInnings = true;
let target = 0;
let isFreeHit = false;
let runsBeforeRunOut = 0;
let isRunOutActive = false; 
let firstInningsOvers = "0.0";
let tossWinner = "";
let tossDecision = ""; 
let wicketFellOnLastBall = false;
// Player stats
let batsmen = [];
let bowlers = [];
let currentBowlerIndex = 0;
let strikerIndex = 0;
let nonStrikerIndex = 1;
let firstInningsBatsmenGlobal = [];
let firstInningsBowlersGlobal = [];
let playersSelected = false;
let firstInningsExtras = 0;
function saveMatchSettings() {
    const teamA = {
        name: document.getElementById("team-a-name").value,
        players: Array.from(document.querySelectorAll("#team-a-list .player-item input"))
            .map(input => input.value)
            .filter(name => name.trim() !== "")
    };
    
    const teamB = {
        name: document.getElementById("team-b-name").value,
        players: Array.from(document.querySelectorAll("#team-b-list .player-item input"))
            .map(input => input.value)
            .filter(name => name.trim() !== "")
    };
    
    // FIX: Ensure we're getting the value correctly
    const overs = parseInt(document.getElementById("overs").value);
    const playerCount = parseInt(document.getElementById("player-count").value);
    const tossWinner = document.querySelector('input[name="toss-winner"]:checked').value;
    const tossDecision = document.querySelector('input[name="toss-decision"]:checked').value;
    
    const matchSettings = {
        teamA: teamA,
        teamB: teamB,
        overs, // This should be the integer value
        playerCount,
        tossWinner,
        tossDecision,
        battingTeam: tossDecision === "bat" ? (tossWinner === "A" ? teamA : teamB) : (tossWinner === "A" ? teamB : teamA),
        bowlingTeam: tossDecision === "bat" ? (tossWinner === "A" ? teamB : teamA) : (tossWinner === "A" ? teamA : teamB)
    };
    
    console.log("Saving match settings:", matchSettings); // Debug log
    localStorage.setItem('matchSettings', JSON.stringify(matchSettings));
    alert("Match settings saved!");
    window.location.href = "scoreboard.html";
}
function initializeApp() {
    const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
   
    if (!savedMatchData) {
        console.log("No saved settings. Showing settings overlay.");
        return;
    }
    console.log("Match settings found. Initializing the match.");

    isMatchOver = false;
    totalRuns = 0; wickets = 0; overs = 0; balls = 0; extras = 0;
    isFirstInnings = true;
    strikerIndex = -1; nonStrikerIndex = -1; currentBowlerIndex = -1;
    target = 0;
    
    const battingPlayersList = savedMatchData.battingTeam?.players || [];
    const bowlingPlayersList = savedMatchData.bowlingTeam?.players || [];
    const playersFromSettings = parseInt(savedMatchData.playerCount) || 0;
   
    if (playersFromSettings === 0 || battingPlayersList.length < playersFromSettings || bowlingPlayersList.length < playersFromSettings) {
        alert("Player Data Error! Please start a new match.");
        localStorage.removeItem('matchSettings'); // गलत सेटिंग्स हटा दें
        showSettingsOverlay();
        return;
    }
    matchSettings = {
        oversLimit: parseInt(savedMatchData.overs) || 5,
        maxPlayers: playersFromSettings,
        wicketsLimit: playersFromSettings - 1,
        wideRunsCount: savedMatchData.wideRunsCount !== undefined ? savedMatchData.wideRunsCount : true,
        noballFreeHitPlusOne: savedMatchData.noballFreeHitPlusOne !== undefined ? savedMatchData.noballFreeHitPlusOne : true
    };
    
    battingTeam = savedMatchData.battingTeam.name;
    bowlingTeam = savedMatchData.bowlingTeam.name;

    batsmen = battingPlayersList.map(p => ({
        name: p, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false
    }));
    bowlers = bowlingPlayersList.map(p => ({
        name: p, overs: 0, maidens: 0, runs: 0, wickets: 0, balls: 0
    }));

    setupEventListeners();
    updateOverthrowButton();
    document.getElementById("batting-team-name").textContent = battingTeam;
    document.getElementById("bowling-team-name").textContent = bowlingTeam;
    updateScoreboard();
   
    if (isFirstInnings && overs === 0 && balls === 0) {
        setTimeout(() => showSettingsOverlay(), 300);
    }
   
}
// New function to load only scoring rules
function loadScoringRulesOnly() {
    const savedSettings = localStorage.getItem('gullyCricketSettings');
    if (savedSettings) {
        const temp = JSON.parse(savedSettings);
        
        // Only update scoring rules, not match settings
        matchSettings.wideRunsCount = temp.wideRunsCount;
        matchSettings.noballFreeHitPlusOne = temp.noballFreeHitPlusOne;
        matchSettings.noballPlusOneNoFreeHit = temp.noballPlusOneNoFreeHit;
        matchSettings.noballBatsmanHitOnly = temp.noballBatsmanHitOnly;
        matchSettings.overthrowRunsCount = temp.overthrowRunsCount;
        
        updateSettingsUI();
    }
}
function calculateStrikeRate(runs, balls) {
    if (balls === 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
}

// Load Saved Settings
function loadSavedSettings() {
    const savedSettings = localStorage.getItem('gullyCricketSettings');
    if (savedSettings) {
        const temp = JSON.parse(savedSettings);
        Object.assign(matchSettings, temp);
        updateSettingsUI();
    }
}

// Update Settings UI
function updateSettingsUI() {
    const s = matchSettings;
    document.getElementById('wide-ball-include').checked = s.wideRunsCount;
    document.getElementById('no-ball-include').checked = s.noballFreeHitPlusOne;
    document.getElementById('no-ball-player-run').checked = s.noballPlusOneNoFreeHit;
    document.getElementById('noball-batsman-hit-only').checked = s.noballBatsmanHitOnly;
    document.getElementById('overthrow-include').checked = s.overthrowRunsCount;
}
// Show Settings Overlay
function showSettingsOverlay() {
    updateSettingsUI();
    const overlay = document.getElementById('settings-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
}

// Hide Settings Overlay
function hideSettingsOverlay() {
    const overlay = document.getElementById('settings-overlay');
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
}

// Save Settings
function saveSettings() {
    if (overs > 0 || balls > 0) {
        alert("Settings can only be changed before the first ball is bowled!");
        hideSettingsOverlay();
        return;
    }
    const s = matchSettings;
    s.wideRunsCount = document.getElementById('wide-ball-include').checked;
    s.noballFreeHitPlusOne = document.getElementById('no-ball-include').checked;
    s.noballPlusOneNoFreeHit = document.getElementById('no-ball-player-run').checked;
    s.noballBatsmanHitOnly = document.getElementById('noball-batsman-hit-only').checked;
    s.overthrowRunsCount = document.getElementById('overthrow-include').checked;

    localStorage.setItem('gullyCricketSettings', JSON.stringify(s));
    updateOverthrowButton();
    const btn = document.getElementById('save-settings');
    btn.textContent = 'Saved!';

    setTimeout(() => {
        btn.textContent = 'Save Settings';
        hideSettingsOverlay();

        if (isFirstInnings && overs === 0 && balls === 0 && !playersSelected) {
            setTimeout(() => {
                showPlayerPopup("start");
            }, 300);
        }
    }, 1000);
}
function saveMatchSettings() {
    const teamA = {
        name: document.getElementById("team-a-name").value,
        players: Array.from(document.querySelectorAll("#team-a-list .player-item input"))
            .map(input => input.value)
            .filter(name => name.trim() !== "")
    };
    
    const teamB = {
        name: document.getElementById("team-b-name").value,
        players: Array.from(document.querySelectorAll("#team-b-list .player-item input"))
            .map(input => input.value)
            .filter(name => name.trim() !== "")
    };
    
    const overs = parseInt(document.getElementById("overs").value);
    const playerCount = parseInt(document.getElementById("player-count").value);
    const tossWinner = document.querySelector('input[name="toss-winner"]:checked').value;
    const tossDecision = document.querySelector('input[name="toss-decision"]:checked').value;
    
    const matchSettings = {
        teamA,
        teamB,
        overs,  // Make sure this is saving the correct value
        playerCount,
        tossWinner,
        tossDecision,
        battingTeam: tossDecision === "bat" ? (tossWinner === "A" ? teamA : teamB) : (tossWinner === "A" ? teamB : teamA),
        bowlingTeam: tossDecision === "bat" ? (tossWinner === "A" ? teamB : teamA) : (tossWinner === "A" ? teamA : teamB)
    };
    
    console.log("Saving match settings:", matchSettings); // Add this for debugging
    localStorage.setItem('matchSettings', JSON.stringify(matchSettings));
    alert("Match settings saved!");
    window.location.href = "scoreboard.html";
}
function incrementBall() {
    // सिर्फ गेंदबाज की फेंकी गई कुल गेंदें बढ़ाएं
    if (bowlers[currentBowlerIndex]) {
        bowlers[currentBowlerIndex].balls++;
    }
    // अगर यह लीगल गेंद है (नो-बॉल या फ्री-हिट नहीं), तो ओवर की गेंद बढ़ाएं
    if (!isNoBallActive && !isFreeHitActive) {
        balls++;
    }
    if (balls >= 6) {
        overs++;
        balls = 0;
        
        // अब जाँचें कि क्या पारी खत्म हो गई है ise dhyan se ........
        if (matchSettings && overs >= matchSettings.oversLimit) {
            alert("Innings over: Maximum overs reached.");
            endInnings();
            return; // आगे कुछ न करें
        }
        // अगर आखिरी गेंद पर विकेट नहीं गिरा, तो नया गेंदबाज चुनें
        if (!wicketFellOnLastBall) {
            setTimeout(() => showPlayerPopup("newBowler"), 200);
        }
    }
}
function findNextAvailableBatsman() {
    // First try to find batsman with higher index
    for (let i = Math.max(strikerIndex, nonStrikerIndex) + 1; i < batsmen.length; i++) {
        if (!batsmen[i].isOut) {
            return i;
        }
    }   
    // Then try any available batsman (including lower indices)
    for (let i = 0; i < batsmen.length; i++) {
        if (!batsmen[i].isOut && i !== strikerIndex && i !== nonStrikerIndex) {
            return i;
        }
    }    
    // If still not found, add new player if possible
    if (batsmen.length < matchSettings.maxPlayers) {
        batsmen.push({ 
            name: `Player ${batsmen.length + 1}`, 
            runs: 0, 
            balls: 0, 
            fours: 0, 
            sixes: 0, 
            isOut: false 
        });
        return batsmen.length - 1;
    }
    
    return -1; // No more batsmen available
}

// Function to handle the initial Run Out action (prompt for runs and show end selection buttons)
function initiateRunOut() {
    if (isRunOutActive) {
        alert("Run Out process is already active. Please select the end.");
        return;
    }
    const runs = parseInt(prompt("Enter runs completed before the Run Out:", "0"));
    if (!isNaN(runs)) {
        runsBeforeRunOut = runs;
        isRunOutActive = true;
        // Show the 'Bowler End' and 'Keeper End' buttons
        document.getElementById('bowler-end-btn').style.display = 'inline-block';
        document.getElementById('keeper-end-btn').style.display = 'inline-block';
        // Hide the run out initiation button (optional, if you want it to disappear)
        document.querySelector(".runout-btn").style.display = 'none';
    } else {
        alert("Invalid input for runs.");
    }
}

// Function to handle Run Out at Bowler's End
function handleBowlerEndRunOut() {
    if (isRunOutActive) {
        processRunOut("bowler");
        resetRunOutUI();
    }
}

// Function to handle Run Out at Keeper's End
function handleKeeperEndRunOut() {
    if (isRunOutActive) {
        processRunOut("keeper");
        resetRunOutUI();
    }
}

function processRunOut(endType) {
    if (!isRunOutActive) return;

    const runOutRuns = runsBeforeRunOut; // completed runs before wicket fell
    const striker = batsmen[strikerIndex];
    const nonStriker = batsmen[nonStrikerIndex];
    const bowler = bowlers[currentBowlerIndex];

    // Add runs to total and stats
    totalRuns += runOutRuns;
    if (striker) {
        striker.runs += runOutRuns;
        striker.balls++;
    }
    if (bowler) {
        bowler.balls++;
        bowler.runs += runOutRuns;
    }

    // Mark the batsman out
    const outIndex = endType === "bowler" ? nonStrikerIndex : strikerIndex;
    if (batsmen[outIndex]) {
        batsmen[outIndex].isOut = true;
        batsmen[outIndex].dismissedBy = "Run Out";
    }
    wickets++;

    if (endType === "bowler") {
        if (runOutRuns % 2 === 0) {
            [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
        }
    }
    isRunOutActive = false;
    runsBeforeRunOut = 0;

    // Update UI
    updateScoreboard();
    updateBatsmanUI();
    updateBowlerStats();
    resetRunOutUI();

    const totalPlayers = parseInt(localStorage.getItem('numPlayers')) || batsmen.length;
    if (wickets >= totalPlayers - 1) {
        setTimeout(() => {
            if (isFirstInnings) {
                alert(`${bowlingTeam} needs ${totalRuns + 1} runs to win.`);
                endInnings();
            } else {
                let resultText = "";
                const runsNeeded = target - totalRuns;

                if (runsNeeded > 1) {
                    resultText = `${bowlingTeam} won by ${runsNeeded - 1} runs!`;
                } else if (runsNeeded === 1) {
                    resultText = "Match Tied!";
                }
                alert(resultText);
                disableAllControls();
                saveMatchData();
            }
        }, 150);
    } else {
        setTimeout(() => showPlayerPopup("newBatsman"), 700);
    }
}
function resetRunOutUI() {
    document.getElementById('bowler-end-btn').style.display = 'none';
    document.getElementById('keeper-end-btn').style.display = 'none';
    document.querySelector(".runout-btn").style.display = 'inline-block';
}
// Set up event listeners
function setupEventListeners() {
    console.log("🎯 Setting up event listeners...");
    
    try {
        // Settings button - Keep as is, working fine
        const settingsBtn = document.getElementById('open-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                showSettingsOverlay(); // ✅ Better to use function if it exists
            });
            console.log("✅ Settings button listener added");
        } else {
            console.warn("⚠️ Settings button not found");
        }

        // Settings overlay close - Keep as is, working fine
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) {
            settingsOverlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        }

        // Save settings button - ✅ Enhanced to actually save settings
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', function() {
                // ✅ Save actual settings instead of just closing
                saveSettings(); // Call your existing function if available
                document.getElementById('settings-overlay').style.display = 'none';
                console.log("✅ Settings saved");
            });
        }

        // ✅ Run button controls - Enhanced validation
        const runBtns = document.querySelectorAll('.run-btn');
        if (runBtns.length > 0) {
            runBtns.forEach(btn => {
                if (btn && btn.dataset.runs) { // ✅ Check if data-runs exists
                    btn.addEventListener('click', handleRunScored);
                }
            });
            console.log(`✅ Added listeners to ${runBtns.length} run buttons`);
        } else {
            console.warn("⚠️ No run buttons found");
        }

        // ✅ Extra buttons - Enhanced validation
        const extraBtns = document.querySelectorAll('.extra-btn');
        if (extraBtns.length > 0) {
            extraBtns.forEach(btn => {
                if (btn && btn.dataset.extra) { // ✅ Check if data-extra exists
                    btn.addEventListener('click', handleExtra);
                }
            });
            console.log(`✅ Added listeners to ${extraBtns.length} extra buttons`);
        } else {
            console.warn("⚠️ No extra buttons found");
        }

        // ✅ Wicket button - Keep as is, working fine
        const wicketBtn = document.querySelector('.wicket-btn');
        if (wicketBtn) {
            wicketBtn.addEventListener('click', handleWicket);
            console.log("✅ Wicket button listener added");
        } else {
            console.warn("⚠️ Wicket button not found");
        }

        // ✅ Run out buttons - Add these if missing
        const runoutBtn = document.querySelector('.runout-btn');
        if (runoutBtn) {
            runoutBtn.addEventListener('click', function() {
                if (typeof initiateRunOut === 'function') {
                    initiateRunOut();
                } else {
                    console.warn("initiateRunOut function not found");
                }
            });
        }

        const bowlerEndBtn = document.getElementById('bowler-end-btn');
        if (bowlerEndBtn) {
            bowlerEndBtn.addEventListener('click', function() {
                if (typeof handleBowlerEndRunOut === 'function') {
                    handleBowlerEndRunOut();
                }
            });
        }

        const keeperEndBtn = document.getElementById('keeper-end-btn');
        if (keeperEndBtn) {
            keeperEndBtn.addEventListener('click', function() {
                if (typeof handleKeeperEndRunOut === 'function') {
                    handleKeeperEndRunOut();
                }
            });
        }
        console.log("ℹ️ End innings and new match buttons handled by modal system");

        console.log("✅ Event listeners setup completed successfully");

    } catch (error) {
        console.error("❌ Error setting up event listeners:", error);
        console.log("⚠️ Some controls may not work properly");
    }
}
function handleRunScored(event) {
    if (isMatchOver) {
        showNotification("Match is already over!", "#ff4444");
        return;
    }
    
    const runs = parseInt(event.target.dataset.runs);
    if (isNaN(runs)) {
        console.error("Invalid run value");
        return;
    }
    
    console.log(`🏏 Run scored: ${runs}`);
    addRuns(runs);
}
function handleWicket(event) {
    addWicket(); 
}
function updateScoreboard() {
    document.getElementById("batting-score").textContent = `${totalRuns}/${wickets}`;
    document.getElementById("batting-overs").textContent = `(${overs}.${balls} ov)`;
    
    const totalBalls = overs * 6 + balls;
    const runRate = totalBalls > 0 ? (totalRuns / totalBalls) * 6 : 0;
    document.getElementById("current-rr").textContent = runRate.toFixed(2);
    
    document.getElementById("extras").textContent = extras;
    document.getElementById("target-score").textContent = target > 0 ? target : "-";
    // 2. दूसरी पारी का स्कोर दिखाएं (यह हिस्सा सही है)
    if (!isFirstInnings) {
        const firstInningsData = JSON.parse(localStorage.getItem('firstInningsData')) || {};
        const scoreText = `${firstInningsData.total || 0}/${firstInningsData.wickets || 0}`;
        document.getElementById("bowling-score").textContent = scoreText;
    } else {
        document.getElementById("bowling-score").textContent = "-";
    }

    updateBatsmanUI();   // यह दोनों बल्लेबाजों को संभालेगा
    updateBowlerStats(); // यह गेंदबाज को संभालेगा
}
function updateBatsmanUI() {
    const striker = batsmen[strikerIndex];
    const nonStriker = batsmen[nonStrikerIndex];

    const player1Row = document.querySelector(".batsman-row:nth-child(2)");
    const player2Row = document.querySelector(".batsman-row:nth-child(3)");

    // सुरक्षा जाँच: अगर player1Row या player2Row नहीं मिला, तो बाहर निकल जाएं
    if (!player1Row || !player2Row) return;

    // स्ट्राइकर का UI अपडेट करें (अगर वह चुना गया है)
    if (striker) {
        player1Row.querySelector('.player-name').textContent = striker.name + " *";
        player1Row.querySelector('.runs').textContent = striker.runs;
        player1Row.querySelector('.balls').textContent = striker.balls;
        player1Row.querySelector('.fours').textContent = striker.fours;
        player1Row.querySelector('.sixes').textContent = striker.sixes;
        const sr = striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(2) : "0.00";
        player1Row.querySelector('.strike-rate').textContent = sr;
    } else {
        // अगर कोई स्ट्राइकर नहीं है, तो रो को खाली कर दें (यह क्रैश को रोकता है)
        player1Row.querySelector('.player-name').textContent = "";
        player1Row.querySelector('.runs').textContent = "0";
        player1Row.querySelector('.balls').textContent = "0";
        player1Row.querySelector('.fours').textContent = "0";
        player1Row.querySelector('.sixes').textContent = "0";
        player1Row.querySelector('.strike-rate').textContent = "0.00";
    }

    // नॉन-स्ट्राइकर का UI अपडेट करें (अगर वह चुना गया है)
    if (nonStriker) {
        player2Row.querySelector('.player-name').textContent = nonStriker.name;
        player2Row.querySelector('.runs').textContent = nonStriker.runs;
        player2Row.querySelector('.balls').textContent = nonStriker.balls;
        player2Row.querySelector('.fours').textContent = nonStriker.fours;
        player2Row.querySelector('.sixes').textContent = nonStriker.sixes;
        const sr = nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(2) : "0.00";
        player2Row.querySelector('.strike-rate').textContent = sr;
    } else {
        // अगर कोई नॉन-स्ट्राइकर नहीं है, तो रो को खाली कर दें
        player2Row.querySelector('.player-name').textContent = "";
        player2Row.querySelector('.runs').textContent = "0";
        player2Row.querySelector('.balls').textContent = "0";
        player2Row.querySelector('.fours').textContent = "0";
        player2Row.querySelector('.sixes').textContent = "0";
        player2Row.querySelector('.strike-rate').textContent = "0.00";
    }
}
function updateBowlerStats() {
    const bowlerRow = document.querySelector(".bowler-row");
    const bowler = bowlers[currentBowlerIndex];

    if (!bowlerRow) return;

    // सुरक्षा जाँच - क्या गेंदबाज चुना गया है?
    if (bowler) {
        // अगर हाँ, तो आँकड़े दिखाएं
        const oversInt = Math.floor(bowler.balls / 6);
        const ballsInt = bowler.balls % 6;
        const oversDisplay = `${oversInt}.${ballsInt}`;
        const totalOvers = bowler.balls / 6;
        const economyRate = totalOvers > 0 ? (bowler.runs / totalOvers).toFixed(2) : "0.00";

        bowlerRow.querySelector(".player-name").textContent = bowler.name + "*";
        bowlerRow.querySelector(".overs").textContent = oversDisplay;
        bowlerRow.querySelector(".maidens").textContent = bowler.maidens;
        bowlerRow.querySelector(".runs-conceded").textContent = bowler.runs;
        bowlerRow.querySelector(".wickets").textContent = bowler.wickets;
        bowlerRow.querySelector(".economy").textContent = economyRate;
    } else {
        // अगर नहीं, तो खाली जानकारी दिखाएं (यह क्रैश को रोकता है)
        bowlerRow.querySelector(".player-name").textContent = "";
        bowlerRow.querySelector(".overs").textContent = "0.0";
        bowlerRow.querySelector(".maidens").textContent = "0";
        bowlerRow.querySelector(".runs-conceded").textContent = "0";
        bowlerRow.querySelector(".wickets").textContent = "0";
        bowlerRow.querySelector(".economy").textContent = "0.00";
    }
}
// Add with other helper functions
function updateOverthrowButton() {
    const btn = document.getElementById("overthrow-btn");
    if (matchSettings.overthrowRunsCount) {
        btn.style.display = 'inline-block';
        btn.classList.add('active');
        btn.onclick = handleOverthrow; // Connect to noball.js function
    } else {
        btn.style.display = 'none';
        btn.classList.remove('active');
    }
}
let isOverthrowActive = false; // Add this with other global variables

// Modified Overthrow Handler
function handleOverthrow() {
    isOverthrowActive = true;
    const completedRuns = totalRuns; // Current runs before overthrow
    const overthrowRuns = parseInt(prompt("Overthrow ke kitne extra run?", "0"));
    
    if (!isNaN(overthrowRuns)) {
        // Add runs without ball increment
        batsmen[strikerIndex].runs += overthrowRuns;
        totalRuns += overthrowRuns;
        
        // Rotate strike for odd runs
        if (overthrowRuns % 2 !== 0) {
            [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
        }
        
        showNotification(`OVERTHROW! +${overthrowRuns} runs`, "#FF5555");
    }
    
    isOverthrowActive = false;
    updateScoreboard();
}
let pendingNoBallRuns = 0; // No Ball पर बनाए गए रन्स को होल्ड करेगा

function addRuns(runs, isWide = false) {
    if (isMatchOver) return;

    // Wide handling
    if (isWide) {
        if (matchSettings.wideRunsCount) {
            totalRuns++;
            extras++;
            if (bowlers[currentBowlerIndex]) {
                bowlers[currentBowlerIndex].runs++;
            }
        }
        updateScoreboard();
        return;
    }

    // Handle no-ball deliveries
    if (isNoBallActive) {
        // This is a no-ball delivery
        totalRuns += runs;
        
        // Add runs to the current striker
        if (batsmen[strikerIndex]) {
            batsmen[strikerIndex].runs += runs;
            // DO NOT increment balls faced for no-ball delivery
            if (runs === 4) batsmen[strikerIndex].fours++;
            if (runs === 6) batsmen[strikerIndex].sixes++;
        }
        
        // Add runs to bowler's conceded runs
        if (bowlers[currentBowlerIndex]) {
            bowlers[currentBowlerIndex].runs += runs;
        }
        
        // Rotate strike for odd runs
        if (runs % 2 !== 0) {
            [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
        }
        
        // Reset no-ball flag
        isNoBallActive = false;
        
        // Update scoreboard but do NOT increment ball count
        updateScoreboard();
        return;
    }

    // Handle free-hit deliveries
    if (isFreeHitActive) {
        // Free-hit delivery
        totalRuns += runs;
        
        if (batsmen[strikerIndex]) {
            batsmen[strikerIndex].runs += runs;
            batsmen[strikerIndex].balls++; // Increment balls faced
            if (runs === 4) batsmen[strikerIndex].fours++;
            if (runs === 6) batsmen[strikerIndex].sixes++;
        }
        
        if (bowlers[currentBowlerIndex]) {
            bowlers[currentBowlerIndex].runs += runs;
            bowlers[currentBowlerIndex].balls++; // Increment balls bowled
        }
        
        // Increment the over ball count
        balls++;
        checkOverCompletion();
        
        // Rotate strike for odd runs
        if (runs % 2 !== 0) {
            [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
        }
        
        // Reset free-hit flag after this delivery
        isFreeHitActive = false;
        showNotification("FREE HIT completed!", "#CCCCCC");
        
        updateScoreboard();
        return;
    }

    // Normal delivery handling
    totalRuns += runs;
    
    if (batsmen[strikerIndex]) {
        batsmen[strikerIndex].runs += runs;
        batsmen[strikerIndex].balls++; // Increment balls faced
        if (runs === 4) batsmen[strikerIndex].fours++;
        if (runs === 6) batsmen[strikerIndex].sixes++;
    }
    
    if (bowlers[currentBowlerIndex]) {
        bowlers[currentBowlerIndex].runs += runs;
        bowlers[currentBowlerIndex].balls++; // Increment balls bowled
    }
    
    // Increment the over ball count
    balls++;
    checkOverCompletion();
    
    // Rotate strike for odd runs
    if (runs % 2 !== 0) {
        [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
    }
    
    // Rotate strike at end of over
    if (balls === 0 && !wicketFellOnLastBall) {
        [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
    }

    updateScoreboard();
    if (!isFirstInnings && totalRuns >= target) {
        checkTargetReached();
    }
}

function clearBatsmanRow(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const row = el.closest(".batsman-row");
  if (!row) return;

  row.querySelector(".player-name").textContent = "";
  row.querySelectorAll("span:not(.player-name)").forEach(span => span.textContent = "");
}

function addWicket() {
    // सुरक्षा जाँच: अगर मैच पहले ही खत्म हो चुका है, तो कुछ न करें।
    if (isMatchOver) {
        showNotification("Match is already over!", "#ff4444");
        return;
    }

    // नो-बॉल/फ्री-हिट पर विकेट का आपका मौजूदा नियम
    if (isNoBallActive || isFreeHitActive) {
        const runOut = confirm("NO BALL/FREE HIT RULE:\nOnly Run Out allowed. Confirm?");
        if (!runOut) {
            showNotification("Wicket not allowed!", "#ff4444");
            return;
        }
    }

    // 1. सबसे पहले, बल्लेबाज और गेंदबाज के आँकड़े अपडेट करें
    batsmen[strikerIndex].isOut = true;
    wickets++;
    batsmen[strikerIndex].dismissedBy = bowlers[currentBowlerIndex].name;
    bowlers[currentBowlerIndex].wickets++; // गेंदबाज का विकेट बढ़ाएं
    batsmen[strikerIndex].balls++; // बल्लेबाज द्वारा खेली गई गेंद बढ़ाएं

    // 2. तुरंत गेंद की गिनती बढ़ाएं (यह "आखिरी विकेट" वाले बग को ठीक करता है)
    incrementBall();

    // 3. सभी नई जानकारी (विकेट + गेंद) के साथ स्कोरबोर्ड को तुरंत अपडेट करें
    updateScoreboard();

    // 4. अब जाँच करें कि क्या पारी/मैच खत्म हो गया है
    const totalPlayers = parseInt(localStorage.getItem('numPlayers')) || batsmen.length;
    if (wickets >= totalPlayers - 1) { // टीम ऑल आउट हो गई है
        
        // एक छोटा सा डिले दें ताकि UI पूरी तरह से अपडेट हो जाए, फिर अलर्ट दिखाएं
        setTimeout(() => {
            if (isFirstInnings) {
                // पहली पारी खत्म हुई
                alert(`${bowlingTeam} needs ${totalRuns + 1} runs to win.`);
                endInnings(); // दूसरी पारी की तैयारी करें
            } else {
                // दूसरी पारी और मैच खत्म हुआ
                let resultText = "";
                const runsNeeded = target - totalRuns;

                if (runsNeeded > 1) {
                    resultText = `${bowlingTeam} won by ${runsNeeded - 1} runs!`;
                } else if (runsNeeded === 1) {
                    resultText = "Match Tied!";
                } else {
                    resultText = `${bowlingTeam} won the match!`; // सेफ्टी के लिए
                }
                alert(resultText);
                
                // मैच खत्म करने वाले हमारे फंक्शन
                disableAllControls(); 
                saveMatchData();
            }
        }, 150); // थोड़ा सा डिले

        return; // फंक्शन को यहीं रोक दें, क्योंकि नया बल्लेबाज नहीं आएगा
    }
    const wasLastBall = balls === 0; // जाँचें कि क्या ओवर खत्म हो गया है
    
    // अगले उपलब्ध बल्लेबाज को खोजें
    let next = -1;
    for (let i = 0; i < batsmen.length; i++) {
        if (!batsmen[i].isOut && i !== strikerIndex && i !== nonStrikerIndex) {
            next = i;
            break;
        }
    }

    // नया बल्लेबाज चुनने के लिए पॉपअप दिखाएं
    setTimeout(() => {
        showPlayerPopup("newBatsman", next);

        // अगर ओवर की आखिरी गेंद थी, तो नया गेंदबाज भी चुनें
        if (wasLastBall) {
            const checkBatsmanSelected = setInterval(() => {
                const popup = document.getElementById("player-selection-popup");
                if (popup.style.display === "none") {
                    clearInterval(checkBatsmanSelected);
                    showPlayerPopup("newBowler");
                }
            }, 300);
        }
    }, 700);
}
function addExtra(extraType) {
    if (isMatchOver) {
        showNotification("Match is already over!", "#ff4444");
        return;
    }

    console.log(`🏏 Extra called: ${extraType}`);

    if (extraType === 'wide') {
        // Wide ball logic
        if (matchSettings.wideRunsCount) {
            totalRuns += 1;
            extras += 1;
            
            // Update bowler stats
            if (bowlers[currentBowlerIndex]) {
                bowlers[currentBowlerIndex].runs += 1;
            }
            
            showNotification("WIDE BALL! +1 Extra", "#FFA500");
        } else {
            showNotification("WIDE BALL! (No extra run)", "#FFA500");
        }
        
        // Wide ball doesn't count as a valid delivery
        // So no ball increment
        
    } else if (extraType === 'noball') {
        // No ball logic - call your existing handleNoBall function
        if (typeof handleNoBall === 'function') {
            handleNoBall();
        } else {
            // Fallback no-ball logic if handleNoBall doesn't exist
            if (matchSettings.noballFreeHitPlusOne || matchSettings.noballPlusOneNoFreeHit) {
                totalRuns += 1;
                extras += 1;
                if (bowlers[currentBowlerIndex]) {
                    bowlers[currentBowlerIndex].runs += 1;
                }
            }
            
            isNoBallActive = true;
            
            let notificationMessage = "NO BALL!";
            if (matchSettings.noballFreeHitPlusOne) {
                notificationMessage += " +1 Run. Next ball is FREE HIT";
                isFreeHitActive = true;
            } else if (matchSettings.noballPlusOneNoFreeHit) {
                notificationMessage += " +1 Run (No Free Hit)";
            } else if (matchSettings.noballBatsmanHitOnly) {
                notificationMessage = "NO BALL! (Batsman Hit Only)";
            }
            
            showNotification(notificationMessage, "orange");
        }
        
        // No ball is a valid delivery, so increment ball
        incrementBall();
        
    } else if (extraType === 'bye') {
        // Bye runs logic
        const byeRuns = parseInt(prompt("Enter bye runs:") || "0");
        if (byeRuns > 0) {
            totalRuns += byeRuns;
            extras += byeRuns;
            showNotification(`BYE! +${byeRuns} runs`, "#87CEEB");
        }
        incrementBall();
        
    } else if (extraType === 'legbye') {
        // Leg bye runs logic
        const legByeRuns = parseInt(prompt("Enter leg bye runs:") || "0");
        if (legByeRuns > 0) {
            totalRuns += legByeRuns;
            extras += legByeRuns;
            showNotification(`LEG BYE! +${legByeRuns} runs`, "#DDA0DD");
        }
        incrementBall();
    }

    // Update scoreboard
    updateScoreboard();
    
    // Check if target reached in second innings
    if (!isFirstInnings && totalRuns >= target) {
        checkTargetReached();
    }
    
    // Check over completion
    checkOverCompletion();
}
function handleExtra(event) {
    if (isMatchOver) {
        showNotification("Match is already over!", "#ff4444");
        return;
    }
    
    // Check if valid players are selected
    if (strikerIndex === -1 || currentBowlerIndex === -1) {
        alert("Please select batsmen and bowler first!");
        showPlayerPopup("start");
        return;
    }
    
    const extraType = event.target.dataset.extra;
    if (!extraType) {
        console.error("❌ Extra type not found in button data");
        return;
    }
    
    console.log(`🏏 Extra button clicked: ${extraType}`);
    
    // Call the addExtra function
    addExtra(extraType);
}
let firstInningsTotal = 0;
let firstInningsWickets = 0;
function endInnings() {
    if (isFirstInnings) {
        const firstInningsData = {
            teamName: battingTeam,
            totalRuns: totalRuns,
            wickets: wickets,
            overs: overs,
            balls: balls,
            extras: extras,
            batsmen: JSON.parse(JSON.stringify(batsmen.map(b => ({
                name: b.name || "Unknown",
                runs: parseInt(b.runs) || 0,
                balls: parseInt(b.balls) || 0,
                fours: parseInt(b.fours) || 0,
                sixes: parseInt(b.sixes) || 0,
                isOut: b.isOut || false,
                dismissedBy: b.dismissedBy || ""
            })))),
            bowlers: JSON.parse(JSON.stringify(bowlers.map(b => ({
                name: b.name || "Unknown",
                overs: `${Math.floor((b.balls || 0) / 6)}.${(b.balls || 0) % 6}`,
                maidens: parseInt(b.maidens) || 0,
                runs: parseInt(b.runs) || 0,
                wickets: parseInt(b.wickets) || 0,
                balls: parseInt(b.balls) || 0
            }))))
        };
        
        localStorage.setItem('firstInningsData', JSON.stringify(firstInningsData));
        
        target = totalRuns + 1;
        
        const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
        if (!savedMatchData) {
            alert("Critical Error: Match settings lost. Cannot proceed.");
            return;
        }
        
        let teamAName = savedMatchData.teamAName || savedMatchData.teamA?.name || savedMatchData.battingTeam?.name;
        let teamBName = savedMatchData.teamBName || savedMatchData.teamB?.name || savedMatchData.bowlingTeam?.name;
        let teamAPlayers = savedMatchData.teamAPlayers || savedMatchData.teamA?.players || savedMatchData.battingTeam?.players || [];
        let teamBPlayers = savedMatchData.teamBPlayers || savedMatchData.teamB?.players || savedMatchData.bowlingTeam?.players || [];
        
        const previousBattingTeam = battingTeam;
        const previousBowlingTeam = bowlingTeam;
        
        battingTeam = previousBowlingTeam;
        bowlingTeam = previousBattingTeam;
        
        let newBattingPlayers, newBowlingPlayers;
        
        if (battingTeam === teamAName) {
            newBattingPlayers = teamAPlayers;
            newBowlingPlayers = teamBPlayers;
        } else {
            newBattingPlayers = teamBPlayers;
            newBowlingPlayers = teamAPlayers;
        }
        
        batsmen = newBattingPlayers.map(p => ({
            name: p,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false
        }));
        
        bowlers = newBowlingPlayers.map(p => ({
            name: p,
            overs: 0,
            maidens: 0,
            runs: 0,
            wickets: 0,
            balls: 0
        }));
        
        isFirstInnings = false;
        totalRuns = 0;
        wickets = 0;
        overs = 0;
        balls = 0;
        extras = 0;
        
        strikerIndex = -1;
        nonStrikerIndex = -1;
        currentBowlerIndex = -1;
        playersSelected = false;
        
        document.getElementById("batting-team-name").textContent = battingTeam;
        document.getElementById("bowling-team-name").textContent = bowlingTeam;
        document.getElementById("target-score").textContent = target;
        document.getElementById("bowling-score").textContent = `${totalRuns}/${wickets}`;
        
        updateScoreboard();
        
        showNotification(`Second Innings: ${battingTeam} needs ${target} runs to win!`, "#FF8C00");
        
        setTimeout(() => {
            showPlayerPopup("start");
        }, 1000);
        
    } else {
        isMatchOver = true;
        disableAllControls();
        saveMatchData();
    }
}


function resetMatch() {
    // Save incomplete match if needed
    if (totalRuns > 0 || wickets > 0 || overs > 0 || balls > 0) {
        const confirmSave = confirm("Match abhi complete nahi hua. Kya aap isse history me save karna chahte hain?");
        playersSelected = false;
        if (confirmSave) {
            const matchData = createMatchDataObject();
            matchData.result = "Match Incomplete";
            saveMatchToFirebase(matchData);
        }
    }

    // Reload original match settings
    const savedMatchData = JSON.parse(localStorage.getItem('matchSettings'));
    const maxPlayers = savedMatchData ? parseInt(savedMatchData.playerCount || 6) : 6;

    // Reset teams and players to original state
    if (savedMatchData) {
        battingTeam = savedMatchData.battingTeam.name;
        bowlingTeam = savedMatchData.bowlingTeam.name;
        
        batsmen = savedMatchData.battingTeam.players.slice(0, maxPlayers).map(p => ({
            name: p,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false
        }));
        
        bowlers = savedMatchData.bowlingTeam.players.slice(0, maxPlayers).map(p => ({
            name: p,
            overs: 0,
            maidens: 0,
            runs: 0,
            wickets: 0,
            balls: 0
        }));
    } else {
        // Fallback if no saved data
        battingTeam = "Team A";
        bowlingTeam = "Team B";
        batsmen = [
            { name: "Player 1", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
            { name: "Player 2", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
        ];
        bowlers = [
            { name: "Bowler 1", overs: 0, maidens: 0, runs: 0, wickets: 0, balls: 0 }
        ];
    }
    totalRuns = 0;
    wickets = 0;
    overs = 0;
    balls = 0;
    extras = 0;
    isFirstInnings = true;
    target = 0;
    firstInningsTotal = 0;
    firstInningsWickets = 0;
    firstInningsOvers = "0.0";
    isFreeHit = false;
    runsBeforeRunOut = 0;
    isRunOutActive = false;
    currentBowlerIndex = 0;
    strikerIndex = 0;
    nonStrikerIndex = 1;
    // Update UI
    document.getElementById("batting-team-name").textContent = battingTeam;
    document.getElementById("bowling-team-name").textContent = bowlingTeam;
    document.getElementById("target-score").textContent = "-";
    document.getElementById("bowling-score").textContent = "-/-";

    updateScoreboard();
    resetRunOutUI();
}

// =========== Global variable for tracking click order ===========
let selectionCounter = 0;

function showPlayerPopup(type = "start", nextBatsmanIndex = null) {
    selectionCounter = 0;  // Reset counter when popup opens
    
    const popup = document.getElementById("player-selection-popup");
    const popupContent = popup.querySelector(".popup-content");
    popupContent.innerHTML = ""; // पॉपअप को साफ़ करें

    const title = document.createElement("h3");
    title.textContent = type === "start" ? "Select Opening Players" :
                        type === "newBatsman" ? "Select New Batsman" :
                        "Select New Bowler";
    popupContent.appendChild(title);

    if (type === "start" || type === "newBatsman") {
        const battingHeader = document.createElement("div");
        battingHeader.textContent = "Batting Team: " + battingTeam;
        battingHeader.className = "popup-header";
        popupContent.appendChild(battingHeader);

        const battingList = document.createElement("div");
        battingList.className = "player-list batting-list";
        
        batsmen.forEach((batsman, i) => {
            if (batsman.isOut !== true && i !== strikerIndex && i !== nonStrikerIndex) {
                const p = document.createElement("div");
                p.className = "player-item";
                p.textContent = batsman.name;
                p.dataset.index = i;
                
                p.onclick = function () {
                    if (type === "start") {
                        if (this.classList.contains("selected")) {
                            // Deselect - remove selection and order
                            this.classList.remove("selected");
                            this.removeAttribute("data-order");
                        } else if (battingList.querySelectorAll(".selected").length < 2) {
                            // Select - add selection and record click order
                            this.classList.add("selected");
                            this.dataset.order = ++selectionCounter;
                        }
                    } else { // newBatsman
                        battingList.querySelectorAll(".player-item").forEach(item => item.classList.remove("selected"));
                        this.classList.add("selected");
                    }
                };
                battingList.appendChild(p);
            }
        });
        popupContent.appendChild(battingList);
    }

    // Bowler selection
    if (type === "start" || type === "newBowler") {
        const bowlingHeader = document.createElement("div");
        bowlingHeader.textContent = "Bowling Team: " + bowlingTeam;
        bowlingHeader.className = "popup-header";
        popupContent.appendChild(bowlingHeader);

        const bowlingList = document.createElement("div");
        bowlingList.className = "player-list bowling-list";
        
        bowlers.forEach((bowler, i) => {
            if (i !== currentBowlerIndex) {
                const p = document.createElement("div");
                p.className = "player-item";
                p.textContent = bowler.name;
                p.dataset.index = i;
                
                p.onclick = function () {
                    bowlingList.querySelectorAll(".player-item").forEach(item => item.classList.remove("selected"));
                    this.classList.add("selected");
                };
                bowlingList.appendChild(p);
            }
        });
        popupContent.appendChild(bowlingList);
    }

    const confirmBtn = document.createElement("button");
    confirmBtn.id = "confirm-player-selection";
    confirmBtn.textContent = "Confirm";

    confirmBtn.onclick = () => {
        if (type === "start") {
            // Get selected batsmen and sort by click order
            const selectedNodes = Array.from(
                document.querySelectorAll('.batting-list .player-item.selected')
            ).sort((a, b) => parseInt(a.dataset.order) - parseInt(b.dataset.order));

            const selectedBowlerNode = document.querySelector('.bowling-list .player-item.selected');

            if (selectedNodes.length < 2) { 
                alert("Please select two opening batsmen."); 
                return; 
            }
            if (!selectedBowlerNode) { 
                alert("Please select an opening bowler."); 
                return; 
            }

            // First clicked = striker, second clicked = non-striker
            const strikerIdx = parseInt(selectedNodes[0].dataset.index);
            const nonStrikerIdx = parseInt(selectedNodes[1].dataset.index);

            if (strikerIdx === nonStrikerIdx) {
                alert("Please select two different batsmen.");
                return;
            }

            strikerIndex = strikerIdx;
            nonStrikerIndex = nonStrikerIdx;
            batsmen[strikerIndex].isOut = false;
            batsmen[nonStrikerIndex].isOut = false;
            currentBowlerIndex = parseInt(selectedBowlerNode.dataset.index);
            playersSelected = true;

        } else if (type === "newBatsman") {
            const selectedBatsmanNodes = document.querySelectorAll('.batting-list .player-item.selected');
            if (selectedBatsmanNodes.length < 1) { 
                alert("Please select a new batsman."); 
                return; 
            }
            
            const newPlayerIndex = parseInt(selectedBatsmanNodes[0].dataset.index);
            strikerIndex = newPlayerIndex;
            batsmen[strikerIndex].isOut = false;

        } else if (type === "newBowler") {
            const selectedBowlerNode = document.querySelector('.bowling-list .player-item.selected');
            if (!selectedBowlerNode) { 
                alert("Please select a new bowler."); 
                return; 
            }
            currentBowlerIndex = parseInt(selectedBowlerNode.dataset.index);
        }

        updateScoreboard();
        popup.style.display = "none";
    };

    popupContent.appendChild(confirmBtn);
    popup.style.display = "flex";
}

function disableAllControls() {
    console.log("Match has ended. Disabling controls.");
    isMatchOver = true; // Match end flag set करें

    document.querySelectorAll('.run-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.extra-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.wicket-btn').forEach(btn => btn.disabled = true);
    
    document.querySelectorAll('.runout-btn').forEach(btn => btn.disabled = true);
    document.getElementById('bowler-end-btn')?.setAttribute('disabled', true);
    document.getElementById('keeper-end-btn')?.setAttribute('disabled', true);
    
    document.querySelector('.controls').style.opacity = '0.6';
    document.querySelector('.controls').style.cursor = 'not-allowed';
}

function saveMatchData() {
    console.log("saveMatchData फंक्शन सफलतापूर्वक कॉल हुआ।");

    const matchData = createMatchDataObject();
    if (matchData) {
        const finalResultElement = document.getElementById("final-result-display");
        const motmElement = document.getElementById("man-of-the-match-display");
        const summarySection = document.getElementById("match-summary-section");
        if (finalResultElement) {
            finalResultElement.textContent = matchData.result;
        }
        if (motmElement) {
            motmElement.textContent = matchData.manOfTheMatch;
        }
        if (summarySection) {
            summarySection.style.display = 'block';
        }
        alert(`Match Over!\n${matchData.result}\nMan of the Match: ${matchData.manOfTheMatch}`);
        saveMatchToFirebase(matchData);

    } else {
        console.error("मैच डेटा ऑब्जेक्ट नहीं बन सका, इसलिए सेव नहीं किया गया।");
    }
}


function createMatchDataObject() {
    try {
        const firstInningsData = JSON.parse(localStorage.getItem('firstInningsData')) || {};
        const savedSettings = JSON.parse(localStorage.getItem("matchSettings")) || {};

        const teamAName = savedSettings.teamAName || savedSettings.teamA?.name || savedSettings.battingTeam?.name || "Team A";
        const teamBName = savedSettings.teamBName || savedSettings.teamB?.name || savedSettings.bowlingTeam?.name || "Team B";
        
        const firstInningsBattingTeam = firstInningsData.teamName || teamAName;
        const secondInningsBattingTeam = firstInningsBattingTeam === teamAName ? teamBName : teamAName;
        
        const tossWinnerName = savedSettings.tossWinner === 'A' ? teamAName : teamBName;
        const tossDecision = savedSettings.tossDecision === 'bat' ? 'bat first' : 'bowl first';
        const tossResultString = `${tossWinnerName} won the toss and chose to ${tossDecision}`;
        
        const allBatsmen = (firstInningsData.batsmen || []).concat(batsmen || []);
        const allBowlers = (firstInningsData.bowlers || []).concat(bowlers || []);
        const manOfTheMatch = calculateManOfTheMatch(allBatsmen, allBowlers);

        let finalResult = "In Progress";
        if (isMatchOver) {
            if (!isFirstInnings) {
                if (totalRuns >= target) {
                    const wicketsLeft = (matchSettings.wicketsLimit || 10) - wickets;
                    finalResult = `${secondInningsBattingTeam} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
                } else if (totalRuns === target - 1) {
                    finalResult = "Match Tied";
                } else {
                    const runMargin = target - 1 - totalRuns;
                    finalResult = `${firstInningsBattingTeam} won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`;
                }
            } else {
                finalResult = "First innings completed";
            }
        }
        
        const processBatsmen = (playersArray) => {
            if (!playersArray || !Array.isArray(playersArray)) return [];
            return playersArray.map(b => ({
                name: b.name || "Unknown",
                runs: parseInt(b.runs) || 0,
                balls: parseInt(b.balls) || 0,
                fours: parseInt(b.fours) || 0,
                sixes: parseInt(b.sixes) || 0,
                isOut: b.isOut === true ? true : (b.isOut === 'dnb' ? 'dnb' : false),
                dismissedBy: b.dismissedBy || ""
            }));
        };
        
        const processBowlers = (playersArray) => {
            if (!playersArray || !Array.isArray(playersArray)) return [];
            return playersArray
                .filter(b => (b.balls || 0) > 0 || (b.wickets || 0) > 0)
                .map(b => ({
                    name: b.name || "Unknown",
                    overs: b.overs || `${Math.floor((b.balls || 0) / 6)}.${(b.balls || 0) % 6}`,
                    maidens: parseInt(b.maidens) || 0,
                    runs: parseInt(b.runs) || 0,
                    wickets: parseInt(b.wickets) || 0
                }));
        };
        
        const matchData = {
            timestamp: new Date().toISOString(),
            teamAName: teamAName,
            teamBName: teamBName,
            tossResult: tossResultString,
            oversLimit: savedSettings.overs || savedSettings.oversLimit || matchSettings?.oversLimit || 5,
            result: finalResult,
            manOfTheMatch: manOfTheMatch,

            firstInnings: {
                team: firstInningsBattingTeam,
                score: `${firstInningsData.totalRuns || 0}/${firstInningsData.wickets || 0}`,
                overs: firstInningsData.overs !== undefined ? 
                       `${firstInningsData.overs}.${firstInningsData.balls || 0}` : '0.0',
                totalRuns: firstInningsData.totalRuns || 0,
                wickets: firstInningsData.wickets || 0,
                batsmen: processBatsmen(firstInningsData.batsmen || []),
                bowlers: processBowlers(firstInningsData.bowlers || [])
            },
            
            secondInnings: !isFirstInnings ? {
                team: secondInningsBattingTeam,
                score: `${totalRuns}/${wickets}`,
                overs: `${overs}.${balls}`,
                target: target,
                totalRuns: totalRuns,
                wickets: wickets,
                batsmen: processBatsmen(batsmen),
                bowlers: processBowlers(bowlers)
            } : null
        };

        return matchData;
        
    } catch (error) {
        return null;
    }
}

initializeApp(); 



