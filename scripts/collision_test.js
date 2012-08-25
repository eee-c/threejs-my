var renderer, scene, camera, cube1, cube2;

Physijs.scripts.worker = 'scripts/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

document.addEventListener( "DOMContentLoaded", function() {
  init();
  animate();
});

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColorHex(0x87CEEB);
  document.body.appendChild(renderer.domElement);

  scene = new Physijs.Scene;
  scene.setGravity(
    new THREE.Vector3(0,0,0)
  );

  var plane = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(15, 1000),
    new THREE.MeshBasicMaterial({color: 0x7CFC00})
  );
  plane.position.y = -5;
  scene.add(plane);
  console.log("plane: " + plane.id);

  cube1 = new Physijs.BoxMesh(
    new THREE.CubeGeometry(10, 10, 10),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    )
  );
  cube1.position.x = -50;
  scene.add(cube1);
  console.log("cube 1: " + cube1.id);

  cube2 = new Physijs.BoxMesh(
    new THREE.CubeGeometry(10, 10, 10),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(), 0.2, 0.9
    )
  );
  cube2.position.x = 50;
  scene.add(cube2);
  console.log("cube 2: " + cube2.id);

  cube2.addEventListener('collision', function(object) {
    console.log("Object " + this.id + " collided with " + object.id);
  });

  cube2.setLinearVelocity(new THREE.Vector3(-10, 0,0));

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 100;
  scene.add(camera);
}

function animate() {
  requestAnimationFrame(animate);
  scene.simulate(); // run physics
  render();
}

function render() {
  renderer.render(scene, camera);
}
