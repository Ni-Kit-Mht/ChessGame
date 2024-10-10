let scale = 1;
let target = '';
let clickedSquare = '';
let justClickedSquare = '';
let selectedPiece;
let capturedPiece;
let currentMove = Promise.resolve(); // Holds the promise chain for the current move
const chessboard = document.getElementById('chessboard');
const pieces = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
let moveHistory = [];

function undoMove() {
    if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop(); // Get the last move

        // Restore the moved piece to its original position
        lastMove.from.appendChild(lastMove.piece);

        // If there was a captured piece, restore it
        if (lastMove.capturedPiece) {
            lastMove.to.appendChild(lastMove.capturedPiece); // Append the captured piece back
        }        
    } else {
        console.log('No moves to undo');
    }
}
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault(); // Prevent default browser action
        undoMove(); // Call undo move
    }
});

for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((i + j) % 2 === 0 ? 'light' : 'dark');
        square.dataset.row = i;
        square.dataset.col = j;
        chessboard.appendChild(square);
    }
}

for (let i = 0; i < 8; i++) {
    if (i === 0 || i === 1) { 
        for (let j = 0; j < 8; j++) {
            const piece = document.createElement('img');
            piece.src = `chess-game/${(i === 0 ? pieces[j] + '1' : 'M')}.png`; // Black pieces
            piece.alt = (i === 1) ? 'M' : `${pieces[j]} piece`; // Use a specific alt for pawns
            piece.style.width = '99%';  // Set piece size
            piece.style.height = '99%'; // Set piece size
            // Add click event to select the piece
            document.querySelectorAll('.piece').forEach(piece => {
                piece.addEventListener('click', (event) => {
                    currentMove = currentMove.then(() => {
                        if (!selectedPiece) {
                            selectedPiece = event.target;
                        }
                    });
                });
            });
            // Find the corresponding square and append the piece
            const square = chessboard.querySelector(`.square[data-row="${i}"][data-col="${j}"]`);
            square.appendChild(piece);
        }
    } else if (i === 6 || i === 7) {
        for (let j = 0; j < 8; j++) {
            const piece = document.createElement('img');
            piece.src = `chess-game/${(i === 7 ? pieces[j] : 'P')}.png`; // White pieces
        
            piece.alt = (i === 6) ? 'P' : `${pieces[j]} piece`; // Use a specific alt for pawns
            piece.style.width = '99%';  
            piece.style.height = '99%'; 
            // Add click event to select the piece
            document.querySelectorAll('.piece').forEach(piece => {
                piece.addEventListener('click', (event) => {
                    // Chain the promise to ensure no new piece can be selected during animation
                    currentMove = currentMove.then(() => {
                        selectedPiece = piece; // Set the currently selected piece
                        //selectedPiece.classList.add('selected'); // Highlight the selected piece
                        event.stopPropagation(); // Prevent event from bubbling up
                    });
                });
            });  
            // Find the corresponding square and append the piece
            const square = chessboard.querySelector(`.square[data-row="${i}"][data-col="${j}"]`);
            square.appendChild(piece);
        }
    }
}

// Function to handle square clicks
function handleSquareClick(event) {
    const clickedSquare = event.target.closest('.square'); // Get the closest square
    if (clickedSquare) {
        console.log('Clicked square:', clickedSquare);
        const row = parseInt(clickedSquare.dataset.row);
        const col = parseInt(clickedSquare.dataset.col);
        console.log(`Clicked cell: Row ${row}, Column ${col}`);

        const pieceImg = clickedSquare.querySelector('img'); // Get piece image in clicked square

        currentMove = currentMove.then(() => {
            return new Promise((resolve) => {
                // If the clicked square is the same as just clicked, deselect it
                if (justClickedSquare === clickedSquare) {
                    clickedSquare.classList.remove('selected');
                    selectedPiece = null;
                    justClickedSquare = null;
                    resolve();
                } else {
                    // If there's a piece selected, attempt to move it
                    if (selectedPiece) {
                        const pieceType = selectedPiece.alt.charAt(0); // Get the first character of the alt text
                        const startRow = parseInt(justClickedSquare.dataset.row);
                        const startCol = parseInt(justClickedSquare.dataset.col);
                        const isValidMove = validateMove(pieceType, [startRow, startCol], [row, col]);

                        if (isValidMove) {
                            if (pieceImg && canCapture(selectedPiece, pieceImg)) {
                                capture(clickedSquare); // Capture logic
                            } else {
                                movePiece(clickedSquare); // Move logic
                            }
                        } else {
                            console.warn("Invalid move");
                        }
                        resolve();
                    } else if (pieceImg) {
                        // Select the piece if clicked square has a piece
                        selectedPiece = pieceImg; // Select the piece
                        clickedSquare.classList.add('selected');
                        justClickedSquare = clickedSquare; // Remember where the piece was selected
                        console.log(`Selected piece: ${pieceImg.alt}`);
                        resolve();
                    } else {
                        clickedSquare.classList.add('selected');
                        justClickedSquare = clickedSquare; // Remember the selected square                        
                        clickedSquare.classList.remove('selected');
                        justClickedSquare = null; // Clear the remembered square
                        resolve();
                    }
                }
            });
        });
    } else {
        console.warn("Clicked outside a square");
    }
}

function isSquareEmpty(row, col) {
    const square = chessboard.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    return square.childNodes.length === 0; // Return true if no pieces are present
}

// The existing validateMove function remains unchanged
function validateMove(pieceType, start, end) {
    const [startRow, startCol] = start;
    const [endRow, endCol] = end;

    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    switch (pieceType) {
    case 'R': // Rook
        return (startRow === endRow || startCol === endCol); // Can move in straight lines

    case 'N': // Knight
        return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || 
                (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2); // L-shape move

    case 'B': // Bishop
        return Math.abs(rowDiff) === Math.abs(colDiff); // Diagonal moves

    case 'Q': // Queen
        return (startRow === endRow || startCol === endCol || 
                Math.abs(rowDiff) === Math.abs(colDiff)); // Rook + Bishop moves

    case 'K': // King
        return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1; // One square in any direction

    case 'P': // Pawn
        return validatePawnMove(startRow, startCol, endRow, endCol, pieceType);
    case 'M': // Pawn
        return validatePawnMove(startRow, startCol, endRow, endCol, pieceType);

    default:
        return false; // Invalid piece type
    }
}

function validatePawnMove(startRow, startCol, endRow, endCol, pieceType) {
    const isWhite = pieceType === 'P'; // White pawn
    const isBlakc = pieceType ==='M'
    const direction = isWhite ? -1 : 1; // White moves up (+1), Black moves down (-1)

    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;

    // Normal move (1 square forward)
    if (rowDiff === direction && colDiff === 0) {
        return isSquareEmpty(endRow, endCol); // Check if the target square is empty
    }

    // Initial move (2 squares forward)
    if ((isWhite && startRow === 6) || (!isWhite && startRow === 6)) {
        if (rowDiff === direction * (2) && colDiff === 0) {
            return isSquareEmpty(startRow + direction, startCol) && isSquareEmpty(endRow, endCol); // Check if both squares are empty
        }
    }

    if ((isBlakc && startRow === 1)) {
        if (rowDiff === direction * (2) && colDiff === 0) {
            return isSquareEmpty(startRow + direction, startCol) && isSquareEmpty(endRow, endCol); // Check if both squares are empty
        }
    }

    // Capture move (diagonally)
    if (rowDiff === direction && Math.abs(colDiff) === 1) {
        return !isSquareEmpty(endRow, endCol); // Check if there's an opponent's piece to capture
    }

    return false;
}

function canCapture(selectedPiece, targetPiece) {
    // Assuming black pieces end with '1' and white pieces don't
    const selectedPieceIsBlack = selectedPiece.src.includes('1');
    const targetPieceIsBlack = targetPiece.src.includes('1');

    // Pieces must be of different colors to capture
    return selectedPieceIsBlack !== targetPieceIsBlack;
}

function movePiece(targetSquare) {
    const fromSquare = justClickedSquare; // The square where the piece was initially
    const toSquare = targetSquare; // The square where the piece is moved to
    const movedPiece = selectedPiece;
    const capturedPiece = toSquare.querySelector('img'); // Check if there's a captured piece

    // Store move details in history
    moveHistory.push({
        from: fromSquare,
        to: toSquare,
        piece: movedPiece,
        capturedPiece: capturedPiece ? capturedPiece.cloneNode(true) : null // Store a clone of the captured piece
    });

    // Start the animation and move process
    currentMove = currentMove.then(() => {
        return new Promise((resolve) => {
            if (selectedPiece) {
                // Animate the move before actually moving the piece
                animateMove(targetSquare).then(() => {
                    // Move the piece to the target square
                    targetSquare.appendChild(selectedPiece);

                    // If a piece was captured, remove it from the target square
                    if (capturedPiece) {
                        capturedPiece.remove(); // Remove captured piece from the board
                    }

                    // Clear selection and resolve the move
                    selectedPiece = null;
                    justClickedSquare.classList.remove('selected');
                    resolve();
                });
            } else {
                console.warn("No piece selected to move");
                resolve(); // Resolve immediately if no piece is selected
            }
        });
    });
}

function capture(targetSquare) {
    // Check if there's a piece in the target square (captured piece)
    const capturedPiece = targetSquare.querySelector('img');

    // If a piece is found, proceed with capturing
    if (capturedPiece) {
        // Log the captured piece for debugging
        console.log(`Captured piece: ${capturedPiece.alt}`);
    }

    // Now move the selected piece to the target square
    movePiece(targetSquare);
}

function animateMove(targetSquare) {
    return new Promise((resolve) => {
        const pieceRect = selectedPiece.getBoundingClientRect();
        
        // Get the target position of the clicked square
        const targetRect = targetSquare.getBoundingClientRect();

        // Calculate the distance to move
        let deltaX = (targetRect.right + targetRect.left) - (pieceRect.right + pieceRect.left);
        let deltaY = (targetRect.top + targetRect.bottom) - (pieceRect.top + pieceRect.bottom);
        deltaX = deltaX / scale;
        deltaY = deltaY / scale;
        deltaX = deltaX / 2;
        deltaY = deltaY / 2;

        selectedPiece.style.transition = 'transform 0.5s ease'; // Smooth transition
        selectedPiece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        //selectedPiece.classList.remove('selected');
        setTimeout(() => {
            selectedPiece.style.transform = '';
            resolve(); // Resolve after the animation completes
        }, 500);
    });
}

function adjustScale() {
    const container = document.getElementById('container');
    scale = Math.min(container.clientWidth / 1200, container.clientHeight / 1200);
    chessboard.style.transform = `scale(${scale})`;
}
adjustScale();
window.addEventListener('resize', adjustScale);
chessboard.addEventListener('click', handleSquareClick);
