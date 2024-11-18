const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 900,
    backgroundColor: '#000000',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };
  
  const TILE_SIZE = 75;
  const GRID_ROWS = 12;
  const GRID_COLS = 16;
  const MOVE_DELAY = 200; // Delay in milliseconds between player moves
  let lastMoveTime = 0;
  
  // Enum to represent different stardust types
  const StardustType = {
    EMPTY: 0,
    DESTROYABLE_STARDUST: 1,
    PERMANENT_STARDUST: 2,
    ENTRY_PORTAL: 3,
    EXIT_PORTAL: 4,
    WARP_POCKET: 5,
    PURPLE_STAR_WALL: 6,
    STAR_BLOCK: 7,
    FALLWALL: 8,
    BLUE_STARDUST: 9,
    GREEN_STARDUST: 10,
  };
  
  // Level grid represented as a 12x16 matrix
  let levelGrid = [];
  
  let player;
  let playerPosition = { row: 2, col: 4 };
  let stardustSprites = [];
  
  const game = new Phaser.Game(config);
  
  function preload() {
    this.load.image('player', 'assets/images/player.png');
    this.load.image('blue_stardust', 'assets/images/blue_stardust.png');
    this.load.image('green_stardust', 'assets/images/green_stardust.png');
    this.load.image('destroyable_stardust', 'assets/images/destroyable_stardust.png');
    this.load.image('permanent_stardust', 'assets/images/permanent_stardust.png');
    this.load.image('entry_portal', 'assets/images/entry_portal.png');
    this.load.image('exit_portal', 'assets/images/exit_portal.png');
    this.load.image('warp_pocket', 'assets/images/warp_pocket.png');
    this.load.image('purple_star_wall', 'assets/images/purple_star_wall.png');
    this.load.image('star_block', 'assets/images/star_block.png');
    this.load.image('fallwall', 'assets/images/fallwall.png');  
    loadLevelFromFile(1);
}

function loadLevelFromFile(levelNumber) {
    fetch(`assets/levels/0${levelNumber}`)
      .then(response => response.text())
      .then(data => {
        const lines = data.split('\n');
        levelGrid = lines.map(line => line.trim().split('').map(Number));
    })
      .catch(err => {
        console.error('Error reading level file:', err);
      });
  }

  function create() {
    // Create the level based on the grid
    for (let row = 0; row < GRID_ROWS; row++) {
      stardustSprites[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const stardustType = levelGrid[row][col];
        let spriteKey;
        switch (stardustType) {
          case StardustType.BLUE_STARDUST:
            spriteKey = 'blue_stardust';
            break;
          case StardustType.GREEN_STARDUST:
            spriteKey = 'green_stardust';
            break;
          case StardustType.DESTROYABLE_STARDUST:
            spriteKey = 'destroyable_stardust';
            break;
          case StardustType.PERMANENT_STARDUST:
            spriteKey = 'permanent_stardust';
            break;
          case StardustType.ENTRY_PORTAL:
            spriteKey = 'entry_portal';
            playerPosition = { row: row, col: col };
            break;
          case StardustType.EXIT_PORTAL:
            spriteKey = 'exit_portal';
            break;
          default:
            spriteKey = null;
        }
        if (spriteKey) {
          const stardustSprite = this.add.image(col * TILE_SIZE, row * TILE_SIZE, spriteKey).setOrigin(0).setDisplaySize(TILE_SIZE, TILE_SIZE);
          stardustSprites[row][col] = stardustSprite;
        } else {
          stardustSprites[row][col] = null;
        }
      }
    }
  
    // Create the player
    player = this.physics.add.sprite(playerPosition.col * TILE_SIZE, playerPosition.row * TILE_SIZE, 'player').setOrigin(0).setDisplaySize(TILE_SIZE, TILE_SIZE);
  
    // Set up controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => placeOrDestroyStardust.call(this));
  } 
   
  function update(time) {
    // Ensure enough time has passed for the player to move
    if (time - lastMoveTime < MOVE_DELAY) {
      return;
    }
  
    // Update player movement based on arrow keys
    if (this.cursors.left.isDown) {
      movePlayer(-1, 0);
      player.flipX = true; // Face left
      lastMoveTime = time;
    } else if (this.cursors.right.isDown) {
      movePlayer(1, 0);
      player.flipX = false; // Face right
      lastMoveTime = time;
    } 
  
    // Check if the player should fall down
    fallPlayer();
  }
  
  function movePlayer(deltaCol, deltaRow) {
    const newCol = playerPosition.col + deltaCol;
    const newRow = playerPosition.row + deltaRow;
  
    // Check if the new position is within bounds and not stardusted
    if (newCol >= 0 && newCol < GRID_COLS && newRow >= 0 && newRow < GRID_ROWS) {
      const stardustType = levelGrid[newRow][newCol];
      if (stardustType === StardustType.EMPTY || stardustType === StardustType.PORTAL) {
        playerPosition.col = newCol;
        playerPosition.row = newRow;
        player.setPosition(playerPosition.col * TILE_SIZE, playerPosition.row * TILE_SIZE);
  
        // If player reaches the portal, reset to the starting position
        if (stardustType === StardustType.PORTAL) {
          playerPosition = { row: 2, col: 4 };
          player.setPosition(playerPosition.col * TILE_SIZE, playerPosition.row * TILE_SIZE);
        }
      }
    }
  }
  
  function fallPlayer() {
    const belowRow = playerPosition.row + 1;
  
    // Check if the player is within bounds and there is an empty space below
    if (belowRow < GRID_ROWS) {
      const stardustTypeBelow = levelGrid[belowRow][playerPosition.col];
      if (stardustTypeBelow === StardustType.EMPTY) {
        playerPosition.row = belowRow;
        player.setPosition(playerPosition.col * TILE_SIZE, playerPosition.row * TILE_SIZE);
      }
    } else {
      // If player falls below the bottom edge, move to the portal
      playerPosition = { row: 2, col: 7 }; // Assuming portal is at row 2, col 7
      player.setPosition(playerPosition.col * TILE_SIZE, playerPosition.row * TILE_SIZE);
    }
  }
  
  function placeOrDestroyStardust() {
    if (this.cursors.up.isDown){
        raiseGreenStardust.call(this);
        return;
    }
    const currentRow = playerPosition.row;
    const currentCol = playerPosition.col;
    const facingCol =  player.flipX ? currentCol - 1 : currentCol + 1;
    const facingRow = this.cursors.down.isDown ? currentRow + 1 : currentRow;
  
    if (facingCol >= 0 && facingCol < GRID_COLS) {
      const stardustType = levelGrid[facingRow][facingCol];
      if (stardustType === StardustType.EMPTY) {
        // Place a blue stardust stardust
        levelGrid[facingRow][facingCol] = StardustType.BLUE_STARDUST;
        const stardustSprite = this.add.image(facingCol * TILE_SIZE, facingRow * TILE_SIZE, 'blue_stardust').setOrigin(0).setDisplaySize(TILE_SIZE, TILE_SIZE);
        stardustSprites[facingRow][facingCol] = stardustSprite;
      } else if (stardustType === StardustType.BLUE_STARDUST || stardustType === StardustType.DESTROYABLE_STARDUST || stardustType === StardustType.GREEN_STARDUST) {
        // Destroy the blue stardust stardust
        levelGrid[facingRow][facingCol] = StardustType.EMPTY;
        if (stardustSprites[facingRow][facingCol]) {
          stardustSprites[facingRow][facingCol].destroy();
          stardustSprites[facingRow][facingCol] = null;
        }
      }
    }
  }
  
  function raiseGreenStardust() {
    const currentRow = playerPosition.row;
    const currentCol = playerPosition.col;
    const belowRow = currentRow + 1;
    const aboveRow = currentRow - 1; 

    if (belowRow < GRID_ROWS && levelGrid[belowRow][currentCol] === StardustType.GREEN_STARDUST){
        levelGrid[belowRow][currentCol] = StardustType.EMPTY;
        if (stardustSprites[belowRow][currentCol]) {
            stardustSprites[belowRow][currentCol].destroy();
            stardustSprites[belowRow][currentCol] = null;
        }
    } else if (belowRow < GRID_ROWS && levelGrid[belowRow][currentCol] !== StardustType.EMPTY) {
      if (levelGrid[belowRow][currentCol] !== StardustType.EMPTY && aboveRow >= 0 && levelGrid[aboveRow][currentCol] === StardustType.EMPTY) {
        // Place a green stardust stardust below the player and move the player up
        movePlayer(0, -1);
        console.log(stardustSprites)
        levelGrid[currentRow][currentCol] = StardustType.GREEN_STARDUST;
        const stardustSprite = this.add.image(currentCol * TILE_SIZE, currentRow * TILE_SIZE, 'green_stardust').setOrigin(0).setDisplaySize(TILE_SIZE, TILE_SIZE);
        stardustSprites[currentRow][currentCol] = stardustSprite;
        console.log(stardustSprites)
      }
    }
  }