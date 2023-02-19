import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from 'three/addons/libs/stats.module.js';
const particlVertexShader = load('./shaders/particle.vert.glsl')
const particlFragmentShader = load('./shaders/particle.frag.glsl')
const histv = load('./shaders/histodata.vert.glsl')
const histf = load('./shaders/histodata.frag.glsl')
const drawv = load('./shaders/histograph.vert.glsl')
const drawf = load('./shaders/histograph.frag.glsl')



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




var colorSpaceMaterial
var stats

init();
animate();



async function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    stats = new Stats();
    container.appendChild(stats.dom);
    
    scene = new THREE.Scene();
    scene2 = new THREE.Scene();
    tmpScene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // renderer.setAnimationLoop(animate);
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
    tmpCam = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, 1 / Math.pow(2, 53), 10)
    camera.position.z = 0.7;
    camera2.position.set(0.5, 0, -5);
    

    controls = new OrbitControls(camera2, renderer.domElement);
    controls.minDistance = 0.005;
    controls.maxDistance = 1.0;
    controls.enableRotate = true;
    controls.enablePan = true;
    // controls.addEventListener("change", render);
    










    {
        dat = new THREE.WebGLRenderTarget(256, 1, {
            type: THREE.FloatType,
            // magFilter: THREE.NearestFilter,
            // minFilter: THREE.NearestFilter
            magFilter: THREE.LinearFilter,
            minFilter: THREE.LinearFilter
        })
    
        bucketMat = new THREE.ShaderMaterial({
            vertexShader: histv,
            fragmentShader: histf,
            uniforms: {
                tex: {value: null}, // video texture will be set after loaded
                color: {value: null}
            },
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor,
            // depthTest: false,
            // depthWrite: false,
            // side: THREE.DoubleSide
    
        })

        histMat = new THREE.ShaderMaterial({
            vertexShader: drawv,
            fragmentShader: drawf,
            uniforms: {
                hist: {value: dat.texture}
            },
        })

        
    }



    colorSpaceMaterial = new THREE.ShaderMaterial({
        vertexShader: particlVertexShader,
        fragmentShader: particlFragmentShader,
        uniforms: {
            tex: { value: null },
        }
    });

    
    

    if (!navigator.mediaDevices?.getUserMedia) throw new Error('navigator.mediaDevices is not loaded.')

    const constraints = {video: { width: 1920, height: 1080, facingMode: "user" }};
    const userMedia = await navigator.mediaDevices.getUserMedia(constraints)

    video = document.createElement("video");
    video.srcObject = userMedia;
    video.play();

    video.onloadeddata = videoOnLoadedData()


    // histogramSpace = generateHistogramSpace()
    // scene.add(histogramSpace)

    particleSpace = generateParticleSpace()
    // particleSpace.position.z = 0
    scene2.add(particleSpace)

    // const histo = shad()
    // dat = new THREE.WebGLRenderTarget(256, 1, {
    //     type: THREE.FloatType,
    //     // type: THREE.HalfFloatType,
    //     magFilter: THREE.NearestFilter,
    //     minFilter: THREE.NearestFilter
    // })


    window.addEventListener("resize", onWindowResize, false);
}

function render() {
    if (points) {
        tmpScene.remove(points);
        points.geometry.dispose();
    }
    points = new THREE.Points(bufgeom, bucketMat)
    tmpScene.add(points)


    renderer.setRenderTarget(dat)
    renderer.clear();
    for (let i=0; i<3; i++) {
        var mask = [0, 0, 0]
        mask[i] = 1
        bucketMat.uniforms.color.value = mask
        renderer.render(tmpScene, tmpCam)
    }
    renderer.setRenderTarget(null)


    // let mem = new Float32Array(1*256*4)
    // renderer.readRenderTargetPixels(dat, 0, 0, 256, 1, mem)
    // // console.log(dat)
    // console.log(mem)

// // 
//     histmesh.material = histMat



    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(scene2, camera2);


}



function shad() {
    bucketMat.uniforms.tex.value = videoTexture

    if (needsUpdate) {
        positions = []
        if (video) {
            for (let j=0; j<video.videoHeight/down; j++) {
                for (let i=0; i<video.videoWidth/down; i++) {
                    positions.push(i/(video.videoWidth/down), j/(video.videoHeight/down), 0.0)
                }
            }
        }
        bufgeom = new THREE.BufferGeometry()
        bufgeom.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(positions), 3)
        )
        bufgeom.computeBoundingSphere()
        needsUpdate = false    
    }
    
    var hhh = new THREE.PlaneGeometry(1, 1, 256, 100)
    var hhmesh = new THREE.Mesh(hhh, histMat)

    return hhmesh
}

function videoOnLoadedData() {
    return function() {
        videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.NearestFilter;
        videoTexture.magFilter = THREE.NearestFilter;
        videoTexture.generateMipmaps = false;
        videoTexture.format = THREE.RGBAFormat;

        scene.background = videoTexture
        
        var points = textureToPoint(videoTexture, video.videoWidth, video.videoHeight)
        points.name = 'point'
        particleSpace.add(points);
        // colorSpaceMaterial.uniforms.tex.value = videoTexture

        // histmesh = shad()
        // histmesh.scale.set(.4, .4, .4)
        // scene.add(histmesh)

        // var hst

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

function animate() {
    requestAnimationFrame(animate)
    controls.update();
    // if (stats) stats.update();
    stats.update();
    render();
}


function textureToPoint(texture, width, height) {
    var discret = 2;

    colorSpaceMaterial.uniforms.tex.value = texture

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < height; i += discret) {
        for (let j = 0; j < width; j += discret) {
            // positions
            const x = (i+0.5) / width;
            const y = (j+0.5) / height;
            const z = 0;
            positions.push(x, y, z);
        }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    return new THREE.Points(geometry, colorSpaceMaterial);
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



function load(url){
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);

    if(request.readyState == 4) {
        if(request.status != 200) return null
        return request.responseText;
    }
}



function generateHistogramSpace() {
    const space = new THREE.Group()
    const aspect = window.innerWidth / window.innerHeight
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
    
    return space
}

function generateParticleSpace() {
    const space = new THREE.Group()
    const aspect = window.innerWidth / window.innerHeight
    // space.position.set(aspect*0.3, 1*0.3, 0)
    space.scale.set(0.2, 0.2, 0.2)
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1
        })
    )
    space.add(cube)
    const grid = new THREE.GridHelper(1, 10, 0x999999)
    grid.material.transparent = true
    grid.material.opacity = 0.3
    grid.position.y = -0.5
    space.add(grid)
    const axisR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1),
        new THREE.MeshBasicMaterial({
            color: 0xff00000,
            transparent: true,
            opacity: 0.3
        })
    )
    axisR.position.set(0, -0.5, -0.5)
    axisR.rotation.z = Math.PI/2
    const axisG = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1),
        new THREE.MeshBasicMaterial({
            color: 0x00ff000,
            transparent: true,
            opacity: 0.3
        })
    )
    axisG.position.set(-0.5, -0.5, 0)
    axisG.rotation.x = Math.PI/2
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
    space.add(axisR)
    space.add(axisG)
    space.add(axisB)

    return space
}