import {
  Cesium3DTileset,
  Ion,
  Primitive,
  Scene,
  Viewer,
  createGooglePhotorealistic3DTileset,
  defined
} from 'cesium';

const GOOGLE_3D_TILESET_URL = import.meta.env.VITE_GOOGLE_3D_TILESET_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

Ion.defaultAccessToken = '';

export type ViewerBundle = {
  viewer: Viewer;
  tileset: Cesium3DTileset;
};

const loadPhotorealisticTiles = async (scene: Scene): Promise<Cesium3DTileset> => {
  const trimmedUrl = GOOGLE_3D_TILESET_URL?.trim();
  if (trimmedUrl) {
    const externalTileset = await Cesium3DTileset.fromUrl(trimmedUrl);
    scene.primitives.add(externalTileset as Primitive);
    await scene.camera.flyToBoundingSphere(externalTileset.boundingSphere, {
      duration: 0
    });
    return externalTileset;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      'Set VITE_GOOGLE_3D_TILESET_URL to a Tile API root tileset URL or provide VITE_GOOGLE_MAPS_API_KEY for Cesium helper loading.'
    );
  }

  const googleTileset = await createGooglePhotorealistic3DTileset({
    onlyUsingWithGoogleGeocoder: false,
    key: GOOGLE_MAPS_API_KEY
  });

  scene.primitives.add(googleTileset as Primitive);
  await scene.camera.flyToBoundingSphere(googleTileset.boundingSphere, {
    duration: 0
  });
  return googleTileset;
};

export const createViewer = async (container: HTMLElement): Promise<ViewerBundle> => {
  const viewer = new Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    infoBox: false
  });

  viewer.scene.globe.show = false;

  const tileset = await loadPhotorealisticTiles(viewer.scene);

  return { viewer, tileset };
};

export const applyFilters = (tileset: Cesium3DTileset, showTiles: boolean, showWireframe: boolean) => {
  tileset.show = showTiles;

  if (defined((tileset as unknown as { debugWireframe?: boolean }).debugWireframe)) {
    (tileset as unknown as { debugWireframe: boolean }).debugWireframe = showWireframe;
  }
};
