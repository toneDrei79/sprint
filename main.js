import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from 'three/addons/libs/stats.module.js';
import Histogram from './histogram.js'
import Particle from "./particle.js"


var camera, camera2, controls, scene, scene2, renderer, container;
var video, videoTexture;

let histogram, particle
var stats

init();
animate();


async function init() {
    container = document.createElement("div");
    document.body.appendChild(container);
    
    scene = new THREE.Scene();
    scene2 = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000);
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;

    container.appendChild(renderer.domElement);

    const aspect = window.innerWidth / window.innerHeight
    camera = new THREE.PerspectiveCamera(75, aspect, 0.0001, 10);
    camera2 = new THREE.PerspectiveCamera(75, aspect, 0.0001, 10);
    camera.position.z = .5;
    camera2.position.z = .5;



    

    controls = new OrbitControls(camera2, renderer.domElement);
    // controls.update()
    controls.minDistance = 0.005;
    controls.maxDistance = 1.0;
    controls.enableRotate = true;
    controls.enablePan = true;

    histogram = new Histogram()
    scene.add(histogram.mesh)

    particle = new Particle()
    


    const gui = new GUI()
    guiHistogram(gui)
    // guiParticle(gui)

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener("resize", onWindowResize, false)


    if (!navigator.mediaDevices?.getUserMedia) throw new Error('navigator.mediaDevices is not loaded.')

    const constraints = {video: { width: 1920, height: 1080, facingMode: "user" }};
    const userMedia = await navigator.mediaDevices.getUserMedia(constraints)
    video = document.createElement("video");
    video.srcObject = userMedia;
    video.play();

    video.onloadeddata = videoOnLoadedData()
}

function render() {
    histogram.compute(renderer)

    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(scene2, camera2);
}

function animate() {
    requestAnimationFrame(animate)

    if (histogram.needsUpdate) histogram.loadCoordGeometry(video)
    if (particle.needsUpdate) particle.loadGeometry(video)

    stats.update()

    render()
}

function guiHistogram(gui) {
    const folder = gui.addFolder('Histogram')
    folder.add(histogram, 'downsamplingRate', 1., 32.).step(1.).name('down-sampling rate')
    folder.add(histogram, 'roughness', 1., 32.).step(1.).name('roughness')
}

function guiParticle(gui) {
    const folder = gui.addFolder('Particle')
    // folder.add(particle, 'downsamplingRate', 1., 128.).step(1.).name('down-sampling rate')
}

function videoOnLoadedData() {
    return function() {
        videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.NearestFilter;
        videoTexture.magFilter = THREE.NearestFilter;
        videoTexture.generateMipmaps = false;
        videoTexture.format = THREE.RGBAFormat;

        scene.background = videoTexture
        
        histogram.loadCoordGeometry(video)
        histogram.setVideoTexture(videoTexture)

        particle.loadGeometry(video)
        particle.setVideoTexture(videoTexture)
        scene2.add(particle.mesh)
    }
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    camera2.aspect = aspect;
    camera2.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}