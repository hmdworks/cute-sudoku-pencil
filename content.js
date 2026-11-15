
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

        // Check in case the board already exists
        checkBoard();
    });
}


function readGrid() {
    const cells = [...document.querySelectorAll(
        '[role="gridcell"]'
    )];
    
    // Sort cells by their board index
    cells.sort((a, b) =>
        Number(a.dataset.cell) - Number(b.dataset.cell)
    );

    if (cells.length !== 81) {
        return null;
    }

    const grid = [];

    for (let row = 0; row < 9; row++) {
        const currentRow = [];

        for (let col = 0; col < 9; col++) {
            const index = row * 9 + col;
            const cell = cells[index];

            // Only read the main cell value, not pencil marks
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

    const grid = readGrid();

    console.log("My Sudoku grid 💗");
    console.table(grid);
}


main();
