var camera, scene, renderer, clock, controls,
avatar, avatar_left_leg, avatar_right_leg, avatar_left_arm, avatar_right_arm,
island, walls, fence;

document.addEventListener( "DOMContentLoaded", function( e ) {
  init();

  clock = new THREE.Clock(true);
  animate();
});

var ISLAND_WIDTH = 5000
  , ISLAND_HALF = ISLAND_WIDTH / 2;

function init() {
  scene = new THREE.Scene();

  var fenceGeometry = new THREE.CubeGeometry(ISLAND_WIDTH, 10000, ISLAND_WIDTH)
    , fenceMaterial = new THREE.MeshBasicMaterial({wireframe: true});
  fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
  fence.flipSided = true;
  scene.add(fence);

  // var wallGeometry = new THREE.CubeGeometry(ISLAND_WIDTH, 1000, 100)
  //   , wallMaterial = new THREE.MeshBasicMaterial({wireframe: true})
  //   , wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
  // wallMesh.position.z = ISLAND_HALF;
  // scene.add(wallMesh);

  // walls = [wallMesh];

  // Sky box
  var skyGeometry = new THREE.SphereGeometry(ISLAND_WIDTH, 11, 11)
    , skyMaterial = new THREE.MeshBasicMaterial({color: 0x87CEEB})
    , skyboxMesh  = new THREE.Mesh(skyGeometry, skyMaterial);
  skyboxMesh.flipSided = true;
  scene.add(skyboxMesh);

  // Sea
  var seaGeometry = new THREE.PlaneGeometry(2*ISLAND_WIDTH, 2*ISLAND_WIDTH, 3, 3)
    , seaMaterial = new THREE.MeshBasicMaterial({color: 0x483D8B})
    , seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
  seaMesh.position.y = -1;
  scene.add(seaMesh);

  // Island
  var islandGeometry = new THREE.PlaneGeometry(ISLAND_WIDTH, ISLAND_WIDTH)
    , islandMaterial = new THREE.MeshBasicMaterial({color: 0x7CFC00});
  island = new THREE.Mesh(islandGeometry, islandMaterial);
  scene.add(island);

  avatar = buildAvatar();
  var a_frame = new THREE.Object3D();
  a_frame.add(avatar);
  scene.add(a_frame);

  controls = new THREE.FirstPersonControls(a_frame);
  controls.movementSpeed = 10000;
  controls.activeLook = false;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 1500;
  camera.position.y = 750;
  a_frame.add(camera);

  avatar_left_arm = avatar.getChildByName("left_arm", true);
  avatar_right_arm = avatar.getChildByName("right_arm", true);
  avatar_left_leg = avatar.getChildByName("left_leg", true);
  avatar_right_leg = avatar.getChildByName("right_leg", true);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
}

function buildAvatar() {
  var avatar = new THREE.Object3D();

  var material = new THREE.MeshNormalMaterial();

  var body_geometry = new THREE.CylinderGeometry(1, 100, 100);
  var body = new THREE.Mesh(body_geometry, material);
  avatar.add(body);

  var head_geometry = new THREE.SphereGeometry(75);
  var head = new THREE.Mesh(head_geometry, material);
  head.position.y = (100 + 35) * .8;
  avatar.add(head);

  var socket;

  // Left Arm
  socket = new THREE.Object3D();
  socket.position.x = 40;
  socket.rotation.z = -Math.PI/3;

  var left_arm = limb(material);
  left_arm.name = 'left_arm';
  socket.add(left_arm);

  avatar.add(socket);

  // Right Arm
  socket = new THREE.Object3D();
  socket.position.x = -40;
  socket.rotation.z = Math.PI/3;

  var right_arm = limb(material);
  right_arm.name = 'right_arm';
  socket.add(right_arm);

  avatar.add(socket);

  //  Right Leg
  socket = new THREE.Object3D();
  socket.position.y = -50;
  socket.position.x = 35;
  socket.rotation.z = Math.PI;

  var right_leg = limb(material);
  right_leg.name = 'right_leg';
  socket.add(right_leg);

  avatar.add(socket);

  // Left Leg
  socket = new THREE.Object3D();
  socket.position.y = -50;
  socket.position.x = -35;
  socket.rotation.z = Math.PI;

  var left_leg = limb(material);
  left_leg.name = 'left_leg';
  socket.add(left_leg);

  avatar.add(socket);

  avatar.position.y = 175;
  return avatar;
}

function limb(material) {
  var limb = new THREE.Object3D();

  var arm_geometry = new THREE.CylinderGeometry(10, 10, 100);
  var arm = new THREE.Mesh(arm_geometry, material);
  arm.position.y = 50;
  limb.add(arm);

  var hand_geometry = new THREE.SphereGeometry(25);
  var hand = new THREE.Mesh(hand_geometry, material);
  hand.position.y = 100;
  limb.add(hand);

  return limb;
}


function animate() {
  // note: three.js includes requestAnimationFrame shim
  requestAnimationFrame(animate);
  TWEEN.update();
  render();
}

var w = 500;
function render() {
  var t_float = clock.getElapsedTime()
    , t = t_float * 1000
    , amplitude = (w/2 - Math.abs((t % (2*w)) - w))/w;

 detectCollision();

  // if (controls.object.position.z >  ISLAND_HALF) controls.moveLeft = false;
  // if (controls.object.position.z < -ISLAND_HALF) controls.moveRight = false;
  // if (controls.object.position.x >  ISLAND_HALF) controls.moveBackward = false;
  // if (controls.object.position.x < -ISLAND_HALF) controls.moveForward = false;

  if (controls.moveForward || controls.moveBackward ||
      controls.moveRight || controls.moveLeft) {
    avatar_left_leg.rotation.x  =    amplitude*(Math.PI/6);
    avatar_right_leg.rotation.x = -1*amplitude*(Math.PI/6);

    avatar_left_arm.rotation.x  =    amplitude*(Math.PI/6);
    avatar_right_arm.rotation.x = -1*amplitude*(Math.PI/6);

    if (controls.moveLeft) spinAvatar(-Math.PI/2);
    if (controls.moveRight) spinAvatar(Math.PI/2);
  }
  else {
    spinAvatar(0);
  }

  renderer.render(scene, camera);

  controls.update(clock.getDelta());
}

function detectCollision() {
  var x, z;
  if (controls.moveLeft) z = 1;
  if (controls.moveRight) z = -1;
  if (controls.moveBackward) x = 1;
  if (controls.moveForward) x = -1;

  var vector = new THREE.Vector3( x, 0, z );
  var ray = new THREE.Ray(controls.object.position, vector);
  var intersects = ray.intersectObject(fence);

  if (intersects.length > 0) {
    if (intersects[0].distance < 50) {
      if (z ==  1) controls.moveLeft = false;
      if (z == -1) controls.moveRight = false;
      if (x ==  1) controls.moveBackward = false;
      if (x == -1) controls.moveForward = false;
    }
  }
}

function spinAvatar(angle) {
  new TWEEN.Tween( { y: avatar.rotation.y } )
      .to( { y: angle }, 100 )
      .onUpdate( function () {
          avatar.rotation.y = this.y;
      } )
      .start();
}
