const teamAInput = document.getElementById("team-a");
const teamBInput = document.getElementById("team-b");

// पेज लोड होने पर localStorage से टीम के नाम लोड करें, यदि मौजूद हों
teamAInput.value = localStorage.getItem("teamA") || "Team A";
teamBInput.value = localStorage.getItem("teamB") || "Team B";

document.getElementById("team-name-form").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent the default form submission

    const teamAName = teamAInput.value.trim();
    const teamBName = teamBInput.value.trim();

    if (teamAName && teamBName) {
        // Store team names in localStorage
        localStorage.setItem("teamA", teamAName);
        localStorage.setItem("teamB", teamBName);

        // Redirect to toss page
        window.location.href = "../../ScoreBoard/TeamPlayerInput/match-setup.html";
    } else {
        alert("Please enter both team names");
    }
});

// Allow only alphanumeric characters and spaces in input fields
teamAInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, "");
});

teamBInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, "");
});