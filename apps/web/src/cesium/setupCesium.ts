import {
  createWorldTerrainAsync,
  Viewer,
  type ViewerOptions,
  type Cesium3DTileset
} from 'cesium';

export async function createCesiumViewer(
  container: HTMLElement,
  options: ViewerOptions = {}
): Promise<Viewer> {
  const terrainProvider = await createWorldTerrainAsync();

  return new Viewer(container, {
    terrainProvider,
    timeline: false,
    animation: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    infoBox: false,
    selectionIndicator: false,
    ...options
  });
}

export async function addTilesetToScene(viewer: Viewer, tileset: Cesium3DTileset) {
  viewer.scene.primitives.add(tileset);
  await viewer.zoomTo(tileset);
}
