
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


function findSudokuBoard() {
    return new Promise((resolve) => {
        const checkBoard = () => {
            const cells = document.querySelectorAll(
                '[role="gridcell"]'
            );

            if (cells.length === 81) {
                observer.disconnect();
                resolve(true);
            }
        };

        const observer = new MutationObserver(checkBoard);

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        checkBoard();
    });
}


async function readGrid() {
    const boardFound = await findSudokuBoard();

    if (!boardFound) {
        console.log("Could not find grid...");
        return;
    }

    const cells = [...document.querySelectorAll(
        '[role="gridcell"]'
    )];
    
    cells.sort((a, b) =>
        Number(a.dataset.cell) - Number(b.dataset.cell)
    );

    const grid = [];

    for (let row = 0; row < 9; row++) {
        const currentRow = [];

        for (let col = 0; col < 9; col++) {
            const index = row * 9 + col;
            const cell = cells[index];

            const number = cell.querySelector(
                ".su-cell__value[data-number]"
            );

            const value = number
                ? Number(number.dataset.number)
                : 0;

            currentRow.push(value);
        }

        grid.push(currentRow);
    }

    return grid;
}


function sendCandidateUpdates(updates) {
    return new Promise((resolve, reject) => {
        const requestId = crypto.randomUUID();

        const timeout = setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Timed out waiting for NYT Redux."));
        }, 10000);

        function handleResponse(event) {
            if (event.source !== window || event.origin !== location.origin) {
                return;
            }

            const message = event.data;

            if (
                !message ||
                message.channel !== "cute-sudoku-pencil" ||
                message.direction !== "response" ||
                message.requestId !== requestId
            ) {
                return;
            }

            clearTimeout(timeout);
            window.removeEventListener("message", handleResponse);

            if (!message.success) {
                reject(new Error(message.error || "Candidate update failed."));
                return;
            }

            resolve(message.result);
        }

        window.addEventListener("message", handleResponse);

        window.postMessage({
            channel: "cute-sudoku-pencil",
            direction: "request",
            type: "updateCandidates",
            requestId,
            payload: { updates }
        }, location.origin);
    });
}


async function updateCandidates(mode) {
    const grid = await readGrid();
    if (!grid) return;

    const updates = [];

    for (let cellId = 0; cellId < 81; cellId++) {
        const row = Math.floor(cellId / 9);
        const col = cellId % 9;

        if (!isEmpty(grid, row, col)) continue;

        const validCandidates = getCandidates(grid, row, col);

        const candidates = [];

        for (let digit = 1; digit <= 9; digit++) {
            candidates.push({
                digit,
                selected: mode === "generate"
                    && validCandidates.includes(digit)
            });
        }

        updates.push({
            cellId,
            candidates
        });
    }

    await sendCandidateUpdates(updates);
}

async function generateCandidates() {
    await updateCandidates('generate');
}

async function clearAllCandidates() {
    await updateCandidates('clear');
}


function injectAutoButtons() {
    if (document.getElementById('cute-candidate-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'cute-candidate-btn';
    btn.textContent = '✨ Generate and fill candidates';
    btn.style.marginTop = '25px';
    btn.style.marginLeft = '0px';
    btn.onclick = generateCandidates;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'cute-clear-candidate-btn';
    clearBtn.textContent = '🫧 Clear all candidates';
    clearBtn.style.marginTop = '12px';
    clearBtn.style.marginLeft = '0px';
    clearBtn.onclick = clearAllCandidates;

    const autoCandidateCheckbox = [...document.querySelectorAll('label')]
        .find(el => el.textContent.includes('Auto Candidate Mode'));

    if (autoCandidateCheckbox?.parentElement) {
        autoCandidateCheckbox.parentElement.append(btn, clearBtn);
    } else {
        const board = document.querySelector('[role="gridcell"]')?.parentElement;
        (board || document.body).append(btn, clearBtn);
    }
}


async function main() {
    const boardFound = await findSudokuBoard();

    if (!boardFound) {
        console.log("Sudoku board not found! 🥺");
        return;
    }

    injectAutoButtons();
}


main();
