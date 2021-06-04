// import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { useHeightfield } from '@react-three/cannon'

import * as THREE from 'three'
import { useRef, useEffect, useMemo } from 'react'

function HeightmapGeometry({ heights, elementSize, ...rest }) {
  const ref = useRef()

  useEffect(() => {
    const dx = elementSize
    const dy = elementSize

    // Create the vertex data from the heights
    const vertices = heights.flatMap((row, i) => row.flatMap((z, j) => [i * dx, j * dy, z]))

    // Create the faces
    const indices = []
    for (let i = 0; i < heights.length - 1; i++) {
      for (let j = 0; j < heights[i].length - 1; j++) {
        const stride = heights[i].length
        const index = i * stride + j
        indices.push(index + 1, index + stride, index + stride + 1)
        indices.push(index + stride, index + 1, index)
      }
    }

    ref.current.setIndex(indices)
    ref.current.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    ref.current.computeVertexNormals()
    ref.current.computeBoundingBox()
    ref.current.computeBoundingSphere()
  }, [heights])

  return <bufferGeometry {...rest} ref={ref} />
}

/**
 * Returns matrix data to be passed to heightfield.
 * set elementSize as `size` / matrix[0].length (image width)
 * and rotate heightfield to match (rotation.x = -Math.PI/2)
 * @param {Image} image black & white, square heightmap texture
 * @returns {[[Number]]} height data extracted from image
 */
function createHeightfieldMatrix(image) {
  let matrix = []
  const w = image.width
  const h = image.height
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const scale = 40 // determines the vertical scale of the heightmap
  let row

  canvas.width = w
  canvas.height = h
  ctx.drawImage(image, 0, 0, w, h)

  for (let x = 0; x < w; x++) {
    row = []
    for (let y = 0; y < h; y++) {
      // returned pixel data is [r, g, b, alpha], since image is in b/w -> any rgb val
      row.push(parseFloat((ctx.getImageData(x, y, 1, 1).data[0] / 255).toPrecision(2)) * scale)
    }
    matrix.push(row)
  }
  return matrix
}

export function Heightfield(props) {
  const { elementSize, position, rotation, ...rest } = props
  const heightmap = useTexture('/textures/heightmap_512.png')
  const heights = useMemo(() => createHeightfieldMatrix(heightmap.image), [heightmap])

  const [ref] = useHeightfield(() => ({
    args: [heights, { elementSize }],
    position,
    rotation,
  }))

  // return null
  return (
    <mesh ref={ref} castShadow receiveShadow {...rest}>
      <meshNormalMaterial flatShading/>
      <HeightmapGeometry heights={heights} elementSize={elementSize} />
    </mesh>
  )
}
