import * as THREE from "three"
import ShaderLoader from './shaderloader.js'

export default class Particle {

    #material
    #geometry

    #downsamplingRate

    #shaderLoader

    constructor() {
        this.#downsamplingRate = 1.
        this.#shaderLoader = new ShaderLoader()

        this.#initMaterial()
    }

    #initMaterial() {
        this.#material = new THREE.ShaderMaterial({
            uniforms: {
                tex: {value: null} // video texture will be set after loaded
            },
            vertexShader: this.#shaderLoader.load('./shaders/particle.vert.glsl'),
            fragmentShader: this.#shaderLoader.load('./shaders/particle.frag.glsl')
        })
    }

    setVideoTexture(texture) {
        this.#material.uniforms.tex.value = texture
    }

    loadGeometry(video) {
        const width = video.videoWidth / this.#downsamplingRate
        const height = video.videoHeight / this.#downsamplingRate
        
        const positions = []
        for (let j=0; j<height; j++) {
            for (let i=0; i< width; i++) {
                positions.push((i+0.5)/width, (j+0.5)/height, 0.)
            }
        }
        
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.computeBoundingSphere()
        this.#geometry = geometry
    }

    get mesh() {
        const background = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.1
            })
        )
        
        const particle = new THREE.Points(this.#geometry, this.#material)

        const group = new THREE.Group()        
        group.add(background)
        group.add(particle)
        group.scale.set(.2, .2, .2)

        return group
    }
}