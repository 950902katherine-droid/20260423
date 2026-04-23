let capture;
let pg;
let bubbles = [];
let btn;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 初始化攝影機擷取
  capture = createCapture(VIDEO);
  // 隱藏預設產生的 HTML 影片元件
  capture.hide();

  // 產生擷圖按鈕
  btn = createButton('擷取畫面 (JPG)');
  updateButtonPosition();
  btn.mousePressed(saveSnapshot);
}

function draw() {
  background('#e7c6ff');

  // 當攝影機準備好且寬度大於 0 時，初始化 pg 繪圖層
  if (capture.width > 0 && !pg) {
    pg = createGraphics(capture.width, capture.height);
  }

  // 計算顯示大小（畫布寬高的 60%）
  let videoW = width * 0.6;
  let videoH = height * 0.6;
  // 計算置中座標
  let x = (width - videoW) / 2;
  let y = (height - videoH) / 2;

  if (pg) {
    // 在 pg 繪圖層上繪製內容（範例：在中間畫一個圓與文字）
    pg.clear(); 

    // 產生新泡泡
    if (frameCount % 5 === 0) {
      bubbles.push({
        x: random(pg.width),
        y: pg.height + 20,
        r: random(5, 15),
        speed: random(1, 3),
        offset: random(TWO_PI)
      });
    }

    // 更新並繪製泡泡
    pg.noFill();
    pg.stroke(255, 180);
    pg.strokeWeight(1.5);

    for (let i = bubbles.length - 1; i >= 0; i--) {
      let b = bubbles[i];
      b.y -= b.speed;
      b.x += sin(frameCount * 0.05 + b.offset) * 0.5; // 左右搖擺
      
      pg.circle(b.x, b.y, b.r);

      // 移除超出畫面的泡泡
      if (b.y < -20) {
        bubbles.splice(i, 1);
      }
    }

    // 繪製影像與疊加層
    push();
    translate(x + videoW, y); // 移至右上角準備翻轉
    scale(-1, 1);             // 水平翻轉

    // 製作馬賽克黑白效果
    let unitSize = 10; // 將單位尺寸改小，使格子更細緻
    let numCols = capture.width / unitSize;
    let numRows = capture.height / unitSize;
    let blockW = videoW / numCols;
    let blockH = videoH / numRows;

    for (let iy = 0; iy < numRows; iy++) {
      for (let ix = 0; ix < numCols; ix++) {
        // 取得每個單位的色彩值 (取該單位左上角的像素作為代表)
        let c = capture.get(ix * unitSize, iy * unitSize);
        let gray = (c[0] + c[1] + c[2]) / 3; // 依照需求計算 (R+G+B)/3
        fill(gray);
        noStroke();
        rect(ix * blockW, iy * blockH, blockW, blockH);
      }
    }

    image(pg, 0, 0, videoW, videoH);      // 上層：Graphics 內容
    pop();
  }
}

function saveSnapshot() {
  // 重新計算目前的擷取範圍（與畫面上顯示的 60% 區域一致）
  let videoW = width * 0.6;
  let videoH = height * 0.6;
  let x = (width - videoW) / 2;
  let y = (height - videoH) / 2;

  // 從畫布中擷取該區塊
  let img = get(x, y, videoW, videoH);
  // 儲存為 jpg 圖檔
  img.save('my_snapshot', 'jpg');
}

function updateButtonPosition() {
  // 將按鈕放置在視訊畫面正下方
  let videoH = height * 0.6;
  let y = (height - videoH) / 2;
  btn.position(width / 2 - btn.width / 2, y + videoH + 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateButtonPosition();
}
