import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from 'three/addons/libs/stats.module.js';
const histogramVertexShader = load('histogramVert.glsl')
const histogramFragmentShader = load('histogramFrag.glsl')
const particlsVertexShader = load('particlsVert.glsl')
const particlsFragmentShader = load('particlsfrag.glsl')
const particlsShadowVertexShader = load('particleshadow.vert.glsl')
const particlsShadowFragmentShader = load('particleshadow.frag.glsl')

var camera, camera2, controls, scene, scene2, renderer, container;
var video, videoTexture;
var colorSpaceMaterial
var shadmat
var area
var space
const clock = new THREE.Clock()
let stats
let gui

let configs = {
    mode: 0
}

init();
animate();


async function init() {
    container = document.createElement("div");
    document.body.appendChild(container);
    
    scene = new THREE.Scene();
    scene2 = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;

    container.appendChild(renderer.domElement);

    const aspect = window.innerWidth / window.innerHeight
    // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10);
    camera = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, 1 / Math.pow(2, 53), 1)
    camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10);
    // camera2 = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, 1 / Math.pow(2, 53), 10)
    
    camera.position.z = 0.7;
    camera2.position.z = 2;
    controls = new OrbitControls(camera2, renderer.domElement);
    controls.minDistance = 0.005;
    controls.maxDistance = 1.0;
    controls.enableRotate = true;
    controls.addEventListener("change", render);
    controls.update();

    {
        area = new THREE.Group()
        area.position.set(aspect*0.3, 1*0.3, 0)
        area.scale.set(0.2, 0.2, 0.2)
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5,
                // opacity: 1.0,
                side: THREE.BackSide
            })
        )
        area.add(cube)
        const grid = new THREE.GridHelper(1, 10, 0x999999)
        grid.material.transparent = true
        grid.material.opacity = 0.3
        grid.position.y = -0.5
        area.add(grid)
        const axisR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 1),
            new THREE.MeshBasicMaterial({
                color: 0xff00000,
                transparent: true,
                opacity: 0.3
            })
        )
        axisR.position.set(-0.5, -0.5, 0)
        axisR.rotation.x = Math.PI/2
        const axisG = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 1),
            new THREE.MeshBasicMaterial({
                color: 0x00ff000,
                transparent: true,
                opacity: 0.3
            })
        )
        axisG.position.set(0, -0.5, -0.5)
        axisG.rotation.z = Math.PI/2
        const axisB = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 1),
            new THREE.MeshBasicMaterial({
                color: 0x0000ff,
                transparent: true,
                opacity: 0.3
            })
        )
        axisB.position.set(-0.5, 0, -0.5)
        axisB.rotation.y = Math.PI/2
        area.add(axisR)
        area.add(axisG)
        area.add(axisB)
        scene2.add(area)   

    }
    {
        space = new THREE.Group()
        const s = 0.2
        const bg = new THREE.Mesh(
            new THREE.PlaneGeometry(1.55, 1.05),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.1
            })
        )
        space.add(bg)
        space.position.set(-aspect/2+s, -0.5+s, 0)
        space.scale.set(s, s, s)
        scene.add(space)
    }
    
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) throw new Error('navigator.mediaDevices is not loaded.')

    const constraints = {video: { width: 1920, height: 1080, facingMode: "user" }};
    const userMedia = await navigator.mediaDevices.getUserMedia(constraints)
    video = document.createElement("video");
    video.srcObject = userMedia;
    video.play();

    video.onloadeddata = videoOnLoadedData()

    stats = new Stats();
    container.appendChild(stats.dom);


    gui = new GUI()
    gui.add(configs, 'mode', {sRGB: 0, CIExyY:1, CIELab: 2}).name('mode').onChange(value => {
        colorSpaceMaterial.uniforms.mode.value = value
        shadmat.uniforms.mode.value = value
    })

    window.addEventListener("resize", onWindowResize, false);
}

function render() {
    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(scene2, camera2);
}


async function animate() {
    requestAnimationFrame(animate)

    if (clock.getElapsedTime() > 5) {
        var h = calcHist()
        space.remove(scene.getObjectByName('graph'))
        space.add(h);

        clock.start()
    }

    if (stats) stats.update();

    render();
}


function calcHist () {
    const canvas = document.createElement( 'canvas' );
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext( '2d' );
    context.drawImage( videoTexture.image, 0, 0 );

    const data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
    // console.log( data.length );

    var rgb = [];
    var skip = 32;
    for (let i=0; i<data.length; i+=4*skip) {
        rgb.push([data[i], data[i+1], data[i+2]])
    }
    // console.log(Math.max(...rgb))

    const histR = Array(256).fill(0)
    const histG = Array(256).fill(0)
    const histB = Array(256).fill(0)
    for (let _rgb of rgb) {
        histR[_rgb[0]]++
        histG[_rgb[1]]++
        histB[_rgb[2]]++
    }
    const max = Math.max(...histR.concat(histG).concat(histB))
    // console.log(max)
    for (let i=0; i<256; i++) {
        histR[i] /= max
        histG[i] /= max
        histB[i] /= max
    }
    // console.log(histR)


    const uni = {
        r: { type: 'v3v', value: histR},
        g: { type: 'v3v', value: histG},
        b: { type: 'v3v', value: histB},
        tex: { type: 't', value: videoTexture},
        w: video.videoWidth,
        h: video.videoHeight,
        hist: { type: 'v3v', value: Array(video.videoWidth*video.videoHeight)}
    };
    
    var material = new THREE.ShaderMaterial({
        uniforms: uni,
        // vertexShader: document.getElementById("vertexShader").textContent,
        // fragmentShader: document.getElementById("fragmentShader").textContent,
        vertexShader: histogramVertexShader,
        fragmentShader: histogramFragmentShader,
    });

    var geometry = new THREE.PlaneGeometry(1.5, 1, 256, max);

    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'graph'
    mesh.material.side = THREE.DoubleSide;

    return mesh
}



function textureToPoint(texture, width, height) {
    var discret = 2;

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    let compteur = 0;
    for (let i = 0; i < height; i += discret) {
        for (let j = 0; j < width; j += discret) {
            // positions
            const x = (i+0.5) / height;
            const y = (j+0.5) / width;
            const z = 0;
            positions.push(x, y, z);
            compteur++;
        }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    return new THREE.Points(geometry, colorSpaceMaterial);
}


function castParticleShadow(texture, width, height) {
    var discret = 2;

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    let compteur = 0;
    for (let i = 0; i < height; i += discret) {
        for (let j = 0; j < width; j += discret) {
            // positions
            const x = (i+0.5) / height;
            const y = (j+0.5) / width;
            const z = 0;
            positions.push(x, y, z);
            compteur++;
        }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    return new THREE.Points(geometry, shadmat);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}



function load(url, data){
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);

    if(request.readyState == 4) {
        if(request.status != 200) return null
        return request.responseText;
    }
}



function createShader(gl, sourceCode, type) {
    // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
    const shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        throw `Could not compile WebGL program. \n\n${info}`;
    }
    return shader;
}

function videoOnLoadedData() {
    return function() {
        videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.NearestFilter;
        videoTexture.magFilter = THREE.NearestFilter;
        videoTexture.generateMipmaps = false;
        videoTexture.format = THREE.RGBAFormat;

        scene.background = videoTexture
        
        colorSpaceMaterial = new THREE.ShaderMaterial({
            vertexShader: particlsVertexShader,
            fragmentShader: particlsFragmentShader,
            uniforms: {
                tex: { value: videoTexture },
                // mode: { value: 0}
                mode: { value: 0}
            },
            depthTest: false,
            transparent: true,
        });
        shadmat = new THREE.ShaderMaterial({
            vertexShader: particlsShadowVertexShader,
            fragmentShader: particlsShadowFragmentShader,
            uniforms: {
                tex: { value: videoTexture },
                // mode: { value: 0}
                mode: { value: 0}
            },
            depthTest: false,
            transparent: true
        });
        var points = textureToPoint(videoTexture, video.videoWidth, video.videoHeight)

        points.name = 'point'
        area.add(points);

        var shad = castParticleShadow(videoTexture, video.videoWidth, video.videoHeight)
        area.add(shad)

        var pausePlayObj = {
            pausePlay: function () {
                if (!video.paused) {
                    console.log("pause");
                    video.pause();
                } else {
                    console.log("play");
                    video.play();
                }
            },
            add10sec: function () {
                video.currentTime = video.currentTime + 10;
                console.log(video.currentTime);
            },
        };
    }
}

var toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1]
}