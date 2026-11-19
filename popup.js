
const buttons = document.querySelectorAll("[data-theme]");

function updateSelectedButton(theme) {
    buttons.forEach(button => {
        button.setAttribute(
            "aria-pressed",
            button.dataset.theme === theme
        );
    });
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
