import maplibregl from 'maplibre-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Model3DConfig } from '../types/model'
import { MODEL_CONFIG, MAP_CONFIG } from '../constants/map'

/**
 * Global model cache to avoid re-downloading models
 * Key: modelPath, Value: Promise<THREE.Group> (the loaded GLTF scene)
 */
const modelCache = new Map<string, Promise<THREE.Group>>()

/**
 * Extended CustomLayerInterface with Three.js properties
 */
interface Model3DLayer extends maplibregl.CustomLayerInterface {
  camera: THREE.Camera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  map: maplibregl.Map
}

/**
 * Type for render function arguments
 * Using the actual MapLibre type for compatibility
 */
type RenderArgs = Parameters<maplibregl.CustomLayerInterface['render']>[1]

/**
 * Creates a MapLibre custom layer for a 3D model
 * This is a lightweight, reusable function that can be used for multiple models
 * 
 * @param config - Configuration object for the 3D model
 * @param config.id - Unique identifier for the model layer
 * @param config.modelPath - Path to the GLTF/GLB model file
 * @param config.coordinates - Geographic coordinates [longitude, latitude]
 * @param config.altitude - Altitude offset in meters (default: 0)
 * @param config.rotation - Rotation in radians [x, y, z] (default: [Math.PI/2, 0, 0])
 * @param config.scale - Scale factor for the model (default: 0.3)
 * @returns MapLibre custom layer interface for rendering the 3D model
 */
export function createModel3DLayer(config: Model3DConfig): Model3DLayer {
  const {
    id,
    modelPath,
    coordinates,
    altitude = MODEL_CONFIG.DEFAULT_ALTITUDE,
    rotation = MODEL_CONFIG.DEFAULT_ROTATION,
    scale: modelScaleFactor = MODEL_CONFIG.DEFAULT_SCALE
  } = config

  const modelLocation = new maplibregl.LngLat(coordinates[0], coordinates[1])
  
  // Store coordinates for use in render function
  const modelCoordinates = coordinates

  const layer: Model3DLayer = {
    id,
    type: 'custom',
    renderingMode: '3d',
    onAdd(map: maplibregl.Map, gl: WebGLRenderingContext) {
      this.camera = new THREE.Camera()
      this.scene = new THREE.Scene()

      // Setup lighting (shared across all models for consistency)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      this.scene.add(ambientLight)

      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5)
      this.scene.add(hemisphereLight)

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight1.position.set(50, 50, 50).normalize()
      this.scene.add(directionalLight1)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
      directionalLight2.position.set(-50, 50, -50).normalize()
      this.scene.add(directionalLight2)

      const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.4)
      directionalLight3.position.set(0, -50, 50).normalize()
      this.scene.add(directionalLight3)

      // Store map reference for render function
      this.map = map

      // Load the 3D model with caching, error handling and retry logic
      const loader = new GLTFLoader()
      let retryCount = 0
      const maxRetries = MODEL_CONFIG.MAX_RETRIES

      const loadModel = async (path: string) => {
        // Check cache first
        if (modelCache.has(path)) {
          try {
            const cachedScene = await modelCache.get(path)!
            // Clone the cached scene for this instance
            const clonedScene = cachedScene.clone()
            this.scene.add(clonedScene)
            
            // Dispatch custom event when model loads successfully
            const event = new CustomEvent('modelLoaded', { 
              detail: { modelId: id, coordinates: modelCoordinates, success: true, cached: true } 
            })
            map.getContainer().dispatchEvent(event)
            return
          } catch (error) {
            // Cache entry failed, remove it and continue with fresh load
            modelCache.delete(path)
          }
        }

        // Create a promise for this load operation and cache it
        const loadPromise = new Promise<THREE.Group>((resolve, reject) => {
          loader.load(
            path,
            (gltf) => {
              // Configure materials for proper rendering
              gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  if (child.material) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(mat => {
                        mat.side = THREE.DoubleSide
                      })
                    } else {
                      child.material.side = THREE.DoubleSide
                    }
                  }
                }
              })
              
              // Store the original scene in cache (don't add to scene yet)
              resolve(gltf.scene)
            },
            (progress) => {
              // Progress callback - could be used for progress indicators
              if (progress.total > 0) {
                const percent = (progress.loaded / progress.total) * 100
                const event = new CustomEvent('modelLoadProgress', { 
                  detail: { modelId: id, progress: percent } 
                })
                map.getContainer().dispatchEvent(event)
              }
            },
            (error) => {
              reject(error)
            }
          )
        })

        // Cache the promise
        modelCache.set(path, loadPromise)

        try {
          const gltfScene = await loadPromise
          // Clone the scene for this instance
          const clonedScene = gltfScene.clone()
          this.scene.add(clonedScene)
          
          // Dispatch custom event when model loads successfully
          const event = new CustomEvent('modelLoaded', { 
            detail: { modelId: id, coordinates: modelCoordinates, success: true, cached: false } 
          })
          map.getContainer().dispatchEvent(event)
        } catch (error) {
          // Remove failed cache entry
          modelCache.delete(path)
          
          // Retry logic
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              loadModel(path)
            }, MODEL_CONFIG.RETRY_DELAY * retryCount) // Exponential backoff
          } else {
            // Max retries reached - dispatch error event
            const errorEvent = new CustomEvent('modelLoadError', { 
              detail: { 
                modelId: id, 
                error: error instanceof Error ? error.message : 'Unknown error',
                modelPath: path
              } 
            })
            map.getContainer().dispatchEvent(errorEvent)
          }
        }
      }

      loadModel(modelPath)

      // Use the MapLibre GL JS map canvas for three.js
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      })

      this.renderer.autoClear = false
    },
    render(gl: WebGLRenderingContext, args: RenderArgs) {
      // Check if terrain is enabled
      const terrainEnabled = this.map.getTerrain() !== null
      
      // Update terrain elevation in real-time as tiles load
      let terrainElevation = 0
      if (terrainEnabled) {
        const elevation = this.map.queryTerrainElevation(modelLocation)
        if (elevation !== null && elevation !== undefined) {
          terrainElevation = elevation
        }
      }
      
      // Add minimum offset to ensure model sits on top of terrain surface
      // This accounts for models with origin at their base
      const minimumOffset = terrainElevation > 0 ? 5 : 0 // 5 meters above terrain if terrain exists
      const finalAltitude = terrainElevation + altitude + minimumOffset
      
      // Terrain elevation logging (only in development)
      if (import.meta.env.DEV && terrainElevation > 0) {
        // Use proper logging instead of console.log
        // This can be removed or replaced with a logging utility
      }
      
      const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
        modelCoordinates,
        finalAltitude
      )

      // Update transform with current terrain elevation
      const currentTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: rotation[0],
        rotateY: rotation[1],
        rotateZ: rotation[2],
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * modelScaleFactor
      }

      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        currentTransform.rotateX
      )
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        currentTransform.rotateY
      )
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        currentTransform.rotateZ
      )

      const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix)
      const l = new THREE.Matrix4()
        .makeTranslation(
          currentTransform.translateX,
          currentTransform.translateY,
          currentTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            currentTransform.scale,
            -currentTransform.scale,
            currentTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)

      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()
    }
  } as Model3DLayer

  return layer
}

