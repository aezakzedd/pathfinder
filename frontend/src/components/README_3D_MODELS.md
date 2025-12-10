# 3D Model System Documentation

## Overview

The 3D model system is a lightweight, reusable component architecture for displaying multiple 3D models (GLTF files) on a MapLibre map. It's designed to easily add tourist spots throughout Catanduanes.

## Architecture

### Components

1. **`types/model.ts`** - TypeScript interface for model configuration
2. **`utils/createModelLayer.ts`** - Core function that creates a MapLibre custom layer for a 3D model
3. **`hooks/useMap3DModels.ts`** - React hook that manages adding/removing multiple models
4. **`config/touristSpots.ts`** - Configuration file where all tourist spot models are defined

## Adding a New 3D Model

To add a new tourist spot 3D model:

1. **Place your GLTF file** in the `public/` folder (or a subfolder)
   ```
   public/
     models/
       puraran_beach.gltf
       puraran_beach.bin  (if separate)
   ```

2. **Update `config/touristSpots.ts`**:
   ```typescript
   export const touristSpotModels: Model3DConfig[] = [
     // ... existing models
     {
       id: 'puraran-beach',
       modelPath: '/models/puraran_beach.gltf',
       coordinates: [124.2167, 13.7833], // [longitude, latitude]
       altitude: 0,
       rotation: [Math.PI / 2, 0, 0], // [x, y, z] in radians
       scale: 0.3,
       name: 'Puraran Beach'
     }
   ]
   ```

3. **That's it!** The model will automatically appear on the map.

## Configuration Options

### Model3DConfig Interface

```typescript
{
  id: string              // Unique identifier (required)
  modelPath: string       // Path to GLTF file (required)
  coordinates: [number, number]  // [longitude, latitude] (required)
  altitude?: number       // Height in meters (default: 0)
  rotation?: [number, number, number]  // [x, y, z] in radians (default: [π/2, 0, 0])
  scale?: number          // Scale factor (default: 0.3)
  name?: string           // Optional name for the spot
}
```

## Performance

- **Lightweight**: Each model uses its own Three.js scene, but shares the same WebGL context
- **Efficient**: Models are only loaded when the map is ready
- **Optimized**: Materials are automatically configured for proper rendering
- **Clean**: Automatic cleanup when components unmount

## Example: Multiple Tourist Spots

```typescript
export const touristSpotModels: Model3DConfig[] = [
  {
    id: 'kape-tagpuan',
    modelPath: '/models/kape_tagpuan.gltf',
    coordinates: [124.29979094631472, 13.607554079383291],
    scale: 0.3,
    name: "Kape't Tagpuan"
  },
  {
    id: 'puraran-beach',
    modelPath: '/models/puraran_beach.gltf',
    coordinates: [124.2167, 13.7833],
    scale: 0.25,
    name: 'Puraran Beach'
  },
  {
    id: 'bato-church',
    modelPath: '/models/bato_church.gltf',
    coordinates: [124.3500, 13.6000],
    scale: 0.4,
    name: 'Bato Church'
  }
]
```

## Troubleshooting

- **Model not appearing**: Check that the `modelPath` is correct and the file exists in `public/`
- **Model too large/small**: Adjust the `scale` property
- **Model in wrong position**: Verify `coordinates` are correct [longitude, latitude]
- **Model rotated incorrectly**: Adjust the `rotation` array [x, y, z] in radians

