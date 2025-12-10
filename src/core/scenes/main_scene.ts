class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'main_scene' });
  }

  create(): void {
    console.log('MainScene create');
    this.add.text(20, 20, 'text');
  }

  update(time: number, delta: number): void {
    // Этот метод вызывается каждый кадр
    // console.log('Tick', time, delta);
  }
}

export default MainScene;
