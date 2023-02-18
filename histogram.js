import * as THREE from "three";
const histv = load('./shaders/histv.glsl')
const histf = load('./shaders/histf.glsl')
const drawv = load('./shaders/drawv.glsl')
const drawf = load('./shaders/drawf.glsl')

export default class Histogram {
    #data
    #dataMaterial
    #pointsGeometry
    #points

    #material
    #offscreanScene
    #offscreanCamera


    constructor() {
        #

    }


}