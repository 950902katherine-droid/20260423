let cols, rows;
let gridSize = 60;
let fruits = [], bombs = [], foundItems = [], particles = [], electricCells = [];
let gameState = "START"; 
let currentLevel = 1;
let score = 0;
let highScore = 0;
let timer = 30;
let lastTime = 0;

let fruitEmojis = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍍', '🍒', '🍑'];
let currentTargets = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 設定字體，monospace 更有科技感
  textFont('monospace'); 
  highScore = localStorage.getItem('fruitRadarHighScore') || 0;
  initStartParticles();
  setupLevel(1);
}

function initStartParticles() {
  particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle('float'));
  }
}

function setupLevel(level) {
  currentLevel = level;
  cols = floor(width / gridSize);
  rows = floor(height / gridSize);
  timer = 30;
  fruits = [];
  bombs = [];
  foundItems = [];
  electricCells = [];
  
  if (level === 1) {
    currentTargets = [random(fruitEmojis)];
    placeItems(5, 5);
  } else if (level === 2) {
    let f1 = random(fruitEmojis);
    let f2 = random(fruitEmojis);
    while(f1 === f2) f2 = random(fruitEmojis);
    currentTargets = [f1, f2];
    placeItems(10, 5);
  } else if (level === 3) {
    currentTargets = [random(fruitEmojis)];
    placeItems(5, 5);
    while(electricCells.length < 8) {
      let p = { i: floor(random(cols)), j: floor(random(rows)) };
      if (!electricCells.some(e => e.i === p.i && e.j === p.j)) electricCells.push(p);
    }
  }
}

function placeItems(fCount, bCount) {
  while (fruits.length < fCount) {
    let p = { i: floor(random(cols)), j: floor(random(rows)), type: random(currentTargets) };
    if (!isPosInList(p, fruits)) fruits.push(p);
  }
  while (bombs.length < bCount) {
    let p = { i: floor(random(cols)), j: floor(random(rows)) };
    if (!isPosInList(p, fruits) && !isPosInList(p, bombs)) bombs.push(p);
  }
}

function draw() {
  background(10); // 深色背景
  if (gameState === "START") drawStartScreen();
  else if (gameState === "PLAY") playGame();
  else if (gameState === "TRANSITION") drawTransitionScreen();
  else if (gameState === "END") drawEndScreen();

  // 最後繪製全螢幕掃描線特效
  drawScanlines();
}

// --- 雷達風格文字繪製函式 ---
// baseColor: 核心文字顏色, glowColor: 光暈顏色, center: 是否置中
function drawRadarText(txt, x, y, size, baseColor, glowColor, center = false) {
  push();
  textSize(size);
  if (center) {
    textAlign(CENTER, CENTER);
  } else {
    textAlign(LEFT, TOP);
  }
  
  // 計算呼吸燈強度的 Alpha 值
  let glowAlpha = map(sin(frameCount * 0.1), -1, 1, 30, 100);
  
  // 繪製光暈 (稍微偏移並加上 Alpha)
  fill(red(glowColor), green(glowColor), blue(glowColor), glowAlpha);
  text(txt, x + 1, y + 1);
  text(txt, x - 1, y - 1);
  
  // 繪製核心文字 (確保清晰)
  fill(baseColor);
  text(txt, x, y);
  pop();
}

function drawScanlines() {
  stroke(255, 255, 255, 15); // 極淡的白色
  strokeWeight(1);
  for (let y = 0; y < height; y += 4) {
    line(0, y, width, y);
  }
}

function playGame() {
  noCursor();
  if (millis() - lastTime >= 1000) { timer--; lastTime = millis(); }
  
  let currentTargetCount = fruits.length;
  let foundTargetCount = foundItems.filter(f => f.itemType === 'fruit').length;
  
  if (timer <= 0 || foundTargetCount === currentTargetCount) {
    if (currentLevel < 3) gameState = "TRANSITION";
    else handleGameEnd();
  }

  drawGrid();
  drawUI();
}

function drawGrid() {
  let foundTargetCount = foundItems.filter(f => f.itemType === 'fruit').length;
  let unfoundFruits = fruits.filter(f => !isPosInFound(f));

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * gridSize;
      let y = j * gridSize;
      
      let d = dist(mouseX, mouseY, x + gridSize/2, y + gridSize/2);
      let brightness = map(d, 0, 200, 220, 30);
      brightness = constrain(brightness, 30, 220);
      
      stroke(0, 255, 255, 30); // 青色網格
      fill(brightness * 0.05, brightness * 0.2, brightness * 0.3, 150);

      if (currentLevel === 3 && electricCells.some(e => e.i === i && e.j === j)) {
        fill(255, 255, 0, 80 + sin(frameCount * 0.1) * 40); 
      }
      
      rect(x, y, gridSize, gridSize);

      if (timer <= 15 && gameState === "PLAY") {
        let showCount = (foundTargetCount === 2) ? 2 : (foundTargetCount <= 1) ? 3 : 0;
        for (let k = 0; k < min(unfoundFruits.length, showCount); k++) {
          if (unfoundFruits[k].i === i && unfoundFruits[k].j === j) {
            noStroke();
            fill(0, 255, 255, sin(frameCount * 0.1) * 80 + 80);
            ellipse(x + gridSize/2, y + gridSize/2, gridSize * 0.4);
          }
        }
      }

      let f = getFoundItem({i, j});
      if (f) {
        textAlign(CENTER, CENTER); textSize(30);
        text(f.type === 'fruit' ? f.emoji : '💣', x + gridSize/2, y + gridSize/2);
      }
    }
  }
  fill(0, 255, 255); noStroke(); circle(mouseX, mouseY, 8);
}

function drawUI() {
  let greenGlow = color(0, 255, 255);
  let white = color(255);
  let red = color(255, 50, 50);

  // 左上角 UI
  drawRadarText(`LV: ${currentLevel}  SCORE: ${score}`, 20, 20, 22, white, greenGlow);
  
  let foundTargetCount = foundItems.filter(f => f.itemType === 'fruit').length;
  let remain = fruits.length - foundTargetCount;
  drawRadarText(`目標: ${currentTargets.join(' ')} 剩餘: ${remain}`, 20, 55, 18, white, greenGlow);
  
  // 正上方時間 (低於10秒變紅)
  let timeColor = timer < 10 ? red : white;
  let timeGlow = timer < 10 ? red : greenGlow;
  drawRadarText(`${timer}s`, width/2, 25, 32, timeColor, timeGlow, true);
}

function drawStartScreen() {
  for (let p of particles) { p.update(); p.display(); }
  fill(0, 0, 0, 200); rect(0, 0, width, height);
  
  let greenGlow = color(0, 255, 255);
  let white = color(255);

  drawRadarText("水果雷達：全速偵測", width/2, height/2 - 40, 50, white, greenGlow, true);
  drawRadarText("找到水果得10分，避開炸彈與電流！", width/2, height/2 + 30, 20, white, greenGlow, true);
  drawBigBtn("啟動第一關");
}

function drawTransitionScreen() {
  cursor(); drawGrid(); 
  for (let f of fruits) {
    textSize(30); textAlign(CENTER, CENTER);
    text(f.type, f.i * gridSize + gridSize/2, f.j * gridSize + gridSize/2);
  }
  fill(0, 0, 0, 200); rect(0, 0, width, height);
  
  let greenGlow = color(0, 255, 255);
  let white = color(255);
  
  drawRadarText(`Level ${currentLevel} 結束`, width/2, height/2 - 50, 40, white, greenGlow, true);
  drawBigBtn(`進入 Level ${currentLevel + 1}`);
}

function drawEndScreen() {
  cursor(); drawGrid();
  for (let f of fruits) {
    textSize(30); textAlign(CENTER, CENTER);
    text(f.type, f.i * gridSize + gridSize/2, f.j * gridSize + gridSize/2);
  }
  for (let p of particles) { p.update(); p.display(); }
  fill(0, 0, 0, 200); rect(0, 0, width, height);
  
  let greenGlow = color(0, 255, 255);
  let white = color(255);
  let red = color(255, 50, 50);

  if (score > highScore) {
    drawRadarText("🎉 破紀錄！太強了 🎉", width/2, height/2 - 80, 50, color(0, 255, 150), greenGlow, true);
  } else {
    drawRadarText("加油！再試一次", width/2, height/2 - 80, 50, red, red, true);
  }
  
  drawRadarText(`總積分: ${score} | 最高: ${max(score, highScore)}`, width/2, height/2 + 20, 28, white, greenGlow, true);
  drawBigBtn("重新開始");
}

function handleGameEnd() {
  if (score > highScore) {
    localStorage.setItem('fruitRadarHighScore', score);
    particles = [];
    for(let i=0; i<60; i++) particles.push(new Particle('confetti'));
  } else {
    createSplats();
  }
  gameState = "END";
}

function drawBigBtn(txt) {
  let over = dist(mouseX, mouseY, width/2, height/2 + 120) < 60;
  let btnColor = over ? color(0, 255, 255) : color(255);
  let glowColor = color(0, 255, 255);
  
  drawRadarText(txt, width/2, height/2 + 120, 30, btnColor, glowColor, true);
}

class Particle {
  constructor(mode) {
    this.mode = mode;
    this.x = random(width); this.y = random(height);
    this.vx = random(-1, 1); this.vy = random(-1, 1);
    this.emoji = random(fruitEmojis);
    this.size = random(15, 30);
    this.col = color(random(255), random(255), random(255));
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
  display() {
    if (this.mode === 'confetti') {
      fill(this.col); rect(this.x, this.y, 10, 10);
    } else if (this.mode === 'splat') {
      fill(200, 0, 0, 150); ellipse(this.x, this.y, 40, 30);
    } else if (this.mode === 'float') {
      textSize(this.size); textAlign(CENTER, CENTER);
      text(this.emoji, this.x, this.y);
    }
  }
}

function createSplats() {
  particles = [];
  for (let i = 0; i < 30; i++) {
    let p = new Particle('splat');
    p.x = random(width); p.y = random(height); particles.push(p);
  }
}

function mousePressed() {
  if (gameState === "PLAY") {
    let i = floor(mouseX / gridSize), j = floor(mouseY / gridSize);
    if (currentLevel === 3 && electricCells.some(e => e.i === i && e.j === j)) {
      score -= 2; return;
    }
    if (!isPosInFound({i, j})) {
      if (isPosInList({i, j}, fruits)) {
        let item = fruits.find(f => f.i === i && f.j === j);
        score += 10;
        foundItems.push({i, j, type: 'fruit', emoji: item.type, itemType: 'fruit'});
      } else if (isPosInList({i, j}, bombs)) {
        score -= 5;
        foundItems.push({i, j, type: 'bomb', itemType: 'bomb'});
      }
    }
  } else if (gameState === "TRANSITION") {
    if (dist(mouseX, mouseY, width/2, height/2 + 120) < 100) {
      setupLevel(currentLevel + 1); gameState = "PLAY";
    }
  } else if (gameState === "END") {
    if (dist(mouseX, mouseY, width/2, height/2 + 120) < 100) {
      score = 0; highScore = localStorage.getItem('fruitRadarHighScore') || 0;
      initStartParticles(); setupLevel(1); gameState = "PLAY";
    }
  } else {
    gameState = "PLAY"; setupLevel(1);
  }
}

function isPosInList(p, list) { return list.some(item => item.i === p.i && item.j === p.j); }
function isPosInFound(p) { return foundItems.some(item => item.i === p.i && item.j === p.j); }
function getFoundItem(p) { return foundItems.find(item => item.i === p.i && item.j === p.j); }