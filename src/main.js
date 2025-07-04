import * as THREE from 'three';
import 'bootstrap/dist/css/bootstrap.min.css';

import loadModel, {loadRobot}  from './loader.js';
import generateSDF  from './exporter.js';
import placers  from './placer.js';
console.log(placers); // Should print whawt objects: A. were arranged & in inventory B. were in inventory and not arranged 

//const backend_ip_address = "192.168.0.10"
const backend_ip_address = "localhost"
console.log("1. imports done");
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({antialias: true, canvas}); // This calls what we pass requestAnimationFrame
const fov = 120;
const aspect = 2;  // the canvas default
const near = 0.01;
const far = 200;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// All 0s works:
camera.position.z = 0;
camera.position.x = 0;
camera.position.y = 0;
camera.rotation.x = -1;
camera.rotation.y = 0.0;
camera.rotation.z = 0.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color('gray');
scene.updateMatrixWorld(true);

const color = 0xFFFFFF;
const intensity = 5;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
//scene.add(light);
camera.add(light);

///////////////////
// Class helpers//
/////////////////

class PickHelper {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
    }
// -------mousemove   
    pick(normalizedPosition, scene, camera) {
        if (this.pickedObject) {
          this.pickedObject = undefined;
        }
        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
          // pick the first object. It's the closest one
          this.pickedObject = intersectedObjects[0].object;
          return this.pickedObject;
        }
    }
}

/////////////////////
// Initializing   //
///////////////////

const pickHelper = new PickHelper();

const pickPosition = {x: 0, y: 0};
clearPickPosition();





/////////////////////
//   UI vars      //
///////////////////
let choice = "";
let hovered = "";
let rotate_active = true;
let tick = 0;
let robots = [];

/////////////////////
//  Arena-level   //
///////////////////
let model = null;
let inventory = null;
let arena = null;

///////////////////
//    World     //
/////////////////
let worldNotation = {
    "25_central_square": {
        "cameras": ["camera_point_barista", "camera_point_scooper"]
    }
}

/////////////////////
// major helpers  //
///////////////////
console.log("2. things initialized");

async function load(arenaToLoad) {
    console.log("3.0.0 loading start")
    if (!arenaToLoad) {
        arenaToLoad = getRandomArena(worldNotation)
    }
    console.log("3.0.0.0 loading", arenaToLoad)
    try {
      const modelScene = await loadModel(arenaToLoad);
      scene.add(modelScene);
      model = modelScene;
      model.rotation.y = 0.0;
    } catch (err) {
      console.error(err);
    }
    console.log("3.0.0.1 arena loaded")
    try {
      const dataSeries = await loadData(arenaToLoad);

        if (dataSeries.length > 0) {
          const latest = dataSeries[dataSeries.length - 1];
          inventory = latest.data.inventory.items;
        } else {
          console.warn("No time series data found.");
        }
    } catch (err) {
      console.error('Failed to load JSON', err);
    }
    moveCameraToPoint(worldNotation[arenaToLoad]["cameras"][1]);
    arrange();
    arena = arenaToLoad;
    console.log("3.0.1 loading done. arena:", arena)
}

function arrange() {
    console.log("Arranging...");
    let originals = [];
    let itemsToPlace = structuredClone(inventory)
    let arrangedPerSpawnPoint = {};
    while (itemsToPlace.length > 0) {
      const item = itemsToPlace.shift();
      const original = scene.getObjectByName(item.geometry);
      if (!original) {
        console.warn(`No mesh named "${item.geometry}" found`);
        return;
      }
      
      const count = item.count;
      for (let i = 0; i < count; i++) {
        
        let worldPos = new THREE.Vector3();
        let worldQuat = new THREE.Quaternion();
        let worldScale = new THREE.Vector3(1,1,1);
        const spawnPoint = scene.getObjectByName(item.spawn);
        
        if (spawnPoint) {
          // Ensure world matrices are up to date
          spawnPoint.updateMatrixWorld(true);
          spawnPoint.getWorldPosition(worldPos);
          spawnPoint.getWorldQuaternion(worldQuat);
          spawnPoint.getWorldScale(worldScale);
        } else {
          console.warn('No spawn point named "${item.spawn}" found; defaulting to origin');
        }
        let placerFunction = placers[item.geometry];
        if (!placerFunction) {
            placerFunction = placers["default"]; // placeCup
            console.warn("No placer function implemented for", item.name);
        }
        let index = arrangedPerSpawnPoint[item.spawn] ? arrangedPerSpawnPoint[item.spawn] : 0;
        worldPos = placerFunction(worldPos, index);
        
        const clone = original.clone(true);
        const localPos = model.worldToLocal(worldPos.clone());
        clone.position.copy(localPos);
        clone.quaternion.copy(worldQuat);
        clone.scale.copy(worldScale);
        clone["item_name"] = item.name; // Added attribute.
        model.add(clone);
        console.log("Arranging", item.name, i + 1, "/", item.count, "at index", index);
        arrangedPerSpawnPoint[item.spawn] = arrangedPerSpawnPoint[item.spawn] ? arrangedPerSpawnPoint[item.spawn] + 1 : 1;
      }

      // now that we've made all the clones, remove the original
      originals.push(original);
      
      if (item.hasOwnProperty("case")) {
        itemsToPlace.push(item["case"])
      }
    }
    originals.forEach(toDelete => {toDelete.removeFromParent();});
}

function inspect() {
    if (choice) {
        const choiceObject = choice;
        const worldPos = new THREE.Vector3();
        choiceObject.getWorldPosition(worldPos);
        const canvas = renderer.domElement;
        const { x, y } = worldToCanvasPos(worldPos, camera, canvas);

        const tag = document.getElementById('inspector');
        tag.style.visibility="visible";
        
        /// Inspector Styling ///
        tag.style.left = `${x}px`;
        tag.style.top  = `${y - 30}px`;
        
        let itemsToCheck = structuredClone(inventory);
        let item;
        while (itemsToCheck.length > 0) {
            item = itemsToCheck.shift();
            if (item.name === choiceObject.item_name) {
                break;
            }else {
                
                if (item.case) {
                    itemsToCheck.push(item.case);
                }
                item = null;
                
            }
        }
        
        tag.children[0].innerText = item ? item.name : "";
        const count = document.getElementById('count');
        const record = inventory.find(item => item.geometry === choiceObject.name);
        const num = item ? item.count : "untracked";
        count.innerText = num.toString();

    } else {
        const tag = document.getElementById('inspector');
        tag.style.visibility="hidden";
    }     
}

////////////////
// Start Up  //
//////////////

console.log("3. startup");

await load();

console.log("3.2 startup done");
requestAnimationFrame(render); // Point WebGL to render() below
console.log("4. first render request");
//////////////////////
// Render function //
////////////////////

function render(time) {
    tick += 1;
    time *= 0.001;  // convert time to seconds
    
    robots.forEach((robot) => {
        randomizeJoints(robot);
    });
    

    
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }    
    
    // Lazy stream for Arranging
    if (tick % 1000 === 0) {
        loadData(arena)
          .then(dataSeries => {
            if (dataSeries.length > 0) {
              const latest = dataSeries[dataSeries.length - 1];
              inventory = latest.data.inventory.items;
            } else {
              console.warn("No time series data found.");
            }
          })
          .catch(err => console.error('Failed to load JSON', err));
        arrange();
    }
    // end lazy stream
    
    if (model && rotate_active) {
        //camera.rotation.y = time * 0.1;  
    }
    
    hovered = pickHelper.pick(pickPosition, scene, camera);
    inspect();
    if (choice) {
        document.getElementById("chosen-part").innerText = choice.item_name;
    }
    if (hovered) {
        document.getElementById("hover-part").innerText = hovered.item_name;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}




///////////////////////
// Helper functions //
/////////////////////

async function spawnRobot(robotName, spawnPointName) {
    // Currently there's only one robot implemented
    let robot;
    await loadRobot()
    .then(robotScene => {
        robot = robotScene;
        scene.add(robotScene);
        robots.push(robot);
    })
    .catch(console.error);
    const spawnPoint = scene.getObjectByName(spawnPointName);
    spawnPoint.add(robot);
}

function moveCameraToPoint(pointName) {
  const newCameraPoint = scene.getObjectByName(pointName);
  if (!newCameraPoint) {
    console.warn(`Camera point '${pointName}' not found.`);
    return;
  }

  // Remove camera from current parent
  if (camera.parent) {
    camera.parent.remove(camera);
  }

  // Add camera to the new point
  newCameraPoint.add(camera);
}

function printAllMeshes(root) {
  const meshes = [];
  root.traverse(obj => {
    if (obj.isMesh) meshes.push(obj);
  });
  meshes.forEach((m, i) => {
    console.log(`${i}: name="${m.name}"`, m);
  });
  return meshes;
}

async function getArenaIdByName(name) {
  const response = await fetch(`http://localhost:5000/arenas/by_name/${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error("Arena not found");
  const result = await response.json();
  return result.arena_id;
}

async function loadData(arena_name) {
  try {
    const arenaId = await getArenaIdByName(arena_name);
    const response = await fetch(`http://localhost:5000/arenas/${arenaId}/data`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("Time-series data:", data);
    return data;
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

// -------click
function choose(event) {
    choice = pickHelper.pick(pickPosition, scene, camera);
    console.log(choice);
}

function worldToCanvasPos(worldPos, camera, canvas) {
  // Clone so we don't overwrite the original
  const pos = worldPos.clone();

  // Project into NDC space (x,y ∈ [-1,1])
  pos.project(camera);
   
  // Convert to pixels
  const halfW = canvas.clientWidth  / 2;
  const halfH = canvas.clientHeight / 2;

  return {
    x: ( pos.x * halfW ) + halfW,
    y: ( -pos.y * halfH ) + halfH,
  };
}

function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}
 
function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
  pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
}

function clearPickPosition() {
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
    renderer.setSize(width, height, false);
    }
    return needResize;
}

function randomizeJoints(robot) {
  for (const jointName in robot.joints) {
    const joint = robot.joints[jointName];

    if (joint.setJointValue) {
      // For revolute or continuous joints, random angle between -π and π
      const randomAngle = (Math.random() * 2 - 1) * Math.PI;
      joint.setJointValue(randomAngle);
    }
  }
}

function getRandomArena(json) {
  const keys = Object.keys(json);                            // e.g. ["A","V"]
  const idx  = Math.floor(Math.random() * keys.length);     // 0 ≤ idx < keys.length
  return keys[idx];
}

function addPointDropdown(id, f) {
    console.log("\t5.5.0");
    const menu = document.getElementById(id);
    console.log("\t5.5.1 arena:", arena);
    const options = worldNotation[arena].cameras; // Potentially change
    console.log("\t5.5.2");
    options.forEach(name => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dropdown-item";
        btn.textContent = name;
        // optional: hook up a click handler
        btn.addEventListener("click", () => {
            f(name);
        });
        li.appendChild(btn);
        menu.appendChild(li);
    });
}





console.log("5. helper functions declared");
/////////////////////
//Event Listeners //
///////////////////
window.addEventListener('click', choose);
window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

//mobile
window.addEventListener('touchstart', (event) => {
  // prevent the window from scrolling
  event.preventDefault();
  setPickPosition(event.touches[0]);
}, {passive: false});
 
window.addEventListener('touchmove', (event) => {
  setPickPosition(event.touches[0]);
  choose(event)
});
 
window.addEventListener('touchend', clearPickPosition);

// camera dropdown
console.log("5.5. before addPointDropdown('cameraMenu', moveCameraToPoint)");
addPointDropdown("cameraMenu", moveCameraToPoint);
console.log("6. first event-listeners");
const form = document.getElementById("arenaForm");
console.log("6.5. form:", form);
const arenas = Object.keys(worldNotation);
arenas.forEach((arenaName, idx) => {
  // 1) wrapper div
  const wrapper = document.createElement('div');
  wrapper.className = 'form-check';

  // 2) the radio input
  const input = document.createElement('input');
  input.className = 'form-check-input';
  input.type      = 'radio';
  input.name      = 'arenaOption';
  input.id        = `arena-option-${idx}`;
  input.value     = arenaName;
  if (idx === 0) input.checked = true;     // default first checked

  // 3) the label
  const label = document.createElement('label');
  label.className = 'form-check-label';
  label.htmlFor   = input.id;
  label.textContent = arenaName;

  // 4) assemble & attach
  wrapper.appendChild(input);
  wrapper.appendChild(label);
  form.appendChild(wrapper);
});
console.log("7. configure button made");
////////////////////////
//Specific Listeners //
//////////////////////

document.getElementById('reloadBtn').addEventListener('click', () => {
  // grab the checked radio’s value
  const chosen = document.querySelector('input[name="arenaOption"]:checked').value;
  // call the loader
  load(chosen);
  // hide the modal
  const modalEl = document.getElementById('configModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
});

const blButton = document.getElementById('bl-button');

function handleBottomLeftClick(event) {
  console.log('Bottom-left button clicked!', event);
    rotate_active = !rotate_active;
}

blButton.addEventListener('click', handleBottomLeftClick);

function handleTopLeftAction1Click(event) {
  console.log('Top-left Action 1 clicked!', event);
  moveCameraToPoint("camera_point_barista");
  
}

function handleTopLeftAction2Click(event) {
  console.log('Top-left Action 2 clicked!', event);
  moveCameraToPoint("camera_point_scooper");
}

const gazeboButton = document.getElementById('gazebo-button');

gazeboButton.addEventListener('click', async () => {
  console.log('Simulate with Gazebo clicked!');
  const sdf = await generateSDF(scene)
  console.log(sdf);
  //const res = await fetch('http://' + backend_ip_address + ':5000/launch-sim');
  //const output = await res.text();
});

const pyButton = document.getElementById('send_request');

pyButton.addEventListener('click', async () => {
  console.log('Sending...');
  const res = await fetch('http://' + backend_ip_address + ':5000/run-script');
  const output = await res.text();
  console.log('Python says:', output);
});

const pyButton3 = document.getElementById('restart');

pyButton3.addEventListener('click', async () => {
  console.log('Sending...');
  const res = await fetch('http://' + backend_ip_address + ':5000/restart');
  const output = await res.text();
  console.log('Mess:', output);
});

document.querySelectorAll('.dropdown-submenu > .dropdown-toggle')
          .forEach(t => t.addEventListener('click', e => {
              e.preventDefault();
              e.stopPropagation();
              bootstrap.Dropdown.getOrCreateInstance(t).toggle();
          }));

  document.querySelectorAll('.robot-spawn').forEach(btn =>
    btn.addEventListener('click', e => {
      const { robot, spawn } = e.currentTarget.dataset;
      console.log(`Spawn ${robot} at ${spawn}`);
      spawnRobot(robot, spawn);
    })
  );
console.log("8. rest of the buttons done - and Done.");
