let stars = [];
let trees = [];
let sideTrees = [];
let meteors = [];
let paused = false;
let intensitySlider;
let meteorSlider;
let pauseButton;
let pauseIcon;
let nextMeteorFrame = 90;
let terrainSeed = 43017;
let lakeLine = 0;

const palette = [
  { r: 82, g: 255, b: 176 },
  { r: 105, g: 230, b: 255 },
  { r: 212, g: 108, b: 255 },
  { r: 154, g: 255, b: 128 },
];

function setup() {
  const holder = document.getElementById("sketch-holder");
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(holder);
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  colorMode(RGB, 255, 255, 255, 255);
  noiseDetail(4, 0.52);

  intensitySlider = select("#intensity");
  meteorSlider = select("#meteorRate");
  pauseButton = select("#pauseBtn");
  pauseIcon = select("#pauseIcon");
  pauseButton.mousePressed(togglePause);

  rebuildScene();
}

function draw() {
  if (paused) {
    return;
  }

  const t = frameCount * 0.008;
  drawNightSky(t);
  drawStars(t);
  drawAurora(t, Number(intensitySlider.value()));
  drawMeteors();
  maybeSpawnMeteor(Number(meteorSlider.value()));
  drawCloudBand(t);
  drawLake();
  drawForest();
  drawCanoe();
  drawSideTrees();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rebuildScene();
}

function keyPressed() {
  if (key === " ") {
    togglePause();
  }
  if (key === "r" || key === "R") {
    terrainSeed = floor(random(100000));
    rebuildScene();
  }
}

function togglePause() {
  paused = !paused;
  pauseIcon.html(paused ? ">" : "||");
  pauseButton.attribute("aria-label", paused ? "Resume animation" : "Pause animation");
  if (!paused) {
    loop();
  }
}

function rebuildScene() {
  randomSeed(terrainSeed);
  noiseSeed(terrainSeed);
  stars = [];
  trees = [];
  sideTrees = [];
  meteors = [];
  lakeLine = height * 0.76;

  const starCount = floor(map(width * height, 280000, 1800000, 120, 430, true));
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.04, height * 0.72),
      size: random(0.6, 2.1),
      phase: random(TWO_PI),
      twinkle: random(0.15, 0.85),
      warmth: random(),
    });
  }

  let x = -30;
  while (x < width + 40) {
    const base = getTreelineY(x) + random(-6, height * 0.035);
    const heightRamp = constrain(map(x, 0, width, 0, 1), 0, 1);
    trees.push({
      x,
      base,
      h: random(height * lerp(0.075, 0.14, heightRamp), height * lerp(0.16, 0.31, heightRamp)),
      w: random(15, lerp(32, 50, heightRamp)),
      lean: random(-0.13, 0.13),
      tiers: floor(random(5, 10)),
      branchiness: random(0.68, lerp(1.05, 1.38, heightRamp)),
    });
    x += random(7, 16);
  }

  for (let i = 0; i < 7; i++) {
    sideTrees.push({
      x: width + random(-80, 45),
      base: height * random(0.58, 0.96),
      h: random(height * 0.23, height * 0.55),
      w: random(42, 86),
      lean: random(-0.36, -0.12),
      tiers: floor(random(7, 13)),
      branchiness: random(0.9, 1.6),
    });
  }
}

function drawNightSky(t) {
  const ctx = drawingContext;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#000107");
  gradient.addColorStop(0.34, "#101229");
  gradient.addColorStop(0.62, "#362545");
  gradient.addColorStop(0.86, "#142c31");
  gradient.addColorStop(1, "#030507");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  noStroke();
  for (let i = 0; i < 28; i++) {
    const y = map(i, 0, 27, height * 0.06, height * 0.82);
    const drift = noise(i * 0.15, t * 0.2) * width;
    fill(72, 76, 104, 3.5);
    ellipse(drift, y, width * randomStable(i, 0.18, 0.5), height * 0.08);
  }
}

function drawStars(t) {
  blendMode(SCREEN);
  noStroke();
  for (const s of stars) {
    const flicker = 0.55 + 0.45 * sin(t * 3.2 + s.phase);
    const alpha = 105 + 150 * flicker * s.twinkle;
    const blue = lerp(230, 255, s.warmth);
    fill(215, 226, blue, alpha);
    circle(s.x, s.y, s.size);

    if (s.size > 1.55 && flicker > 0.82) {
      stroke(220, 240, 255, alpha * 0.42);
      strokeWeight(0.5);
      line(s.x - s.size * 2.5, s.y, s.x + s.size * 2.5, s.y);
      line(s.x, s.y - s.size * 2.5, s.x, s.y + s.size * 2.5);
      noStroke();
    }
  }
  blendMode(BLEND);
}

function drawAurora(t, strength) {
  blendMode(ADD);
  const horizon = height * 0.86;
  const topLimit = height * 0.16;

  for (let layer = 0; layer < 4; layer++) {
    const c = palette[layer % palette.length];
    const layerOffset = layer * 910.37;
    const baseY = height * (0.55 + layer * 0.035);
    const amplitude = height * (0.07 + layer * 0.022) * strength;
    const step = 9 - layer;

    for (let x = -30; x <= width + 30; x += step) {
      const nx = x * 0.0025;
      const lift = noise(nx + layerOffset, t * 0.35) * amplitude;
      const wave = sin(x * 0.011 + t * (1.4 + layer * 0.22) + layer) * amplitude * 0.46;
      const ribbonY = constrain(baseY - lift + wave, topLimit, horizon);
      const columnNoise = noise(x * 0.008 + layerOffset, t * 0.95);
      const pulse = pow(max(0, sin(t * 2.2 + x * 0.018 + layer)), 2.0);
      const columnAlpha = (7 + 34 * columnNoise + 30 * pulse) * strength;
      const columnHeight = (horizon - ribbonY) * (0.68 + 0.32 * noise(x * 0.006, t + layer));

      stroke(c.r, c.g, c.b, columnAlpha);
      strokeWeight(1.2 + 2.4 * columnNoise);
      line(x, ribbonY, x + sin(t + x * 0.02) * 16, ribbonY + columnHeight);

      if (columnNoise > 0.58) {
        stroke(255, 245, 226, columnAlpha * 0.23);
        strokeWeight(0.65);
        line(x + 2, ribbonY - 8, x + 7, ribbonY + columnHeight * 0.58);
      }
    }

    noFill();
    for (let ribbon = 0; ribbon < 8; ribbon++) {
      const a = (16 - ribbon * 1.5) * strength;
      stroke(c.r, c.g, c.b, a);
      strokeWeight(18 - ribbon * 1.75);
      beginShape();
      for (let x = -80; x <= width + 80; x += 18) {
        const curl = sin(x * 0.012 + t * (1.8 + layer * 0.22) + ribbon * 0.76) * amplitude * 0.34;
        const n = noise(x * 0.002 + ribbon * 5.7, t * 0.38 + layer * 2.1);
        const y = baseY - n * amplitude * 1.45 + curl + ribbon * 12;
        curveVertex(x, constrain(y, topLimit, horizon + 30));
      }
      endShape();
    }
  }

  for (let i = 0; i < 7; i++) {
    const cx = width * noise(i * 22.8, t * 0.12);
    const cy = height * (0.36 + 0.24 * noise(i * 13.2 + 4, t * 0.16));
    const spin = t * (0.7 + i * 0.08);
    const c = palette[i % palette.length];
    noFill();
    stroke(c.r, c.g, c.b, 10 * strength);
    strokeWeight(2.3);
    beginShape();
    for (let a = 0; a < TWO_PI * 1.4; a += 0.2) {
      const r = 12 + a * 18 + 26 * noise(i, a, t * 0.4);
      const x = cx + cos(a + spin) * r;
      const y = cy + sin(a + spin * 0.74) * r * 0.32;
      curveVertex(x, y);
    }
    endShape();
  }

  blendMode(BLEND);
}

function drawMeteors() {
  blendMode(ADD);
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.life++;
    m.x += m.vx;
    m.y += m.vy;
    const fade = 1 - m.life / m.maxLife;
    const tailX = m.x - m.vx * m.tail;
    const tailY = m.y - m.vy * m.tail;

    strokeWeight(m.weight);
    stroke(200, 235, 255, 235 * fade);
    line(m.x, m.y, tailX, tailY);
    strokeWeight(m.weight * 2.9);
    stroke(116, 203, 255, 42 * fade);
    line(m.x, m.y, tailX, tailY);

    if (m.life > m.maxLife || m.x > width + 120 || m.y > height * 0.84) {
      meteors.splice(i, 1);
    }
  }
  blendMode(BLEND);
}

function maybeSpawnMeteor(rate) {
  if (frameCount < nextMeteorFrame) {
    return;
  }
  if (random() < 0.018 * rate) {
    meteors.push({
      x: random(-80, width * 0.72),
      y: random(height * 0.08, height * 0.38),
      vx: random(8, 15),
      vy: random(3.8, 8.5),
      tail: random(8, 16),
      life: 0,
      maxLife: random(28, 48),
      weight: random(1, 2.2),
    });
    nextMeteorFrame = frameCount + floor(random(65, 220) / max(0.25, rate));
  } else {
    nextMeteorFrame = frameCount + floor(random(20, 70));
  }
}

function drawCloudBand(t) {
  noFill();
  for (let band = 0; band < 10; band++) {
    const yBase = height * (0.76 + band * 0.012);
    stroke(8, 15, 22, 34 - band * 2);
    strokeWeight(9 + band * 1.2);
    beginShape();
    for (let x = -60; x <= width + 60; x += 22) {
      const y = yBase + sin(x * 0.015 + band + t * 0.28) * 9 + noise(x * 0.006, band, t * 0.2) * 22;
      curveVertex(x, y);
    }
    endShape();
  }
}

function drawForest() {
  noStroke();
  fill(0, 1, 3, 248);
  beginShape();
  vertex(0, lakeLine + 44);
  for (let x = 0; x <= width; x += 28) {
    vertex(x, getTreelineY(x));
  }
  vertex(width, lakeLine + 44);
  endShape(CLOSE);

  for (const tree of trees) {
    drawPine(tree, 235);
  }

  drawShorelineCap();
}

function drawLake() {
  const ctx = drawingContext;
  const gradient = ctx.createLinearGradient(0, lakeLine, 0, height);
  gradient.addColorStop(0, "rgba(8, 22, 29, 0.96)");
  gradient.addColorStop(0.46, "rgba(7, 13, 24, 0.98)");
  gradient.addColorStop(1, "rgba(1, 3, 7, 1)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, lakeLine, width, height - lakeLine);

  noFill();
  for (let i = 0; i < 16; i++) {
    const y = lakeLine + 14 + i * ((height - lakeLine - 18) / 16);
    stroke(124, 168, 178, map(i, 0, 15, 13, 3));
    strokeWeight(0.7);
    beginShape();
    for (let x = -30; x <= width + 30; x += 70) {
      const offset = sin(x * 0.015 + i * 0.9) * 4 + randomStable(i * 31 + floor(x), -2, 2);
      curveVertex(x, y + offset);
    }
    endShape();
  }

  noStroke();
  fill(0, 1, 3, 232);
  beginShape();
  vertex(0, lakeLine + 30);
  for (let x = 0; x <= width; x += 26) {
    const bank = lakeLine + 7 + sin(x * 0.02) * 4 + noise(x * 0.01, 90.4) * 12;
    vertex(x, bank);
  }
  vertex(width, lakeLine + 46);
  vertex(0, lakeLine + 46);
  endShape(CLOSE);
}

function drawShorelineCap() {
  noStroke();
  fill(0, 1, 3, 246);
  beginShape();
  vertex(0, lakeLine + 28);
  for (let x = 0; x <= width; x += 22) {
    const y = lakeLine + 4 + sin(x * 0.021) * 4 + noise(x * 0.011, 117.5) * 10;
    vertex(x, y);
  }
  vertex(width, lakeLine + 34);
  vertex(0, lakeLine + 34);
  endShape(CLOSE);
}

function drawCanoe() {
  const cx = width * 0.5;
  const cy = height * 0.868;
  const canoeW = constrain(width * 0.18, 116, 230);
  const canoeH = constrain(height * 0.043, 22, 38);

  push();
  translate(cx, cy);
  noStroke();
  fill(36, 4, 7, 38);
  ellipse(0, canoeH * 0.96, canoeW * 0.68, canoeH * 0.22);

  fill(58, 6, 10, 242);
  beginShape();
  vertex(-canoeW * 0.5, -canoeH * 0.34);
  bezierVertex(-canoeW * 0.37, canoeH * 0.74, canoeW * 0.37, canoeH * 0.74, canoeW * 0.5, -canoeH * 0.34);
  bezierVertex(canoeW * 0.2, canoeH * 0.04, -canoeW * 0.2, canoeH * 0.04, -canoeW * 0.5, -canoeH * 0.34);
  endShape(CLOSE);

  fill(14, 3, 5, 238);
  arc(0, -canoeH * 0.12, canoeW * 0.76, canoeH * 0.48, 0, PI, CHORD);
  stroke(91, 18, 20, 150);
  strokeWeight(max(1, canoeH * 0.06));
  line(-canoeW * 0.42, -canoeH * 0.24, canoeW * 0.42, -canoeH * 0.24);
  noStroke();

  drawPerson(-canoeW * 0.17, -canoeH * 0.53, canoeH * 0.86);
  drawPerson(canoeW * 0.17, -canoeH * 0.51, canoeH * 0.82);
  pop();
}

function drawPerson(x, y, scaleBase) {
  push();
  translate(x, y);
  noStroke();
  fill(0, 1, 3, 248);
  ellipse(0, 0, scaleBase * 0.52, scaleBase * 1.28);
  pop();
}

function drawSideTrees() {
  for (const tree of sideTrees) {
    drawPine(tree, 250);
  }
}

function getTreelineY(x) {
  const slope = map(x, 0, width, height * 0.825, height * 0.695);
  const softRidge = sin(x * 0.012) * height * 0.014 - noise(x * 0.007, 14.7) * height * 0.035;
  return constrain(slope + softRidge, height * 0.62, lakeLine - 12);
}

function drawPine(tree, alpha) {
  push();
  translate(tree.x, tree.base);
  rotate(tree.lean * 0.12);
  stroke(0, 1, 3, alpha);
  strokeWeight(max(2, tree.w * 0.08));
  line(0, 0, tree.lean * tree.h, -tree.h);
  noStroke();
  fill(0, 1, 3, alpha);

  for (let i = 0; i < tree.tiers; i++) {
    const p = i / tree.tiers;
    const y = -tree.h * (0.1 + p * 0.86);
    const tierW = tree.w * (1 - p * 0.82) * tree.branchiness;
    const tierH = tree.h * 0.14 * (1 - p * 0.38);
    const leanX = tree.lean * -y;
    triangle(leanX, y - tierH, leanX - tierW, y + tierH * 0.62, leanX + tierW, y + tierH * 0.7);

    if (i % 2 === 0) {
      triangle(leanX - tierW * 0.18, y, leanX - tierW * 0.88, y + tierH * 0.38, leanX - tierW * 0.08, y + tierH * 0.78);
      triangle(leanX + tierW * 0.16, y, leanX + tierW * 0.86, y + tierH * 0.44, leanX + tierW * 0.06, y + tierH * 0.74);
    }
  }
  pop();
}

function randomStable(i, minValue, maxValue) {
  const value = fract(sin(i * 12.9898 + terrainSeed * 0.0001) * 43758.5453);
  return lerp(minValue, maxValue, value);
}

function fract(value) {
  return value - floor(value);
}
