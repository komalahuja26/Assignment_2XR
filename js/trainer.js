// workout-trainer.js

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 1, 0));
    camera.upperBetaLimit = Math.PI / 2 - 0.05;
    camera.attachControl(canvas, true);

    const light1 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light1.intensity = 0.7;

    const light2 = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, 1), scene);
    light2.position = new BABYLON.Vector3(20, 40, 20);
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.usePoissonSampling = true;

    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/valleygrass.png");
    groundMat.specularColor = new BABYLON.Color3(0, 0, 0);

    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", 
        "https://assets.babylonjs.com/environments/villageheightmap.png", 
        { width: 100, height: 100, subdivisions: 20, minHeight: 0, maxHeight: 10 }, scene);
    ground.material = groundMat;
    ground.receiveShadows = true;

    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 100.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    const ambientSound = new BABYLON.Sound("birds", "./media/chirping-birds-ambience-217410.mp3", scene, null, {
        loop: true,
        autoplay: true
    });

    // ✅ Updated model filenames to avoid special characters and spaces
    const pushup = await BABYLON.SceneLoader.ImportMeshAsync("", "./meshes/", "Medea_Push_Up.gltf", scene);
    const squat = await BABYLON.SceneLoader.ImportMeshAsync("", "./meshes/", "Medea_Squat.gltf", scene);
    const jumping = await BABYLON.SceneLoader.ImportMeshAsync("", "./meshes/", "Medea_Jumping_Jacks.gltf", scene);

    const allTrainers = [pushup, squat, jumping];
    const trainerPositions = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0)];

    allTrainers.forEach((result, i) => {
        result.meshes[0].scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
        result.meshes[0].position = trainerPositions[i];
        result.meshes[0].setEnabled(false);
        shadowGenerator.addShadowCaster(result.meshes[0], true);
        result.meshes[0].receiveShadows = true;
    });

    let currentIndex = 0;
    allTrainers[currentIndex].meshes[0].setEnabled(true);
    allTrainers[currentIndex].animationGroups[0].start(true);

    // UI Buttons
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    function createButton(name, text, x, onClick) {
        const btn = BABYLON.GUI.Button.CreateSimpleButton(name, text);
        btn.width = "150px";
        btn.height = "40px";
        btn.color = "white";
        btn.cornerRadius = 10;
        btn.background = "#8A2BE2";
        btn.left = x;
        btn.top = "40px";
        btn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        btn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        btn.onPointerDownObservable.add(onClick);
        advancedTexture.addControl(btn);
    }

    createButton("btnPushup", "Push-Up", "-160px", () => switchTrainer(0));
    createButton("btnSquat", "Squat", "0px", () => switchTrainer(1));
    createButton("btnJumping", "Jumping Jacks", "160px", () => switchTrainer(2));

    function switchTrainer(index) {
        if (index === currentIndex) return;
        allTrainers[currentIndex].animationGroups[0].stop();
        allTrainers[currentIndex].meshes[0].setEnabled(false);

        currentIndex = index;
        allTrainers[currentIndex].meshes[0].setEnabled(true);
        allTrainers[currentIndex].animationGroups[0].start(true);
    }

    if (await BABYLON.WebXRSessionManager.IsSessionSupportedAsync("immersive-vr")) {
        await scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground],
            optionalFeatures: true
        });
    } else {
        console.log("WebXR is not supported on this device.");
    }

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", function () {
    engine.resize();
});
