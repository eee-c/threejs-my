var raft, current_river, camera, scene, renderer;

var offset;

var canvas = !! window.CanvasRenderingContext2D;
var webgl = ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();

Physijs.scripts.worker = 'scripts/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

document.addEventListener( "DOMContentLoaded", function() {
  init();
  animate();
});

function init() {
  if (webgl) renderer = new THREE.WebGLRenderer();
  else if (canvas) renderer = new THREE.CanvasRenderer();
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColorHex(0x87CEEB);
    document.body.appendChild(renderer.domElement);
  }
  else {
    alert("Can't make renderer. What kind of browser are you using?!");
  }

  scene = new Physijs.Scene;

  // Land
  var land = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(1e6, 1e6),
    new THREE.MeshBasicMaterial({color: 0x7CFC00})
  );
  land.position.y = -1;
  scene.add(land);

  // River
  offset = riverSegment(scene, Math.PI/8);
  offset = riverSegment(scene, 0, offset);
  offset = riverSegment(scene, -Math.PI/8, offset);

  // scene.add(river_segment);
  // var river1 = riverSegment(scene, 50, 0);
  raft = buildRaft();
  scene.add(raft);
  raft.setDamping(0.0, 1.0);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 500;
  camera.lookAt(raft.position);

  scene.add(camera);
}

function buildRaft() {
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


  return raft;
}

function riverSegment(scene, rotation, offset) {
  if (!offset) offset = {x: 0, z: 0};

  var length = 1500
    , sin = Math.sin(rotation)
    , cos = Math.cos(rotation)
    , z_frame = 0.5 * length * sin
    , z_offset = z_frame + offset.z
    , x_frame = 0.5 * length * cos
    , x_offset = x_frame + offset.x;

  var water = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(1500, 500),
    new THREE.MeshBasicMaterial({color: 0x483D8B})
  );
  water.position.x = x_offset;
  water.position.z = -z_offset;
  water.rotation.y = rotation;

  water.addEventListener('collision', function(object) {
    raft.applyCentralForce(new THREE.Vector3(1e8 * cos, 0, 1e8 * sin));
  });

  var bank1 = new Physijs.BoxMesh(
    new THREE.CubeGeometry(1500, 100, 100),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  bank1.position.z = -250;
  water.add(bank1);

  var bank2 = new Physijs.BoxMesh(
    new THREE.CubeGeometry(1500, 100, 100),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  bank2.position.z = 250;
  water.add(bank2);

  scene.add(water);

  return {x: 2 * x_frame + offset.x - 50, z: 2 * z_frame + offset.z};
}


function animate() {
  requestAnimationFrame(animate);
  scene.simulate(); // run physics
  render();
}

function render() {
  camera.position.x = raft.position.x;
  camera.position.z = raft.position.z;

  renderer.render(scene, camera);
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
  var angle = raft.rotation.z
    , cos = Math.cos(angle)
    , sin = Math.sin(angle);

  raft.applyCentralForce(new THREE.Vector3(1e8 * cos, 0, 1e8 * sin));
}

function rotateRaft(direction) {
  raft.__dirtyRotation = true;
  raft.rotation.z = raft.rotation.z + direction * Math.PI / 100;
}
