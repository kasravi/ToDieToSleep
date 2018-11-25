class Intro extends Phaser.Scene {

  constructor() {
    super();

  }

  preload() {
    this.load.image("yemen", "../assets/images/yemen.png");
    this.load.image("yemen2", "../assets/images/yemen2.png");
    this.music.preload('intro');
  }

  create() {
    this.music.play();

      this.add.image(300, 300, 'yemen');

      let self = this;

      setTimeout(() => first(), 4000);

      setTimeout(() => second(), 8000);

      setTimeout(() => third(), 9000);

      setTimeout(() => fourth(), 12000);

      setTimeout(() => goToFirstLevel(), this.music.getLength()*1000);

      this.input.keyboard.on("keydown_W",event => {
        goToFirstLevel();
      })

      const first = () => {
        self.dialog.init();
        self.dialog.setText("Once there was a war", true);
      };

      const second = () => {
        self.add.image(300, 300, 'yemen2');
        self.dialog.closeWindow();
      };

      const third = () => {
        self.dialog.init();
        self.dialog.setText("And war is never fair", true);
      };

      const fourth = () => {
        self.dialog.closeWindow();
      };

      const goToFirstLevel = () => {
        this.music.stop();
        this.scene.start('1');
      };
  }




}



