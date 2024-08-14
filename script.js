// Board
let board;
let boardWidth = 360;
let boardHeight = 648;
let context;

// Archer
let archerWidth = 65;
let archerHeight = 65;
let archerX = boardWidth / 2 - archerWidth / 2;
let archerY = boardHeight * 7 / 8 - archerHeight / 2;
let archerRightImg;
let archerLeftImg;
let archerJumpImg;

let archer = {
    img: null,
    x: archerX,
    y: archerY,
    width: archerWidth,
    height: archerHeight
};

// Physics
let velocityX = 0;
let velocityY = 0; // Archer jump speed
let initialVelocityY = -3.5; // Starting velocity Y
let gravity = 0.05;

// Platforms
let platformArray = [];
let platformWidth = 60;
let platformHeight = 25;
let platformImg;

// Score 
let score = 0;
let maxScore = 0;
let gameOver = false;

let thresholdHeight = boardHeight * 1 / 2;

// Sound effects
const landingSound = new Audio('./assets/sounds/land.mp3');
landingSound.volume = 0.6;

let backgroundMusic = new Audio('./assets/sounds/background.mp3');
backgroundMusic.loop = true; 
backgroundMusic.volume = 0.2; 
backgroundMusic.play(); 
let isMusicPlaying = true;

// Key States
let isRightPressed = false;
let isLeftPressed = false;

let touchStartX = 0; 

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // Used for drawing on the board

    // Load images
    archerRightImg = new Image();
    archerRightImg.src = "./assets/images/archer-right.png";
    archer.img = archerRightImg;
    archerRightImg.onload = function () {
        context.drawImage(archer.img, archer.x, archer.y, archer.width, archer.height);
    };

    archerLeftImg = new Image();
    archerLeftImg.src = "./assets/images/archer-left.png";

    platformImg = new Image();
    platformImg.src = "./assets/images/platform-wood.png";

    velocityY = initialVelocityY;

    placePlatforms();
    requestAnimationFrame(update);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Music control
    document.getElementById('music-toggle').addEventListener('click', function() {
       

        if (isMusicPlaying) {
            backgroundMusic.pause();
            isMusicPlaying = false;
            this.textContent = "Music On";
        } else {
            backgroundMusic.play();
            isMusicPlaying = true;
            this.textContent = "Music Off";
        }
    });
    // Touch event listeners
    board.addEventListener("touchstart", function(e) {
        // Get the touch start position
        touchStartX = e.touches[0].clientX;
    });

    board.addEventListener("touchmove", function(e) {
        // Get the touch move position
        const touchEndX = e.touches[0].clientX;

        // Determine the direction based on touch movement
        if (touchEndX > touchStartX + 30) { // Swipe right
            isRightPressed = true;
            isLeftPressed = false;
            archer.img = archerRightImg;
        } else if (touchEndX < touchStartX - 30) { // Swipe left
            isLeftPressed = true;
            isRightPressed = false;
            archer.img = archerLeftImg;
        }
    });

    board.addEventListener("touchend", function() {
        // Stop moving when the touch ends
        isRightPressed = false;
        isLeftPressed = false;
    });
};


// Update game state
function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    // Archer movement
    if (isRightPressed) {
        velocityX = 1.8;
    } else if (isLeftPressed) {
        velocityX = -1.8;
    } else {
        velocityX = 0; // Stop movement when no key is pressed
    }

    archer.x += velocityX;
    if (archer.x > boardWidth) {
        archer.x = 0;
    } else if (archer.x + archer.width < 0) {
        archer.x = boardWidth;
    }

    velocityY += gravity;
    archer.y += velocityY;
    if (archer.y > board.height) {
        gameOver = true;
    }
    context.drawImage(archer.img, archer.x, archer.y, archer.width, archer.height);

    // Platforms
    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];
        if (velocityY < 4 && archer.y < thresholdHeight) {
            platform.y -= initialVelocityY * 0.75; // Slide platform down
        }

        if (detectCollision(archer, platform) && velocityY >= 0) {
            velocityY = initialVelocityY;
            drawDust(archer.x + archer.width / 2, archer.y + archer.height);
            landingSound.play(); // Play landing sound when archer lands on platform
        }
        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
    }

    // Clear platforms and add new ones
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift(); // Remove first element from the array
        newPlatform(); // Replace with new platform on top
    }

    // Score update
    updateScore();
    context.fillStyle = "white";
    context.font = "16px sans-serif";
    context.fillText(score, 5, 20);

    if (gameOver) {
        context.fillText("Game Over: Press 'Space' to Restart", boardWidth / 7, boardHeight * 7 / 8);
    }
}

// Handle key down events
function handleKeyDown(e) {
    e.preventDefault(); // Prevent default action for all key presses

    if (e.code === "ArrowRight" || e.code === "KeyD") { // Move right
        isRightPressed = true;
        archer.img = archerRightImg;
    }
    else if (e.code === "ArrowLeft" || e.code === "KeyA") { // Move left
        isLeftPressed = true;
        archer.img = archerLeftImg;
    }
    else if (e.code === "Space") { // Reset game if game is over
        if (gameOver) {
            archer.x = archerX;
            archer.y = archerY;
            velocityX = 0;
            velocityY = initialVelocityY;
            score = 0;
            maxScore = 0;
            gameOver = false;
            placePlatforms(); // Reset platforms
        }
    }
}

// Handle key up events
function handleKeyUp(e) {
    if (e.code === "ArrowRight" || e.code === "KeyD") { // Stop moving right
        isRightPressed = false;
    }
    else if (e.code === "ArrowLeft" || e.code === "KeyA") { // Stop moving left
        isLeftPressed = false;
    }
}

function newPlatform() {
    let randomX;
    const minXDistance = platformWidth * 2; // Minimum horizontal distance between platforms
    const maxXDistance = boardWidth - platformWidth; // Maximum allowed width to cover the whole board

    // Get the y position of the last platform in the array
    let lastPlatformY = platformArray[platformArray.length - 1].y;
    let lastPlatformX = platformArray[platformArray.length - 1].x;

    // Generate a random y position above the last platform with a minimum distance
    let minYDistance = platformHeight * 6; // Minimum vertical distance between platforms
    let maxYDistance = platformHeight * 10; // Maximum vertical distance between platforms
    let newY = lastPlatformY - Math.floor(Math.random() * (maxYDistance - minYDistance) + minYDistance);

    // Ensure platforms are not placed too far above the visible area
    if (newY < -platformHeight) {
        newY = -platformHeight; // Start platforms above the screen
    }

    // Generate a random X position with respect to minXDistance
    do {
        randomX = Math.floor(Math.random() * (maxXDistance - minXDistance) + minXDistance);

        // Randomly decide to place the platform left or right from the last one
        if (Math.random() > 0.5) {
            randomX = lastPlatformX + randomX; // To the right
        } else {
            randomX = lastPlatformX - randomX; // To the left
        }

        // Adjust if it goes beyond the board width
        if (randomX + platformWidth > boardWidth) {
            randomX = boardWidth - platformWidth;
        } else if (randomX < 0) {
            randomX = 0;
        }
    } while (Math.abs(randomX - lastPlatformX) < minXDistance);

    let platform = {
        img: platformImg,
        x: randomX,
        y: newY,
        width: platformWidth,
        height: platformHeight
    };

    platformArray.push(platform);
}

function placePlatforms() {
    platformArray = [];

    // Starting platform
    let platform = {
        img: platformImg,
        x: boardWidth / 2 - platformWidth / 2,
        y: boardHeight - 60,
        width: platformWidth,
        height: platformHeight
    };

    platformArray.push(platform);

    const minXDistance = platformWidth * 2; 
    const maxAttempts = 10; 

    for (let i = 1; i < 5; i++) {
        let randomX;
        let attempts = 0;

        do {
            randomX = Math.floor(Math.random() * (boardWidth - platformWidth)); // Generate a random X position

            // Check if the new X position is too close to any existing platform
            let tooClose = platformArray.some(p => Math.abs(p.x - randomX) < minXDistance);

            if (!tooClose) {
                break; // If no overlap, exit the loop
            }

            attempts++;
        } while (attempts < maxAttempts); // Try up to maxAttempts to find a valid position

    
        // Generate a random y position above the last platform with a minimum distance
        let minYDistance = platformHeight * 5; // Minimum vertical distance between platforms
        let maxYDistance = platformHeight * 6; // Maximum vertical distance between platforms
        let newY = platformArray[i - 1].y - Math.floor(Math.random() * (maxYDistance - minYDistance) + minYDistance);

        // Ensure platforms are not placed too far above the visible area
        if (newY < -platformHeight) {
            newY = -platformHeight; // Start platforms above the screen
        }

        let platform = {
            img: platformImg,
            x: randomX,
            y: newY,
            width: platformWidth,
            height: platformHeight
        };

        platformArray.push(platform);
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function updateScore() {
    let points = 10; // Each platform passed gives 10 points

    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];

        if (archer.y < platform.y && !platform.scored) {
            score += points;
            platform.scored = true;
        }
    }
}

function drawDust(x, y) {
    context.fillStyle = "white";
    context.beginPath();
    context.arc(x, y, 3, 0, 2 * Math.PI);
    context.fill();

    setTimeout(() => {
        context.clearRect(x - 3, y - 3, 6, 6);
    }, 100);
}
