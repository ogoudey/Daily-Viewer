export default async function generateSDF (scene) {
    const sdfParts = [];

    sdfParts.push('<?xml version="1.0" ?>');
    sdfParts.push('<sdf version="1.6">');
    sdfParts.push('<world name="default">');

    scene.traverse(obj => {
        console.log("Traversing", obj.name)
        if (obj.isMesh) {
            const sdfName = obj.item_name;
            const meshUri = "TODO";
            const mass = 1.0;
            
            const pos = obj.position;
            const rot = obj.rotation;

            sdfParts.push(`<model name="${sdfName}">`);
            sdfParts.push(`  <static>false</static>`);
            sdfParts.push(`  <link name="link">`);
            sdfParts.push(`    <pose>${pos.x} ${pos.y} ${pos.z} ${rot.x} ${rot.y} ${rot.z}</pose>`);
            sdfParts.push(`    <inertial><mass>${mass}</mass></inertial>`);
            sdfParts.push(`    <visual name="visual">`);
            sdfParts.push(`      <geometry><mesh><uri>${meshUri}</uri></mesh></geometry>`);
            sdfParts.push(`    </visual>`);
            sdfParts.push(`    <collision name="collision">`);
            sdfParts.push(`      <geometry><mesh><uri>${meshUri}</uri></mesh></geometry>`);
            sdfParts.push(`    </collision>`);
            sdfParts.push(`  </link>`);
            sdfParts.push(`</model>`);
            }
    });

    sdfParts.push('</world>');
    sdfParts.push('</sdf>');
    
    return sdfParts.join('\n');
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
