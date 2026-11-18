
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


function simulateClick(element) {
    element.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
}


function getCandidatesForCell(cell) {
    const rect = cell.getBoundingClientRect();

    return [...document.querySelectorAll('.su-candidate')]
        .filter(candidate => {
            const candidateRect = candidate.getBoundingClientRect();

            const x = candidateRect.left + candidateRect.width / 2;
            const y = candidateRect.top + candidateRect.height / 2;

            return (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            );
        })
        .map(candidate => Number(candidate.dataset.candidate));
}


async function updateCandidates(mode) {
    const grid = await readGrid();
    if (!grid) return;

    const originalSelection = document.querySelector('.su-cell.selected');

    const cells = [...document.querySelectorAll('[role="gridcell"]')];

    cells.sort((a, b) =>
        Number(a.dataset.cell) - Number(b.dataset.cell)
    );

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {

            if (!isEmpty(grid, r, c)) continue;

            const cell = cells[r * 9 + c];
            if (!cell) continue;

            const validCandidates = getCandidates(grid, r, c);

            cell.click();

            const container = document.querySelector(
                '.su-candidates.selected'
            );

            if (!container) continue;

            const existingCandidates = getCandidatesForCell(cell);

            for (let num = 1; num <= 9; num++) {
                const isSelected = existingCandidates.includes(num);

                const shouldBeSelected = mode === 'generate'
                    ? validCandidates.includes(num)
                    : false;

                if (isSelected === shouldBeSelected) continue;

                const button = container.querySelector(
                    `.su-candidate-button[data-candidate="${num}"]`
                );

                if (button) {
                    simulateClick(button);
                }
            }
        }
    }

    if (originalSelection) {
        originalSelection.click();
    }
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
