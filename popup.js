
//// THEMES ////
const buttons = document.querySelectorAll("[data-theme]");

function updateSelectedButton(theme) {
    buttons.forEach(button => {
        button.setAttribute(
            "aria-pressed",
            button.dataset.theme === theme
        );
    });

    document.documentElement.dataset.theme = theme;
}

chrome.storage.local.get({ theme: "pink" }, result => {
    updateSelectedButton(result.theme);
});

buttons.forEach(button => {
    button.addEventListener("click", async () => {
        const theme = button.dataset.theme;

        await chrome.storage.local.set({ theme });

        updateSelectedButton(theme);
    });
});


//// LOAD STATS ////
const settingsLayout = document.querySelector(".settings-layout");
const statsContent = document.getElementById("stats-content");


(async () => {
    const result = await chrome.storage.local.get({
        completedPuzzles: []
    });

    const stats = calculateStats(result.completedPuzzles);

    displayStats(stats);
})();


function calculateStats(puzzles) {
    const validPuzzles = puzzles.filter(puzzle => !puzzle.revealed);

    const totalCompleted = validPuzzles.length;

    const dates = [...new Set(
        validPuzzles.map(puzzle => puzzle.date)
    )].sort();

    let longestStreak = 0;
    let currentRun = 0;
    let previousDate = null;

    for (const date of dates) {
        const currentDate = new Date(date + "T12:00:00Z");

        if (previousDate) {
            const difference =
                (currentDate - previousDate) / (1000 * 60 * 60 * 24);

            if (difference === 1) {
                currentRun++;
            } else {
                currentRun = 1;
            }
        } else {
            currentRun = 1;
        }

        longestStreak = Math.max(longestStreak, currentRun);
        previousDate = currentDate;
    }

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayString = [
        yesterday.getFullYear(),
        String(yesterday.getMonth() + 1).padStart(2, "0"),
        String(yesterday.getDate()).padStart(2, "0")
    ].join("-");

    let currentStreak = 0;

    if (dates.includes(todayString) || dates.includes(yesterdayString)) {
        currentStreak = currentRun;
    }

    const difficulties = ["easy", "medium", "hard"];

    const averagesByDifficulty = {};

    for (const difficulty of difficulties) {
        const matchingPuzzles = validPuzzles.filter(
            puzzle => puzzle.difficulty === difficulty
        );

        const totalDifficultyTime = matchingPuzzles.reduce(
            (sum, puzzle) => sum + puzzle.elapsedTime,
            0
        );

        averagesByDifficulty[difficulty] = matchingPuzzles.length
            ? totalDifficultyTime / matchingPuzzles.length
            : null;
    }

    return {
        totalCompleted,
        currentStreak,
        longestStreak,
        averagesByDifficulty
    };
}


function formatTime(seconds) {
    if (seconds == null || !Number.isFinite(seconds)) {
        return "--:--";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


function displayStats(stats) {
    document.getElementById("total-completed").textContent =
        stats.totalCompleted;

    document.getElementById("current-streak").textContent =
        `${stats.currentStreak} days`;

    document.getElementById("longest-streak").textContent =
        `${stats.longestStreak} days`;

    document.getElementById("average-easy").textContent =
        formatTime(stats.averagesByDifficulty.easy);

    document.getElementById("average-medium").textContent =
        formatTime(stats.averagesByDifficulty.medium);

    document.getElementById("average-hard").textContent =
        formatTime(stats.averagesByDifficulty.hard);
}
