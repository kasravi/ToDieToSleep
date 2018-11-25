var Level1 = new SceneBuilder("1");
var Level2 = new SceneBuilder("2");

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
    plugins: {
        scene: [
            { key: 'dialog', plugin: Dialog, mapping: 'dialog' },
            { key: 'sing', plugin: Sing, mapping: 'sing' },
            { key: 'music', plugin: MusicUtility, mapping: 'music' }
        ]
    },
    scene: [ Level1, Level2]
  };
  
  const game = new Phaser.Game(config);

  