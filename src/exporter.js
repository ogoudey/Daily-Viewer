import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export default async function generateSDF (scene) {
    const sdfParts = [];
    const meshFiles = [];
    const uniqueMeshes = new Set();

    sdfParts.push('<?xml version="1.0" ?>');
    sdfParts.push('<sdf version="1.6">');
    sdfParts.push('<world name="default">');
    
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
    
    console.log("Traversing", scene);
    const meshObjects = [];
    scene.traverse(obj => {
      if (obj.isMesh) {
        meshObjects.push(obj);
      }
    });
    
    for (const obj of meshObjects) {
        console.log("Traversing", obj)
        let sdfName;
        if (obj.userData.item_name) {
            sdfName = obj.userData.item_name;
        } else {
            sdfName = obj.name;    
        }
        sdfName += generateID();
        
        
        const meshName = obj.name;
        const filename = `${meshName}.glb`;
        const uri = `meshes/${filename}`;
        console.log(uniqueMeshes, "contains", filename, "?");
        if (uniqueMeshes.has(filename)) {
            //
        } else {
            console.log("No...");
            const glbBlob = await exportMesh(obj, meshName);
            meshFiles.push({ filename, blob: glbBlob });
            uniqueMeshes.add(filename);
        }        
        
        const mass = 1.0;
        
        const pos = obj.position;
        const rot = obj.rotation;
        
        const x = pos.x;
        const y = pos.z;  // Z in Three.js becomes Y in Gazebo
        const z = pos.y;

        const roll  = rot.x;
        const pitch = rot.z;  // Swap
        const yaw   = rot.y;
        
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

    sdfParts.push('</world>');
    sdfParts.push('</sdf>');
    
    return { sdf: sdfParts.join('\n'), meshFiles };
}

function generateID() {
  return crypto.randomUUID().slice(-5);
}



/*

<?xml version="1.0" ?>
<sdf version="1.6">
  <world name="default">
    <include>
      <uri>model://ground_plane</uri>
    </include>

    <include>
      <uri>model://sun</uri>
    </include>
  </world>
</sdf>

*/
