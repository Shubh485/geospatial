/** Deterministic demo overlay geometry. Not official watershed boundaries. */

export function demoRing(lat, lng, radiusDeg, points = 12, phase = 0) {
  const ring = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2 + phase;
    const radius = radiusDeg * (0.72 + 0.28 * Math.abs(Math.sin(angle * 2 + phase)));
    const lngScale = 1.15;
    ring.push([
      Number((lng + radius * Math.cos(angle) * lngScale).toFixed(5)),
      Number((lat + radius * Math.sin(angle)).toFixed(5)),
    ]);
  }
  ring.push(ring[0]);
  return ring;
}

export function parcelRing(lat, lng, index) {
  const w = 0.012 + (index % 5) * 0.002;
  const h = 0.01 + (index % 4) * 0.0015;
  const skew = ((index % 7) - 3) * 0.001;
  return [
    [Number((lng - w + skew).toFixed(5)), Number((lat - h).toFixed(5))],
    [Number((lng + w).toFixed(5)), Number((lat - h + skew).toFixed(5))],
    [Number((lng + w - skew).toFixed(5)), Number((lat + h).toFixed(5))],
    [Number((lng - w).toFixed(5)), Number((lat + h - skew).toFixed(5))],
    [Number((lng - w + skew).toFixed(5)), Number((lat - h).toFixed(5))],
  ];
}

export function offsetPoint(lat, lng, index, spread = 0.18) {
  const dx = (((index * 13) % 11) - 5) * (spread / 5);
  const dy = (((index * 7) % 9) - 4) * (spread / 5);
  return {
    lat: Number((lat + dy).toFixed(4)),
    lng: Number((lng + dx).toFixed(4)),
  };
}
