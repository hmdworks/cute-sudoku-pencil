
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


async function generateCandidates() {
    const grid = await readGrid();
    if (!grid) return;

    const cells = [...document.querySelectorAll('[role="gridcell')];

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

            for (let num = 1; num <= 9; num++) {

                const container = document.querySelector(
                    '.su-candidates.selected'
                );

                const isSelected = !!container.querySelector(
                    '.su-candidate[data-candidate="${num}"'
                );

                const shouldBeSelected = validCandidates.includes(num);

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

}
async function main() {
    const boardFound = await findSudokuBoard();

    if (!boardFound) {
        console.log("Sudoku board not found! 🥺");
        return;
    }

    generateCandidates();
}


main();
