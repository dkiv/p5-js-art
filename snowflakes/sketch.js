let snowflakes = [];
let topColor;
let bottomColor;

function setup() {
  const holder = document.getElementById("sketch-holder");
  const cnv = createCanvas(410, 730);
  cnv.parent(holder);
  angleMode(RADIANS);
  frameRate(60);

  topColor = color(10, 20, 60);
  bottomColor = color(5, 5, 20);

  initSnowflakes();
}

function draw() {
  drawBackgroundGradient();

  for (const flake of snowflakes) {
    flake.update();
    flake.display();
  }
}

function initSnowflakes() {
  snowflakes = [];

  for (let i = 0; i < 55; i++) snowflakes.push(new Snowflake(2));
  for (let i = 0; i < 35; i++) snowflakes.push(new Snowflake(1));
  for (let i = 0; i < 18; i++) snowflakes.push(new Snowflake(0));
}

class Snowflake {
  constructor(layer) {
    this.layer = layer;

    if (layer === 0) {
      this.size = random(70, 130);
      this.vy = random(1.2, 2.0);
      this.rotationSpeed = random(-0.004, 0.004);
      this.wobbleAmp = random(8, 16);
      this.blurAmount = 0;
    } else if (layer === 1) {
      this.size = random(45, 90);
      this.vy = random(0.7, 1.3);
      this.rotationSpeed = random(-0.003, 0.003);
      this.wobbleAmp = random(5, 10);
      this.blurAmount = 1;
    } else {
      this.size = random(30, 70);
      this.vy = random(0.3, 0.8);
      this.rotationSpeed = random(-0.002, 0.002);
      this.wobbleAmp = random(3, 8);
      this.blurAmount = 3;
    }

    this.spawn();
    this.gfx = createSnowflakeGraphic(this.size);
  }

  spawn() {
    const margin = 180;

    this.x = random(-margin, width + margin);
    this.y = random(-height, height);
    this.baseX = this.x;

    this.rotation = random(TWO_PI);
    this.wobblePhase = random(TWO_PI);
  }

  resetToTop() {
    const margin = 180;

    this.y = random(-height * 0.5, -this.size);
    this.x = random(-margin, width + margin);
    this.baseX = this.x;

    this.rotation = random(TWO_PI);
    this.wobblePhase = random(TWO_PI);

    this.gfx = createSnowflakeGraphic(this.size);
  }

  update() {
    this.y += this.vy;
    this.wobblePhase += 0.01;

    const wind = map(noise(this.y * 0.002, frameCount * 0.002), 0, 1, -0.9, 0.9);

    this.baseX += wind * this.vy * 0.45;
    this.x = this.baseX + sin(this.wobblePhase) * this.wobbleAmp;
    this.rotation += this.rotationSpeed;

    const margin = 240;
    if (this.y > height + this.size || this.x < -margin || this.x > width + margin) {
      this.resetToTop();
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);

    drawingContext.filter = `blur(${this.blurAmount}px)`;
    imageMode(CENTER);
    image(this.gfx, 0, 0);
    drawingContext.filter = "none";

    pop();
  }
}

function createSnowflakeGraphic(size) {
  const pg = createGraphics(size, size);
  pg.angleMode(RADIANS);
  pg.clear();

  pg.push();
  pg.translate(size / 2, size / 2);

  pg.noStroke();
  pg.fill(255, 255, 255, 30);
  pg.ellipse(0, 0, size * 0.28, size * 0.28);

  pg.stroke(225, 240, 255, 230);
  pg.noFill();
  pg.strokeWeight(max(0.7, size * 0.012));

  const arms = random([6, 8]);
  const params = {
    baseLen: random(size * 0.18, size * 0.28),
    depth: int(random(4, 6)),
    maxAngle: random(0.45, 0.85),
    lengthDecay: random(0.55, 0.7),
    branchesPerNode: random([2, 3]),
  };
  const flakeSeed = floor(random(1000000000));

  for (let i = 0; i < arms; i++) {
    pg.push();
    pg.rotate((TWO_PI / arms) * i);
    randomSeed(flakeSeed);
    drawBranchPG(pg, params.baseLen, params.depth, params);
    pg.pop();
  }

  pg.pop();
  return pg;
}

function drawBranchPG(pg, len, depth, params) {
  if (depth <= 0 || len < 3) return;

  pg.line(0, 0, 0, -len);
  pg.translate(0, -len);

  for (let i = 0; i < params.branchesPerNode; i++) {
    pg.push();
    const a = random(-params.maxAngle, params.maxAngle);
    pg.rotate(a);
    drawBranchPG(pg, len * params.lengthDecay, depth - 1, params);
    pg.pop();
  }
}

function drawBackgroundGradient() {
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const c = lerpColor(topColor, bottomColor, t);
    stroke(c);
    line(0, y, width, y);
  }

  noFill();
  for (let r = max(width, height) * 0.45; r < max(width, height); r += 14) {
    const alpha = map(r, max(width, height) * 0.45, max(width, height), 0, 100);
    stroke(0, 0, 20, alpha);
    ellipse(width / 2, height / 2, r, r);
  }
}
