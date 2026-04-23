let weeds = [];
let bubbles = [];
let popSound;
let soundEnabled = false; // 音效開關，預設關閉
let webFrame; // 用來存放 iframe 元素

function preload() {
  popSound = loadSound('pop.mp3');
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('pointer-events', 'none'); // 讓滑鼠事件穿透 Canvas，以便操作後方網頁
  cnv.style('z-index', '1'); // Canvas 設為上層

  webFrame = createElement('iframe');
  webFrame.position(0, 0);
  webFrame.size(windowWidth, windowHeight);
  webFrame.attribute('src', 'https://www.et.tku.edu.tw');
  webFrame.style('border', 'none');
  webFrame.style('z-index', '-1'); // iframe 設為下層背景

  let colors = ['#729ea1', '#b5bd89', '#dfbe99', '#ec9192', '#db5375'];

  // 產生 70 條水草的屬性
  for (let i = 0; i < 70; i++) {
    weeds.push({
      x: random(0, 1),             // 位置 (0~1)
      h: random(0.2, 0.45),        // 高度 (20%~45%)
      thickness: random(30, 40),   // 粗細
      col: random(colors),         // 顏色
      swayFreq: random(0.005, 0.02), // 搖晃頻率
      offset: random(1000)         // 噪聲偏移 (讓每條形狀不同)
    });
  }
}

function draw() {
  clear(); // 清除畫布，確保透明背景不殘留
  background(227, 242, 253, 255 * 0.3); // 背景顏色 #e3f2fd，透明度 0.3
  blendMode(BLEND);

  // --- 氣泡邏輯 ---
  if (random() < 0.2) { // 每一幀有 20% 機率產生新氣泡
    bubbles.push(new Bubble());
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isFinished()) {
      bubbles.splice(i, 1); // 移除已破掉的氣泡
    }
  }

  noFill();

  for (let weed of weeds) {
    let c = color(weed.col);
    c.setAlpha(120); // 設定透明度 (0-255)，120 約為 50% 透明
    stroke(c);
    strokeWeight(weed.thickness);

    let startX = weed.x * width;
    let weedHeight = height * weed.h;

    beginShape();
    curveVertex(startX, height);
    for (let y = height; y > height - weedHeight; y -= 20) {
      let progress = map(y, height, height - weedHeight, 0, 1);
      let sway = map(noise(y * 0.02 + weed.offset, frameCount * weed.swayFreq), 0, 1, -60, 60);
      curveVertex(startX + sway * progress, y);
    }
    let topY = height - weedHeight;
    let topSway = map(noise(topY * 0.02 + weed.offset, frameCount * weed.swayFreq), 0, 1, -60, 60);
    curveVertex(startX + topSway, topY);
    curveVertex(startX + topSway, topY);
    endShape();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (webFrame) {
    webFrame.size(windowWidth, windowHeight);
  }
}

function mousePressed() {
  if (mouseButton === LEFT) {
    soundEnabled = !soundEnabled; // 切換開關
    if (soundEnabled) {
      userStartAudio(); // 確保瀏覽器音訊環境已啟動
    }
  }
}

class Bubble {
  constructor() {
    this.x = random(width);
    this.y = height + 10;
    this.size = random(15, 30);
    this.speed = random(1, 3);
    // 設定氣泡上升多少距離後會破掉 (視窗高度的 20% ~ 80%)
    this.popHeight = height - random(height * 0.2, height * 0.8);
    this.popped = false;
    this.popTimer = 0; // 用來控制破掉動畫的時間
  }

  update() {
    if (!this.popped) {
      this.y -= this.speed;
      // 讓氣泡有點左右搖晃
      this.x += sin(frameCount * 0.05 + this.y * 0.01) * 0.5;
      
      if (this.y < this.popHeight) {
        this.popped = true;
        if (soundEnabled) {
          popSound.play(); // 播放音效
        }
      }
    } else {
      this.popTimer++;
    }
  }

  display() {
    if (!this.popped) {
      noStroke();
      fill(255, 127); // 白色，透明度 0.5 (127/255)
      circle(this.x, this.y, this.size);
      
      // 左上角亮點
      fill(255, 204); // 白色，透明度 0.8 (204/255)
      circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
    } else {
      // 破掉的效果：產生一個變大且變淡的圓圈
      noFill();
      stroke(255, map(this.popTimer, 0, 10, 255, 0)); // 隨時間變淡
      strokeWeight(2);
      circle(this.x, this.y, this.size + this.popTimer * 2);
    }
  }

  isFinished() {
    // 當破掉動畫播放完畢 (10幀) 後標記為結束
    return this.popped && this.popTimer > 10;
  }
}
