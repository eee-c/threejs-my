var player, camera, scene, renderer, world, player_fixture;

document.addEventListener("DOMContentLoaded", function() {
  init();

  if (!renderer) {
    alert("Can't make renderer. What kind of browser are you using?!");
    return;
  }

  gameStep();
  animate();
});

function init() {
  renderer = initRenderer(0x87CEEB);

  scene = new THREE.Scene;

  player = new THREE.Mesh(
    new THREE.CubeGeometry(20, 50, 1),
    // new THREE.MeshBasicMaterial({color: 0xB22222})
    new THREE.MeshNormalMaterial({color: 0xB22222})
  );
  scene.add(player);

  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 1, 10000
  );
  camera.position.z = 100;
  camera.lookAt(player.position);

  scene.add(camera);

  startPhysics();
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

function startPhysics() {
  var b2Vec2 = Box2D.Common.Math.b2Vec2
    , b2World = Box2D.Dynamics.b2World
    , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    , b2BodyDef = Box2D.Dynamics.b2BodyDef
    , b2Body = Box2D.Dynamics.b2Body
    , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;

  world = new b2World(
    new b2Vec2(0, -1e2),    //gravity
    true                  //allow sleep
  );

  var fixDef = new b2FixtureDef;
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;

  var bodyDef = new b2BodyDef;

  //create ground
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.position.y = -50;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(1e5, 0.5);
  world.CreateBody(bodyDef).CreateFixture(fixDef);

  // player
  bodyDef.type = b2Body.b2_dynamicBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(10, 0.1);

  bodyDef.position.x = -20;
  bodyDef.position.y = 100;
  player_fixture = world.CreateBody(bodyDef).CreateFixture(fixDef);
}


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function gameStep() {
  world.Step(
    1 / 60,   //frame-rate
    10,       //velocity iterations
    10       //position iterations
  );
  world.ClearForces();

  var pos = player_fixture.GetBody().GetDefinition().position;
  player.position.x = pos.x;
  player.position.y = pos.y;

  setTimeout(gameStep, 1000 / 60); // process the game logic
                                   // at a target 60 FPS.
}

document.addEventListener("keydown", function(event) {
  var code = event.which || event.keyCode;

  var events = {
    37: left,  // left arrow
    39: right, // right arrow
    38: up,    // up arrow
    32: up     // space bar
  };

  if (events[code]) events[code]();
  else console.log(code);
});

function left()  { move(-1e4, 0); }
function right() { move(1e4, 0); }
function up()    { move(0, 1e5); }

function move(x, y) {
  var b2Vec2 = Box2D.Common.Math.b2Vec2
    , body = player_fixture.GetBody()
    , method = (y>0) ? 'ApplyForce' : 'ApplyImpulse';

  body[method](
    new b2Vec2(x, y),
    body.GetWorldCenter()
  );
}
