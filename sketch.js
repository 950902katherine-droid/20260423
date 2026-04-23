let nodes = [];
let routePoints = [];
let bgTexture;
let treasureImg; // 可選：放置寶箱圖片
let decorations = []; // 存放置裝飾物（金幣、珠寶）

function setup() {
  let canvasHolder = select('#canvas-holder');
  // 使用 clientWidth 確保在 Flex 佈局下精確獲取寬高
  let canvas = createCanvas(canvasHolder.elt.clientWidth, canvasHolder.elt.clientHeight);
  canvas.parent('canvas-holder');

  // 初始化座標與節點
  initMapElements();

  // 設定返回地圖的按鈕：移除翻轉狀態，讓地圖翻回來
  select('#back-btn').mousePressed(() => {
    select('#flip-card').removeClass('is-flipped');
    select('#scene').removeClass('is-flipped');
  });

  // 初始化並生成地圖紋理，避免每一幀重新計算導致閃爍
  bgTexture = createGraphics(width, height);
  generateMapTexture(bgTexture);

  // 當視窗大小改變時，重新調整畫布大小
  windowResized = function() {
    resizeCanvas(canvasHolder.elt.offsetWidth, canvasHolder.elt.offsetHeight);
    bgTexture.resizeCanvas(width, height);
    generateMapTexture(bgTexture);
    initMapElements(); 
  };
}

function initMapElements() {
  let w = width;
  let h = height;
  
  // 清空舊數據
  routePoints = [];
  nodes = [];
  decorations = []; // 清空裝飾物

  // 設定「時光記憶圖譜」路線：由底部蜿蜒向上
  routePoints.push(createVector(w * 0.50, h * 0.85)); // 第一週起點
  routePoints.push(createVector(w * 0.25, h * 0.65)); // 第二週
  routePoints.push(createVector(w * 0.70, h * 0.50)); // 第三週
  routePoints.push(createVector(w * 0.35, h * 0.30)); // 第四週
  routePoints.push(createVector(w * 0.85, h * 0.15)); // 終點：寶藏箱

  // 初始化節點物件
  nodes.push(new TimeNode(routePoints[0].x, routePoints[0].y, "第一週", "week1/index.html"));
  nodes.push(new TimeNode(routePoints[1].x, routePoints[1].y, "第二週", "week2/index.html"));
  nodes.push(new TimeNode(routePoints[2].x, routePoints[2].y, "第三週", "week3/index.html"));
  nodes.push(new TimeNode(routePoints[3].x, routePoints[3].y, "第四週", "week4/index.html"));

  // 生成隨機裝飾物（金幣與珠寶）
  for (let i = 0; i < 15; i++) {
    decorations.push({
      x: random(w * 0.1, w * 0.9),
      y: random(h * 0.1, h * 0.9),
      type: random(['gold', 'ruby', 'emerald']),
      size: random(10, 20),
      rot: random(TWO_PI),
      hoverScale: 1 // 新增懸停縮放屬性
    });
  }
}

function draw() {
  drawMapBackground();
  
  updateDecorations(); // 更新裝飾物狀態
  drawDecorations(); // 繪製裝飾物
  // 1. 利用 Vertex & For 繪製時間軸路線
  drawRoute();

  let isHoveringNode = false;
  // 2. 更新並顯示節點
  for (let node of nodes) {
    node.update();
    node.display();
    if (node.isHovered()) {
      isHoveringNode = true;
    }
  }

  // 如果滑鼠懸停在節點上，將游標改為手型
  if (isHoveringNode) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }

  // 繪製終點寶箱標示
  drawTreasureMark(routePoints[routePoints.length - 1]);
}

function updateDecorations() {
  for (let d of decorations) {
    // 檢查滑鼠是否懸停在裝飾物上
    let isHovered = dist(mouseX, mouseY, d.x, d.y) < d.size * 0.8; // 稍微縮小感應範圍
    if (isHovered) {
      d.hoverScale = lerp(d.hoverScale, 1.3, 0.1); // 放大到 1.3 倍
    } else {
      d.hoverScale = lerp(d.hoverScale, 1, 0.1); // 恢復到原始大小
    }
  }
}

function drawDecorations() {
  noStroke();
  for (let d of decorations) {
    push();
    translate(d.x, d.y);
    scale(d.hoverScale); // 應用懸停縮放
    rotate(d.rot);
    if (d.type === 'gold') {
      fill(212, 175, 55, 180); // 金色
      ellipse(0, 0, d.size, d.size);
      stroke(184, 134, 11, 150);
      strokeWeight(1);
      noFill();
      ellipse(0, 0, d.size * 0.7, d.size * 0.7); // 錢幣內圈
    } else if (d.type === 'ruby') {
      fill(180, 0, 0, 150); // 紅寶石
      triangle(0, -d.size / 2, -d.size / 2, d.size / 2, d.size / 2, d.size / 2);
    } else { // emerald
      fill(0, 128, 0, 150); // 綠寶石
      rectMode(CENTER);
      rect(0, 0, d.size * 0.8, d.size * 0.8);
    }
    pop();
  }
}

function drawMapBackground() {
  // 清除畫布，CSS 處理底色，我們繪製預生成的紋理
  clear();
  if (bgTexture) {
    image(bgTexture, 0, 0);
  }
}

function generateMapTexture(pg) {
  pg.clear();
  
  // 1. 咖啡漬 (Coffee Stains) - 使用不規則形狀
  for (let i = 0; i < 6; i++) {
    pg.fill(101, 67, 33, random(15, 35));
    pg.noStroke();
    let cx = random(pg.width);
    let cy = random(pg.height);
    pg.beginShape();
    for (let a = 0; a < TWO_PI; a += 0.2) {
      let r = random(40, 150) * (0.7 + noise(cx, cy, a) * 0.5);
      pg.vertex(cx + cos(a) * r, cy + sin(a) * r);
    }
    pg.endShape(CLOSE);
  }

  // 2. 老舊摺痕 (Creases)
  pg.strokeWeight(1);
  for (let i = 0; i < 3; i++) {
    let x = random(pg.width);
    pg.stroke(0, 15); // 摺痕陰影
    pg.line(x, 0, x + random(-30, 30), pg.height);
    pg.stroke(255, 10); // 摺痕亮部
    pg.line(x + 1, 0, x + 1 + random(-30, 30), pg.height);
  }

  // 3. 紙張裂痕與細微顆粒 (Cracks & Grain)
  pg.stroke(60, 30, 10, 60);
  for (let i = 0; i < 12; i++) {
    let x = random(pg.width);
    let y = random(pg.height);
    pg.noFill();
    pg.beginShape();
    for (let j = 0; j < 6; j++) {
      pg.vertex(x, y);
      x += random(-15, 15);
      y += random(-15, 15);
    }
    pg.endShape();
  }
  
  // 增加紙張粗糙感
  pg.stroke(0, 8);
  for (let i = 0; i < 1500; i++) {
    pg.point(random(pg.width), random(pg.height));
  }
}

function drawRoute() {
  stroke(101, 67, 33, 180); 
  strokeWeight(8); // 棕色粗線主要設計
  noFill();
  beginShape();
  // 繪製曲線必須要有起始與結束的控制點，否則第一點與最後一點會消失
  if (routePoints.length > 0) {
    curveVertex(routePoints[0].x, routePoints[0].y); 
    for (let p of routePoints) {
      curveVertex(p.x, p.y);
    }
    curveVertex(routePoints[routePoints.length - 1].x, routePoints[routePoints.length - 1].y);
  }
  endShape();
}

function drawTreasureMark(p) {
  push();
  translate(p.x, p.y);
  // 繪製寶箱圖示
  fill(139, 69, 19);
  stroke(60, 30, 10);
  strokeWeight(3);
  rectMode(CENTER);
  rect(0, 0, 50, 35, 5); // 寶箱主體
  line(-25, 0, 25, 0);   // 蓋子接縫
  fill(255, 215, 0);     // 金色鎖頭
  noStroke();
  circle(0, 0, 10);
  fill(93, 64, 55);
  textAlign(CENTER);
  textFont('Special Elite'); // 使用復古字體
  textSize(18); // 調整大小
  text("期中寶藏", 0, -25);
  pop();
}

function mouseClicked() {
  for (let node of nodes) {
    if (node.isHovered()) {
      node.onClicked();
    }
  }
}

// --- Class 定義 ---
class TimeNode {
  constructor(x, y, label, url) {
    this.pos = createVector(x, y);
    this.label = label;
    this.url = url;
    this.size = 20;
    this.hoverAnim = 0;
    this.bounce = 0;
    this._sparkleTimer = 0; // 新增閃爍計時器
  }

  update() {
    if (this.isHovered()) {
      // 懸停時的跳動邏輯
      this.bounce = sin(frameCount * 0.2) * 5;
      this.hoverAnim = lerp(this.hoverAnim, 1, 0.1);
    } else {
      this.bounce = 0;
      this.hoverAnim = lerp(this.hoverAnim, 0, 0.1);
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y + this.bounce);

    // 鼠標移到節點上方的黃色光暈特效
    if (this.hoverAnim > 0) {
      drawingContext.shadowBlur = 25 * this.hoverAnim;
      drawingContext.shadowColor = 'rgba(255, 215, 0, ' + this.hoverAnim + ')';
      // 底層發光環
      noStroke();
      fill(255, 255, 0, 50 * this.hoverAnim);
      ellipse(0, 0, this.size * 2);
    }
    
    // 繪製「開花」效果 (隨 hoverAnim 放大)
    if (this.hoverAnim > 0.01) {
      fill(255, 182, 193, 200 * this.hoverAnim); // 粉色花瓣
      noStroke();
      for (let i = 0; i < 5; i++) {
        rotate(TWO_PI / 5);
        ellipse(15 * this.hoverAnim, 0, 20 * this.hoverAnim, 10 * this.hoverAnim);
      }
    }

    // 重置發光（避免影響核心節點）
    drawingContext.shadowBlur = 0;

    // 核心節點
    fill(121, 85, 72);
    stroke(255);
    strokeWeight(2);
    circle(0, 0, this.size);
    
    // 文字標籤
    fill(46, 26, 20); // 更深的墨水色
    noStroke();
    textFont('Special Elite'); // 使用復古字體
    textSize(18); // 放大字體，更易讀
    textAlign(CENTER);
    textStyle(BOLD);
    // 位置下移一點 (從 15 移到 40)
    text(this.label, 0, 40);
    pop();
  }

  isHovered() {
    return dist(mouseX, mouseY, this.pos.x, this.pos.y) < this.size;
  }

  onClicked() {
    this._sparkleTimer = 30; // 點擊時觸發閃爍效果
    // 3. Iframe 整合：切換對應作品
    select('#project-frame').attribute('src', this.url);
    // 觸發翻轉動畫：將卡片翻到背面
    select('#flip-card').addClass('is-flipped');
    // 讓背景容器進入全螢幕狀態（移除邊距）
    select('#scene').addClass('is-flipped');
  }
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}