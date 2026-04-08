import * as THREE from 'three';

try {
  const wrapper = document.getElementById('lanyard-canvas');
  if (!wrapper) throw new Error('Lanyard: wrapper not found');

  // ── Renderer ──
  const W = wrapper.clientWidth || 460;
  const H = wrapper.clientHeight || 720;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  wrapper.appendChild(renderer.domElement);

  // ── Scene / Camera ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, W / H, 0.1, 100);
  camera.position.set(0, 0, 20);

  // ── Lights ──
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 3.5);
  sun.position.set(3, 5, 6);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x6c63ff, 1.2);
  fill.position.set(-4, -2, 2);
  scene.add(fill);

  // ── Verlet Physics ──
  const N = 20;
  const SEG = 0.29;
  const GRAV = 0.0105;
  const DAMP = 0.987;
  const SOLVER_ITERS = 12;
  const ANCHOR_Y = 5.55;
  const ANCHOR_X = 0;
  const CARD_OFFSET_Y = 0.46;

  const px = new Float32Array(N);
  const py = new Float32Array(N);
  const ox = new Float32Array(N);
  const oy = new Float32Array(N);
  const lpx = new Float32Array(N);
  const lpy = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    px[i] = ox[i] = lpx[i] = ANCHOR_X;
    py[i] = oy[i] = lpy[i] = ANCHOR_Y - i * SEG;
  }

  function stepPhysics() {
    for (let i = 1; i < N; i++) {
      const vx = (px[i] - ox[i]) * DAMP;
      const vy = (py[i] - oy[i]) * DAMP;
      ox[i] = px[i]; oy[i] = py[i];
      px[i] += vx;
      py[i] += vy - GRAV;
    }
    for (let iter = 0; iter < SOLVER_ITERS; iter++) {
      px[0] = ANCHOR_X; py[0] = ANCHOR_Y;
      for (let i = 0; i < N - 1; i++) {
        const dx = px[i+1] - px[i];
        const dy = py[i+1] - py[i];
        const dist = Math.sqrt(dx*dx + dy*dy) || 1e-6;
        const diff = (dist - SEG) / dist * 0.5;
        if (i > 0) { px[i] += dx * diff; py[i] += dy * diff; }
        px[i+1] -= dx * diff; py[i+1] -= dy * diff;
      }
    }
  }

  function updateLerped(delta) {
    lpx[0] = px[0]; lpy[0] = py[0];
    for (let i = 1; i < N; i++) {
      const dx = px[i] - lpx[i], dy = py[i] - lpy[i];
      const d = Math.sqrt(dx*dx + dy*dy);
      const clamped = Math.max(0.01, Math.min(1, d));
      const speed = 10 + clamped * (50 - 10);
      const t = Math.min(1, delta * speed);
      lpx[i] += dx * t;
      lpy[i] += dy * t;
    }
  }

  // ── Card Texture ──
  function makeCardTexture() {
    const cc = document.createElement('canvas');
    cc.width = 520; cc.height = 740;
    const c = cc.getContext('2d');

    function rr(x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x+r, y); c.lineTo(x+w-r, y);
      c.arcTo(x+w, y, x+w, y+r, r); c.lineTo(x+w, y+h-r);
      c.arcTo(x+w, y+h, x+w-r, y+h, r); c.lineTo(x+r, y+h);
      c.arcTo(x, y+h, x, y+h-r, r); c.lineTo(x, y+r);
      c.arcTo(x, y, x+r, y, r); c.closePath();
    }

    c.fillStyle = '#0D0F12';
    rr(0, 0, 520, 740, 28); c.fill();

    c.strokeStyle = 'rgba(108,99,255,0.07)'; c.lineWidth = 1;
    for (let y = 0; y < 740; y += 32) { c.beginPath(); c.moveTo(0,y); c.lineTo(520,y); c.stroke(); }
    for (let x = 0; x < 520; x += 32) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,740); c.stroke(); }

    const grad = c.createLinearGradient(0, 0, 520, 0);
    grad.addColorStop(0, '#6C63FF'); grad.addColorStop(1, '#00D9A3');
    c.fillStyle = grad;
    rr(0, 0, 520, 10, 0); c.fill();

    c.strokeStyle = 'rgba(108,99,255,0.2)'; c.lineWidth = 1.5;
    rr(1, 1, 518, 738, 27); c.stroke();

    c.fillStyle = 'rgba(108,99,255,0.12)';
    c.fillRect(24, 26, 120, 22);
    c.fillStyle = '#6C63FF';
    c.font = '500 11px "JetBrains Mono", monospace';
    c.textAlign = 'left';
    c.fillText('CS · AI · PRODUCT', 30, 41);

    c.fillStyle = '#151720';
    c.beginPath(); c.arc(260, 215, 115, 0, Math.PI*2); c.fill();
    const ringG = c.createRadialGradient(260, 215, 100, 260, 215, 118);
    ringG.addColorStop(0, 'rgba(108,99,255,0.5)'); ringG.addColorStop(1, 'rgba(108,99,255,0)');
    c.fillStyle = ringG;
    c.beginPath(); c.arc(260, 215, 118, 0, Math.PI*2); c.fill();
    c.fillStyle = '#1E2230';
    c.beginPath(); c.arc(260, 195, 52, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(260, 330, 88, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(108,99,255,0.6)';
    c.font = 'bold 52px Arial'; c.textAlign = 'center';
    c.fillText('S', 260, 212);

    c.fillStyle = '#FFFFFF';
    c.font = 'bold 46px Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('SKYLAR', 260, 372);
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.font = '22px Arial, sans-serif';
    c.fillText('Dararithy Heng', 260, 406);

    const divG = c.createLinearGradient(120, 0, 400, 0);
    divG.addColorStop(0, 'transparent'); divG.addColorStop(0.5, '#6C63FF'); divG.addColorStop(1, 'transparent');
    c.strokeStyle = divG; c.lineWidth = 1;
    c.beginPath(); c.moveTo(120, 424); c.lineTo(400, 424); c.stroke();

    c.fillStyle = '#6C63FF';
    c.font = '500 18px "JetBrains Mono", monospace';
    c.fillText('AI Builder · Aspiring PM', 260, 453);

    const rows = [['🎓','AUPP + FHSU · Dual Degree'],['🤖','AI Associate · TGI'],['🌐','skylar-thedev.me']];
    c.font = '15px "JetBrains Mono", monospace';
    rows.forEach(([icon, text], i) => {
      const ry = 498 + i * 34;
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.textAlign = 'left'; c.fillText(icon, 80, ry);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillText(text, 116, ry);
    });

    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(40, 610); c.lineTo(480, 610); c.stroke();

    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 28; i++) {
      const bx = 80 + i * 13;
      const bh = (i%3===0) ? 38 : (i%2===0 ? 28 : 20);
      c.fillRect(bx, 622, (i%4<2) ? 7 : 4, bh);
    }
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.font = '10px monospace';
    c.fillText('PHNOM PENH · CAMBODIA · 2025', 260, 678);

    c.fillStyle = '#6C63FF'; c.beginPath(); c.arc(28, 716, 5, 0, Math.PI*2); c.fill();
    c.fillStyle = '#00D9A3'; c.beginPath(); c.arc(492, 716, 5, 0, Math.PI*2); c.fill();

    return new THREE.CanvasTexture(cc);
  }

  const cardTex = makeCardTexture();

  // ── Card Mesh ──
  const cardGeo = new THREE.BoxGeometry(1.55, 2.2, 0.06);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x0D0F12, roughness: 0.9 });
  const frontMat = new THREE.MeshPhysicalMaterial({
    map: cardTex, clearcoat: 1.0, clearcoatRoughness: 0.08, roughness: 0.55, metalness: 0.05,
  });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x0A0B0E, roughness: 0.95 });
  const card = new THREE.Mesh(cardGeo, [sideMat,sideMat,sideMat,sideMat,frontMat,backMat]);
  card.scale.setScalar(1.4);
  scene.add(card);

  // ── Hardware ──
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xC8C2B8, metalness: 0.95, roughness: 0.12 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.038, 20, 48), ringMat);
  ring.position.set(0, 1.21, 0.02);
  card.add(ring);

  const clipMat = new THREE.MeshStandardMaterial({ color: 0xB0A898, metalness: 0.92, roughness: 0.14 });
  const clipBody = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 12, 32, Math.PI), clipMat);
  clipBody.rotation.z = Math.PI / 2;
  clipBody.position.set(0, 1.02, 0.02);
  card.add(clipBody);
  const clipBar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.26, 10), clipMat);
  clipBar.position.set(0, 1.02, 0.02);
  card.add(clipBar);

  const tether = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.034, 0.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x0A0A0A, roughness: 0.6, metalness: 0.05 })
  );
  tether.position.set(0, 1.5, 0);
  scene.add(tether);

  const anchorMat = new THREE.MeshStandardMaterial({ color: 0xD0CBBD, metalness: 0.95, roughness: 0.1 });
  const anchor = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), anchorMat);
  anchor.position.set(ANCHOR_X, ANCHOR_Y, 0);
  scene.add(anchor);
  const anchorRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 12, 28), anchorMat);
  anchorRing.position.set(ANCHOR_X, ANCHOR_Y - 0.14, 0);
  scene.add(anchorRing);

  // ── Lanyard strap texture ──
  function makeLanyardTex() {
    const lc = document.createElement('canvas');
    lc.width = 128; lc.height = 512;
    const lt = lc.getContext('2d');
    const W = lc.width, H = lc.height;

    const glossGrad = lt.createLinearGradient(0, 0, W, 0);
    glossGrad.addColorStop(0,    '#0C0C0C');
    glossGrad.addColorStop(0.18, '#222222');
    glossGrad.addColorStop(0.32, '#141414');
    glossGrad.addColorStop(0.5,  '#0A0A0A');
    glossGrad.addColorStop(0.68, '#141414');
    glossGrad.addColorStop(0.82, '#1E1E1E');
    glossGrad.addColorStop(1,    '#0C0C0C');
    lt.fillStyle = glossGrad;
    lt.fillRect(0, 0, W, H);

    const streak = lt.createLinearGradient(0, 0, W, 0);
    streak.addColorStop(0,    'rgba(255,255,255,0)');
    streak.addColorStop(0.22, 'rgba(255,255,255,0.09)');
    streak.addColorStop(0.28, 'rgba(255,255,255,0.16)');
    streak.addColorStop(0.34, 'rgba(255,255,255,0.09)');
    streak.addColorStop(1,    'rgba(255,255,255,0)');
    lt.fillStyle = streak;
    lt.fillRect(0, 0, W, H);

    lt.fillStyle = 'rgba(255,255,255,0.07)';
    lt.fillRect(7, 0, 1.5, H);
    lt.fillRect(W - 8.5, 0, 1.5, H);

    const SYM_SPACING = 72;
    for (let sy = 36; sy < H; sy += SYM_SPACING) {
      const cx = W / 2, cy = sy;
      lt.fillStyle = 'rgba(255,255,255,0.55)';
      lt.beginPath(); lt.arc(cx, cy, 2.2, 0, Math.PI * 2); lt.fill();
      lt.strokeStyle = 'rgba(255,255,255,0.28)';
      lt.lineWidth = 1;
      [[0,-1],[0,1],[-1,0],[1,0]].forEach(([tx, ty]) => {
        lt.beginPath();
        lt.moveTo(cx + tx * 4, cy + ty * 4);
        lt.lineTo(cx + tx * 11, cy + ty * 11);
        lt.stroke();
      });
    }

    lt.fillStyle = 'rgba(255,255,255,0.018)';
    for (let y = 0; y < H; y += 8) { lt.fillRect(0, y, W, 1); }

    const t = new THREE.CanvasTexture(lc);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 4);
    return t;
  }

  const lanyardTex = makeLanyardTex();
  const ropeMat = new THREE.MeshStandardMaterial({ map: lanyardTex, roughness: 0.38, metalness: 0.08 });

  // ── CatmullRom rope (cylinder segments) ──
  const CTRL = 10;
  const curvePts = Array.from({ length: CTRL }, (_, i) => {
    const idx = Math.round(i * (N - 1) / (CTRL - 1));
    return new THREE.Vector3(lpx[idx], lpy[idx], 0);
  });
  const ropeCurve = new THREE.CatmullRomCurve3(curvePts);
  ropeCurve.curveType = 'centripetal';

  const N_SEGS = 32;
  const segGeo = new THREE.CylinderGeometry(0.072, 0.072, 1, 10);
  const segs = Array.from({ length: N_SEGS }, () => {
    const m = new THREE.Mesh(segGeo, ropeMat);
    scene.add(m);
    return m;
  });
  const denseP = Array.from({ length: N_SEGS + 1 }, () => new THREE.Vector3());

  function updateRope() {
    for (let i = 0; i < CTRL; i++) {
      const idx = Math.round(i * (N - 1) / (CTRL - 1));
      curvePts[i].set(lpx[idx], lpy[idx], 0);
    }
    for (let i = 0; i <= N_SEGS; i++) { ropeCurve.getPoint(i / N_SEGS, denseP[i]); }
    for (let i = 0; i < N_SEGS; i++) {
      const a = denseP[i], b = denseP[i + 1];
      const mx = (a.x + b.x) * 0.5, my = (a.y + b.y) * 0.5;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      segs[i].position.set(mx, my, 0);
      segs[i].rotation.z = -Math.atan2(dx, dy);
      segs[i].scale.y = len;
    }
    tether.position.set(lpx[N - 1], lpy[N - 1] + 0.33, 0);
    tether.rotation.z = -Math.atan2(lpx[N - 1] - lpx[N - 2], lpy[N - 2] - lpy[N - 1]);
  }

  // ── Drag ──
  let dragging = false;
  let offX = 0, offY = 0;

  function toWorld(cx, cy) {
    const r = renderer.domElement.getBoundingClientRect();
    const nx = ((cx - r.left) / r.width) * 2 - 1;
    const ny = -((cy - r.top) / r.height) * 2 + 1;
    const v = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
    const d = v.sub(camera.position).normalize();
    const t = -camera.position.z / d.z;
    const p = camera.position.clone().addScaledVector(d, t);
    return { x: p.x, y: p.y };
  }

  renderer.domElement.style.cursor = 'grab';
  renderer.domElement.style.touchAction = 'none';

  renderer.domElement.addEventListener('pointerdown', e => {
    const wp = toWorld(e.clientX, e.clientY);
    const cx = px[N-1], cy = py[N-1] - CARD_OFFSET_Y;
    const dx = wp.x - cx, dy = wp.y - cy;
    if (Math.abs(dx) < 1.0 && Math.abs(dy) < 1.3) {
      dragging = true; offX = dx; offY = dy;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    }
  });

  renderer.domElement.addEventListener('pointermove', e => {
    if (!dragging) return;
    const wp = toWorld(e.clientX, e.clientY);
    px[N-1] = wp.x - offX; py[N-1] = wp.y - offY + CARD_OFFSET_Y;
    ox[N-1] = px[N-1]; oy[N-1] = py[N-1];
  });

  renderer.domElement.addEventListener('pointerup', e => {
    dragging = false;
    renderer.domElement.releasePointerCapture(e.pointerId);
    renderer.domElement.style.cursor = 'grab';
  });

  // ── Animate ──
  let time = 0, lastNow = 0;
  const cardRot = { z: 0, x: 0.06, y: 0 };

  function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - lastNow) / 1000, 1 / 20) || 1 / 60;
    lastNow = now;
    time += delta;

    if (dragging) {
      for (let i = 1; i < N - 1; i++) {
        const vx = (px[i] - ox[i]) * DAMP, vy = (py[i] - oy[i]) * DAMP;
        ox[i] = px[i]; oy[i] = py[i];
        px[i] += vx; py[i] += vy - GRAV;
      }
      for (let iter = 0; iter < SOLVER_ITERS; iter++) {
        px[0] = ANCHOR_X; py[0] = ANCHOR_Y;
        for (let i = 0; i < N - 2; i++) {
          const dx = px[i+1] - px[i], dy = py[i+1] - py[i];
          const dist = Math.sqrt(dx*dx + dy*dy) || 1e-6;
          const diff = (dist - SEG) / dist * 0.5;
          if (i > 0) { px[i] += dx * diff; py[i] += dy * diff; }
          px[i+1] -= dx * diff; py[i+1] -= dy * diff;
        }
      }
    } else {
      stepPhysics();
      px[0] = ANCHOR_X + Math.sin(time * 0.34) * 0.016;
      py[0] = ANCHOR_Y + Math.sin(time * 0.22) * 0.01;
      for (let i = 1; i < N - 1; i++) {
        const tt = i / (N - 1);
        px[i] += Math.sin(time * 0.92 - tt * 3.6) * 0.0019 * tt;
        py[i] += Math.cos(time * 0.58 - tt * 2.2) * 0.0012 * tt;
      }
    }

    updateLerped(delta);
    updateRope();

    const cx = lpx[N-1], cy = lpy[N-1];
    const pcx = lpx[N-2], pcy = lpy[N-2];
    card.position.set(cx, cy - CARD_OFFSET_Y, 0);

    const angle = Math.atan2(cx - pcx, pcy - cy);
    const idleZ = dragging ? 0 : Math.sin(time * 0.9) * 0.045;
    const idleX = dragging ? 0.06 : 0.09 + Math.cos(time * 0.62) * 0.012;
    const targetY = dragging ? 0 : Math.sin(time * 0.48) * 0.08;

    cardRot.z = THREE.MathUtils.lerp(cardRot.z, (-angle * 0.58) + idleZ, 0.08);
    cardRot.x = THREE.MathUtils.lerp(cardRot.x, idleX, 0.03);
    cardRot.y = THREE.MathUtils.lerp(cardRot.y, targetY - cardRot.y * 0.25, 0.025);
    card.rotation.z = cardRot.z;
    card.rotation.x = cardRot.x;
    card.rotation.y = cardRot.y;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  new ResizeObserver(() => {
    const nw = wrapper.clientWidth || 460;
    const nh = wrapper.clientHeight || 720;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }).observe(wrapper);

  const hint = document.createElement('div');
  hint.textContent = 'drag me';
  hint.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-family:"JetBrains Mono",monospace;font-size:10px;color:rgba(108,99,255,0.5);letter-spacing:0.12em;text-transform:uppercase;pointer-events:none;';
  wrapper.appendChild(hint);
  setTimeout(() => { hint.style.transition = 'opacity 1s'; hint.style.opacity = '0'; }, 3000);

} catch(e) { console.error('Lanyard error:', e); }
