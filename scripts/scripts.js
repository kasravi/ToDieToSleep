class SceneBuilder extends Phaser.Scene {

  constructor(name) {
    super();
    this.name = name;

    Phaser.Scene.call(this, { key: name });
    this.cursors;
    this.player;
    this.showDebug = false;
    this.showInventory = false;
    this.inventory;
    this.inventoryBag = { tunes: [' ,4n'], tools: [], lullaby: [], page: 0 };
    this.lastInventoryBag = {};
    this.camera;
    this.narratorMet = [];
    this.isNearChild = false;
    this.inventorySelectorPosition = { x: 0, y: 0 }
    this.inventoryBoxSize = 64;
    this.inventoryMaxX = 8;
    this.inventoryMaxY = 8;
    this.dialog;
    this.sing;
    this.inventoryScreen = {
      keys: {
        collectedTunes: 0,
        builtTunesFrom: 1,
        builtTunesProb: 2,
        builtTunesTo: 3,
        startSinging: 4,
        collectedItems: 5,
        builtTunes: [1, 2, 3],
      },
      content: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 2, 3, undefined, 1, 2, 3, 5, 5],
        [1, 2, 3, undefined, 1, 2, 3, 5, 5],
        [1, 2, 3, undefined, 1, 2, 3, 5, 5],
        [1, 2, 3, undefined, 1, 2, 3, 5, 5],
        [1, 2, 3, undefined, 1, 2, 3, 5, 5],
        [1, 2, 3, undefined, 1, 2, 3, undefined, undefined],
        [1, 2, 3, undefined, 1, 2, 3, undefined, 4],
      ]
    }
  }

  preload() {
    this.load.image("tiles", "../assets/tilesets/tileset.png");
    this.load.tilemapTiledJSON("map" + this.name, "../assets/tilemaps/" + this.name + "/map.json");
    this.load.image('inventory', '../assets/images/inventory/i.png', 270, 180);
    this.load.image('note', '../assets/images/note2.png', 40, 40);
    this.load.image('rest', '../assets/images/rest2.png', 40, 40);

    // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
    // the player animations (walking left, walking right, etc.) in one image. For more info see:
    //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
    // If you don't use an atlas, you can do the same thing with a spritesheet, see:
    //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
    this.load.atlas("atlas", "../assets/atlas/atlas.png", "../assets/atlas/atlas.json");

    this.music.init(parseInt(this.name));
    this.music.preload();
  }

  create() {

    this.music.play();

    const map = this.make.tilemap({ key: "map" + this.name });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
    const worldLayer = map.createStaticLayer("World", tileset, 0, 0);
    const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

    this.inventory = this.add.group();
    this.inventory.add(this.add.sprite(400, 300, 'inventory').setScrollFactor(0));
    let selector = this.add.graphics().setScrollFactor(0);
    selector.lineGradientStyle(2, 0xFFFFFF, 0, 0xFFFFFF, 0, 1);
    selector.strokeRect(110, 40, 65, 65);
    selector.name = "selector";
    this.inventory.add(selector);
    this.inventory.setDepth(-40);

    worldLayer.setCollisionByProperty({ collides: true });

    aboveLayer.setDepth(10);

    const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
    const narratorObjects = map.objects[0].objects.filter(obj => obj.name === "narrator");
    const childsObjects = map.objects[0].objects.filter(obj => obj.name === "child");
    let narrators = this.physics.add.group();
    let childs = this.physics.add.group();

    this.player = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, "atlas", "front")
      .setSize(30, 40)
      .setOffset(0, 24);

    function meetNarator(player, narrator) {
      this.inventoryBag.tunes.push(narrator.data.list.tune);
      this.dialog.init();
      this.dialog.setText(narrator.data.list.dialog, true);
      this.sing.singPart();
      this.music.FadeInOUt();
      narrator.destroy();
    }

    narratorObjects.forEach(narrator => {
      let sprite = map.createFromObjects('Objects', narrator.id, { key: 'narrator' })[0];
      sprite.visible = false;
      narrators.add(sprite);
    });

    this.physics.add.collider(this.player, narrators, meetNarator, null, this);

    function meetChild(player, child) {
      this.sing.setTheLullaby(child.data.list.lullaby.split(';'));
      this.isNearChild = true;
      child.destroy();
    }

    childsObjects.forEach(narrator => {
      let sprite = map.createFromObjects('Objects', narrator.id, { key: 'child' })[0];
      sprite.visible = false;
      childs.add(sprite);
    });

    this.physics.add.collider(this.player, childs, meetChild, null, this);

    this.physics.add.collider(this.player, worldLayer);

    const anims = this.anims;
    anims.create({
      key: "left-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "left-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "right-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "right-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "front-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "front-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "back-walk",
      frames: anims.generateFrameNames("atlas", { prefix: "back-walk.", start: 0, end: 3, zeroPad: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.camera = this.cameras.main;
    this.camera.startFollow(this.player);
    this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.cursors = this.input.keyboard.createCursorKeys();

    // this.add
    //   .text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
    //     font: "18px monospace",
    //     fill: "#000000",
    //     padding: { x: 20, y: 10 },
    //     backgroundColor: "#ffffff"
    //   })
    //   .setScrollFactor(0)
    //   .setDepth(30);

    this.input.keyboard.on("keydown_Q", event => {
      this.showInventory = !this.showInventory;
      this.music.mute();
      //this.sing.singPart();
    })

    this.input.keyboard.on("keydown_T", event => {
      
      if (!this.sing.isSinging() && this.inventoryBag.lullaby.length>0) {
        this.sing.init(buildWalkingNodes(this.inventoryBag));
        this.sing.reset()
        this.sing.sing();
        if (this.isNearChild) {
          this.sing.recognized().then(()=>{
            self.add.sprite(1, 1, 'note').setScrollFactor(0).setDepth(50);
            self.camera.fadeOut(15000);
            self.sing.singLullaby().then(() => goToNextLevel())
          });
        }
      } else {
        this.sing.stop();
      }
    });

    const goToNextLevel = () => {
      this.music.stop();
      this.scene.start('success-'+this.name);
    }

    const buildWalkingNodes = (bag) => {
      if (!bag) return;
      let grouped = groupBy(bag.lullaby, 'from');
      return Object.keys(grouped).map(k => {
        return {
          id: parseInt(k),
          content: bag.tunes[k],
          next: grouped[k].reduce((acc, cur) => {
            let fil = acc.filter(f => f.to === cur.to);
            if (fil.length > 0) {
              fil[0].prob += cur.prob;
            } else {
              acc.push({
                id: parseInt(cur.to),
                prob: cur.prob
              })
            }
            return acc;
          }, [])
        }
      })
    }

    var groupBy = function (xs, key) {
      return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };

    let self = this;
    this.input.keyboard.on("keydown_R", event => {
      self.inventoryBag.page++;
      self.inventoryBag.page %= 4;
    })

    const currentPosition = () => self.inventoryScreen.content[self.inventorySelectorPosition.y][self.inventorySelectorPosition.x];
    this.input.keyboard.on('keydown_W', function (event) {
      if (self.showInventory) {
        if (currentPosition() === self.inventoryScreen.keys.collectedTunes) {
          let pos = self.inventorySelectorPosition.x + self.inventoryMaxX * self.inventorySelectorPosition.y;
          if (pos > 0) {
            self.sing.playSegment(self.inventoryBag.tunes[pos]);
          }
        } else if (self.inventoryScreen.keys.builtTunes.indexOf(currentPosition() >= 0)) {
          const maxPageSize = self.inventoryScreen.content.reduce((a, f) => [...a, ...f])
            .filter(f => self.inventoryScreen.keys.builtTunes.indexOf(f) >= 0).length / 3;
          let cid = (self.inventorySelectorPosition.y - 1) +
            ((self.inventorySelectorPosition.x > 3 ? 1 : 0) * maxPageSize / 2) +
            self.inventoryBag.page * maxPageSize + 1;
          let row = self.inventoryBag.lullaby.filter(i => i.id === cid);
          if (row && row.length > 0) {
            if (currentPosition() === self.inventoryScreen.keys.builtTunesFrom) {
              row[0].from++;
              row[0].from %= self.inventoryBag.tunes.length;
            } else if (currentPosition() === self.inventoryScreen.keys.builtTunesTo) {
              row[0].to++;
              row[0].to %= self.inventoryBag.tunes.length;
            } else if (currentPosition() === self.inventoryScreen.keys.builtTunesProb) {
              row[0].prob++;
              row[0].prob %= 10;
              row[0].prob = row[0].prob === 0 ? 1 : row[0].prob;
            }
          } else {
            self.inventoryBag.lullaby.push({
              id: cid,
              from: 0,
              to: 0,
              prob: 1
            });
          }
        }
      } else {
        self.dialog.stop();
      }
    });

    this.input.keyboard.on('keydown_E', function (event) {
      if (self.showInventory) {
        if (currentPosition() === self.inventoryScreen.keys.collectedTunes) {
          let pos = self.inventorySelectorPosition.x + self.inventoryMaxX * self.inventorySelectorPosition.y;
          if (pos > 0) {
            self.sing.playSegment(self.inventoryBag.tunes[pos]);
          }
        } else if (self.inventoryScreen.keys.builtTunes.indexOf(currentPosition() >= 0)) {
          const maxPageSize = self.inventoryScreen.content.reduce((a, f) => [...a, ...f])
            .filter(f => self.inventoryScreen.keys.builtTunes.indexOf(f) >= 0).length / 3;
          let cid = (self.inventorySelectorPosition.y - 1) +
            ((self.inventorySelectorPosition.x > 3 ? 1 : 0) * maxPageSize / 2) +
            self.inventoryBag.page * maxPageSize + 1;
          let row = self.inventoryBag.lullaby.filter(i => i.id === cid);
          if (row && row.length > 0) {
            if (currentPosition() === self.inventoryScreen.keys.builtTunesFrom) {
              row[0].from--;
              if (row[0].from < 0) row[0].from += self.inventoryBag.tunes.length;
              row[0].from %= self.inventoryBag.tunes.length;
            } else if (currentPosition() === self.inventoryScreen.keys.builtTunesTo) {
              row[0].to--;
              if (row[0].to < 0) row[0].to += self.inventoryBag.tunes.length;
              row[0].to %= self.inventoryBag.tunes.length;
            } else if (currentPosition() === self.inventoryScreen.keys.builtTunesProb) {
              row[0].prob--;
              row[0].prob %= 10;
              row[0].prob = row[0].prob === 0 ? 9 : row[0].prob;
            }
          } else {
            self.inventoryBag.lullaby.push({
              id: cid,
              from: 0,
              to: 0,
              prob: 1
            });
          }
        }
      }
    });

    this.input.keyboard.on("keydown_D", event => {
      self.physics.world.createDebugGraphic();

      narrators.children.entries.forEach(narrator => {
        narrator.visible = !narrator.visible;
      });

      const graphics = self.add
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

  getSelector(f) { return f.getChildren().filter(g => g.name === 'selector')[0]; }
  makeText(text, y, x, self, prob) {
    let t;
    if (!prob) {
      const tints = [0xfff533, 0xff2211, 0x112233, 0xf3f3f3, 0x343434];
      t = self.add.sprite(145, 70, text === ' ,4n' ? 'rest' : 'note').setScrollFactor(0).setDepth(50);
      t.setTint(tints[this.inventoryBag.tunes.indexOf(text)]);
    } else {
      t = self.add.text(16, 16, text, {
        font: "24px monospace",
        fill: "#FFFFFF",
        padding: { x: 120, y: 40 }
      }).setScrollFactor(0).setDepth(50);
    }

    t.x += x * this.inventoryBoxSize;
    t.y += y * this.inventoryBoxSize;
    t.name = 'inventoryItems';
    return t;
  }
  deleteTexts(inventory) {
    inventory.getChildren().filter(f => f.name === 'inventoryItems').map(f => f.destroy());
  }

  update(time, delta) {
    const speed = 175;
    const prevVelocity = this.player.body.velocity.clone();

    this.player.body.setVelocity(0);
    if (this.showInventory) {
      this.player.anims.stop();
      this.inventory.setDepth(40);

      if (JSON.stringify(this.lastInventoryBag) !== JSON.stringify(this.inventoryBag)) {
        this.deleteTexts(this.inventory);
        this.lastInventoryBag = JSON.parse(JSON.stringify(this.inventoryBag));
        for (let i = 0; i < this.inventoryBag.tunes.length; i++)
          this.inventory.add(this.makeText(this.inventoryBag.tunes[i], 0, i, this));

        if (this.inventoryBag.lullaby) {
          this.inventoryBag.lullaby.forEach(l => {
            const maxPageSize = this.inventoryScreen.content.reduce((a, f) => [...a, ...f]).filter(f => this.inventoryScreen.keys.builtTunes.indexOf(f) >= 0).length / 3;

            if (l.id < (this.inventoryBag.page * maxPageSize) || l.id > ((this.inventoryBag.page + 1) * maxPageSize)) return;
            let id = l.id % maxPageSize;
            let y = id % (maxPageSize / 2);
            this.inventory.add(this.makeText(this.inventoryBag.tunes[l.from], y, 0 + (id > (this.inventoryMaxY - 1) ? 4 : 0), this));
            this.inventory.add(this.makeText(l.prob, y, 1 + (id > (this.inventoryMaxY - 1) ? 4 : 0), this, true));
            this.inventory.add(this.makeText(this.inventoryBag.tunes[l.to], y, 2 + (id > (this.inventoryMaxY - 1) ? 4 : 0), this));
          })
        }
      }
      if (this.input.keyboard.checkDown(this.cursors.left, 250)) {
        if (this.inventorySelectorPosition.x > 0) {
          this.inventorySelectorPosition.x--;
          if (this.inventoryScreen.content[this.inventorySelectorPosition.y][this.inventorySelectorPosition.x] === undefined) {
            this.inventorySelectorPosition.x--;
          }
          this.getSelector(this.inventory).x = this.inventorySelectorPosition.x * this.inventoryBoxSize;
        }
      } else if (this.input.keyboard.checkDown(this.cursors.right, 250)) {
        if (this.inventorySelectorPosition.x < this.inventoryMaxX) {
          this.inventorySelectorPosition.x++;
          if (this.inventoryScreen.content[this.inventorySelectorPosition.y][this.inventorySelectorPosition.x] === undefined) {
            this.inventorySelectorPosition.x++;
          }

          this.getSelector(this.inventory).x = this.inventorySelectorPosition.x * this.inventoryBoxSize;
        }
      }

      if (this.input.keyboard.checkDown(this.cursors.up, 250)) {
        if (this.inventorySelectorPosition.y > 0) {
          this.inventorySelectorPosition.y--;
          if (this.inventoryScreen.content[this.inventorySelectorPosition.y][this.inventorySelectorPosition.x] === undefined) {
            this.inventorySelectorPosition.y--;
          }
          this.getSelector(this.inventory).y = this.inventorySelectorPosition.y * this.inventoryBoxSize;
        }
      } else if (this.input.keyboard.checkDown(this.cursors.down, 250)) {
        if (this.inventorySelectorPosition.y < this.inventoryMaxY - 1) {
          this.inventorySelectorPosition.y++;
          if (this.inventoryScreen.content[this.inventorySelectorPosition.y][this.inventorySelectorPosition.x] === undefined) {
            this.inventorySelectorPosition.y++;
          }
          this.getSelector(this.inventory).y = this.inventorySelectorPosition.y * this.inventoryBoxSize;
        }
      }
    } else {
      //this.inventorySelectorPosition = { x: 0, y: 0 };
      this.inventory.setDepth(-40);

      if (this.cursors.left.isDown) {
        this.player.body.setVelocityX(-speed);
      } else if (this.cursors.right.isDown) {
        this.player.body.setVelocityX(speed);
      }

      if (this.cursors.up.isDown) {
        this.player.body.setVelocityY(-speed);
      } else if (this.cursors.down.isDown) {
        this.player.body.setVelocityY(speed);
      }

      this.player.body.velocity.normalize().scale(speed);

      if (this.cursors.left.isDown) {
        this.player.anims.play("left-walk", true);
      } else if (this.cursors.right.isDown) {
        this.player.anims.play("right-walk", true);
      } else if (this.cursors.up.isDown) {
        this.player.anims.play("back-walk", true);
      } else if (this.cursors.down.isDown) {
        this.player.anims.play("front-walk", true);
      } else {
        this.player.anims.stop();

        if (prevVelocity.x < 0) this.player.setTexture("atlas", "left");
        else if (prevVelocity.x > 0) this.player.setTexture("atlas", "right");
        else if (prevVelocity.y < 0) this.player.setTexture("atlas", "back");
        else if (prevVelocity.y > 0) this.player.setTexture("atlas", "front");
      }
    }
  }
}
