
var IntroScene = new Intro();
var Level1 = new SceneBuilder("1");
var Level1Success = new Success("1");
var Level2 = new SceneBuilder("2");
var Level2Success = new Success("2");

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
    scene: [ IntroScene, Level1, Level1Success, Level2, Level2Success]
  };
  
  const game = new Phaser.Game(config);

  