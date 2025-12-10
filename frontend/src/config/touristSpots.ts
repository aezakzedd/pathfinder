import { Model3DConfig } from '../types/model'

/**
 * Configuration for all tourist spot 3D models in Catanduanes
 * Add new tourist spots here as you create more 3D models
 */
export const touristSpotModels: Model3DConfig[] = [
  {
    id: 'kape-tagpuan',
    modelPath: '/1998193939030491136/light.glb',
    coordinates: [124.32495514015112, 13.559159840888644],
    altitude: 25,
    rotation: [Math.PI / 2, 0, 0],
    scale: 4.0,
    name: "Bote Lighthouse"
  }
  // Add more tourist spots here as you create models:
  // {
  //   id: 'puraran-beach',
  //   modelPath: '/models/puraran_beach.gltf',
  //   coordinates: [124.2167, 13.7833],
  //   altitude: 0,
  //   rotation: [Math.PI / 2, 0, 0],
  //   scale: 0.3,
  //   name: 'Puraran Beach'
  // },
]

