function isEmpty(grid, row, col) {
    return grid[row][col] === 0
}

function getCandidates(grid, row, col) {
    if (!isEmpty(grid, row, col)) {
        return [];
    }

    const used = new Set();

    for (let i = 0; i < 9; i++) {
        used.add(grid[row][i]);
        used.add(grid[i][col]);
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            used.add(grid[r][c])
        }   
    }

    const cdds = []

    for (let cdd = 1; cdd <= 9; cdd++) {
        if (!used.has(cdd)) {
            cdds.push(cdd);
        }
    }

    return cdds;
}
