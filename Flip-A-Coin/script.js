// Initial state variables
let selectedTeam = null;  // 'A' or 'B'
let selectedCall = null;  // 'heads' or 'tails'
let matchSettings = null; // Store match settings
let tossDecision = null; // Store toss decision

const coin = document.getElementById("coin");
const flipBtn = document.getElementById("flip-button");
const resetBtn = document.getElementById("reset-button");
const tossResult = document.getElementById("toss-result");

const callTeamAButton = document.getElementById("call-team-a");
const callTeamBButton = document.getElementById("call-team-b");
const callHeadsButton = document.getElementById("call-heads");
const callTailsButton = document.getElementById("call-tails");

const selectCallSection = document.getElementById("select-call-section");
const tossCallingTeamName = document.getElementById("toss-calling-team-name");
const selectTeamSectionText = document.querySelector("#select-team-section p");

const battingBowlingButtons = document.getElementById("batting-bowling-buttons");
const chooseBattingBtn = document.getElementById("choose-batting");
const chooseBowlingBtn = document.getElementById("choose-bowling");

const beginMatchWrapper = document.getElementById("begin-match-wrapper");
const beginMatchBtn = document.getElementById("begin-match-btn");

const selectTeamSection = document.getElementById("select-team-section");
const buttonsContainer = document.querySelector(".buttons");
const heading = document.querySelector(".heading");

// Utility: Check if toss is ready to flip
function isTossReady() {
    return selectedTeam !== null && selectedCall !== null;
}

// Load team names from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
    // Load match settings
    matchSettings = JSON.parse(localStorage.getItem("matchSettings")) || {
        teamA: { name: "Team A" },
        teamB: { name: "Team B" }
    };
    
    // Set team names on buttons
    callTeamAButton.textContent = matchSettings.teamA.name;
    callTeamBButton.textContent = matchSettings.teamB.name;

    resetAll();  // Initialize UI
});

// Reset everything to initial state
function resetAll() {
    selectedTeam = null;
    selectedCall = null;
    tossDecision = null;

    // Show initial elements
    heading.style.display = "block";
    selectTeamSection.style.display = "block";
    selectTeamSectionText.style.display = "block";

    callTeamAButton.style.display = "inline-block";
    callTeamBButton.style.display = "inline-block";
    callTeamAButton.style.margin = "";
    callTeamBButton.style.margin = "";

    selectCallSection.style.display = "none";
    callHeadsButton.style.display = "inline-block";
    callHeadsButton.style.margin = "";
    callTailsButton.style.display = "inline-block";
    callTailsButton.style.margin = "";

    coin.style.display = "block";
    coin.style.animation = "none";

    flipBtn.disabled = true;
    flipBtn.style.display = "inline-block";

    resetBtn.style.display = "inline-block";

    tossResult.style.display = "none";
    tossResult.textContent = "";
    tossResult.removeAttribute("data-winner");

    battingBowlingButtons.style.display = "none";
    beginMatchWrapper.style.display = "none";
}

// Handle team selection and show call section
function handleTeamSelect(selectedBtn, otherBtn, teamName) {
    selectedBtn.style.display = "block";
    selectedBtn.style.margin = "0 auto";
    otherBtn.style.display = "none";
    selectTeamSectionText.style.display = "none";

    selectCallSection.style.display = "flex";
    tossCallingTeamName.textContent = `${teamName} is calling:`;
}

// Team selection buttons
callTeamAButton.addEventListener("click", () => {
    selectedTeam = "A";
    handleTeamSelect(
        callTeamAButton, 
        callTeamBButton, 
        matchSettings.teamA.name
    );
});

callTeamBButton.addEventListener("click", () => {
    selectedTeam = "B";
    handleTeamSelect(
        callTeamBButton, 
        callTeamAButton, 
        matchSettings.teamB.name
    );
});

// Handle heads/tails call selection
function handleCoinCall(selectedBtn, otherBtn) {
    selectedBtn.style.display = "block";
    selectedBtn.style.margin = "0 auto";
    otherBtn.style.display = "none";

    // Hide call instructions after selection
    document.querySelectorAll("#select-call-section p").forEach(p => p.style.display = "none");

    // Enable flip button
    flipBtn.disabled = false;
}

callHeadsButton.addEventListener("click", () => {
    selectedCall = "heads";
    handleCoinCall(callHeadsButton, callTailsButton);
});

callTailsButton.addEventListener("click", () => {
    selectedCall = "tails";
    handleCoinCall(callTailsButton, callHeadsButton);
});

// Coin flip animation and result logic
flipBtn.addEventListener("click", () => {
    if (!isTossReady()) {
        alert("Please select a team and their call.");
        return;
    }

    flipBtn.disabled = true;

    // Hide initial UI elements smoothly
    heading.style.display = "none";
    selectTeamSection.style.display = "none";
    selectCallSection.style.display = "none";
    buttonsContainer.style.display = "none";

    // Coin flip animation
    const result = Math.random() < 0.5 ? "tails" : "heads";
    const animationName = result === "heads" ? "spin-heads" : "spin-tails";

    coin.style.animation = "none"; // reset animation
    setTimeout(() => {
        coin.style.animation = `${animationName} 3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards`;
    }, 100);

    // After animation, show result and toss decision buttons
    setTimeout(() => {
        const caller = selectedTeam === "A" ? matchSettings.teamA : matchSettings.teamB;
        const other = selectedTeam === "A" ? matchSettings.teamB : matchSettings.teamA;

        coin.style.display = "none";
        tossResult.style.display = "block";

        // Determine toss winner text
        if (selectedCall === result) {
            tossResult.textContent = `${caller.name} won the toss and decide to: `;
            tossResult.setAttribute("data-winner", caller.name);
        } else {
            tossResult.textContent = `${other.name} won the toss and decide to: `;
            tossResult.setAttribute("data-winner", other.name);
        }

        battingBowlingButtons.style.display = "block";

        // Move 'Again' button to bottom-right corner
        resetBtn.style.position = "fixed";
        resetBtn.style.bottom = "20px";
        resetBtn.style.right = "20px";
        resetBtn.style.display = "inline-block";
    }, 3200);
});

// Toss decision buttons: Batting or Bowling
chooseBattingBtn.addEventListener("click", () => {
    handleTossDecision("Bat First");
});

chooseBowlingBtn.addEventListener("click", () => {
    handleTossDecision("Bowl First");
});

function handleTossDecision(decisionText) {
    tossResult.textContent += ` ${decisionText}`;
    tossDecision = decisionText;
    battingBowlingButtons.style.display = "none";
    beginMatchWrapper.style.display = "block";
}

// Begin Match button: Save toss result & decision, then navigate
beginMatchBtn.addEventListener("click", () => {
    const tossWinnerName = tossResult.getAttribute("data-winner");
    const tossDecisionText = tossDecision; // "Bat First" or "Bowl First"

    if (tossWinnerName && tossDecisionText) {
        // Determine which team won the toss
        const tossWinner = tossWinnerName === matchSettings.teamA.name ? "A" : "B";
        
        // Determine batting/bowling teams based on toss decision
        let battingTeam, bowlingTeam;
        if (tossDecisionText === "Bat First") {
            battingTeam = tossWinner === "A" ? matchSettings.teamA : matchSettings.teamB;
            bowlingTeam = tossWinner === "A" ? matchSettings.teamB : matchSettings.teamA;
        } else {
            bowlingTeam = tossWinner === "A" ? matchSettings.teamA : matchSettings.teamB;
            battingTeam = tossWinner === "A" ? matchSettings.teamB : matchSettings.teamA;
        }
        
        // Update match settings with determined roles
        const finalSettings = {
            ...matchSettings,
            battingTeam,
            bowlingTeam,
            tossWinner,
            tossDecision: tossDecisionText === "Bat First" ? "bat" : "bowl"
        };
        
        // Save to localStorage
        localStorage.setItem("matchSettings", JSON.stringify(finalSettings));
        
        // Also save old format for compatibility
        localStorage.setItem("tossWinner", tossWinnerName);
        localStorage.setItem("tossDecision", tossDecisionText);
        
        // Navigate to scoreboard
        window.location.href = "../ScoreBoard/index.html";
    } else {
        alert("Error: Toss winner or decision not recorded.");
    }
});

// Reset button: Reset everything to initial state
resetBtn.addEventListener("click", () => {
    resetAll();

    // Reset 'Again' button position
    resetBtn.style.position = "static";
    resetBtn.style.bottom = "";
    resetBtn.style.right = "";

    // Show the initial buttons container again
    buttonsContainer.style.display = "block";
    coin.style.display = "block";
    coin.style.animation = "none";
});