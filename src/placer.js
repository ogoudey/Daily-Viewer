function placeSleeve(worldPos, i){
    worldPos.y = worldPos.y;
    worldPos.z -= i * 0.1;
    
    worldPos.x += i * 0.1;
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
    
    worldPos.y += i * 0.2;
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
    "Cup Sleeve": placeSleeve,
    "Cup Case": placeCupCase,
};

export default placers;


