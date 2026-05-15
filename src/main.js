import * as THREE from 'three';
import { World, Vec3, Sphere, Body, Plane } from 'cannon-es';

// Инициализация сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Cannon.js мир
const world = new World();
world.gravity.set(0, -9.82, 0);

// Освещение
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Пол
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const floorBody = new Body({ mass: 0 });
floorBody.addShape(new Plane());
floorBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(floorBody);

// Мячик
const ballRadius = 0.5;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff4444,
    shininess: 100
});
const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
ballMesh.castShadow = true;
ballMesh.position.y = 2;
scene.add(ballMesh);

const ballShape = new Sphere(ballRadius);
const ballBody = new Body({ mass: 1 });
ballBody.addShape(ballShape);
ballBody.position.set(0, 2, 0);
world.addBody(ballBody);

// Переменные игры
let score = 0;
const scoreElement = document.getElementById('score');

// Raycaster для кликов
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Обработка клика мыши
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(ballMesh);
    if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        const center = ballMesh.position;

        const hitVector = new THREE.Vector3()
            .subVectors(hitPoint, center)
            .normalize();

        const power = Math.max(5, 15 - hitVector.y * 10);
        // For 2.5D behavior, zero out Z impulse
        const impulse = new Vec3(
            hitVector.x * power,
            Math.max(8, 12 - hitVector.y * 5),
            0
        );

        ballBody.applyImpulse(impulse, ballBody.position);

        score += Math.floor(power);
        if (scoreElement) scoreElement.textContent = `Очки: ${score}`;
    }
}

window.addEventListener('click', onMouseClick);

// Позиция камеры
camera.position.set(0, 5, 10);
camera.lookAt(0, 2, 0);

// Анимация
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    world.step(1/60, deltaTime, 3);

    // Enforce 2.5D: lock Z coordinate and zero Z velocity
    ballBody.position.z = 0;
    ballBody.velocity.z = 0;
    ballBody.angularVelocity.z = 0;

    // Синхронизация мяча
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    // Мячик не улетел за пол
    if (ballBody.position.y < -1) {
        ballBody.position.set(0, 2, 0);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);
        ballMesh.position.y = 2;
    }

    renderer.render(scene, camera);
}

// Адаптация под размер окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
