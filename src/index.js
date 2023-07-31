import domready from "domready"
import "./style.css"
import { voronoi } from "d3-voronoi"
import { polygonCentroid } from "d3-polygon"
import { createNoise3D } from "simplex-noise"

const overdraw = 1.2


const noiseScale = 0.002
const noiseExp = 1.8
const noiseIso = 8


function noiseFn(x, y)
{
    // const { width, height } = config
    //
    // const off = (y * width + x) << 2
    // return Math.pow(tex[off + 2]/255, noiseExp)

    return Math.floor(Math.pow(0.5 + 0.5 * noise(x * noiseScale, y * noiseScale, 0), noiseExp) * noiseIso)/noiseIso
}


function randomPoints(count, delta = 0)
{
    const { width, height } = config

    const cx = width >> 1
    const cy = height >> 1

    const out = []


    let tries = 0
    for (let i = 0; i < count; i++)
    {
        const x = Math.round(cx + (-0.5 + Math.random()) * width * overdraw)
        const y = Math.round(cy + (-0.5 + Math.random()) * height * overdraw)

        const n = noiseFn(x, y);

        tries++
        if (Math.random() > n + delta)
        {
            i--
            continue
        }
        out.push([
            x,
            y,
        ])
    }

    console.log(out.length + "/" + tries)

    return out
}

function relax(v, pts, count = 5)
{
    for (let i = 0; i < count; i++)
    {
        pts = v(pts).polygons().map(poly => {
            const c = polygonCentroid(poly)
            c[0] |= 0
            c[1] |= 0
            return c
        })
    }
    return pts
}

function drawPolygon(polygon)
{
    const last = polygon.length - 1
    const [x1, y1] = polygon[last]

    ctx.beginPath()
    ctx.moveTo(
        x1 | 0,
        y1 | 0
    )

    for (let i = 0; i < polygon.length; i++)
    {
        const [x1, y1] = polygon[i]

        const jx = (Math.random() - 0.5) * 4
        const jy = (Math.random() - 0.5) * 4


        ctx.lineTo((x1 + jx) | 0, (y1 + jy) | 0)
    }
    ctx.stroke()
}



const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;


const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;
let noise
let tex

const count = 8000
const ratio = 0.1


function fillNoise()
{
    const { width, height } = config
    const id = ctx.getImageData(0,0, width, height)

    const { data } = id
    let off = 0
    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {

            const n = Math.floor(noiseFn(x,y)*255)

            data[off    ] = n
            data[off + 1] = n
            data[off + 2] = n
            data[off + 3] = 255

            off+=4
        }
    }

    ctx.putImageData(id, 0 ,0)
}


domready(
    () => {


        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;
        const bb = document.getElementById("bb")

        const paint = () => {


            noise = createNoise3D()

            //ctx.drawImage(bb, 0,0)
            //tex = ctx.getImageData(0,0,width,height).data

            ctx.fillStyle = "#000";
            ctx.fillRect(0,0, width, height);
            //fillNoise()

            const borderX = (overdraw - 1) * width / 2
            const borderY = (overdraw - 1) * height / 2
            const v = voronoi().extent([[-borderX,-borderY], [width + borderX, height + borderY]])

            let pts = randomPoints(count * (1-ratio))
            let pts2 = randomPoints(count * ratio, -0.1)
            let pts3 = randomPoints(count * ratio, -0.1)

            pts2 = pts2.concat(pts)
            pts3 = pts3.concat(pts)

            // pts = relax(v, pts, 1)
            // pts2 = relax(v, pts2, 1)
            // pts3 = relax(v, pts3, 1)

            console.log({pts,pts2,pts3})


            ctx.strokeStyle = "rgba(255,255,255, 0.7)";
            const diagram = v(pts)
            diagram.polygons().forEach(p => drawPolygon(p))

            ctx.strokeStyle = "rgba(230,214,0, 0.9)";
            const diagram2 = v(pts2)
            diagram2.polygons().forEach(p => drawPolygon(p))

            ctx.strokeStyle = "rgba(0,230,214, 0.9)";
            const diagram3 = v(pts3)
            diagram3.polygons().forEach(p => drawPolygon(p))
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);


////////////////////
