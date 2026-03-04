import { Cesium3DTileset } from 'cesium';

const GOOGLE_TILESET_URL = (apiKey: string) =>
  `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`;

export function getGoogleTileApiKey(): string {
  const apiKey = import.meta.env.VITE_GOOGLE_TILE_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing VITE_GOOGLE_TILE_KEY. Add it to apps/web/.env (or your shell) before loading Google Photorealistic 3D Tiles.'
    );
  }

  return apiKey;
}

export async function loadPhotorealisticTiles(apiKey: string): Promise<Cesium3DTileset> {
  return Cesium3DTileset.fromUrl(GOOGLE_TILESET_URL(apiKey));
}
