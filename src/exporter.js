import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';

export default async function exportSDF (scene) {
    const sdfParts = [];
    const meshFiles = [];
    const uniqueMeshes = new Set(); // So meshes are reused, initialize a set of reuseable meshes.
    
    // Standard headers
    sdfParts.push('<?xml version="1.0" ?>');
    sdfParts.push('<sdf version="1.6">');
    // Add basic lighting
    sdfParts.push('<world name="default">');
    sdfParts.push('  <scene>');
    sdfParts.push('    <ambient>0.4 0.4 0.4 1.0</ambient>');
    sdfParts.push('  </scene>');
    sdfParts.push('  <light name="sun" type="directional">');
    sdfParts.push('    <cast_shadows>true</cast_shadows>');
    sdfParts.push('    <pose>0 0 10 0 0 0</pose>');
    sdfParts.push('    <diffuse>1 1 1 1</diffuse>');
    sdfParts.push('    <specular>0.1 0.1 0.1 1</specular>');
    sdfParts.push('    <direction>-0.5 -0.5 -1</direction>');
    sdfParts.push('  </light>');
    
    // Function to export mesh blob
    const exportMesh = (obj, name) =>
                new Promise((resolve) => {
                  exporter.parse(obj, (result) => {
                    const glb = new Blob([JSON.stringify(result)], {
                      type: 'application/octet-stream',
                    });
                    resolve(glb);
                  });
                });
            
    const exporter = new GLTFExporter();
    
    const meshObjects = [];
    
    scene.traverse(obj => {
      if (obj.isMesh) {
        meshObjects.push(obj);
      }
    });
    
    // Adding a containing model to convert coordinates of Three.js (Y-up) to SDF (Z-up)
    sdfParts.push('  <model name="scene_root">')
    sdfParts.push('    <pose>0 0 0 1.5708 0 0</pose>  <!-- +90° roll = rotate about X -->')
    sdfParts.push('    <static>true</static>')
    
    for (const obj of meshObjects) {
        let sdfName;
        
        if (obj.userData.item_name) {   // Useful for a project that spawned this module.
            sdfName = obj.userData.item_name;
        } else {
            sdfName = obj.name;
        }
        sdfName += "_" + generateID(); // To account for multiple of the same object names (disallowed in gazebo).
        
        const meshName = obj.name;
        const filename = `${meshName}.glb`;
        const uri = `meshes/${filename}`;
        console.log(uniqueMeshes, "contains", filename, "?");
        if (uniqueMeshes.has(filename)) {
            //
        } else {
            obj.updateMatrixWorld(true); // force full world matrix update
            const baked = obj.clone();
            baked.applyMatrix4(obj.matrixWorld);
            baked.position.set(0, 0, 0);
            baked.rotation.set(0, 0, 0);
            baked.scale.set(1, 1, 1);
            const glbBlob = await exportMesh(baked, meshName);
            meshFiles.push({ filename, blob: glbBlob });
            uniqueMeshes.add(filename);
        }        
        
        const mass = 1.0;
        
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const euler = new THREE.Euler();

        obj.getWorldPosition(pos);
        obj.getWorldQuaternion(quat);
        
        euler.setFromQuaternion(quat, 'XYZ');
        
        
        
        
        // Convert from Y-up (Three.js) to Z-up (Gazebo)
        const x = pos.x;
        const y = pos.y;  // Y-up → Z-up
        const z = pos.z;

        const roll  = euler.x;
        const pitch = euler.y;
        const yaw   = euler.z;
        
        sdfParts.push(`<model name="${sdfName}">`);
        sdfParts.push(`  <static>false</static>`);
        sdfParts.push(`  <link name="link">`);
        sdfParts.push(`    <pose>${x} ${y} ${z} ${roll} ${pitch} ${yaw}</pose>`);
        sdfParts.push(`    <inertial><mass>${mass}</mass></inertial>`);
        sdfParts.push(`    <visual name="visual">`);
        sdfParts.push(`      <geometry><mesh><uri>${uri}</uri></mesh></geometry>`);
        sdfParts.push(`    </visual>`);
        sdfParts.push(`    <collision name="collision">`);
        sdfParts.push(`      <geometry><mesh><uri>${uri}</uri></mesh></geometry>`);
        sdfParts.push(`    </collision>`);
        sdfParts.push(`  </link>`);
        sdfParts.push(`</model>`);
            
    }
    sdfParts.push(' </model>'); // end Containing model
    sdfParts.push('</world>');
    sdfParts.push('</sdf>');
    
    return { sdf: sdfParts.join('\n'), meshFiles };
}

// Helper for unique naming
function generateID() {
  return crypto.randomUUID().slice(-5);
}

export async function exportRobosuiteXML(scene) {
    const xmlParts = [];
    const meshFiles = [];

    const exportMesh = (obj) =>
        new Promise((resolve) => {
            const stlString = exporter.parse(obj);  // returns text (STL ASCII)
            const blob = new Blob([stlString], { type: 'text/plain' });
            resolve(blob);
        });

    const exporter = new STLExporter();

    const meshObjects = [];
    scene.traverse(obj => {
        if (obj.isMesh) meshObjects.push(obj);
    });

    xmlParts.push('<mujoco model="custom_scene">');
    xmlParts.push('  <asset>');

    const uniqueMeshes = new Set();
    
    for (const obj of meshObjects) {
        const meshName = obj.name;
        const filename = `${meshName}.stl`;
        const uri = `meshes/${filename}`;

        if (!uniqueMeshes.has(filename)) {
            const baked = obj.clone();
            baked.applyMatrix4(obj.matrixWorld);
            baked.applyMatrix4(obj.matrixWorld);
            baked.position.set(0, 0, 0);
            baked.rotation.set(0, 0, 0);
            baked.scale.set(1, 1, 1);
            const stlBlob = await exportMesh(baked);
            meshFiles.push({ filename, blob: stlBlob });
            xmlParts.push(`    <mesh name="${meshName}" file="${uri}"/>`);
            uniqueMeshes.add(filename);
        }
    }

    xmlParts.push('  </asset>');
    xmlParts.push('  <worldbody>');
    xmlParts.push('    <body>');
xmlParts.push('      <body name="object" pos="0 0 0" quat="1 0 0 0">');
    for (const obj of meshObjects) {
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        obj.getWorldPosition(pos);
        obj.getWorldQuaternion(quat);
        const xmlName = obj.name + "_" + generateID()
        xmlParts.push(`        <body name="${xmlName}" pos="${pos.x} ${pos.y} ${pos.z}" quat="${quat.w} ${quat.x} ${quat.y} ${quat.z}">`);
        xmlParts.push(`          <geom mesh="${obj.name}" type="mesh" mass="1.0" group="1"/>`);
        xmlParts.push('        </body>');
    }
    xmlParts.push('      </body>');
    xmlParts.push('    </body>');
    xmlParts.push('  </worldbody>');
    xmlParts.push('</mujoco>');

    return { xml: xmlParts.join('\n'), meshFiles };
}
