import * as THREE from 'three'
import ShaderLoader from './shaderloader'



export default class Histogram {

    #data
    #dataMaterial
    
    #graphMaterial

    #coord
    #coordGeometry

    #downsamplingRate

    #needsUpdate

    #shaderLoader

    #offscreanScene
    #offscreanCamera

    constructor(video) {
        this.#shaderLoader = ShaderLoader()

        this.#initData()
        this.#initDataMaterial()
        this.#initGraphMaterial()
        this.#loadCoordGeometry(video)
        this.#initOffscrean()
    }

    setVideoTexture(texture) { // should be called in video.onLoadedVideo
        this.#dataMaterial.uniforms.tex.value = texture
    }

    #initData(video) {
        this.data = new THREE.WebGLRenderTarget(256, 1, {
            type: THREE.FloatType,
            // magFilter: THREE.NearestFilter,
            // minFilter: THREE.NearestFilter
            magFilter: THREE.LinearFilter,
            minFilter: THREE.LinearFilter
        })
    }

    #initDataMaterial() {
        this.#dataMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null}, // video texture will be set after loaded
                color: {value: null}
            },
            vertexShader: this.#shaderLoader.load('./shaders/histodata.vert.glsl'),
            fragmentShader: this.#shaderLoader.load('./shaders/histodata.frag.glsl'),
            
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneFactor,
            // depthTest: false,
            // depthWrite: false
        })
    }

    #initGraphMaterial() {
        this.#graphMaterial = new THREE.ShaderMaterial({
            uniforms: {
                hist: {value: this.#data.texture}
            },
            vertexShader: this.#shaderLoader.load('./shaders/histograph.vert.glsl'),
            fragmentShader: this.#shaderLoader.load('./shaders/histograph.vert.glsl')
        })
    }

    #loadCoordGeometry(video) {
        const width = video.videoWidth / this.#downsamplingRate
        const height = video.videoHeight / this.#downsamplingRate

        const positions = []
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                positions.push(i/width, j/height, 0.)
            }
        }
        
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(positions), 3)
        )
        geometry.computeBoundingSphere()
        
        this.#needsUpdate = false
        this.#coordGeometry = geometry
    }

    compute(renderer) {
        if (this.#coord) {
            this.#offscreanScene.remove(this.#coord);
            this.#coord.geometry.dispose();
        }
        this.#coord = new THREE.Points(this.#coordGeometry, this.#dataMaterial)
        this.#offscreanScene.add(this.#coord)
    
        renderer.setRenderTarget(this.#data)
        renderer.clear();
        for (let i=0; i<3; i++) {
            const color = [0, 0, 0]
            color[i] = 1
            this.#dataMaterial.uniforms.color.value = color
            renderer.render(this.#offscreanScene, this.#offscreanCamera)
        }
        renderer.setRenderTarget(null)
    }
    
    #initOffscrean() {
        this.#offscreanScene = new THREE.Scene()
        this.#offscreanCamera = new THREE.OrthographicCamera(-1., 1., 1., -1., 0., 1.)
        this.#offscreanScene.add(this.#coord)
    }

    get graph() {
        const geometry = new THREE.PlaneGeometry(1, 1, 256, 100)
        return new THREE.Mesh(geometry, this.#graphMaterial)
    }




}