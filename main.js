import * as THREE from 'three';
import { InteractionManager } from './js/three.interactive.js';
import { OrbitControls } from './js/OrbitControls.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import { RGBELoader } from './js/RGBELoader.js';
import { MTLLoader } from './js/MTLLoader.js';
import { OBJLoader } from './js/OBJLoader.js';
import { CSS2DRenderer, CSS2DObject } from './js/CSS2DRenderer.js';

import { gsap } from "gsap";

var global_label;
var global_object;
var global_child;
var MODEL_TYPE;
let selected_elements = {}

const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(),
  new THREE.MeshBasicMaterial()
);
mesh.geometry.computeBoundingBox();

const stats = new Stats();
stats.dom.style.left = 'auto';
stats.dom.style.right = '0';
stats.dom.style.top = 'auto';
stats.dom.style.bottom = '0';
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1; // changed from 1.2
document.getElementById('container').appendChild(renderer.domElement);

// LABEL
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.id = 'labelRenderer'
document.getElementById('container').appendChild(labelRenderer.domElement);
// document.body.appendChild( labelRenderer.domElement );

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  25,
  window.innerWidth / window.innerHeight,
  0.01,
  10000
);

if (env.start.hasOwnProperty("camera_position"))
  camera.position.set(...env.start.camera_position);
// camera.position.set(11.011675925552135, 12.01484409108719, -16.173583451058594);

// {x: 11.011675925552135, y: 12.01484409108719, z: -16.173583451058594}
// _Vector3 {x: -17.875158077919778, y: 42.66562854748416, z: 45.09580434623089}

// const _camera = new THREE.PerspectiveCamera(
//   25,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   1000
// );
// // _camera.position.set(11.011675925552135, 12.01484409108719, -16.173583451058594);
// let cameraPerspectiveHelper = new THREE.CameraHelper(_camera);
// scene.add(cameraPerspectiveHelper);

const controls = new OrbitControls(camera, labelRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.minDistance = 0.01; // 0.1;
controls.maxDistance = 100000; // 10000;
// controls.target.set(0, 0, 0);
// controls.target.set(1.6026395000762448, -2.428353519051226, -0.35886733140890414);
// _Vector3 {x: 1.6026395000762448, y: -2.428353519051226, z: -0.35886733140890414}
// _Vector3 {x: -6.169298198569686, y: -2.6444192575129084, z: -5.118301815393441}
controls.update();

const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById('progress-bar');
if (progressBar) {
  loadingManager.onProgress = function (item, loaded, total) {
    progressBar.style.width = (loaded / total) * 100 + '%';
    progressBar.textContent = (loaded / total) * 100 + '%'
  };

  loadingManager.onLoad = function () {
    progressBar.style.width = '100%';
    setTimeout(() => {
      progressBar.style.display = 'none';
    }, 500);
  };
}

const axesHelper = new THREE.AxesHelper(2)
scene.add(axesHelper)

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

const logDiv = document.querySelector('#title .log');
// const coordsDiv = document.querySelector('#coords');

if (env.modeller && env.modeller.length) {
  for (const model of env.modeller) {
    preloadModel(model)
  }
} else if (env.model && env.model.length) {
  preloadModel(env.model)
}

function preloadModel(model) {
  switch (true) {
    case /\.gltf/g.test(model):
      MODEL_TYPE = "GLTF"
      doLoadGLTF(model)
      break;
    case /\.obj/g.test(model):
      MODEL_TYPE = "OBJ"
      doLoadOBJ(model)
      break;


    default:
      alert("Fandt ikke model typen")
      break;
  }
}

function doLoadOBJ(model) {
  if (!doLoadOBJ.light_setup) {
    doLoadOBJ.light_setup = true
    const ambientLight = new THREE.AmbientLight(0xffffff, .5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 100);
    camera.add(pointLight);
    scene.add(camera);
  }
  THREE.ColorManagement.legacyMode = false

  renderer.outputEncoding = THREE.sRGBEncoding;

  const loader = new MTLLoader().setPath(env.mappe)
  loader.manager = loadingManager

  let mtl_path = model.replace(/\.obj$/g, "") + '.mtl'
  let obj_path = model

  console.log(mtl_path, obj_path)

  loader.load(mtl_path, function (materials) {

    materials.preload();

    const obj_loader = new OBJLoader()
      .setMaterials(materials)
      .setPath(env.mappe)
    obj_loader.manager = loadingManager

    obj_loader.load(obj_path, async function (object) {
      const emissiveIntensity = 0.5;

      // console.log("getWorldPosition", object.getWorldPosition(new THREE.Vector3()))
      // console.log("getWorldQuaternion", object.getWorldQuaternion(new THREE.Quaternion()))
      // console.log("getWorldScale", object.getWorldScale(new THREE.Vector3()))
      // console.log("getWorldDirection", object.getWorldDirection(new THREE.Vector3()))
      // console.log("localToWorld", object.localToWorld(new THREE.Vector3()))
      // debugger

      // object.position.y = - 0.95;

      if (env.start.hasOwnProperty("model_position"))
        object.position.set(...env.start.model_position);
      if (env.start.hasOwnProperty("model_rotation"))
        object.rotation.set(...env.start.model_rotation);
      if (env.start.hasOwnProperty("model_scalar"))
        object.scale.setScalar(env.start.model_scalar);

      if (env.start.hasOwnProperty("model_scale")) {
        const scale = new THREE.Vector3(...env.start.model_scale);
        object.scale.multiply(scale);
      }

      // add
      scene.add(object);

      await renderer.compileAsync(object, camera, scene);

      global_object = object

      // eventlistners
      let objectsHover = [];
      let i = 0;

      object.traverse((child) => {
        // Add only objects widthout children
        if (child.children.length === 0) {
          if (i == 0) {
            // Labels
            const center = child.getVertexPosition(0, new THREE.Vector3()); // boundingBox.getCenter(new THREE.Vector3());
            console.log("center", center)

            const objectDiv = document.createElement('div');
            objectDiv.className = 'label';
            objectDiv.textContent = /* getLabel() || */ child.name || 'Object';

            const objectLabel = new CSS2DObject(objectDiv);

            objectLabel.position.copy(center);
            objectLabel.center.set(0, 2);


            child.add(objectLabel);

            objectLabel.layers.set(0);


            global_child = child
            global_label = objectLabel
          }
          i++

          if (child.material) {
            if (!Array.isArray(child.material))
              child.material = [child.material]

            for (let cm of child.material) {
              cm = cm.clone();

              child.userData.initialEmissive =
                cm.emissive.clone();
              cm.emissiveIntensity = emissiveIntensity;

              // options
              // ...
            }
          }

          interactionManager.add(child);

          addMouseover(child, objectsHover, emissiveIntensity);

          addMouseout(child, objectsHover)

          addMousedown(child, objectsHover)
        } // else debugger
      });
    }, function (x) {
      // console.log("progress", x)
    }, function (x) {
      console.error("error", x)
    });

  });
}

function doLoadGLTF(model) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load('textures/skybox_512px.hdr', (texture) => {
    let envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
  });

  rgbeLoader.manager = loadingManager;

  const loader = new GLTFLoader().setPath(env.mappe);
  loader.manager = loadingManager;

  loader.load(model,
    async function (gltf) {
      const model = gltf.scene;
      const emissiveIntensity = 0.75;

      await renderer.compileAsync(model, camera, scene);

      scene.add(model);

      let objectsHover = [];

      model.traverse((child) => {
        if (child.children.length === 0) {
          // Add only objects widthout children
          if (child.material) {
            child.material = child.material.clone();
            child.userData.initialEmissive =
              child.material.emissive.clone();
            child.material.emissiveIntensity = emissiveIntensity;
          }

          interactionManager.add(child);

          addMouseover(child, objectsHover, emissiveIntensity);

          addMouseout(child, objectsHover)

          addMousedown(child, objectsHover)
        } // else debugger
      });
    }
  );
}

function addMouseover(child, objectsHover, emissiveIntensity) {
  child.addEventListener('mouseover', (event) => {
    // console.log(event);
    // event.stopPropagation();
    if (!objectsHover.includes(event.target))
      objectsHover.push(event.target);

    document.body.style.cursor = 'pointer';

    // calc center coords
    const boundingBox = new THREE.Box3().setFromObject(event.target);
    const center = boundingBox.getCenter(new THREE.Vector3());

    child.box = new THREE.BoxHelper(event.target.parent, 0xffff00);
    scene.add(child.box);

    // show center coords
    const path = getPath(event.target);
    logDiv.innerHTML =
      '<span style="color: #ff0000">' +
      path +
      ' – mouseover</span>'
      + '<br>Center: ' + JSON.stringify(center);

    if (child.material) {
      if (!Array.isArray(child.material))
        child.material = [child.material]

      for (let cm of child.material) {
        child.userData.materialEmissiveHex =
          cm.emissive.getHex();
        cm.emissive.setHex(0xff0000);
        cm.emissiveIntensity = emissiveIntensity;
      }
    }
  })
}
function addMouseout(child, objectsHover) {
  child.addEventListener('mouseout', (event) => {
    // console.log(event);
    // event.stopPropagation();
    scene.remove(child.box);

    objectsHover = objectsHover.filter((n) => n !== event.target);
    if (objectsHover.length > 0) {
      const o = objectsHover[objectsHover.length - 1];

      if (!Array.isArray(o.material))
        o.material = [o.material]

      for (let om of o.material) {
        om.emissive.setHex(0xff0000);
      }

      logDiv.innerHTML = getPath(o);
    } else {
      logDiv.innerHTML = '';
    }

    document.body.style.cursor = 'default';

    if (child.material) {
      if (!Array.isArray(child.material))
        child.material = [child.material]

      for (let cm of child.material) {
        cm.emissive.setHex(child.userData.materialEmissiveHex);
        if (MODEL_TYPE == "OBJ")
          cm.emissiveIntensity = 0;
      }
    }

    // if (child.material) {
    //   if (!Array.isArray(child.material))
    //     child.material = [child.material]

    //   for (let cm of child.material) {
    //     cm.emissive.setHex(
    //       child.userData.materialEmissiveHex
    //     );
    //   }
    // }
  });
}
function addMousedown(child, objectsHover) {
  child.addEventListener('mousedown', (event) => {
    // only left click
    if (event.originalEvent.which && event.originalEvent.which != 1) return

    event.stopPropagation();

    if (child.material) {
      if (!Array.isArray(child.material))
        child.material = [child.material]

      for (let cm of child.material) {
        cm.emissive.setHex(0x0000ff);
      }
    }

    fitCameraToObject(event.target /* .parent */, env.start.click_offset)

    const path = getPath(event.target);
    logDiv.innerHTML =
      '<span style="color: #0000ff">' +
      path +
      ' – mousedown</span>';

    // add element to selected elements
    selected_elements = {
      target: event.target,
      child: child
    }
  });
}


// const updateCoords = () => {
//   coordsDiv.innerHTML =
//     '<span style="color: white;">'
//     + `{${camera.position.x},${camera.position.y},${camera.position.z}}`
//     + "<br>"
//     + `{${controls.target.x},${controls.target.y},${controls.target.z}}`
// }

const animate = (time) => {
  requestAnimationFrame(animate);

  controls.update();

  interactionManager.update();

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  stats.update();

  // update coords
  // updateCoords();
};

animate();

window.addEventListener('resize', handleWindowResize, false);

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function getPath(object) {
  const string = object.name + ' [' + object.type + ']';

  if (object.parent) {
    return getPath(object.parent) + ' > ' + string;
  } else {
    return string;
  }
}



// ------------------------

function fitCameraToObject(object, offset) {
  const __camera = camera
  // For testing start with the current controlCamera's position
  // __camera.position.set(camera.position.x, camera.position.y, camera.position.z)

  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  const canvas = document.querySelector("#container canvas")

  const canvasWidth = canvas.getBoundingClientRect().width
  const canvasHeight = canvas.getBoundingClientRect().height
  const minSize = Math.min(...[boundingBox.min.x, boundingBox.min.y, boundingBox.min.z])
  const maxSize = Math.max(...[boundingBox.max.x, boundingBox.max.y, boundingBox.max.z])

  const aspect = canvasWidth / canvasHeight
  const fov = 75
  const near = 0.1
  const far = 1000

  let cameraZoom = 1
  // console.log("init camera.position", __camera.position)
  // console.log("init camera.zoom", __camera.zoom);
  // console.log("init controls", controls.target)
  // console.log("center", center);
  // console.log("size", size);

  gsap.to(__camera.position, {
    duration: 1, // seconds
    x: center.x > 1 ? center.x - (size.x * offset) : (center.x + (size.x * offset)),
    y: center.y + (size.y * offset),
    // y is up
    z: center.z < 0 ? center.z - (size.z * offset) : (center.z + (size.z * offset)),
    onUpdate: function () {
      // __camera.lookAt(center);
      controls.target.set(center.x, center.y, center.z);

    },
    onComplete: function () {
      // cameraZoom = 45 / maxSize;
      // __camera.zoom = cameraZoom;
    }
  });

  console.log("camera", __camera.position)
  console.log("camera.zoom", __camera.zoom);
  console.log("controls", controls.target)

}
