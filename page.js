
//// FIND BOARD ////
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


//// NYT STORE ////
let nytStore = null;

async function getNYTStore() {
    if (nytStore) return nytStore;

    await findSudokuBoard();

    const cells = document.querySelectorAll('[role="gridcell"]');

    for (const element of cells) {
        const fiberKey = Object.keys(element).find(
            key => key.startsWith("__reactFiber$")
        );

        if (!fiberKey) continue;

        let fiber = element[fiberKey];

        for (let i = 0; fiber && i < 60; i++, fiber = fiber.return) {
            const store = fiber.memoizedProps?.value?.store;

            if (store?.getState && store?.dispatch) {
                nytStore = store;
                return nytStore;
            }
        }
    }

    throw new Error("Could not find the NYT Redux store.");
}


//// CELEBRATION SOUND ////
(() => {
    const originalPlay = HTMLMediaElement.prototype.play;

    let celebrationSound = null;

    window.addEventListener("message", (event) => {
        if (
            event.source !== window ||
            event.data?.source !== "cute-sudoku-pencil" ||
            event.data?.type !== "setCelebrationSound"
        ) {
            return;
        }

        celebrationSound = new Audio(event.data.url);
    });

    HTMLMediaElement.prototype.play = function () {
        if ((this.currentSrc || this.src).includes("San_Jose_Strut.mp3")) {

            if (!celebrationSound) {
                console.warn("Celebration sound hasn't loaded yet.");
                return Promise.resolve();
            }

            setTimeout(() => {
                celebrationSound.currentTime = 0;
                celebrationSound.play();
            }, 700);

            return Promise.resolve();
        }

        return originalPlay.apply(this, arguments);
    };
})();


//// COMPLETION DETECTOR ////
(async () => {
    const store = await getNYTStore();

    let previousPuzzleState = store.getState();

    store.subscribe(() => {
        const state = store.getState();

        for (const difficulty of ["easy", "medium", "hard"]) {
            const previous = previousPuzzleState.game.byKey[difficulty];
            const current = state.game.byKey[difficulty];

            if (!previous?.solved && current?.solved) {
                setTimeout(() => {
                    const finalState = store.getState();

                    const finalPuzzle = finalState.game.byKey[difficulty];

                    const puzzleInfo = finalState.puzzles[difficulty];

                    const record = {
                        puzzleId: puzzleInfo.puzzle_id,
                        date: finalPuzzle.id,
                        difficulty,
                        elapsedTime: finalState.game.timers[difficulty].elapsedTime,
                        completedAt: new Date().toISOString()
                    };

                    window.postMessage({
                        source: "cute-sudoku-pencil",
                        type: "saveCompletedPuzzle",
                        record
                    }, location.origin);

                }, 200);
            };
        }
        previousPuzzleState = state;
    });
})();


//// UPDATE CANDIDATES ////
(() => {
    const CHANNEL = "cute-sudoku-pencil";
 
    let cachedWebpackRequire = null;
    let nextProbeChunkId = 900000000;

    function getWebpackRequire() {
        if (cachedWebpackRequire) {
            return cachedWebpackRequire;
        }

        const chunkArray = window.webpackChunk_xwords_phoenix;

        if (!chunkArray || typeof chunkArray.push !== "function") {
            throw new Error("NYT Webpack chunk array not found.");
        }

        let webpackRequire;

        const probeId = ++nextProbeChunkId;

        chunkArray.push([
            [probeId],
            {},
            (requireFunction) => {
                webpackRequire = requireFunction;
            }
        ]);

        if (typeof webpackRequire !== "function") {
            throw new Error(
                "Webpack callback did not run. The chunk runtime may have changed."
            );
        }

        cachedWebpackRequire = webpackRequire;

        return cachedWebpackRequire;
    }

    async function updateCandidates(updates) {
        const store = await getNYTStore();
        const webpackRequire = getWebpackRequire();

        const slice = webpackRequire(4755).ZP;
        const actions = slice.actions;

        if (
            !actions.pushToHistory ||
            !actions.restoreCellState
        ) {
            throw new Error("Required NYT Redux actions were not found.");
        }

        let puzzle = store.getState().game.byKey[
            store.getState().game.activeKey
        ];

        if (!puzzle) {
            throw new Error("Could not find the active Sudoku puzzle.");
        }

        if (puzzle.autoCandidateMode) {
            throw new Error("Please disable Auto Candidate Mode first.");
        }

        for (const update of updates) {
            const { cellId, candidates } = update;

            if (
                !Number.isInteger(cellId) ||
                cellId < 0 ||
                cellId >= 81
            ) {
                continue;
            }

            const root = store.getState();
            const activeKey = root.game.activeKey;
            puzzle = root.game.byKey[activeKey];

            const cell = puzzle.cells[cellId];

            if (!cell || cell.value != null) continue;

            const oldManual = puzzle.manualCandidates[cellId];
            const oldAuto = puzzle.autoCandidates[cellId];

            const nextManual = { ...(oldManual || {}) };

            let changed = false;

            for (const candidate of candidates) {
                const { digit, selected } = candidate;

                if (
                    !Number.isInteger(digit) ||
                    digit < 1 ||
                    digit > 9 ||
                    typeof selected !== "boolean"
                ) {
                    continue;
                }

                const currentlySelected = oldManual?.[digit] === true;

                if (currentlySelected === selected) continue;

                nextManual[digit] = selected;
                changed = true;
            }

            if (!changed) continue;

            const snapshot = {
                type: "cell",
                value: {
                    cell,
                    manualCandidates: oldManual,
                    autoCandidates: oldAuto
                }
            };

            store.dispatch(actions.pushToHistory(snapshot));

            store.dispatch(actions.restoreCellState({
                type: "cell",
                value: {
                    cell,
                    manualCandidates: nextManual,
                    autoCandidates: oldAuto
                }
            }));
        }

        return {
            success: true,
        };
    }

    window.addEventListener("message", async event => {
        if (event.source !== window || event.origin !== location.origin) {
            return;
        }

        const message = event.data;

        if (
            !message ||
            message.channel !== CHANNEL ||
            message.direction !== "request" ||
            message.type !== "updateCandidates"
        ) {
            return;
        }

        try {
            const result = await updateCandidates(message.payload.updates);

            window.postMessage({
                channel: CHANNEL,
                direction: "response",
                requestId: message.requestId,
                success: true,
                result
            }, location.origin);

        } catch (error) {
            window.postMessage({
                channel: CHANNEL,
                direction: "response",
                requestId: message.requestId,
                success: false,
                error: error.message
            }, location.origin);
        }
    });
})();
