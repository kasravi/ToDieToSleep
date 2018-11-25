class Success extends Phaser.Scene {

  constructor(name) {
    super();
    Phaser.Scene.call(this, { key: 'success-' + name });
    this.name = name;

  }

  preload() {
    this.load.image("yemen", "../assets/images/yemen.png");
    this.music.preload('vole');
  }

  create() {
    this.music.play();

    this.add.image(300, 300, 'yemen');

    let self = this;

    setTimeout(() => first(), 1000);

    setTimeout(() => goToNextLevel(), this.music.getLength() * 1000);

    this.input.keyboard.on("keydown_W", event => {
      goToNextLevel();
    })

    const first = () => {
      self.dialog.init();
      self.dialog.setText("Now the baby is sleeping...", true);
    };

    const goToNextLevel = () => {
      this.music.stop();
      this.scene.start(parseInt(this.name) + 1 + '');
    };
  }




}



