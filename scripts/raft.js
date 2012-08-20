var raft, camera, scene, renderer;

var canvas = !! window.CanvasRenderingContext2D;
var webgl = ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();

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

  scene = new THREE.Scene();

  raft = new THREE.Mesh(
    new THREE.TorusGeometry(25, 10, 16, 16),
    new THREE.MeshNormalMaterial()
  );
  raft.rotation.x = Math.PI/2;
  scene.add(raft);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 500;
  camera.lookAt(raft.position);

  raft.add(camera);
}

function animate() {
  // requestAnimationFrame(animate);
  render();
}

function render() {
  renderer.render(scene, camera);
}
