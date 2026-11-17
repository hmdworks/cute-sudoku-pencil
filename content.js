
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


async function main() {
    const boardFound = await findSudokuBoard();

    if (!boardFound) {
        console.log("Sudoku board not found! 🥺");
        return;
    }
}


main();
