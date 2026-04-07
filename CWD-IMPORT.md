# CWD Zone Import

Heyra now supports local import of CWD monitoring zones into PostGIS.

## Quick start

1. Put a GeoJSON FeatureCollection on disk.
2. Run:

```bash
npm run cwd:import -- ./path/to/cwd-zones.geojson
```

To replace existing rows first:

```bash
npm run cwd:import -- --replace ./path/to/cwd-zones.geojson
```

## Supported geometry

- `Polygon`
- `MultiPolygon`

The importer stores zones as `geometry(MultiPolygon, 4326)` and updates existing rows by `externalId`.

## Notes

- `data/cwd-zones.example.geojson` is only a development example, not authoritative production data.
- Property boundaries are re-checked against imported CWD zones whenever a boundary is saved.
