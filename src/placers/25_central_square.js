function placeSleeve(worldPos, i){
    worldPos.y = worldPos.y;
    worldPos.z -= i * 0.06;
    
    worldPos.x += i * 0.06;
    return worldPos;
}

function placeCup(worldPos, i){
    worldPos.x = worldPos.x;
    worldPos.z = worldPos.z;
    
    worldPos.y += i * 0.051;
    return worldPos;
}

function placeCupCase(worldPos, i){
    worldPos.x = worldPos.x;
    worldPos.z = worldPos.z;
    
    worldPos.y += i * 0.5;
    return worldPos;
}

function placeTub(worldPos, i){
    worldPos.x = worldPos.x - Math.floor(i/4)*0.26;
    worldPos.z = worldPos.z - i%4 * 0.26;
    worldPos.y = worldPos.y
    return worldPos;
}

function placeCoffee(worldPos, i){
    worldPos.y = worldPos.y;
    worldPos.z -= i * 0.1;
    
    worldPos.x += i * 0.1;
    return worldPos;
}

const placers = {
    "default": placeCup,
    "Cup": placeCup,
    "Coffee": placeCoffee,
    "Cup_Sleeve": placeSleeve,
    "Cup_Case": placeCupCase,
    "Ice_Cream_Tub": placeTub,
};

export default placers;


