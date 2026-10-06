export const families = [
  ['gallery', '画廊装裱'], ['double-mat', '双层卡纸'], ['inset', '内嵌相框'],
  ['keyline', '细线框'], ['corners', '照片角贴'], ['tape', '胶带手帐'],
  ['filmstrip', '胶片齿孔'], ['contact', '接触印样'], ['postage', '邮票边框'],
  ['postcard', '旅行明信片'], ['ticket', '票根收藏'], ['notebook', '笔记纸页'],
  ['blueprint', '网格制图'], ['editorial', '杂志标题'], ['sidebar', '侧栏排版'],
  ['caption-band', '色块题签'], ['overlay', '全幅底签'], ['floating-label', '悬浮标签'],
  ['arch', '拱门画窗'], ['oval', '椭圆画窗'], ['bevel', '斜角镜框'],
  ['stitched', '缝线织物'], ['offset', '错位叠纸'], ['duotone', '双色印刷'],
] as const;

export const palettes = [
  { id: 'ink', name: '墨白', paper: '#f5f5f4', ink: '#252525', accent: '#595959', soft: '#ddddda' },
  { id: 'jade', name: '青玉', paper: '#eef6f0', ink: '#173f35', accent: '#28725b', soft: '#bcd9ca' },
  { id: 'rose', name: '莓红', paper: '#fff1f3', ink: '#69243b', accent: '#b43d61', soft: '#f1bdcc' },
  { id: 'cobalt', name: '钴蓝', paper: '#eff5ff', ink: '#183c74', accent: '#2d63bd', soft: '#bfd2f0' },
  { id: 'citrus', name: '柠黄', paper: '#ffffe8', ink: '#41441b', accent: '#6c711d', soft: '#e0e595' },
] as const;

export type FamilyId = typeof families[number][0];
export type PaletteId = typeof palettes[number]['id'];
export type OriginalStyle = 'polaroid' | 'glass' | 'neon' | 'shadow' | 'vintage';
export type PhotoStyleId = OriginalStyle | `${FamilyId}-${PaletteId}`;
export interface PhotoStyle {
  id: PhotoStyleId;
  name: string;
  family: FamilyId | 'original';
  palette: PaletteId | 'original';
  variables: Record<string, string>;
}
export interface ShowcaseCard {
  id: number | string;
  image: string;
  type: PhotoStyleId;
  label: string;
  alt?: string;
  position?: string;
}

const originals: PhotoStyle[] = [
  ['polaroid', '拍立得'], ['glass', '透明玻璃'], ['neon', '深色相框'],
  ['shadow', '柔和阴影'], ['vintage', '复古胶片'],
].map(([id, name]) => ({ id: id as OriginalStyle, name, family: 'original', palette: 'original', variables: {} }));

export const photoStyles: PhotoStyle[] = [
  ...originals,
  ...palettes.flatMap(palette => families.map(([family, name]) => ({
    id: `${family}-${palette.id}` as PhotoStyleId,
    name: `${name} · ${palette.name}`,
    family,
    palette: palette.id,
    variables: {
      '--pc-paper': palette.paper, '--pc-ink': palette.ink,
      '--pc-accent': palette.accent, '--pc-soft': palette.soft,
    },
  }))),
];

const styleMap = new Map(photoStyles.map(style => [style.id, style]));
export function resolvePhotoStyle(id: string): PhotoStyle {
  return styleMap.get(id as PhotoStyleId) ?? photoStyles[0];
}

export const defaultCards: ShowcaseCard[] = [
  { id: 1, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', type: 'polaroid', label: 'Mountain' },
  { id: 2, image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop', type: 'glass', label: 'Forest' },
  { id: 3, image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=400&fit=crop', type: 'neon', label: 'Golden' },
  { id: 4, image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop', type: 'shadow', label: 'Spring' },
  { id: 5, image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop', type: 'vintage', label: 'Nature' },
];

export function isImageSource(value: unknown): value is string {
  return typeof value === 'string' && /^(https?:\/\/|\/(?!\/)|\.\.?\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(value);
}

export function parseCards(value: unknown): ShowcaseCard[] {
  if (!Array.isArray(value) || value.length !== 5) throw new Error('需要五张卡片的配置');
  const ids = new Set<string | number>();
  return value.map(card => {
    if (!card || !['string', 'number'].includes(typeof card.id) || ids.has(card.id)
      || !isImageSource(card.image) || !styleMap.has(card.type)
      || typeof card.label !== 'string' || card.label.length > 80
      || (card.alt !== undefined && (typeof card.alt !== 'string' || card.alt.length > 200))
      || (card.position !== undefined && !/^(center|top|bottom|left|right|\d{1,3}% \d{1,3}%)$/.test(card.position))) {
      throw new Error('卡片配置包含无效图片、风格、编号或文案');
    }
    ids.add(card.id);
    return { id: card.id, image: card.image, type: card.type, label: card.label,
      alt: card.alt, position: card.position };
  });
}
