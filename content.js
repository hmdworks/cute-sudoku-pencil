
const style = document.createElement('style');
style.textContent = `
    svg.su-candidate-button path.su-number,
    .su-candidate-button:hover path.su-number,
    .su-candidate-button:focus path.su-number,
    [class*="candidate"] path {
    fill: #ef4089 !important;
    }

    [aria-selected="true"],
    .su-cell[aria-selected="true"] {
        background-color: rgb(252, 179, 209) !important;
    }

    .su-cell.highlighted:not([aria-selected="true"]) {
        background-color: rgb(247, 215, 220) !important;
    }
`;
document.head.appendChild(style);


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


function readGrid() {
    const cells = [...document.querySelectorAll(
        '[role="gridcell"]'
    )];
    
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
