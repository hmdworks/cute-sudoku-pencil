
//// LOAD THEME ////
function applyTheme(theme) {
    const allowedThemes = ["pink", "green", "blue"];

    if (!allowedThemes.includes(theme)) {
        theme = "pink";
    }

    document.documentElement.dataset.cuteSudokuTheme = theme;
}

chrome.storage.local.get({ theme: "pink" }, result => {
    applyTheme(result.theme);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.theme) {
        applyTheme(changes.theme.newValue);
    }
});
