import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import URDFLoader from 'urdf-loader';

import csq_path     from './assets/25_central_square.glb';
import robot_path     from './assets/kinova.urdf';
//const robot_path     from '/assets/kinova.urdf';


const ARENAS = {
    "25_central_square": csq_path
}

export default function loadModel(arena_name) {
  const model_path = ARENAS[arena_name];
  
  const uri = `model://${arena_name}/meshes/${model_path.split('/').pop()}`; //added
  
  
  const loader = new GLTFLoader();
  
  
  return loader.loadAsync(model_path).then(gltf => {
    // Traverse all child objects and set a URI tag
    gltf.scene.traverse(obj => {
      if (obj.isMesh) {
        obj.userData.uri = uri;
      }
    });
    return gltf.scene;
  });
}

export function loadRobot() {
  const loader = new URDFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      robot_path,
      (robot) => resolve(robot),
      undefined, // onProgress (optional)
      (error) => reject(error)
    );
  });
}
