Physijs.scripts.worker = 'scripts/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

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
  // scene = new THREE.Scene();
  scene = new Physijs.Scene;

  var fence = new Physijs.BoxMesh(
    new THREE.CubeGeometry(ISLAND_WIDTH, 1000, 10),
    Physijs.createMaterial(
      new THREE.Material(), 0.2, 1.0
    ),
    0
  );
  fence.position.z = -ISLAND_HALF;
  fence.position.y = 500;
  scene.add(fence);

  fence = new Physijs.BoxMesh(
    new THREE.CubeGeometry(ISLAND_WIDTH, 1000, 10),
    Physijs.createMaterial(
      new THREE.Material(), 0.2, 1.0
    ),
    0
  );
  fence.position.z = ISLAND_HALF;
  fence.position.y = 500;
  scene.add(fence);

  fence = new Physijs.BoxMesh(
    new THREE.CubeGeometry(10, 1000, ISLAND_WIDTH),
    Physijs.createMaterial(
      new THREE.Material(), 0.2, 1.0
    ),
    0
  );
  fence.position.x = -ISLAND_HALF+10;
  fence.position.y = 500;
  scene.add(fence);

  fence = new Physijs.BoxMesh(
    new THREE.CubeGeometry(10, 1000, ISLAND_WIDTH),
    Physijs.createMaterial(
      new THREE.Material(), 0.2, 1.0
    ),
    0
  );
  fence.position.x = ISLAND_HALF-10;
  fence.position.y = 500;
  scene.add(fence);

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
  var island = new Physijs.PlaneMesh(
    new THREE.PlaneGeometry(ISLAND_WIDTH, ISLAND_WIDTH),
    new THREE.MeshBasicMaterial({color: 0x7CFC00})
  );
  scene.add(island);

  scene.add(river());

  // A ball
  ball = new Physijs.SphereMesh(
    new THREE.SphereGeometry(100),
    Physijs.createMaterial(
      new THREE.MeshNormalMaterial(),
      0.2,
      1.0
    )
  );

  ball.position.z = -500;
  ball.position.y = 100;
  scene.add(ball);

  avatar = buildAvatar();
  avatar.position.y = 30;
  // a_frame = new THREE.Object3D(
  a_frame = new Physijs.BoxMesh(
    new THREE.CubeGeometry(250, 250, 250),
    new THREE.Material(),
    1000*1000*1000
  );
  a_frame.position.y = 125;
  a_frame.add(avatar);
  scene.add(a_frame);
  a_frame.setDamping(0.9, 1.0);

  scene.add(new THREE.AmbientLight(0xffffff));

  controls = new THREE.FirstPersonControls(a_frame);
  controls.movementSpeed = 10000;
  controls.activeLook = false;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 1000;
  camera.position.y = 750;
  camera.rotation.x = -Math.PI / 8;
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

  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 100, 100),
    material
  );
  avatar.add(body);

  var img = new Image();
  var texture = new THREE.Texture(img);
  img.onload = function () { texture.needsUpdate = true; };
  img.src = 'face.png';
  texture.needsUpdate = true;

  var head_material = new THREE.MeshPhongMaterial({
    map: texture,
    shininess: 40
  });
  var head_geometry = new THREE.SphereGeometry(75);
  var head = new THREE.Mesh(head_geometry, head_material);
  head.position.y = (100 + 35) * .8;
  head.rotation.y = -Math.PI/2;
  avatar.add(head);

  var light = new THREE.PointLight(0xffffff, 10);
  light.position.set(50, 300, 0);
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
  // blockers.push(wall);

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

  // blockers.push(wall);
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

  if (moving) {
    avatar_left_leg.rotation.x  =    amplitude*(Math.PI/6);
    avatar_right_leg.rotation.x = -1*amplitude*(Math.PI/6);

    avatar_left_arm.rotation.x  =    amplitude*(Math.PI/6);
    avatar_right_arm.rotation.x = -1*amplitude*(Math.PI/6);

    if (controlState.moveLeft) spinAvatar(-Math.PI/2);
    if (controlState.moveRight) spinAvatar(Math.PI/2);
    if (controlState.moveForward) spinAvatar(Math.PI);
    if (controlState.moveBackward) spinAvatar(0);
  }
  else {
    spinAvatar(0);
  }

  a_frame.rotation.set(0,0,0);
  a_frame.__dirtyRotation = true;
  scene.simulate(); // run physics

  renderer.render(scene, camera);

  // controls.update(clock.getDelta());
}

function spinAvatar(angle) {
  new TWEEN.Tween( { y: avatar.rotation.y } )
      .to( { y: angle }, 100 )
      .onUpdate( function () {
         avatar.rotation.y = this.y;
      })
      .start();
}


var speed = 500;
var moving = false;
var controlState = {};
document.addEventListener("keydown", function(event) {
  // Last wins (for now) because we set the velocity, not apply force
  function setState(state) {
    moving = true;
    controlState = {};
    controlState[state] = true;
  }

  var code = event.which || event.keyCode;
  if (code == 0x57) { // w
    setState("moveForward");
    a_frame.setLinearVelocity({z: -speed, y: 0, x: 0 });
  }
  if (code == 0x41) { // a
    setState("moveLeft");
    a_frame.setLinearVelocity({z: 0, y: 0, x: -speed });
  }
  if (code == 0x53) { // s
    moving = true;
    setState("moveBackward");
    a_frame.setLinearVelocity({z: speed, y: 0, x: 0 });
  }
  if (code == 0x44) { // d
    moving = true;
    setState("moveRight");
    a_frame.setLinearVelocity({z: 0, y: 0, x: speed });
  }
});

document.addEventListener("keyup", function(event) {
  function stopState(state) {
    if (controlState[state]) {
      moving = false;
      controlState = {};
    }
  }

  var code = event.which || event.keyCode;
  if (code == 0x57) { // w
    stopState("moveForward");
    // a_frame.setLinearVelocity({z: 0, y: 0, x: 0 });
  }
  else if (code == 0x41) { // a
    stopState("moveLeft");
    // a_frame.setLinearVelocity({z: 0, y: 0, x: 0 });
  }
  else if (code == 0x53) { // s
    stopState("moveBackward");
    // a_frame.setLinearVelocity({z: 0, y: 0, x: 0 });
  }
  else if (code == 0x44) { // d
    stopState("moveRight");
    // a_frame.setLinearVelocity({z: 0, y: 0, x: 0 });
  }
});
