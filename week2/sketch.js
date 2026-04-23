let topPoints = [];
let bottomPoints = [];
let gameState = "START"; // START, PLAYING, LEVEL_WIN, FINAL_WIN, LOSE
let level = 0; // 0: Level 1, 1: Level 2, 2: Level 3
let fireworks = [];
let lightningTimer = 0;
let obstacles = []; // 儲存障礙物資訊

function setup() {
  createCanvas(windowWidth, windowHeight);
  generatePath();
}

function draw() {
  background('#343a40'); // 改為深灰色背景

  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAYING") {
    drawGame();
    checkCollision();
  } else if (gameState === "LEVEL_WIN") {
    drawEndScreen("過關成功！", false);
  } else if (gameState === "FINAL_WIN") {
    drawEndScreen("傳奇誕生！", true);
    updateFireworks();
  } else if (gameState === "LOSE") {
    drawEndScreen("電力中斷...", false);
    if (level === 2) drawLightning();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath();
}

function generatePath() {
  topPoints = [];
  bottomPoints = [];
  obstacles = [];
  let numPoints = 8 + level * 4; // 第一關 8 點，隨關卡增加
  let padding = 60; // 左右留白，確保起終點圓圈完整露出
  let pathWidth = width - 2 * padding;
  let xStep = pathWidth / (numPoints - 1);
  
  // 難度計算：隨等級寬度縮減
  let baseMin = max(40, 60 - level * 10);
  let baseMax = max(60, 100 - level * 15);

  for (let i = 0; i < numPoints; i++) {
    let x = padding + i * xStep;
    let yTop, gap;
    if (i === 0 || i === numPoints - 1) {
      // 起點與終點間距加大至 100，確保圓點完整露出
      yTop = height / 2 - 50;
      gap = 100;
    } else {
      // 確保通道寬度足以容納操作
      yTop = random(height * 0.2, height * 0.7);
      gap = random(baseMin, baseMax);
    }

    topPoints.push({x: x, y: yTop});
    bottomPoints.push({x: x, y: yTop + gap});
  }

  // 生成障礙物 (第二關與第三關)
  if (level >= 1) {
    let obstacleCount = level === 1 ? 3 : 4; // 第二關3個，第三關4個
    for (let i = 0; i < obstacleCount; i++) {
      // 避開起點與終點，從中間的點選取位置
      let idx = floor(random(2, numPoints - 2));
      let x = topPoints[idx].x;
      let tY = topPoints[idx].y;
      let bY = bottomPoints[idx].y;
      
      let obsSize = random(15, 25);
      let obsY = (tY + bY) / 2;
      
      obstacles.push({
        x: x,
        y: obsY,
        size: obsSize,
        topY: tY,
        botY: bY,
        speed: level === 2 ? random(0.5, 1.5) : 0, // 第三關才有速度
        dir: random() > 0.5 ? 1 : -1,
        // 紀錄對應的頂點索引，方便移動時參考邊界
        idx: idx
      });
    }
  }
}

function drawGame() {
  let numPoints = topPoints.length;
  // 繪製路徑填色 (方便玩家辨識路徑範圍)
  fill(50, 60, 70);
  noStroke();
  beginShape();
  // 上邊界曲線
  curveVertex(topPoints[0].x, topPoints[0].y); // 控制點
  for (let p of topPoints) curveVertex(p.x, p.y);
  curveVertex(topPoints[numPoints - 1].x, topPoints[numPoints - 1].y); // 控制點
  
  // 連接到下邊界
  vertex(bottomPoints[numPoints - 1].x, bottomPoints[numPoints - 1].y);
  
  // 下邊界曲線 (反向)
  curveVertex(bottomPoints[numPoints - 1].x, bottomPoints[numPoints - 1].y);
  for (let i = numPoints - 1; i >= 0; i--) curveVertex(bottomPoints[i].x, bottomPoints[i].y);
  curveVertex(bottomPoints[0].x, bottomPoints[0].y);
  endShape(CLOSE);

  // 繪製起點與終點的亮點
  noStroke();
  // 螢光紅起點 (左)
  fill('#FF003F');
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = '#FF003F';
  ellipse(topPoints[0].x, (topPoints[0].y + bottomPoints[0].y) / 2, 30, 30);
  
  // 螢光綠終點 (右)
  fill('#39FF14');
  drawingContext.shadowColor = '#39FF14';
  ellipse(topPoints[numPoints-1].x, (topPoints[numPoints-1].y + bottomPoints[numPoints-1].y) / 2, 30, 30);

  // 繪製藍色電流線條 (加粗且有微顫動特效)
  stroke('#00f2ff');
  strokeWeight(6);
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = '#00f2ff';
  noFill();
  
  // 上方電流邊界
  beginShape();
  curveVertex(topPoints[0].x, topPoints[0].y);
  for (let p of topPoints) curveVertex(p.x, p.y + random(-1.5, 1.5));
  curveVertex(topPoints[numPoints - 1].x, topPoints[numPoints - 1].y);
  endShape();

  // 下方電流邊界
  beginShape();
  curveVertex(bottomPoints[0].x, bottomPoints[0].y);
  for (let p of bottomPoints) curveVertex(p.x, p.y + random(-1.5, 1.5));
  curveVertex(bottomPoints[numPoints - 1].x, bottomPoints[numPoints - 1].y);
  endShape();

  // 繪製與更新障礙物
  for (let obs of obstacles) {
    // 第三關移動邏輯
    if (level === 2) {
      obs.y += obs.speed * obs.dir;
      // 碰到上下邊界反彈 (考慮到隨機抖動，稍微縮減碰撞範圍)
      if (obs.y - obs.size/2 < topPoints[obs.idx].y + 5 || obs.y + obs.size/2 > bottomPoints[obs.idx].y - 5) {
        obs.dir *= -1;
      }
    }

    // 繪製障礙物
    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = '#00f2ff';
    stroke('#00f2ff');
    strokeWeight(3);
    fill(0);
    ellipse(obs.x, obs.y, obs.size, obs.size);
    // 障礙物中心加個小閃電
    line(obs.x - 3, obs.y - 3, obs.x + 3, obs.y + 3);
    pop();
  }

  drawingContext.shadowBlur = 0; // 重置發光效果

  // 提示滑鼠位置 (小紅點)
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 5, 5);
  // 左上角遊戲資訊 UI
  drawElectricText("這是第 " + (level + 1) + " 關", 20, 20, 28, LEFT, TOP);
  drawElectricText("通過了 " + level + " 關", 20, 55, 28, LEFT, TOP);
}

function checkCollision() {
  let numPoints = topPoints.length;
  // 成功條件：移到最右邊
  if (mouseX >= topPoints[numPoints - 1].x) {
    if (level < 2) {
      gameState = "LEVEL_WIN";
    } else {
      gameState = "FINAL_WIN";
      createFireworks();
    }
    return;
  }

  // 如果滑鼠還沒進到起點區域，不判定失敗
  if (mouseX < topPoints[0].x) return;

  // 判斷滑鼠所在的線段
  let segment = -1;
  for (let i = 0; i < topPoints.length - 1; i++) {
    if (mouseX >= topPoints[i].x && mouseX <= topPoints[i+1].x) {
      segment = i;
      break;
    }
  }
  if (segment !== -1) {
    let x1 = topPoints[segment].x;
    let x2 = topPoints[segment+1].x;
    let t = (mouseX - x1) / (x2 - x1);

    // 使用 curvePoint 計算曲線上的精確 Y 值，確保碰撞判定符合曲線視覺
    let i = segment;
    let currentTopY = curvePoint(
      topPoints[max(0, i-1)].y, topPoints[i].y, 
      topPoints[i+1].y, topPoints[min(numPoints-1, i+2)].y, t);
    let currentBottomY = curvePoint(
      bottomPoints[max(0, i-1)].y, bottomPoints[i].y, 
      bottomPoints[i+1].y, bottomPoints[min(numPoints-1, i+2)].y, t);

    if (mouseY < currentTopY || mouseY > currentBottomY) {
      gameState = "LOSE";
    }
  }

  // 障礙物碰撞檢查
  for (let obs of obstacles) {
    let d = dist(mouseX, mouseY, obs.x, obs.y);
    if (d < obs.size / 2 + 3) { // 加上滑鼠判定半徑
      gameState = "LOSE";
    }
  }
}

function drawElectricText(txt, x, y, size, alignX = CENTER, alignY = CENTER) {
  push();
  textAlign(alignX, alignY);
  textSize(size);
  // 電流發光特效
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = '#00f2ff';
  stroke('#00f2ff'); // 醒目的藍色外框
  strokeWeight(3);
  fill(0); // 字體主體為黑色
  // 加入隨機顫動模擬電流感
  text(txt, x + random(-1.5, 1.5), y + random(-1.5, 1.5));
  pop();
}

function drawStartScreen() {
  // 將按鈕移至左側起點位置 (原本紅點處)
  let startP = topPoints[0];
  let btnW = 100;
  let btnH = 40;
  let btnX = startP.x - btnW / 2;
  let btnY = height / 2 - btnH / 2;

  drawElectricText("電流急急棒", width / 2, height / 2 - 80, 48);
  drawElectricText("第 " + (level + 1) + " 關", width / 2, height / 2 - 20, 24);

  fill('#39FF14');
  rect(btnX, btnY, btnW, btnH, 5);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("點我開始", btnX + btnW / 2, btnY + btnH / 2);
}

function drawEndScreen(msg, isFinal) {
  fill(52, 58, 64, 200);
  rect(0, 0, width, height);
  
  drawElectricText(msg, width / 2, height / 2 - 100, 60);
  
  let subMsg = "";
  let btnTxt = "";
  if (gameState === "LEVEL_WIN") {
    subMsg = "手感不錯！準備好迎接更強的電流了嗎？";
    btnTxt = "繼續下一關";
  } else if (gameState === "FINAL_WIN") {
    subMsg = "致賀：你已成為真正的閃電主宰！";
    btnTxt = "重新挑戰";
  } else {
    subMsg = (level === 2) ? "致賀：差一點就通關了，別被雷聲嚇到！" : "沒關係，電力回充中...";
    btnTxt = "再試一次";
  }
  
  drawElectricText(subMsg, width / 2, height / 2 - 20, 24);

  // 繪製功能按鈕
  let bW = 160, bH = 50;
  let bX = width/2 - bW/2, bY = height/2 + 50;
  fill('#00f2ff');
  rect(bX, bY, bW, bH, 5);
  fill(0);
  textSize(20);
  text(btnTxt, width/2, bY + bH/2);
}

function createFireworks() {
  for (let i = 0; i < 50; i++) {
    fireworks.push({
      x: width / 2, y: height / 2,
      vx: random(-5, 5), vy: random(-8, 2),
      life: 255, col: color(random(255), 255, random(255))
    });
  }
}

function updateFireworks() {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let p = fireworks[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.2; p.life -= 4;
    noStroke();
    fill(red(p.col), green(p.col), blue(p.col), p.life);
    ellipse(p.x, p.y, 5, 5);
    if (p.life <= 0) fireworks.splice(i, 1);
  }
  if (frameCount % 20 === 0) createFireworks();
}

function drawLightning() {
  if (frameCount % 15 === 0) {
    stroke(255, 255, 200, 200);
    strokeWeight(4);
    let lx = random(width), ly = 0;
    for (let i = 0; i < 10; i++) {
      let nextX = lx + random(-50, 50);
      let nextY = ly + random(20, 80);
      line(lx, ly, nextX, nextY);
      lx = nextX; ly = nextY;
    }
  }
}

function mousePressed() {
  if (gameState === "START") {
    let startP = topPoints[0];
    let btnW = 100;
    let btnH = 40;
    let btnX = startP.x - btnW / 2;
    let btnY = (startP.y + bottomPoints[0].y) / 2 - btnH / 2;
    
    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      gameState = "PLAYING";
    }
  } else if (gameState === "LEVEL_WIN") {
    let bW = 160, bH = 50;
    if (mouseX > width/2-bW/2 && mouseX < width/2+bW/2 && mouseY > height/2+50 && mouseY < height/2+100) {
      level++;
      generatePath();
      gameState = "START";
    }
  } else if (gameState === "FINAL_WIN" || gameState === "LOSE") {
    let bW = 160, bH = 50;
    if (mouseX > width/2-bW/2 && mouseX < width/2+bW/2 && mouseY > height/2+50 && mouseY < height/2+100) {
      if (gameState === "FINAL_WIN") level = 0; 
      generatePath();
      gameState = "START";
    }
  }
}
