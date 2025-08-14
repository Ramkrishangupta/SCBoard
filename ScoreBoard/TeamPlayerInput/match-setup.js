// Global variables to store team names
let teamA, teamB;

document.addEventListener('DOMContentLoaded', function() {
        // Restore last used overs and playerCount if matchSettings exist
    const savedSettings = JSON.parse(localStorage.getItem('matchSettings'));

    if (savedSettings?.overs) {
        const oversSelect = document.getElementById('overs-presets');
        const customOvers = document.getElementById('overs-custom');
        const oversValue = savedSettings.overs.toString();

        if ([...oversSelect.options].some(opt => opt.value === oversValue)) {
            oversSelect.value = oversValue;
            customOvers.style.display = 'none';
        } else {
            oversSelect.value = 'custom';
            customOvers.value = oversValue;
            customOvers.style.display = 'block';
        }
    }

    if (savedSettings?.playerCount) {
        const playerSelect = document.getElementById('players-presets');
        const customPlayer = document.getElementById('players-custom');
        const countValue = savedSettings.playerCount.toString();

        if ([...playerSelect.options].some(opt => opt.value === countValue)) {
            playerSelect.value = countValue;
            customPlayer.style.display = 'none';
        } else {
            playerSelect.value = 'custom';
            customPlayer.value = countValue;
            customPlayer.style.display = 'block';
        }
    }

    // Initialize all inputs from local storage or set defaults
    loadRecentPresets();
    loadRecentPlayerCounts();
    
    // Load team names and setup teams based on toss results from local storage
    teamA = localStorage.getItem('teamA') || "Team A";
    teamB = localStorage.getItem('teamB') || "Team B";

    document.getElementById('batting-team-name').textContent = `${teamA} Players`;
    document.getElementById('bowling-team-name').textContent = `${teamB} Players`;
    
    generatePlayerInputs();
    document.getElementById('players-presets').addEventListener('change', function() {
        const customInput = document.getElementById('players-custom');
        if(this.value === 'custom') {
            // Show custom input field if 'Custom' option is selected
            customInput.style.display = 'block';
            customInput.focus();
        } else {
            // Hide custom input and update player fields based on the selected preset
            customInput.style.display = 'none';
            // No need to save presets as recent here. Only custom values are saved.
            generatePlayerInputs(); // Regenerate player name fields
        }
    });
    document.getElementById('players-custom').addEventListener('change', function() {
        // Validate custom player count and regenerate inputs if valid
        if(validatePlayerCount(this.value)) {
            saveRecentPlayerCount(this.value); // Save the custom value as recent
            loadRecentPlayerCounts(); // Re-load to update the dropdown immediately
            generatePlayerInputs(); // Regenerate player name fields
        }
    });
    document.getElementById('overs-presets').addEventListener('change', function() {
        const customInput = document.getElementById('overs-custom');
        if(this.value === 'custom') {
            // Show custom input field if 'Custom' option is selected
            customInput.style.display = 'block';
            customInput.focus();
        } else {
            // Hide custom input
            customInput.style.display = 'none';
            // No need to save presets as recent here. Only custom values are saved.
        }
    });

    // NEW: Event listener for custom 'Number of Overs' input field changes
    document.getElementById('overs-custom').addEventListener('change', function() {
        // Validate custom overs and save as recent if valid
        if(validateOvers(this.value)) {
            saveRecentPreset(this.value); // Save the custom value as recent
            loadRecentPresets(); // Re-load to update the dropdown immediately
        }
    });
    
    // Event listener for the 'Begin Match' button click
    document.getElementById('start-match').addEventListener('click', startMatch);
});
function generatePlayerInputs() {
    const playerCount = getPlayerCount(); // Get the current number of players per team
    const battingDiv = document.getElementById('batting-team-inputs');
    const bowlingDiv = document.getElementById('bowling-team-inputs');
    
    battingDiv.innerHTML = `<h3>${teamA} Players</h3>`;
    bowlingDiv.innerHTML = `<h3>${teamB} Players</h3>`;
    
    for(let i = 0; i < playerCount; i++) {
        const placeholderText = `Enter name / Player ${i+1}`; 

        battingDiv.innerHTML += `
            <div class="player-input">
                <label>Player ${i+1}:</label>
                <input type="text" id="batting-player-${i}" placeholder="${placeholderText}">
            </div>
        `;
        
        bowlingDiv.innerHTML += `
            <div class="player-input">
                <label>Player ${i+1}:</label>
                <input type="text" id="bowling-player-${i}" placeholder="${placeholderText}">
            </div>
        `;
    }
}
/**
 * Retrieves player names from input fields for a given team type.
 * Assigns default names (e.g., 'Player 1') if input fields are empty.
 * @param {string} teamType - 'batting' or 'bowling'
 * @returns {Array<string>} An array of player names.
 */
function getPlayerNames(teamType) {
    const playerCount = getPlayerCount(); // Get the current number of players
    const players = [];
    
    for(let i = 0; i < playerCount; i++) {
        const input = document.getElementById(`${teamType}-player-${i}`);
        // If input is empty or just whitespace, use a default name like 'Player X'
        players.push(input.value.trim() || `Player ${i+1}`);
    }
    
    return players;
}
/**
 * Saves the selected number of overs to local storage for recent presets.
 * Keeps only the most recent selection.
 * @param {string} overs - The number of overs to save.
 */
function saveRecentPreset(overs) {
    let presets = JSON.parse(localStorage.getItem('recentOvers')) || [];
    // Filter out duplicates and keep only the last one unique recent selection
    presets = presets.filter(p => p !== overs).slice(0, 1); // Ensures only one recent value
    presets.unshift(overs); // Add the new selection to the beginning of the list
    localStorage.setItem('recentOvers', JSON.stringify(presets));
}

/**
 * Saves the selected player count to local storage for recent presets.
 * Keeps only the most recent selection.
 * @param {string} count - The player count to save.
 */
function saveRecentPlayerCount(count) {
    let counts = JSON.parse(localStorage.getItem('recentPlayerCounts')) || [];
    // Filter out duplicates and keep only the last one unique recent selection
    counts = counts.filter(c => c !== count).slice(0, 1); // Ensures only one recent value
    counts.unshift(count); // Add the new selection to the beginning of the list
    localStorage.setItem('recentPlayerCounts', JSON.stringify(counts));
}
function loadRecentPresets() {
    const presets = JSON.parse(localStorage.getItem('recentOvers')) || [];
    const select = document.getElementById('overs-presets');
    
    // Remove any existing 'Recent' options before adding new ones
    Array.from(select.options).forEach(option => {
        if (option.textContent.includes('(Recent)')) {
            select.removeChild(option);
        }
    });

    presets.forEach(overs => {
        // Add option only if it doesn't already exist and is truly recent
        // We ensure it's not a pre-defined option by checking its value
        if (!select.querySelector(`option[value="${overs}"]`) || (select.querySelector(`option[value="${overs}"]`) && !['1','6','10','15','20'].includes(overs.toString()))) {
            const option = document.createElement('option');
            option.value = overs;
            option.textContent = `${overs} Overs (Recent)`;
            // Insert recent options after "Custom" option (index 1) for better visibility
            select.insertBefore(option, select.options[2]); // Insert at index 2 (after Custom)
        }
    });
}
function loadRecentPlayerCounts() {
    const counts = JSON.parse(localStorage.getItem('recentPlayerCounts')) || [];
    const select = document.getElementById('players-presets');
    
    // Remove any existing 'Recent' options before adding new ones
    Array.from(select.options).forEach(option => {
        if (option.textContent.includes('(Recent)')) {
            select.removeChild(option);
        }
    });

    counts.forEach(count => {
        // Add option only if it doesn't already exist and is truly recent
        // We ensure it's not a pre-defined option by checking its value
        if (!select.querySelector(`option[value="${count}"]`) || (select.querySelector(`option[value="${count}"]`) && !['2','4','6','8','11'].includes(count.toString()))) {
            const option = document.createElement('option');
            option.value = count;
            option.textContent = `${count} Players (Recent)`;
            // Insert recent options after "Custom" option (index 1) for better visibility
            select.insertBefore(option, select.options[2]); // Insert at index 2 (after Custom)
        }
    });
}

// --- Validation functions ---

/**
 * Validates the number of overs input.
 * Displays an error message if the value is invalid.
 * @param {string|number} overs - The overs value to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateOvers(overs) {
    // Check if overs is a valid number within the range 1-50
    if(!overs || isNaN(overs) || overs < 1 || overs > 50) {
        // Use a custom modal or message box instead of native alert() for better UX
        showMessageBox("Please enter a valid number of overs (1-50).");
        document.getElementById('overs-presets').value = 'custom'; // Switch to custom
        document.getElementById('overs-custom').style.display = 'block'; // Show custom input
        document.getElementById('overs-custom').focus(); // Focus on custom input
        return false;
    }
    return true;
}

/**
 * Validates the player count input.
 * Displays an error message if the value is invalid.
 * @param {string|number} count - The player count value to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function validatePlayerCount(count) {
    // Check if count is a valid number within the range 2-12
    if(!count || isNaN(count) || count < 2 || count > 12) {
        // Use a custom modal or message box instead of native alert() for better UX
        showMessageBox("Please enter a valid player count (2-12).");
        document.getElementById('players-presets').value = 'custom'; // Switch to custom
        document.getElementById('players-custom').style.display = 'block'; // Show custom input
        document.getElementById('players-custom').focus(); // Focus on custom input
        return false;
    }
    return true;
}

/**
 * @param {string} message - The message to display to the user.
 */
function showMessageBox(message) {
    // For now, using alert. In a production app, replace this with a styled modal/toast.
    console.warn("Alert suppressed. Implement a custom message box for:", message);
    alert(message); 
}
/**
 * @returns {number} The number of players per team.
 */
function getPlayerCount() {
    const preset = document.getElementById('players-presets');
    const customInput = document.getElementById('players-custom');
    // Parse the value from either the preset dropdown or the custom input
    const count = preset.value === 'custom' ? parseInt(customInput.value) : parseInt(preset.value);
    return isNaN(count) ? 6 : count; // Return 6 if parsed count is NaN (invalid)
}

function startMatch() {
    const oversPreset = document.getElementById('overs-presets');
    const oversCustom = document.getElementById('overs-custom');
    const overs = oversPreset.value === 'custom' ? parseInt(oversCustom.value) : parseInt(oversPreset.value);
    
    const playersPreset = document.getElementById('players-presets');
    const playersCustom = document.getElementById('players-custom');
    const playerCount = playersPreset.value === 'custom' ? playersCustom.value : playersPreset.value;
    
    if(!validateOvers(overs) || !validatePlayerCount(playerCount)) {
        return;
    }
    // Get player names for both teams
    const teamAPlayers = getPlayerNames('batting');
    const teamBPlayers = getPlayerNames('bowling');

    // Save settings without batting/bowling designation
    const settings = {
        overs: parseInt(overs),
        playerCount: parseInt(playerCount),
        teamA: {
            name: teamA,
            players: teamAPlayers
        },
        teamB: {
            name: teamB,
            players: teamBPlayers
        }
    };
    
    // Save the complete match settings object to local storage
    localStorage.setItem('matchSettings', JSON.stringify(settings));
    
    window.location.href = "../../../Flip-A-Coin/index.html";
}
