var camera, scene, renderer, clock, controls,
avatar, avatar_left_leg, avatar_right_leg, avatar_left_arm, avatar_right_arm,
island, blockers;

var canvas = !! window.CanvasRenderingContext2D;
var webgl = ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();

document.addEventListener( "DOMContentLoaded", function( e ) {
  init();

  clock = new THREE.Clock(true);
  animate();
});

var ISLAND_WIDTH = 10 * 1000
  , ISLAND_HALF = ISLAND_WIDTH / 2;

function init() {
  scene = new THREE.Scene();

  var fenceGeometry = new THREE.CubeGeometry(ISLAND_WIDTH, 10000, ISLAND_WIDTH)
    , fenceMaterial = new THREE.MeshBasicMaterial({wireframe: true})
    , fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
  fence.flipSided = true;
  scene.add(fence);

  blockers = [fence];

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

  scene.add(river());

  avatar = buildAvatar();
  var a_frame = new THREE.Object3D();
  a_frame.add(avatar);
  scene.add(a_frame);

  controls = new THREE.FirstPersonControls(a_frame);
  controls.movementSpeed = 10000;
  controls.activeLook = false;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 1000;
  camera.position.y = 750;
  camera.rotation.x = -Math.PI / 8;
  // camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 100000);
  // camera.rotation.x = -Math.PI / 64;
  // camera.position.z = 10000;
  // camera.position.y = 750;
  a_frame.add(camera);

  avatar_left_arm = avatar.getChildByName("left_arm", true);
  avatar_right_arm = avatar.getChildByName("right_arm", true);
  avatar_left_leg = avatar.getChildByName("left_leg", true);
  avatar_right_leg = avatar.getChildByName("right_leg", true);

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
}

function buildAvatar() {
  var avatar = new THREE.Object3D();

  var material = new THREE.MeshNormalMaterial();

  var body_geometry = new THREE.CylinderGeometry(1, 100, 100);
  var body = new THREE.Mesh(body_geometry, material);
  avatar.add(body);

  var img = new Image();
  var texture = new THREE.Texture(img);
  img.onload = function () { texture.needsUpdate = true; };
  img.src = 'face.png';
  texture.needsUpdate = true;

  var head_material = new THREE.MeshPhongMaterial({map: texture});
  var head_geometry = new THREE.SphereGeometry(75);
  var head = new THREE.Mesh(head_geometry, head_material);
  head.position.y = (100 + 35) * .8;
  head.rotation.y = -Math.PI/2;
  avatar.add(head);

  var light = new THREE.PointLight(0xffffff, 2);
  light.position.set(25, 150, 500);
  avatar.add(light);

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

function river() {
  var river = new THREE.Object3D()
    , riverMaterial = new THREE.MeshBasicMaterial({color: 0x483D8B})
    , wallMaterial = new THREE.MeshBasicMaterial()
    , width = 400;

  var waterShape, water, wallShape, wall;

  // Bottom segment of the river
  var bottom = new THREE.Object3D();

  waterShape = new THREE.PlaneGeometry(ISLAND_WIDTH/2, width);
  water = new THREE.Mesh(waterShape, riverMaterial);
  wallShape = new THREE.CubeGeometry(ISLAND_WIDTH/2, 10000, width);
  wall = new THREE.Mesh(wallShape, wallMaterial);
  wall.visible = false;
  bottom.add(water);
  bottom.add(wall);
  bottom.position.x = ISLAND_WIDTH/4;
  bottom.position.z = ISLAND_WIDTH/4;

  // list of water that blocks avatar
  blockers.push(wall);

  river.add(bottom);

  // Top segment of the river
  var top = new THREE.Object3D();

  waterShape = new THREE.PlaneGeometry(ISLAND_WIDTH/2, width);
  water = new THREE.Mesh(waterShape, riverMaterial);
  wallShape = new THREE.CubeGeometry(ISLAND_WIDTH/2, 10000, width);
  wall = new THREE.Mesh(wallShape, wallMaterial);
  wall.visible = false;
  top.add(water);
  top.add(wall);
  top.position.x = -ISLAND_WIDTH/3;
  top.position.z = ISLAND_WIDTH/4;

  // list of water that blocks avatar
  blockers.push(wall);

  river.add(top);

  river.position.y = 1;
  return river;
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

  if (controls.moveUp) controls.moveUp = false;
  if (controls.moveDown) controls.moveDown = false;


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
  var intersects = ray.intersectObjects(blockers);

  if (intersects.length > 0) {
    if (intersects[0].distance < 75) {
      if (controls.moveLeft) controls.moveLeft = false;
      if (controls.moveRight) controls.moveRight = false;
      if (controls.moveBackward) controls.moveBackward = false;
      if (controls.moveForward) controls.moveForward = false;
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
