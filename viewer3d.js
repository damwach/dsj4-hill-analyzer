// Experimental geometric 3D preview for DSJ4 Hill Profile Analyzer.
// This intentionally renders only the hill geometry and XML profile widths.
// Decorations, terrain, beams, and game textures are NOT reconstructed yet.
(function () {
  "use strict";

  const host = document.getElementById("viewer3d");
  const status = document.getElementById("viewer3dStatus");
  const hillSelect = document.getElementById("viewer3dHill");
  const edgesToggle = document.getElementById("viewer3dEdges");
  const fitButton = document.getElementById("viewer3dFit");
  const captureButton = document.getElementById("viewer3dCapture");
  if (!host || !status || !hillSelect) return;

  let THREE, scene, camera, renderer, orbit, modelGroup, ready = false;
  let lastXml = null, lastHill = null, lastEdges = null;
  let currentBounds = null;

  function setStatus(message) { status.textContent = message; }
  function getHill() {
    // "hills" is the existing top-level variable declared by app1.js.
    return hills[hillSelect.value] || null;
  }
  function getNumber(o, key, fallback) {
    const n = Number(o && o[key]);
    return o && o[key] !== undefined && Number.isFinite(n) ? n : fallback;
  }
  function between(x, x0, v0, x1, v1) {
    if (Math.abs(x1 - x0) < 1e-8) return v1;
    const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
    return v0 + t * (v1 - v0);
  }
  function widthOnLanding(hill, x) {
    const dh = hill.dh, marks = hill.geometry.marks;
    const b0 = Math.max(1, getNumber(dh, "b0", 9));
    const bk = Math.max(1, getNumber(dh, "bk", b0));
    const ba = Math.max(1, getNumber(dh, "ba", bk));
    if (x <= marks.K.x) return between(x, 0, b0, marks.K.x, bk);
    return between(x, marks.K.x, bk, marks.end.x, ba);
  }
  function widthOnInrun(hill) { return Math.max(0.6, getNumber(hill.ir, "b1", 2.0)); }

  function makeStrip(points, getWidth, color, name) {
    if (!points || points.length < 2) return null;
    const vertices = [], indices = [];
    for (const p of points) {
      const half = getWidth(p.x) / 2;
      vertices.push(p.x, p.y, -half, p.x, p.y, half);
    }
    for (let i = 0; i < points.length - 1; ++i) {
      const j = 2 * i;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color, roughness: 0.86, metalness: 0.05, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    modelGroup.add(mesh);
    return mesh;
  }

  function makeLine(points, color) {
    if (!points || points.length < 2) return;
    const g = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y, p.z))
    );
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({color}));
    modelGroup.add(line);
  }
  function makeEdges(points, widthFn, color) {
    for (const side of [-1, 1]) {
      makeLine(points.map(p => ({
        x: p.x, y: p.y + 0.08, z: side * widthFn(p.x) / 2
      })), color);
    }
  }
  function pointAtDistance(points, distance) {
    if (!Number.isFinite(distance) || distance < 0) return null;
    let acc = 0;
    for (let i = 1; i < points.length; ++i) {
      const a = points[i - 1], b = points[i];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (acc + length >= distance) {
        const t = length ? (distance - acc) / length : 0;
        return {x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y)};
      }
      acc += length;
    }
    return null;
  }
  function label(text, x, y, z, color) {
    const c = document.createElement("canvas");
    c.width = 360; c.height = 100;
    const context = c.getContext("2d");
    context.fillStyle = "rgba(18,34,51,0.85)";
    context.fillRect(3, 3, c.width - 6, c.height - 6);
    context.strokeStyle = color;
    context.lineWidth = 7;
    context.strokeRect(3, 3, c.width - 6, c.height - 6);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 56px sans-serif";
    context.fillText(text, c.width / 2, c.height / 2);
    const texture = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false}));
    sprite.position.set(x, y, z);
    sprite.scale.set(12, 3.33, 1);
    modelGroup.add(sprite);
  }

  function clearGroup() {
    if (!modelGroup) return;
    scene.remove(modelGroup);
    modelGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
    modelGroup = new THREE.Group();
    scene.add(modelGroup);
  }

  function sync(forceFit) {
    if (!ready) return;
    const hill = getHill();
    const xml = hill && hill.rawXml;
    const edge = edgesToggle.checked;
    if (xml === lastXml && hillSelect.value === lastHill && edge === lastEdges) return;
    lastXml = xml; lastHill = hillSelect.value; lastEdges = edge;
    clearGroup();
    if (!hill) { setStatus("Wczytaj skocznię A lub B, aby zobaczyć model 3D."); return; }

    const inrun = hill.geometry.inrun, landing = hill.geometry.landing;
    const inrunWidth = () => widthOnInrun(hill);
    const landingWidth = x => widthOnLanding(hill, x);
    makeStrip(inrun, inrunWidth, 0x91a9bd, "Rozbieg");
    makeStrip(landing, landingWidth, 0xe9f3f7, "Zeskok");

    if (edge) {
      makeEdges(inrun, inrunWidth, 0x315572);
      makeEdges(landing, landingWidth, 0x47738a);
    }

    for (const key of ["p", "k", "hs"]) {
      const distance = getNumber(hill.dh, key, NaN);
      const p = pointAtDistance(landing, distance);
      if (!p) continue;
      const halfWidth = landingWidth(p.x) / 2;
      const lineColor = key === "hs" ? 0xef8e3b : 0xd24446;
      makeLine([
        {x: p.x, y: p.y + 0.12, z: -halfWidth},
        {x: p.x, y: p.y + 0.12, z: halfWidth}
      ], lineColor);
      label(key.toUpperCase() + " " + distance, p.x, p.y + 2.5, halfWidth + 7,
        key === "hs" ? "#ef8e3b" : "#d24446");
    }

    const pts = [...inrun, ...landing];
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));
    currentBounds = {minX, maxX, minY, maxY};
    const size = Math.max(100, Math.ceil((maxX - minX) / 10) * 10 + 80);
    const grid = new THREE.GridHelper(size, Math.max(10, Math.round(size / 10)), 0x718698, 0xc8d2dc);
    grid.position.set((maxX + minX) / 2, minY - 6, 0);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    modelGroup.add(grid);
    if (forceFit || !orbit.userData?.hasFit) fitCamera();
    setStatus("Model geometryczny z XML. Konstrukcje, teren i dekoracje nie są jeszcze renderowane.");
  }

  function fitCamera() {
    if (!ready || !currentBounds) return;
    const b = currentBounds;
    const span = Math.max(70, b.maxX - b.minX);
    const midX = (b.maxX + b.minX) / 2;
    const midY = (b.maxY + b.minY) / 2;
    camera.position.set(midX - span * 0.32, midY + span * 0.36, span * 0.68);
    camera.near = 0.1;
    camera.far = Math.max(1500, 5 * span);
    camera.updateProjectionMatrix();
    orbit.target.set(midX, midY, 0);
    orbit.update();
    orbit.userData = {hasFit: true};
  }

  function resize() {
    if (!ready) return;
    const w = Math.max(host.clientWidth, 100);
    const h = Math.max(host.clientHeight, 100);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  hillSelect.addEventListener("change", () => { lastXml = null; sync(true); });
  edgesToggle.addEventListener("change", () => sync(false));
  fitButton.addEventListener("click", fitCamera);
  captureButton.addEventListener("click", () => {
    if (!ready) return;
    renderer.render(scene, camera);
    const a = document.createElement("a");
    a.download = "dsj4-hill-3d.png";
    a.href = renderer.domElement.toDataURL("image/png");
    a.click();
  });

  // Connect to the 2D editor without modifying its geometry or XML logic.
  const oldDraw = draw;
  draw = function () {
    const result = oldDraw.apply(this, arguments);
    sync(false);
    return result;
  };

  async function start() {
    try {
      setStatus("Ładowanie silnika 3D...");
      const modules = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"),
        import("https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js")
      ]);
      THREE = modules[0];
      const OrbitControls = modules[1].OrbitControls;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd8e6f0);
      camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
      renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x748391, 2.3));
      const sun = new THREE.DirectionalLight(0xffffff, 2.0);
      sun.position.set(-120, 190, 150);
      scene.add(sun);
      orbit = new OrbitControls(camera, renderer.domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.08;
      orbit.minDistance = 5;
      orbit.maxDistance = 1800;
      ready = true;
      new ResizeObserver(resize).observe(host);
      resize();
      sync(true);
      function frame() {
        requestAnimationFrame(frame);
        orbit.update();
        renderer.render(scene, camera);
      }
      frame();
    } catch (err) {
      setStatus("Podgląd 3D nie został uruchomiony. Wymaga WebGL i dostępu do bibliotek Three.js. " + err.message);
    }
  }
  start();
})();