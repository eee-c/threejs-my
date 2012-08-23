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

  raft = new Physijs.ConvexMesh(
    new THREE.TorusGeometry(25, 10, 16, 16),
    // new THREE.SphereGeometry(20),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    )
  );
  raft.position.y = 20;
  raft.rotation.x = Math.PI/2;
  raft.rotation.z = Math.PI/2;
  scene.add(raft);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 500;
  camera.lookAt(raft.position);

  scene.add(camera);
}

function riverSegment(scene, rotation, offset) {
  if (!offset) offset = {x: 0, z: 0};

  var length = 1500
    // , rotation = -Math.PI/8
    , z_frame = 0.5 * length * Math.sin(rotation)
    , z_offset = z_frame + offset.z
    , x_frame = 0.5 * length * Math.cos(rotation)
    , x_offset = x_frame + offset.x;

  var water = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(1500, 500),
    new THREE.MeshBasicMaterial({color: 0x483D8B})
  );
  water.position.x = x_offset;
  water.position.z = -z_offset;
  water.rotation.y = rotation;
  scene.add(water);

  var bank1 = new Physijs.BoxMesh(
    new THREE.CubeGeometry(1500, 100, 100),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  bank1.position.x = x_offset;
  bank1.position.z = -z_offset -250;
  bank1.rotation.y = rotation;
  scene.add(bank1);

  var bank2 = new Physijs.BoxMesh(
    new THREE.CubeGeometry(1500, 100, 100),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    ),
    0
  );
  bank2.position.x = x_offset;
  bank2.position.z = -z_offset + 250;
  bank2.rotation.y = rotation;
  scene.add(bank2);

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
