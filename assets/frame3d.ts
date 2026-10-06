import * as THREE from 'three';

export const framePresets = [
  { id: 'gallery', name: '画廊白框', color: '#eeeef0', width: .14, roughness: .48, metalness: 0 },
  { id: 'wood', name: '胡桃木框', color: '#78503a', width: .18, roughness: .62, metalness: 0 },
  { id: 'silver', name: '拉丝银框', color: '#adb5bf', width: .075, roughness: .27, metalness: .95 },
  { id: 'black', name: '曜石窄框', color: '#24252a', width: .07, roughness: .32, metalness: .5 },
  { id: 'acrylic', name: '冰透亚克力', color: '#bee8ee', width: .16, roughness: .12, metalness: 0 },
  { id: 'float', name: '悬浮装裱', color: '#595667', width: .19, roughness: .55, metalness: .15 },
] as const;
export type FramePresetId = typeof framePresets[number]['id'];

function ring(outerX: number, outerY: number, innerX: number, innerY: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-outerX, -outerY); shape.lineTo(outerX, -outerY);
  shape.lineTo(outerX, outerY); shape.lineTo(-outerX, outerY); shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-innerX, -innerY); hole.lineTo(-innerX, innerY);
  hole.lineTo(innerX, innerY); hole.lineTo(innerX, -innerY); hole.closePath();
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .012, bevelThickness: .012, curveSegments: 1 });
}

function woodTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(128, 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 128; x++) {
    const grain = Math.sin(x * .9 + Math.sin(y * .021) * 2) * 12 + Math.sin(x * 3.3 + y * .07) * 5;
    const i = (y * 128 + x) * 4;
    pixels.data.set([176 + grain, 136 + grain, 104 + grain, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 1);
  return texture;
}

export function disposeFrame(group: THREE.Group) {
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) { material.map?.dispose(); material.dispose(); }
  });
  group.clear();
}

export function buildFrame(id: FramePresetId, thickness: number) {
  const preset = framePresets.find(item => item.id === id)!;
  const group = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({
    color: preset.color, roughness: preset.roughness, metalness: preset.metalness,
    clearcoat: id === 'wood' ? .3 : .12,
    ...(id === 'acrylic' ? { transmission: .88, thickness: .3, ior: 1.46, transparent: true, opacity: .85, color: '#e0f8fa' } : {}),
  });
  if (id === 'wood') material.map = woodTexture();
  if (id === 'silver') { material.anisotropy = .65; material.anisotropyRotation = Math.PI / 2; }
  const gap = id === 'float' ? .09 : .018;
  const rim = new THREE.Mesh(ring(1 + preset.width, 1.25 + preset.width, 1 + gap, 1.25 + gap, thickness + .045), material);
  rim.position.z = -thickness / 2; rim.castShadow = rim.receiveShadow = true; group.add(rim);
  // Recessed mounting board creates a real air gap around the print.
  if (id !== 'acrylic') {
    const mount = new THREE.Mesh(new THREE.BoxGeometry(2 + preset.width * 2, 2.5 + preset.width * 2, .025), new THREE.MeshStandardMaterial({ color: id === 'float' ? '#16171d' : '#dedee0', roughness: .95 }));
    mount.position.z = -thickness / 2; group.add(mount);
  }
  if (id === 'acrylic') {
    for (const x of [-1.085, 1.085]) for (const y of [-1.335, 1.335]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, thickness + .055, 16), new THREE.MeshStandardMaterial({ color: '#cad3da', metalness: 1, roughness: .22 }));
      bolt.rotation.x = Math.PI / 2; bolt.position.set(x, y, .02); group.add(bolt);
    }
  }
  return group;
}
