const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let showDebug = false;
let showInventory = false;
let inventory;
let inventoryBag = {tunes:['_'], tools:[], lullaby:[], page:0};
let lastInventoryBag = {};
let camera;
let narratorMet= [];
//let selector;
let inventorySelectorPosition = {x:0 , y:0}
const inventoryBoxSize = 64;
const inventoryMaxX = 8;
const inventoryMaxY = 8;

function preload() {
  this.load.image("tiles", "../assets/tilesets/tuxmon-sample-32px-extruded.png");
  this.load.tilemapTiledJSON("map", "../assets/tilemaps/tuxemon-town.json");
  this.load.image('inventory', 'assets/images/inventory/i.png', 270, 180);

  // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
  // the player animations (walking left, walking right, etc.) in one image. For more info see:
  //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
  // If you don't use an atlas, you can do the same thing with a spritesheet, see:
  //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
  this.load.atlas("atlas", "../assets/atlas/atlas.png", "../assets/atlas/atlas.json");
}

function create() {
  const map = this.make.tilemap({ key: "map" });

  // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
  // Phaser's cache (i.e. the name you used in preload)
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
  const worldLayer = map.createStaticLayer("World", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

  //inventory = map.createStaticLayer("menu", tileset, 0, 0);
  inventory = this.add.group();
  inventory.add(this.add.sprite(400, 300, 'inventory').setScrollFactor(0));
  let selector = this.add.graphics().setScrollFactor(0);
  selector.lineGradientStyle(2, 0xFFFFFF,0,0xFFFFFF,0, 1);
  selector.strokeRect(110, 40, 65, 65);
  selector.name = "selector";
  inventory.add(selector);
  inventory.setDepth(-40);

  worldLayer.setCollisionByProperty({ collides: true });

  // By default, everything gets depth sorted on the screen in the order we created things. Here, we
  // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
  // Higher depths will sit on top of lower depth objects.
  aboveLayer.setDepth(10);
  //inventory.setDepth(-40);

  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
  const narratorObjects = map.objects[0].objects.filter(obj => obj.name === "narrator");
  let narrators = this.physics.add.group();

  // Create a sprite with physics enabled via the physics system. The image used for the sprite has
  // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
  player = this.physics.add
    .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
    .setSize(30, 40)
    .setOffset(0, 24);

  function meetNarator (player, narrator)
  {
    //console.log(narrator.data.list.tune);
    inventoryBag.tunes.push(narrator.data.list.tune);
    narrator.destroy();
  }

  narratorObjects.forEach(narrator => {
    let sprite = map.createFromObjects('Objects', narrator.id, {key: 'narrator'})[0];
    sprite.visible=false;
    narrators.add(sprite);
  });

  this.physics.add.collider(player, narrators, meetNarator, null, this);

  // Watch the player and worldLayer for collisions, for the duration of the scene:
  this.physics.add.collider(player, worldLayer);

  // Create the player's walking animations from the texture atlas. These are stored in the global
  // animation manager so any sprite can access them.
  const anims = this.anims;
  anims.create({
    key: "misa-left-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-right-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-front-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-back-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });

  camera = this.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  cursors = this.input.keyboard.createCursorKeys();

  // Help text that has a "fixed" position on the screen
  this.add
    .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
      font: "18px monospace",
      fill: "#000000",
      padding: { x: 20, y: 10 },
      backgroundColor: "#ffffff"
    })
    .setScrollFactor(0)
    .setDepth(30);

  this.input.keyboard.on("keydown_Q",event => {
    showInventory = !showInventory;
  })
  
  this.input.keyboard.on("keydown_R",event => {
    inventoryBag.page++;
    inventoryBag.page%=4;
  })

  this.input.keyboard.on('keydown_W', function (event) {
    if(inventorySelectorPosition.y<1){
      console.log(inventorySelectorPosition.x+inventoryMaxX*inventorySelectorPosition.y);
    }

    if(inventorySelectorPosition.y>=1){
      let cid = inventorySelectorPosition.y+
        (inventoryMaxY)*((inventorySelectorPosition.x>3?1:0)+inventoryBag.page*2);
      let row = inventoryBag.lullaby.filter(i=>i.id===cid);
      if(row && row.length>0){
        if(inventorySelectorPosition.x===0||inventorySelectorPosition.x===4){
          row[0].from++;
          row[0].from%=inventoryBag.tunes.length;
        } else if(inventorySelectorPosition.x===2||inventorySelectorPosition.x===6){
          row[0].to++;
          row[0].to%=inventoryBag.tunes.length;
        } else if(inventorySelectorPosition.x===1||inventorySelectorPosition.x===5){
          row[0].prob++;
          row[0].prob%=10;
        }
      } else {
        inventoryBag.lullaby.push({
          id:cid,
          from:0,
          to:0,
          prob:0});
      }
    }
    console.log(inventoryBag.lullaby.map(f=>f.id).join(','));
  });

  this.input.keyboard.on('keydown_E', function (event) {
    if(inventorySelectorPosition.y<1){
      console.log(inventorySelectorPosition.x+inventoryMaxX*inventorySelectorPosition.y);
    }

    if(inventorySelectorPosition.y>=1){
      let cid = inventorySelectorPosition.y+
        (inventoryMaxY)*((inventorySelectorPosition.x>3?1:0)+inventoryBag.page*2);
      let row = inventoryBag.lullaby.filter(i=>i.id===cid);
      if(row && row.length>0){
        if(inventorySelectorPosition.x===0||inventorySelectorPosition.x===3){
          row[0].from--;
          if(row[0].from<0)row[0].from+=inventoryBag.tunes.length;
          row[0].from%=inventoryBag.tunes.length;
        } else if(inventorySelectorPosition.x===2||inventorySelectorPosition.x===4){
          row[0].to--;
          if(row[0].to<0)row[0].to+=inventoryBag.tunes.length;
          row[0].to%=inventoryBag.tunes.length;
        } else if(inventorySelectorPosition.x===1||inventorySelectorPosition.x===5){
          row[0].prob--;
          if(row[0].prob<0)row[0].prob+=10;
          row[0].prob%=10;
        }
      } else {
        inventoryBag.lullaby.push({
          id:cid,
          from:0,
          to:0,
          prob:0});
      }
    }
    
  });

  // Debug graphics
  this.input.keyboard.once("keydown_D", event => {
    // Turn on physics debugging to show player's hitbox
    this.physics.world.createDebugGraphic();

    // Create worldLayer collision graphic above the player, but below the help text
    const graphics = this.add
      .graphics()
      .setAlpha(0.75)
      .setDepth(20);
    worldLayer.renderDebug(graphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    });
  });
}

const getSelector = f => f.getChildren().filter(g=>g.name==='selector')[0];
const makeText = (text,y,x,self) => {
  let t = self.add.text(16, 16, text, {
    font: "18px monospace",
    fill: "#FFFFFF",
    padding: { x: 120, y: 50 }
  }).setScrollFactor(0).setDepth(50);
  t.x = x * inventoryBoxSize;
  t.y = y * inventoryBoxSize;
  t.name = 'inventoryItems';
  return t;
}
const deleteTexts = (inventory) => {
  inventory.getChildren().filter(f=>f.name === 'inventoryItems').map(f=>f.destroy());
}

function update(time, delta) {
  const speed = 175;
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);
if(showInventory){
  player.anims.stop();
  inventory.setDepth(40);

  if(JSON.stringify(lastInventoryBag) !== JSON.stringify(inventoryBag)){
    console.log('update');
    deleteTexts(inventory);
    lastInventoryBag = JSON.parse(JSON.stringify(inventoryBag));
    for(let i=0;i<inventoryBag.tunes.length;i++)
      inventory.add(makeText(inventoryBag.tunes[i],0,i,this));
    
    if(inventoryBag.lullaby){
      inventoryBag.lullaby.forEach(l=>{
        if(l.id<(inventoryBag.page*(inventoryMaxY-1))||l.id>(2*(inventoryBag.page+1)*(inventoryMaxY-1))) return;
        let y = l.id > ((inventoryMaxY-1)*(inventoryBag.page+1)) ? l.id - inventoryMaxY : l.id;
        y %= (inventoryMaxY-1)*(inventoryBag.page+1)*2;
        inventory.add(makeText(inventoryBag.tunes[l.from],y,0+(l.id>(inventoryMaxY-1)?4:0),this));
      inventory.add(makeText(l.prob,y,1+(l.id>(inventoryMaxY-1)?4:0),this));
      inventory.add(makeText(inventoryBag.tunes[l.to],y,2+(l.id>(inventoryMaxY-1)?4:0),this));
      })
    }
  }
  if (this.input.keyboard.checkDown(cursors.left, 250)) {
    if(inventorySelectorPosition.x>0) {
      inventorySelectorPosition.x--;
      getSelector(inventory).x=inventorySelectorPosition.x*inventoryBoxSize;
    }
  } else if (this.input.keyboard.checkDown(cursors.right, 250)) {
    if(inventorySelectorPosition.x<inventoryMaxX) {
      inventorySelectorPosition.x++;
      getSelector(inventory).x=inventorySelectorPosition.x*inventoryBoxSize;
    }
  }

  // Vertical movement
  if (this.input.keyboard.checkDown(cursors.up, 250)) {
    if(inventorySelectorPosition.y>0) {
      inventorySelectorPosition.y--;
      getSelector(inventory).y=inventorySelectorPosition.y*inventoryBoxSize;
    }
  } else if (this.input.keyboard.checkDown(cursors.down, 250)) {
    if(inventorySelectorPosition.y<inventoryMaxY-1) {
      inventorySelectorPosition.y++;
      getSelector(inventory).y=inventorySelectorPosition.y*inventoryBoxSize;
    }
  }
  //console.log(inventoryBag);
}else{
  inventorySelectorPosition = {x:0 , y:0};
  inventory.setDepth(-40);
  
  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play("misa-left-walk", true);
  } else if (cursors.right.isDown) {
    player.anims.play("misa-right-walk", true);
  } else if (cursors.up.isDown) {
    player.anims.play("misa-back-walk", true);
  } else if (cursors.down.isDown) {
    player.anims.play("misa-front-walk", true);
  } else {
    player.anims.stop();

    // If we were moving, pick and idle frame to use
    if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");
    else if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");
    else if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");
    else if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
  }
}
}
