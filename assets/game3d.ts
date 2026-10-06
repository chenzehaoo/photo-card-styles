import * as THREE from 'three';

export function buildGameFrame(id: string, accent: string) {
  const group = new THREE.Group(); group.userData.layerIndex = 3;
  const mythic = id === 'mythic', frost = id === 'frost';
  const shape = new THREE.Shape();
  const points = [[-.88,-1.24],[.88,-1.24],[.99,-1.13],[.99,1.13],[.88,1.24],[-.88,1.24],[-.99,1.13],[-.99,-1.13]];
  points.forEach(([x,y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-.89,-1.13); hole.lineTo(-.89,1.13); hole.lineTo(.89,1.13); hole.lineTo(.89,-1.13); hole.closePath(); shape.holes.push(hole);
  const metal = new THREE.MeshPhysicalMaterial({ color: mythic ? '#b59044' : frost ? '#bad7e0' : '#39464c', metalness: frost ? .45 : .85, roughness: .32, clearcoat: .45, envMapIntensity: .6 });
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true, bevelSize: .008, bevelThickness: .012, bevelSegments: 3, steps: 1 }), metal);
  group.add(rim);
  for (const y of [-1.19,1.19]) {
    const groove = new THREE.Mesh(new THREE.BoxGeometry(1.56,.022,.006), new THREE.MeshStandardMaterial({ color: '#222c2c', roughness: .8 }));
    groove.position.set(0,y,.052); group.add(groove);
    for (const x of [-.64,-.45,-.26,.26,.45,.64]) {
      const etching = new THREE.Mesh(new THREE.BoxGeometry(.06,.015,.008),new THREE.MeshBasicMaterial({ color: accent, toneMapped: false }));
      etching.position.set(x,y,.06); etching.rotation.z = mythic ? .65 : frost ? -.65 : 0; group.add(etching);
    }
  }
  for (const x of [-.935,.935]) for (const y of [-1.08,1.08]) {
    const gem = new THREE.Mesh(frost ? new THREE.OctahedronGeometry(.065) : new THREE.BoxGeometry(.07,.13,.05), new THREE.MeshPhysicalMaterial({ color: accent, emissive: accent, emissiveIntensity: .6, metalness: .35, roughness: .15 }));
    gem.position.set(x,y,.065); gem.rotation.z = mythic ? Math.PI / 4 : .15; group.add(gem);
  }
  for (const x of [-.94,.94]) for (let i=0;i<9;i++) {
    const inset = new THREE.Mesh(new THREE.BoxGeometry(.025, mythic ? .026 : .065,.012), new THREE.MeshBasicMaterial({ color: i%3 ? accent : '#ffffff', toneMapped: false }));
    inset.position.set(x,-.68+i*.17,.066); inset.rotation.z = frost ? .5 : 0; group.add(inset);
  }
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(.075), new THREE.MeshPhysicalMaterial({ color: accent, emissive: accent, emissiveIntensity: .4, metalness: .5, roughness: .15 }));
  crest.position.set(0,1.18,.08); crest.scale.set(1.2,.8,.45); group.add(crest);
  return group;
}

export function buildGameEnergy(id: string, accent: string) {
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, strength: { value: .65 }, tint: { value: new THREE.Color(accent) }, kind: { value: id === 'mythic' ? 0 : id === 'cyber' ? 1 : 2 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float time; uniform float strength; uniform vec3 tint; uniform float kind;
      void main(){
        vec2 uv=vUv; float edge=min(uv.x,1.0-uv.x);
        float mask=(1.0-smoothstep(0.055,0.21,edge))*smoothstep(0.07,0.18,uv.y)*(1.0-smoothstep(0.9,0.97,uv.y));
        float wave=sin(uv.y*43.0-time*2.0+sin(uv.y*19.0+time)*2.0);
        float ridge=exp(-abs(edge-(0.08+wave*0.018))*125.0);
        float streak=pow(max(0.0,sin(uv.y*85.0+uv.x*17.0-time*3.0)),16.0);
        float scan=pow(max(0.0,sin(uv.y*21.0-time*1.5)),24.0);
        float a=kind<0.5 ? ridge+streak*.45 : kind<1.5 ? ridge*.6+scan : ridge*.8+streak*.7;
        gl_FragColor=vec4(mix(tint,vec3(1.0),ridge*.45),clamp(a*mask*strength,0.0,0.85));
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2.5),material); mesh.userData.layerIndex=6; mesh.userData.gameEnergy=true; return mesh;
}

export function animateGameEnergy(group: THREE.Group, time: number) {
  for (const object of group.children) if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial && (object.userData.gameEnergy || object.userData.animatedFoil)) object.material.uniforms.time.value = time;
}
