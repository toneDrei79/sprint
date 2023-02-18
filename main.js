import * as THREE from "three";
import { PlaneGeometry } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from 'three/addons/libs/stats.module.js';
const histogramVertexShader = load('./shaders/histogramvert.glsl')
const histogramFragmentShader = load('./shaders/histogramfrag.glsl')
const particlVertexShader = load('./shaders/particlevert.glsl')
const particlFragmentShader = load('./shaders/particlefrag.glsl')


const histv = load('./shaders/histv.glsl')
const histf = load('./shaders/histf.glsl')
const drawv = load('./shaders/drawv.glsl')
const drawf = load('./shaders/drawf.glsl')




var camera, camera2, controls, scene, scene2, renderer, container;
var video, videoTexture;
var dat, histMat, bucketMat, tmpScene, tmpCam
var particleSpace, histogramSpace
var histmesh
var points

var colorSpaceMaterial
var stats

const clock = new THREE.Clock()

init();
animate();


async function init() {

    // var test = new Particle(0.2)
    // console.log(test.scale)
    // test.scale = 0.5
    // console.log(test.scale)


    container = document.createElement("div");
    document.body.appendChild(container);
    
    scene = new THREE.Scene();
    scene2 = new THREE.Scene();
    tmpScene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    controls.addEventListener("change", render);
    controls.update();
    

    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) throw new Error('navigator.mediaDevices is not loaded.')

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


    stats = new Stats();
    container.appendChild(stats.dom);



    window.addEventListener("resize", onWindowResize, false);
}

function render() {
    dat = new THREE.WebGLRenderTarget(256, 1, {
        type: THREE.FloatType,
        // type: THREE.HalfFloatType,
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter
        // magFilter: THREE.LinearFilter,
        // minFilter: THREE.LinearFilter
    })

    bucketMat = new THREE.ShaderMaterial({
        vertexShader: histv,
        fragmentShader: histf,
        uniforms: {
            tex: {type: 't', value: videoTexture},
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

    var positions = []
    if (video) {
        for (let j=0; j<video.videoHeight; j++) {
            for (let i=0; i<video.videoWidth; i++) {
                positions.push(i/video.videoWidth, j/video.videoHeight, 0.0)
            }
        }
    }
    // var tmp = new THREE.PlaneGeometry(1, 1, video.videoWidth, video.videoHeight)
    var tmp = new THREE.BufferGeometry()
    tmp.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3)
        // new THREE.BufferAttribute(positions, 3)
    )
    tmp.computeBoundingSphere()
    // var points = new THREE.Mesh(new THREE.PlaneGeometry(1,1,video.videoWidth, video.videoHeight), bucketMat)


    if (points) {
        tmpScene.remove(points);
        points.geometry.dispose();
    }
    points = new THREE.Points(tmp, bucketMat)
    // points = new THREE.Points(new PlaneGeometry(1, 1, video.videoHeight, video.videoWidth), bucketMat)
    tmpScene.add(points)

    const clearColor = renderer.getClearColor(new THREE.Color());
    renderer.setClearColor(new THREE.Color(0,0,0));

    // renderer.clear();
    renderer.setClearColor(0x000000);
    renderer.setRenderTarget(dat)
    renderer.clear();
    for (let i=0; i<3; i++) {
        var mask = [0, 0, 0]
        mask[i] = 1
        // console.log(mask)
        bucketMat.uniforms.color.value = mask
        // renderer.setClearColor(0x000000);
        // renderer.setRenderTarget(dat)
        // renderer.clear();
        renderer.render(tmpScene, tmpCam)

        // renderer.setRenderTarget(null)
    }
    renderer.setRenderTarget(null)


    renderer.setClearColor(clearColor);



    let mem = new Float32Array(1*256*4)
    renderer.readRenderTargetPixels(dat, 0, 0, 256, 1, mem)
    // console.log(dat)
    console.log(mem)
    let r = new Float32Array(256)
    let g = new Float32Array(256)
    let b = new Float32Array(256)
    for (let i=0; i<256; i++){
        r[i] = mem[i*4]
        g[i] = mem[i*4+1]
        b[i] = mem[i*4+2]
    }
    // console.log(b)
    // renderer.clear();

    // const maxim = Math.max(...mem)
    // console.log('a ' + maxim)

    // var a = 0
    // const hisme = new Float32Array(256)
    // for (let i=0; i<256*4; i+=4) {
    //     hisme[i/4] = mem[i]/maxim
    //     // if (mem[i] == maxim) {
    //     //     // console.log('aaa')
    //     //     hisme[i/4] = 0
    //     // }
    //     a += mem[i]
    // }
    // console.log(a)
    // const againmaxim = Math.max(...hisme)
    // console.log('b ' + againmaxim)


    // console.log(hisme)


    histMat = new THREE.ShaderMaterial({
        vertexShader: drawv,
        fragmentShader: drawf,
        uniforms: {
            hist: {type: 't', value: dat.texture}, // ???
            // histmem: {type: 'v3v', value: hisme},
            // hist: {type: 't', value: dat}, // ???
        },
    })
    // histMat.needsUpdate = true
    // var hhh = new THREE.PlaneGeometry(1, 1, 256, 5000)
    // var hhmesh = new THREE.Mesh(hhh, histMat)
    // hhmesh.scale.set(.4, .4, .4)
    // scene2.add(hhmesh)

    if (histmesh) histmesh.material = histMat



    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(scene2, camera2);


}



function shad() {
    bucketMat.uniforms.tex.value = videoTexture
    // bucketMat = new THREE.ShaderMaterial({
    //     vertexShader: histv,
    //     fragmentShader: histf,
    //     uniforms: {
    //         tex: {type: 't', value: videoTexture},
    //     },
    //     blending: THREE.CustomBlending,
    //     blendEquation: THREE.AddEquation,
    //     blendSrc: THREE.OneFactor,
    //     blendDst: THREE.OneFactor,
    //     // side: THREE.DoubleSide
    // })

    // const positions = new Float32Array(video.videoHeight*video.videoWidth*3).fill(0)
    /*
    var positions = []
    for (let j=0; j<video.videoHeight; j++) {
        for (let i=0; i<video.videoWidth; i++) {
            positions.push(i/video.videoWidth, j/video.videoHeight, 0.0)
        }
    }
    // var tmp = new THREE.PlaneGeometry(1, 1, video.videoWidth, video.videoHeight)
    var tmp = new THREE.BufferGeometry()
    tmp.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3)
        // new THREE.BufferAttribute(positions, 3)
    )
    tmp.computeBoundingSphere()
    // var points = new THREE.Mesh(new THREE.PlaneGeometry(1,1,video.videoWidth, video.videoHeight), bucketMat)


    if (points) {
        tmpScene.remove(points);
        points.geometry.dispose();
    }
    points = new THREE.Points(tmp, bucketMat)
    // points = new THREE.Points(new PlaneGeometry(1, 1, video.videoHeight, video.videoWidth), bucketMat)
    tmpScene.add(points)
    */
    // points.position.set(-0.9, 0.3, 0.0)
    // points.scale.set(.2, .2, .2)
    // scene2.add(points) // visualize histgram bucket data


    // renderer.setClearColor(0x000000);
    // renderer.setRenderTarget(dat)
    // renderer.clear();
    // renderer.render(tmpScene, tmpCam)
    // let mem = new Float32Array(1*256*4)
    // renderer.readRenderTargetPixels(dat, 0, 0, 256, 1, mem)
    // // console.log(dat)
    // console.log(mem)

    // renderer.setRenderTarget(null)


    // histMat = new THREE.ShaderMaterial({
    //     vertexShader: drawv,
    //     fragmentShader: drawf,
    //     uniforms: {
    //         tex: {type: 't', value: dat.texture}, // ???
    //     },
    // })

    var hhh = new THREE.PlaneGeometry(1, 1, 256, 5000)
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

        histmesh = shad()
        histmesh.scale.set(.4, .4, .4)
        scene.add(histmesh)

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

    if (clock.getElapsedTime() > 5) {
        
    }
    if (stats) stats.update();
    // controls.update();
    render();
}


function generateHistgram () {
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

    colorSpaceMaterial = new THREE.ShaderMaterial({
        vertexShader: particlVertexShader,
        fragmentShader: particlFragmentShader,
        uniforms: {
            tex: { value: texture },
        }
    });

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < height; i += discret) {
        for (let j = 0; j < width; j += discret) {
            // positions
            const x = (i+0.5) / height;
            const y = (j+0.5) / width;
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

var toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1]
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