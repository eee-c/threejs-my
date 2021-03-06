// Physics
Physijs.scripts.ammo = 'http://gamingJS.com/ammo.js';
Physijs.scripts.worker = 'scripts/physijs_worker.js';
// Physijs.scripts.worker = 'http://gamingJS.com/physijs_worker.js';

var raft, current_river, camera, scene, renderer,
    river_segments, obstacle_markers,
    lake, game_over;

document.addEventListener("DOMContentLoaded", function() {
  init();

  if (!renderer) {
    alert("Can't make renderer. What kind of browser are you using?!");
    return;
  }

  setTimeout(startGame, 500);
});

var start;
function startGame() {
  start = new Date();
  runTimer();
  animate();
}

function runTimer() {
  if (game_over) return;

  writeTime();
  setTimeout(runTimer, 500);
}

function writeTime() {
  var now = new Date()
    , diff = now.getTime() - start.getTime()
    , seconds = diff / 1000;
  writeScoreBoard(seconds);
  return seconds;
}

function init() {
  initScoreBoard();

  renderer = initRenderer(0x87CEEB);

  scene = new Physijs.Scene;

  initRiver(scene);

  raft = initRaft(scene);

  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 1, 10000
  );
  camera.position.y = 500;
  camera.lookAt(raft.position);

  scene.add(camera);
}

function initScoreBoard() {
  var text = document.createElement('div');
  text.id = 'scoreboard';
  text.style.position = 'absolute';
  text.style.backgroundColor = 'white';
  text.style.borderRadius = "5px";
  text.style.padding = "0px 20px";
  text.style.left = "50px";
  text.style.top = "75px";
  text.style.height = "200px";
  document.body.appendChild(text);

  writeScoreBoard(
    'j / k to turn; space to move' +
    '<br/>' +
    'Press space to start'
  );
}

function writeScoreBoard(message) {
  var text = document.getElementById('scoreboard');
  text.innerHTML = message;
}

function initRenderer(bgColor) {
  var renderer = renderingStrategy();

  document.body.style.margin = '0px';
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColorHex(bgColor);
  document.body.appendChild(renderer.domElement);

  return renderer;
}

function renderingStrategy() {
  if (Detector.webgl) return new THREE.WebGLRenderer();
  if (Detector.canvas) return new THREE.CanvasRenderer();
  return undefined;
}

function initRiver(scene) {
  // Land
  var land = new THREE.Mesh(
    new THREE.PlaneGeometry(1e6, 1e6),
    new THREE.MeshBasicMaterial({color: 0x7CFC00})
  );
  land.position.y = -1;
  scene.add(land);

  // River
  river_segments = [];
  obstacle_markers = [];
  //  buildRiver([R, S, L, L, L, S, L, R, S])

  var offset;
  offset = riverSegment(0);
  offset = riverSegment(Math.PI/8,  offset);
  offset = riverSegment(0,          offset);
  offset = riverSegment(-Math.PI/8, offset);
  offset = riverSegment(-Math.PI/8, offset);
  offset = riverSegment(-Math.PI/8, offset);
  offset = riverSegment(0,          offset);
  offset = riverSegment(-Math.PI/8, offset);
  offset = riverSegment(Math.PI/8,  offset);
  offset = riverSegment(0,          offset);

  lake = riverEnd(offset);
}

function initRaft(scene) {
  var raft = new Physijs.ConvexMesh(
    new THREE.TorusGeometry(25, 10, 16, 16),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    )
  );

  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(0, 0, 0));
  geometry.vertices.push(new THREE.Vector3(10, 0, 0));
  var rudder = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({color: 0xff0000})
  );
  rudder.position.z = 0;
  rudder.position.x = 35;
  raft.add(rudder);

  raft.position.y = 20;
  raft.rotation.x = Math.PI/2;

  scene.add(raft);
  raft.setDamping(0.0, 1.0);

  return raft;
}

function riverSegment(rotation, offset) {
  if (!offset) offset = {x: 0, z: 0};

  var length = 1500
    , half = length / 2;

  var segment = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.Material()
  );
  segment.rotation.y = rotation;
  segment.position.x = offset.x;
  segment.position.z = offset.z;

  var water = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(length, 500),
    new THREE.MeshBasicMaterial({color: 0x483D8B})
  );
  water.position.x = half;
  segment.add(water);

  water.add(bank(length, -250));
  water.add(bank(length, 250));

  var end = joint(250, rotation);
  segment.add(end);

  addObstacleMarker(segment);

  scene.add(segment);
  river_segments.push(water);

  return {
    x: Math.cos(rotation) * 1500 + offset.x,
    z: -Math.sin(rotation) * 1500 + offset.z
  };
}

function bank(length, z) {
  var width = 100
    , half = width / 2;

  var bank = new Physijs.BoxMesh(
    new THREE.CubeGeometry(length*.9, 100, width),
      Physijs.createMaterial(
        new THREE.MeshNormalMaterial(), 0.2, 0.9
      ),
    0
  );

 if (z < 0) {
    bank.position.z = z - half;
  }
  else {
    bank.position.z = z + half;
  }

  return bank;
}


function riverEnd(offset) {
  var wall_width = 100
    , radius = 750;

  var ref = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.Material()
  );
  ref.position.x = offset.x + radius - 100;
  ref.position.z = offset.z;

  var water = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 1),
    new THREE.MeshBasicMaterial({color: 0x483D8B})
  );
  ref.add(water);

  var bottom = new Physijs.BoxMesh(
    new THREE.CubeGeometry(wall_width, 100, 2 * radius),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  bottom.position.x = radius/2;
  ref.add(bottom);

  var right = new Physijs.BoxMesh(
    new THREE.CubeGeometry(2 * radius, 100, wall_width),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  right.position.z = -radius/2;
  ref.add(right);

  var left = new Physijs.BoxMesh(
    new THREE.CubeGeometry(2 * radius, 100, wall_width),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  left.position.z = radius/2;
  ref.add(left);

  scene.add(ref);

  return water;
}

function addObstacleMarker(water) {
  var width = 250
    , length = 1500
    , x = Math.random() * length;

  var marker = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.Material()
  );

  marker.position.x = x;
  water.add(marker);

  obstacle_markers.push(marker);
}

function joint(w, rotation) {
  var wall_width = 100
    , wall_length = w + 200
    , width = w + wall_width / 2;

  var joint = new Physijs.BoxMesh(
    new THREE.CubeGeometry(wall_length, 100, wall_width),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );

  var water = new THREE.Mesh(
    new THREE.CylinderGeometry(width, width, 1),
    new THREE.MeshBasicMaterial({color: 0x483D8B})
  );

  if (rotation > 0) {
    joint.position.z = width;
    water.position.z = -width;
  }
  else {
    joint.position.z = -width;
    water.position.z = width;
  }

  joint.add(water);

  return joint;
}


function animate() {
  if (game_over) return;

  requestAnimationFrame(animate);
  applyRiverCurrent();
  checkForWin();
  scene.simulate(); // run physics
  render();
  drawObstacles();
}

function render() {
  camera.position.x = raft.position.x + 0.4 * window.innerHeight ;
  camera.position.z = raft.position.z;

  renderer.render(scene, camera);
}

var _scene_obstacles = [];
function drawObstacles() {
  if (_scene_obstacles.length > 0) return;

  obstacle_markers.forEach(function(marker) {
    var position = marker.matrixWorld.multiplyVector3(new THREE.Vector3());
    console.log(position);
    var obstacle = new Physijs.BoxMesh(
      new THREE.CubeGeometry(
        40, 20, 40
      ),
      Physijs.createMaterial(
        new THREE.MeshNormalMaterial()
      ),
      0
    );
    obstacle.position.y = 21;
    obstacle.position.x = position.x;
    obstacle.position.z = position.z;
    scene.add(obstacle);

    obstacle.addEventListener('collision', function(object) {
      if (object == raft) gameOver();
      else {
        console.log(object);
      }
    });

    _scene_obstacles.push(obstacle);
  });
}

function gameOver() {
  console.log("Game Over!!!!");

  writeScoreBoard('<h1>Game Over!</h1>');

  game_over = true;
}

function checkForWin() {
  var ray = new THREE.Ray(
    raft.position,
    new THREE.Vector3(0, -1, 0)
  );

  var intersects = ray.intersectObject(lake);
  if (!intersects[0]) return;

  game_over = true;

  var time = writeTime();

  writeScoreBoard(
    '<h1>Win!</h1>' +
    '<p>You won it in' +
      '<br>' +
    time + ' seconds. Yay!</p>'
  );
}

function applyRiverCurrent() {
  var ray = new THREE.Ray(
    raft.position,
    new THREE.Vector3(0, -1, 0)
  );

  var intersects = ray.intersectObjects(river_segments);
  if (!intersects[0]) return;

  var current_segment = intersects[0].object;
  if (!current_segment) return;

  var angle = -current_segment.rotation.y
    , cos = Math.cos(angle)
    , sine = Math.sin(angle);

  raft.applyCentralForce(
    new THREE.Vector3(1e6 * cos, 0, 1e6 * sine)
  );
}

document.addEventListener("keydown", function(event) {
  var code = event.which || event.keyCode;
  if (code == 0x20) { // space
    pushRaft();
  }
  else if (code == 0x4a) { // J
    rotateRaft(-1);
  }
  else if (code == 0x4b) { // K
    rotateRaft(1);
  }
  else {
    console.log(code);
  }
});

function pushRaft() {
  var angle = raft.rotation.z;

  raft.applyCentralForce(
    new THREE.Vector3(
      1e8 * Math.cos(angle),
      0,
      1e8 * Math.sin(angle)
    )
  );
}

function rotateRaft(direction) {
  raft.__dirtyRotation = true;
  raft.rotation.z = raft.rotation.z + direction * Math.PI / 10;
}
