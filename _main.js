import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from 'three/addons/libs/stats.module.js';
import Histogram from './histogram.js'


var camera, camera2, controls, scene, scene2, renderer, container;
var video, videoTexture;
var dat, histMat, bucketMat, tmpScene, tmpCam
var particleSpace, histogramSpace
var histmesh
var points


var positions = []
var down = 4.0
var bufgeom
var needsUpdate = true




let histogram




var colorSpaceMaterial
var stats

init();
animate();



function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    stats = new Stats();
    container.appendChild(stats.dom);
    
    scene = new THREE.Scene();
    scene2 = new THREE.Scene();
    tmpScene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000);
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;

    container.appendChild(renderer.domElement);

    // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10);
    const aspect = window.innerWidth / window.innerHeight
    camera = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, 1 / Math.pow(2, 53), 1)
    camera2 = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, 1 / Math.pow(2, 53), 10)
    // camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10);
    camera.position.z = 0.7;
    camera2.position.set(0.5, 0, -5);



    histogram = new Histogram()
    scene.add(histogram.mesh)
    

    controls = new OrbitControls(camera2, renderer.domElement);
    controls.update()
    controls.minDistance = 0.005;
    controls.maxDistance = 1.0;
    controls.enableRotate = true;
    controls.enablePan = true;
    
    window.addEventListener("resize", onWindowResize, false)


    if (!navigator.mediaDevices?.getUserMedia) throw new Error('navigator.mediaDevices is not loaded.')

    const constraints = {video: { width: 1920, height: 1080, facingMode: "user" }};
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        video.onloadeddata = videoOnLoadedData()
    })
}


function render() {
    if (video) histogram.compute(renderer, scene, video)

    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(scene2, camera2);
}


function videoOnLoadedData() {
    return function() {
        videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.NearestFilter;
        videoTexture.magFilter = THREE.NearestFilter;
        videoTexture.generateMipmaps = false;
        videoTexture.format = THREE.RGBAFormat;

        scene.background = videoTexture
        
        histogram.setVideoTexture(videoTexture)
        histogram.loadCoordGeometry(video)
    }
}


function animate() {
    requestAnimationFrame(animate)
    // controls.update();
    // if (stats) stats.update();
    stats.update();


    histogram.setVideoTexture(videoTexture)


    render();
}


function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    // camera.aspect = window.innerWidth / window.innerHeight;
    camera.left = -aspect/2
    camera.right = aspect/2
    camera.top = 1/2
    camera.bottom = -1/2
    camera.updateProjectionMatrix();

    camera2.left = -aspect/2
    camera2.right = aspect/2
    camera2.top = 1/2
    camera2.bottom = -1/2
    camera2.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}