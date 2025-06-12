import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import URDFLoader from 'urdf-loader';

import model_path     from './assets/25_central_square.glb';
import robot_path     from './assets/kinova.urdf';
//const robot_path     from '/assets/kinova.urdf';

export default function loadModel() {
  const loader = new GLTFLoader();

  return loader.loadAsync(model_path)
    .then(gltf => gltf.scene);
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
