var camera, scene, renderer, clock, controls,
avatar, avatar_left_leg, avatar_right_leg, avatar_left_arm, avatar_right_arm;

document.addEventListener( "DOMContentLoaded", function( e ) {
  init();

  clock = new THREE.Clock(true);
  animate();
});

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 1000;
  scene.add(camera);

  // THREE.FlyControls.prototype.mousemove = function() {};
  // THREE.FlyControls.prototype.mousedown = function() {};
  // THREE.FlyControls.prototype.mouseup = function() {};

  controls = new THREE.FlyControls(camera);
  controls.movementSpeed = 1000;
  controls.rollSpeed = 1.0;
  controls.dragToLook = true;

  // controls.prototype.mousemove = function() {};
  // controls.prototype.mousedown = function() {};
  // controls.prototype.mouseup = function() {};

  // controls.lookSpeed = 0.125;
  // controls.lookVertical = true;

  //controls.freeze = true;

  // controls.movementSpeed = 100.0;
	// controls.lookSpeed = 5.0;

  avatar = buildAvatar();
  scene.add(avatar);

  avatar_left_arm = avatar.getChildByName("left_arm", true);
  avatar_right_arm = avatar.getChildByName("right_arm", true);
  avatar_left_leg = avatar.getChildByName("left_leg", true);
  avatar_right_leg = avatar.getChildByName("right_leg", true);

  renderer = new THREE.CanvasRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
}

function buildAvatar() {
  var avatar = new THREE.Object3D();

  var material = new THREE.MeshNormalMaterial();

  var body_geometry = new THREE.CylinderGeometry(1, 300, 300);
  var body = new THREE.Mesh(body_geometry, material);
  body.position.z = -150;
  avatar.add(body);

  var head_geometry = new THREE.SphereGeometry(200);
  var head = new THREE.Mesh(head_geometry, material);
  head.position.y = 200;
  avatar.add(head);

  var right_arm = limb(material);
  right_arm.name = 'right_arm';
  right_arm.position.x = 150;
  right_arm.position.z = -50;
  right_arm.rotation.z = -Math.PI/3;

  avatar.add(right_arm);

  var left_arm = limb(material);
  left_arm.name = 'left_arm';
  left_arm.position.x = -150;
  left_arm.position.z = -50;
  left_arm.rotation.z = Math.PI/3;
  avatar.add(left_arm);

  var left_leg = limb(material);
  left_leg.name = 'left_leg';
  left_leg.rotation.z = Math.PI;
  left_leg.position.y = -275;
  left_leg.position.x = -100;
  left_leg.position.z = -150;
  avatar.add(left_leg);

  var right_leg = limb(material);
  right_leg.name = 'right_leg';
  right_leg.rotation.z = Math.PI;
  right_leg.position.y = -275;
  right_leg.position.x = 100;
  right_leg.position.z = -150;
  avatar.add(right_leg);

  return avatar;
}

function limb(material) {
  var limb = new THREE.Object3D();

  var arm_geometry = new THREE.CylinderGeometry(25, 25, 500);
  var arm = new THREE.Mesh(arm_geometry, material);
  limb.add(arm);

  var hand_geometry = new THREE.SphereGeometry(75);
  var hand = new THREE.Mesh(hand_geometry, material);
  hand.position.y = 250;
  limb.add(hand);

  return limb;
}


function animate() {
  // note: three.js includes requestAnimationFrame shim
  requestAnimationFrame(animate);
  render();
}

var w = 500;
function render() {
  var t_float = clock.getElapsedTime()
    , t = t_float * 1000
    , amplitude = (w/2 - Math.abs((t % (2*w)) - w))/w;

  avatar_left_leg.rotation.x  =    amplitude*(Math.PI/8);
  avatar_right_leg.rotation.x = -1*amplitude*(Math.PI/8);

  avatar_left_arm.rotation.x  =    amplitude*(Math.PI/8);
  avatar_right_arm.rotation.x = -1*amplitude*(Math.PI/8);

  renderer.render(scene, camera);

  controls.update(clock.getDelta());
}
