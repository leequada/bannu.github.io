import * as THREE from './three.module.min.js';

const START_DATE_ISO = '2026-04-25T00:00:00+07:00';

// 9 distinct 3D formations (including 4 badass new geometric & sculptural transforms!)
const FORMATIONS = [
  { classes: ['cube'], zDesktop: 0, mobileDiv: 480, motion: 'spin' },
  { classes: ['cube', 'expanded'], zDesktop: -25, mobileDiv: 520, motion: 'spin' },
  { classes: ['ring'], zDesktop: -230, mobileDiv: 680, motion: 'spin' },
  { classes: ['dodeca'], zDesktop: -150, mobileDiv: 570, motion: 'tumble' },
  { classes: ['helix'], zDesktop: -200, mobileDiv: 640, motion: 'spin' },
  { classes: ['gyro'], zDesktop: -185, mobileDiv: 620, motion: 'tumble' },
  { classes: ['crown'], zDesktop: -210, mobileDiv: 660, motion: 'spin' },
  { classes: ['wings'], zDesktop: -195, mobileDiv: 730, motion: 'sway' },
  { classes: ['heart3d'], zDesktop: -165, mobileDiv: 600, motion: 'sway' } // Final climax before Card!
];

const AUTO_STEP_MS = 4600;

// ============================================================================
// 1. BACKGROUND MP3 MUSIC PLAYER: Boy With Luv (Feat. Halsey)
// ============================================================================
class BgmController {
  constructor(audioEl) {
    this.audio = audioEl;
    this.started = false;
    if (this.audio) {
      this.audio.volume = 0.85;
      this.audio.loop = true;
    }
    this._onInteract = this._onInteract.bind(this);
  }

  init() {
    if (!this.audio) return;
    const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, this._onInteract, { passive: true }));
    this._tryPlay(events);
  }

  _onInteract() {
    const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
    this._tryPlay(events);
  }

  _tryPlay(events) {
    if (!this.audio || this.started) return;
    const p = this.audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        this.started = true;
        events.forEach((ev) => window.removeEventListener(ev, this._onInteract));
      }).catch(() => {
        // Browser requires a direct touch/click gesture first; listeners remain active
      });
    }
  }

  playFireworkSound() {
    // Keep MP3 vocals & melody crystal-clear without synthetic beep interference
    if (!this.started) {
      this._onInteract();
    }
  }
}

// ============================================================================
// 2. THREE.JS COSMIC AURORA, SNOW, 3D HEARTS & MULTI-BURST FIREWORKS
// ============================================================================
class CosmicBackdrop {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.fireworks = [];
    this.hearts = [];
    this.finaleMode = false;
    this.autoFwTimer = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      150
    );
    this.camera.position.set(0, 0, 12);

    this._createGlowSprite();
    this._buildAuroraDome();
    this._buildSnowAndStars();
    this._buildFloating3DHearts();
    this._buildTouchTrail();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  _createGlowSprite() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.38, 'rgba(255,235,250,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    this.sprite = new THREE.CanvasTexture(c);
  }

  _buildAuroraDome() {
    const geo = new THREE.SphereGeometry(75, 40, 28);
    this.auroraUniforms = { uTime: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.auroraUniforms,
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vDir = normalize(wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vDir;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        void main() {
          vec3 d = normalize(vDir);
          float y = d.y * 0.5 + 0.5;
          vec3 base = mix(vec3(0.07, 0.01, 0.14), vec3(0.02, 0.01, 0.08), smoothstep(0.15, 0.9, y));
          float ang = atan(d.z, d.x);
          float n1 = noise(vec2(ang * 3.0 + uTime * 0.12, d.y * 4.0 - uTime * 0.08));
          float n2 = noise(vec2(ang * 4.5 - uTime * 0.15, d.y * 5.2 + uTime * 0.1) + n1);
          float w1 = smoothstep(0.42, 0.85, n1) * exp(-abs(d.y - 0.18) * 2.8);
          float w2 = smoothstep(0.45, 0.88, n2) * exp(-abs(d.y + 0.05) * 3.1);
          vec3 pink = vec3(1.0, 0.18, 0.58);
          vec3 cyan = vec3(0.0, 0.92, 0.82);
          vec3 gold = vec3(1.0, 0.82, 0.32);
          base += pink * w1 * 0.58 + cyan * w2 * 0.52 + gold * (w1 * w2) * 0.95;

          vec2 sg = vec2(ang * 26.0, d.y * 42.0);
          vec2 sid = floor(sg);
          vec2 sl = fract(sg) - 0.5;
          float r = hash(sid);
          if (r > 0.87) {
            float tw = 0.5 + 0.5 * sin(uTime * (3.0 + r * 5.0) + r * 50.0);
            float sb = smoothstep(0.2, 0.0, length(sl)) * tw;
            base += mix(gold, vec3(1.0), fract(r * 9.3)) * sb * 1.15;
          }
          gl_FragColor = vec4(base, 1.0);
        }
      `
    });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  _buildSnowAndStars() {
    const count = 900;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    this.snowSpeed = new Float32Array(count);
    const palette = [
      new THREE.Color(0xffb3e6),
      new THREE.Color(0xffe082),
      new THREE.Color(0xd8b4fe),
      new THREE.Color(0x80ffea)
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
      this.snowSpeed[i] = 0.28 + Math.random() * 0.55;
      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.25,
      map: this.sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.snow = new THREE.Points(geo, mat);
    this.scene.add(this.snow);
  }

  _buildFloating3DHearts() {
    const s = 0.36;
    const shape = new THREE.Shape();
    shape.moveTo(0.25 * s, 0.25 * s);
    shape.bezierCurveTo(0.25 * s, 0.25 * s, 0.20 * s, 0, 0, 0);
    shape.bezierCurveTo(-0.30 * s, 0, -0.30 * s, 0.35 * s, -0.30 * s, 0.35 * s);
    shape.bezierCurveTo(-0.30 * s, 0.55 * s, -0.10 * s, 0.77 * s, 0.25 * s, 0.95 * s);
    shape.bezierCurveTo(0.60 * s, 0.77 * s, 0.80 * s, 0.55 * s, 0.80 * s, 0.35 * s);
    shape.bezierCurveTo(0.80 * s, 0.35 * s, 0.80 * s, 0, 0.50 * s, 0);
    shape.bezierCurveTo(0.35 * s, 0, 0.25 * s, 0.25 * s, 0.25 * s, 0.25 * s);

    const heartGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2
    });
    heartGeo.center();

    const colors = [0xff2a85, 0xffd166, 0xff6ec7, 0x00f5d4, 0xc77dff];
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.75
      });
      const mesh = new THREE.Mesh(heartGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        -2 - Math.random() * 8
      );
      mesh.rotation.z = Math.PI;
      this.hearts.push({
        mesh,
        speedY: 0.4 + Math.random() * 0.65,
        rotSpeed: (Math.random() - 0.5) * 1.8,
        phase: Math.random() * Math.PI * 2
      });
      this.scene.add(mesh);
    }
  }

  _buildTouchTrail() {
    this.trailMax = 200;
    this.trailPos = new Float32Array(this.trailMax * 3);
    this.trailCol = new Float32Array(this.trailMax * 3);
    this.trailLife = new Float32Array(this.trailMax);
    this.trailVel = [];
    this.trailCursor = 0;

    for (let i = 0; i < this.trailMax; i++) {
      this.trailPos[i * 3 + 1] = -999;
      this.trailVel.push(new THREE.Vector3());
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.trailCol, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.36,
      map: this.sprite,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.trail = new THREE.Points(geo, mat);
    this.trail.frustumCulled = false;
    this.scene.add(this.trail);
  }

  spawnSparkleAtScreen(clientX, clientY, count = 3) {
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = -(clientY / window.innerHeight) * 2 + 1;
    const v = new THREE.Vector3(nx, ny, 0.5).unproject(this.camera);
    const dir = v.sub(this.camera.position).normalize();
    const wp = this.camera.position.clone().add(dir.multiplyScalar(9));

    const cols = [0xff2a85, 0xffd166, 0x00f5d4, 0xff70a6, 0xc77dff];
    for (let k = 0; k < count; k++) {
      const i = this.trailCursor;
      this.trailCursor = (this.trailCursor + 1) % this.trailMax;
      this.trailPos[i * 3] = wp.x + (Math.random() - 0.5) * 0.25;
      this.trailPos[i * 3 + 1] = wp.y + (Math.random() - 0.5) * 0.25;
      this.trailPos[i * 3 + 2] = wp.z;
      this.trailVel[i].set((Math.random() - 0.5) * 1.4, (Math.random() - 0.2) * 1.4, 0);
      this.trailLife[i] = 1.0;
      const c = new THREE.Color(cols[Math.floor(Math.random() * cols.length)]);
      this.trailCol[i * 3] = c.r;
      this.trailCol[i * 3 + 1] = c.g;
      this.trailCol[i * 3 + 2] = c.b;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
  }

  launchFirework(originX = null, originY = null, heartShape = true) {
    const count = 165;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels = [];

    const cx = originX !== null ? originX : (Math.random() - 0.5) * 6.8;
    const cy = originY !== null ? originY : 0.8 + Math.random() * 4.2;
    const cz = -1.2 - Math.random() * 2.5;

    const palette = [0xff1e66, 0xffd166, 0x00f5d4, 0xff6ec7, 0x38ff88, 0xc77dff, 0xff9e00];
    const c1 = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
    const c2 = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = cx;
      pos[i * 3 + 1] = cy;
      pos[i * 3 + 2] = cz;

      const v = new THREE.Vector3();
      if (heartShape && i < count * 0.78) {
        const t = (i / (count * 0.78)) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const sp = 0.22 + Math.random() * 0.04;
        v.set(hx * sp, hy * sp, (Math.random() - 0.5) * 1.2);
      } else {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const sp = 2.6 + Math.random() * 2.6;
        v.set(sp * Math.sin(ph) * Math.cos(th), sp * Math.cos(ph), sp * Math.sin(ph) * Math.sin(th));
      }
      vels.push(v);

      const c = i % 2 === 0 ? c1 : c2;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.44,
      map: this.sprite,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.fireworks.push({ pts, vels, age: 0, maxAge: 1.95 });
  }

  launchSalvo() {
    this.launchFirework(0, 2.2, true);
    setTimeout(() => this.launchFirework(-2.4, 3.0, false), 170);
    setTimeout(() => this.launchFirework(2.4, 2.8, true), 340);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;
    this.auroraUniforms.uTime.value = this.elapsed;

    const sp = this.snow.geometry.attributes.position.array;
    for (let i = 0; i < this.snowSpeed.length; i++) {
      sp[i * 3 + 1] += this.snowSpeed[i] * dt;
      sp[i * 3] += Math.sin(this.elapsed * 0.9 + i) * 0.008;
      if (sp[i * 3 + 1] > 12) {
        sp[i * 3 + 1] = -12;
        sp[i * 3] = (Math.random() - 0.5) * 28;
      }
    }
    this.snow.geometry.attributes.position.needsUpdate = true;

    for (const h of this.hearts) {
      h.mesh.position.y += h.speedY * dt;
      h.mesh.rotation.y += h.rotSpeed * dt;
      const pulse = 1 + Math.sin(this.elapsed * 3 + h.phase) * 0.12;
      h.mesh.scale.setScalar(pulse);
      if (h.mesh.position.y > 10) {
        h.mesh.position.y = -10;
        h.mesh.position.x = (Math.random() - 0.5) * 16;
      }
    }

    let dirty = false;
    for (let i = 0; i < this.trailMax; i++) {
      if (this.trailLife[i] > 0) {
        dirty = true;
        this.trailLife[i] -= dt * 1.4;
        if (this.trailLife[i] <= 0) {
          this.trailPos[i * 3 + 1] = -999;
        } else {
          this.trailPos[i * 3] += this.trailVel[i].x * dt;
          this.trailPos[i * 3 + 1] += this.trailVel[i].y * dt;
        }
      }
    }
    if (dirty) this.trail.geometry.attributes.position.needsUpdate = true;

    for (let f = this.fireworks.length - 1; f >= 0; f--) {
      const fw = this.fireworks[f];
      fw.age += dt;
      if (fw.age >= fw.maxAge) {
        this.scene.remove(fw.pts);
        fw.pts.geometry.dispose();
        fw.pts.material.dispose();
        this.fireworks.splice(f, 1);
        continue;
      }
      const arr = fw.pts.geometry.attributes.position.array;
      const drag = Math.pow(0.96, dt * 60);
      for (let k = 0; k < fw.vels.length; k++) {
        fw.vels[k].multiplyScalar(drag);
        fw.vels[k].y -= 1.75 * dt;
        arr[k * 3] += fw.vels[k].x * dt;
        arr[k * 3 + 1] += fw.vels[k].y * dt;
        arr[k * 3 + 2] += fw.vels[k].z * dt;
      }
      fw.pts.geometry.attributes.position.needsUpdate = true;
      fw.pts.material.opacity = Math.max(0, 1 - Math.pow(fw.age / fw.maxAge, 1.5));
    }

    if (this.finaleMode) {
      this.autoFwTimer -= dt;
      if (this.autoFwTimer <= 0) {
        this.launchFirework(null, null, Math.random() > 0.35);
        this.autoFwTimer = 0.75 + Math.random() * 0.65;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================================================
// 3. AUTO-FLOW & MANUAL SHAPE -> FINALE CARD STATE MACHINE
// ============================================================================
const cosmos = new CosmicBackdrop(document.getElementById('cosmos-canvas'));
const music = new BgmController(document.getElementById('bgm-player'));

const shapeEl = document.getElementById('shape');
const stageEl = document.getElementById('stage');
const btnToggleAuto = document.getElementById('btn-toggle-auto');
const btnChangeShape = document.getElementById('btn-change-shape');
const finaleScene = document.getElementById('finale-scene');
const envelopeWrap = document.getElementById('envelope-wrap');
const anniversaryCard = document.getElementById('anniversary-card');
const cardLoveCounter = document.getElementById('card-love-counter');

let currentIdx = 0;
let isAuto = false;
let isCardOpen = false;
let autoTimer = null;
let cardUnfoldTimer1 = null;
let cardUnfoldTimer2 = null;

// Live days counter on the finale card
function updateDaysCounter() {
  const days = Math.max(214, Math.floor((Date.now() - new Date(START_DATE_ISO).getTime()) / 86400000));
  if (cardLoveCounter) {
    cardLoveCounter.textContent = `💖 Tròn 7 Tháng • ${days} Ngày Hạnh Phúc Bên Ánh 💖`;
  }
}
updateDaysCounter();

// Start MP3 playback (or unlock on very first touch/click if browser blocks initial autoplay)
music.init();

// Kinetic 3D Spin, Multi-Axis Tumble & Front-Facing Sway Physics
let rotY = 0;
let rotX = -6;
let spinBoost = 0;
let swayPhase = 0;
let isDragging = false;
let dragX = 0;
let dragY = 0;

// Responsive 3D stage transform so BOTH iPhone portrait & landscape fit cleanly without clipping
function updateStageTransform() {
  const f = FORMATIONS[currentIdx];
  const w = window.innerWidth;
  const h = window.innerHeight;
  let scale = 1.0;
  if (w < 540) {
    scale = Math.min(1.0, Math.max(0.50, w / f.mobileDiv));
  } else if (h < 480) {
    scale = 0.66;
  }
  stageEl.style.transform = `translateZ(${f.zDesktop}px) scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, ${scale.toFixed(3)})`;
}

// Apply 3D Formation + Kinetic Spin Impulse + Fireworks!
function applyFormation(index, withFireworks = true) {
  currentIdx = ((index % FORMATIONS.length) + FORMATIONS.length) % FORMATIONS.length;
  const f = FORMATIONS[currentIdx];

  shapeEl.className = ['backfaces', ...f.classes].join(' ');
  updateStageTransform();

  // Add a badass kinetic spin whoosh during transition!
  if (f.motion === 'sway') {
    // Snap smoothly toward front-facing after a dramatic sweep so Wings & 3D Heart face the viewer
    rotY = ((rotY % 360) + 360) % 360;
    if (rotY > 180) rotY -= 360;
    spinBoost = 0;
    swayPhase = 0;
  } else {
    spinBoost = 4.2;
  }

  if (withFireworks) {
    cosmos.launchSalvo();
    music.playFireworkSound();
  }
}

// Open the 3D Envelope & Automatically Unfold the 7-Month Anniversary Card
function openFinaleCard() {
  clearTimeout(autoTimer);
  clearTimeout(cardUnfoldTimer1);
  clearTimeout(cardUnfoldTimer2);

  isCardOpen = true;
  cosmos.finaleMode = true;
  cosmos.launchSalvo();
  music.playFireworkSound();

  // Reset envelope so it plays the 3D wax-seal + flap opening animation cleanly
  envelopeWrap.classList.remove('hidden', 'opened');
  anniversaryCard.classList.add('hidden');
  finaleScene.classList.remove('hidden');

  cardUnfoldTimer1 = setTimeout(() => {
    envelopeWrap.classList.add('opened');
    cosmos.launchFirework(0, 2.5, true);
  }, 450);

  cardUnfoldTimer2 = setTimeout(() => {
    envelopeWrap.classList.add('hidden');
    anniversaryCard.classList.remove('hidden');
    cosmos.launchSalvo();
    music.playFireworkSound();
  }, 1350);
}

function closeFinaleCard() {
  clearTimeout(cardUnfoldTimer1);
  clearTimeout(cardUnfoldTimer2);
  isCardOpen = false;
  cosmos.finaleMode = false;
  finaleScene.classList.add('hidden');

  // Wrap back to the first formation cleanly
  applyFormation(0, true);
  if (isAuto) {
    scheduleNextAutoStep();
  }
}

function scheduleNextAutoStep() {
  clearTimeout(autoTimer);
  if (!isAuto || isCardOpen) return;

  autoTimer = setTimeout(() => {
    if (!isAuto || isCardOpen) return;
    if (currentIdx < FORMATIONS.length - 1) {
      applyFormation(currentIdx + 1, true);
      scheduleNextAutoStep();
    } else {
      // Reached the end of all formations -> Reveal the 7-Month Anniversary Card!
      openFinaleCard();
    }
  }, AUTO_STEP_MS);
}

// Toggle Auto ON / OFF ("có 1 nút tắt tự động thì nút đổi kiểu sẽ hiện")
btnToggleAuto.addEventListener('click', () => {
  isAuto = !isAuto;
  if (isAuto) {
    btnToggleAuto.textContent = '⏸ Tắt tự động';
    btnChangeShape.classList.add('hidden');
    if (isCardOpen) {
      closeFinaleCard();
    } else {
      scheduleNextAutoStep();
    }
  } else {
    clearTimeout(autoTimer);
    btnToggleAuto.textContent = '▶ Tự động';
    btnChangeShape.classList.remove('hidden');
  }
});

// Manual "Đổi kiểu" ("mỗi lần đổi kiểu là sẽ có pháo hoa , khi đổi đến kiểu cuối mà ấn nữa là ra thiệp")
btnChangeShape.addEventListener('click', () => {
  if (isCardOpen) {
    closeFinaleCard();
    return;
  }
  if (currentIdx < FORMATIONS.length - 1) {
    applyFormation(currentIdx + 1, true);
  } else {
    // At the final style -> pressing "Đổi kiểu" opens the 7-Month Anniversary Card!
    openFinaleCard();
  }
});

document.getElementById('btn-close-finale').addEventListener('click', closeFinaleCard);
finaleScene.addEventListener('click', (e) => {
  if (e.target === finaleScene) closeFinaleCard();
});

function spinTick() {
  if (!isDragging && !isCardOpen) {
    const f = FORMATIONS[currentIdx];
    spinBoost *= 0.94;

    if (f.motion === 'sway') {
      swayPhase += 0.022;
      const targetY = Math.sin(swayPhase) * 26;
      const targetX = Math.cos(swayPhase * 0.7) * 7 - 3;
      rotY += (targetY - rotY) * 0.06;
      rotX += (targetX - rotX) * 0.06;
    } else if (f.motion === 'tumble') {
      swayPhase += 0.02;
      rotY = (rotY + 0.58 + spinBoost) % 360;
      const targetX = Math.sin(swayPhase) * 22;
      rotX += (targetX - rotX) * 0.05;
    } else {
      rotY = (rotY + 0.44 + spinBoost) % 360;
      rotX += (-6 - rotX) * 0.05;
    }
  }
  shapeEl.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  requestAnimationFrame(spinTick);
}
requestAnimationFrame(spinTick);

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button, .anniversary-card')) return;
  isDragging = true;
  dragX = e.clientX;
  dragY = e.clientY;
  cosmos.spawnSparkleAtScreen(e.clientX, e.clientY, 5);
});

window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch' || isDragging) {
    cosmos.spawnSparkleAtScreen(e.clientX, e.clientY, 2);
  }
  if (!isDragging) return;
  const dx = e.clientX - dragX;
  const dy = e.clientY - dragY;
  dragX = e.clientX;
  dragY = e.clientY;
  rotY += dx * 0.45;
  rotX = Math.max(-35, Math.min(30, rotX - dy * 0.28));
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

window.addEventListener('resize', updateStageTransform);

// Kick off initial formation + welcome fireworks (Auto OFF by default)
applyFormation(0, true);
