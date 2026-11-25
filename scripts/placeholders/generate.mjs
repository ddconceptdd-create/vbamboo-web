// Generates placeholder imagery and SAMPLE content for preview builds.
// Run: node scripts/placeholders/generate.mjs
// All entries are written with "sample": true so they never appear on the
// production domain. Replace them in the content editor with real catalogue data.
import fs from 'node:fs';
import path from 'node:path';
import { sceneSVG, studioSVG, detailSVG, wideSVG, ensembleSVG, workshopSVG } from './art.mjs';

const root = process.cwd();
const write = (rel, data) => {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
};
const bi = (vi, en) => ({ vi, en });

const FABRICS = {
  'sand-linen': { name: bi('Lanh màu cát', 'Sand linen'), detail: bi('100% lanh, 420 g/m²', '100% linen, 420 g/m²'), color: '#D9CBB0' },
  'moss-boucle': { name: bi('Bouclé xanh rêu', 'Moss bouclé'), detail: bi('Bouclé len pha, 560 g/m²', 'Wool-blend bouclé, 560 g/m²'), color: '#5E6B4A' },
  'ivory-canvas': { name: bi('Canvas ngà', 'Ivory canvas'), detail: bi('Vải ngoài trời dệt solution-dyed', 'Solution-dyed outdoor canvas'), color: '#EEE6D6' },
  clay: { name: bi('Đất nung', 'Clay'), detail: bi('Cotton pha lanh, 380 g/m²', 'Cotton-linen blend, 380 g/m²'), color: '#B9805A' },
};
const FINISHES = {
  natural: { name: bi('Tre tự nhiên', 'Natural bamboo'), detail: bi('Dầu sáp gốc nước, mờ', 'Water-based oil wax, matte'), color: '#C9A267' },
  smoked: { name: bi('Tre hun khói', 'Smoked bamboo'), detail: bi('Hun nhiệt, sơn mờ', 'Heat-carbonised, matte lacquer'), color: '#8A6438' },
  espresso: { name: bi('Nâu trầm', 'Espresso'), detail: bi('Màu nhuộm gốc nước, sơn mờ', 'Water-based stain, matte lacquer'), color: '#4A3A28' },
};
const opt = (src, key) => ({ key, name: src[key].name, detail: src[key].detail, swatchColor: src[key].color, swatchImage: null });

const COLLECTIONS = [
  {
    slug: 'the-sands',
    name: 'The Sands',
    setting: 'coast',
    order: 1,
    tagline: bi('Nội thất cho những hiên nhà ven biển', 'Furniture for coastal terraces'),
    intro: bi(
      'The Sands bắt nguồn từ những bờ biển miền Trung: gió mặn, cát mịn và ánh sáng dịu buổi chiều. Khung tre uốn cong mềm như đường sóng, vải bọc mang sắc cát và đá.',
      'The Sands draws on the coastline of central Vietnam: salt air, fine sand and soft late-afternoon light. Bamboo frames bend like the line of a wave, and the upholstery takes its colours from sand and stone.',
    ),
    story: bi(
      'Mỗi thanh tre được chọn từ những cây trên năm năm tuổi, xử lý chống ẩm và uốn nhiệt bằng tay. Kết quả là một bộ sưu tập nhẹ, bền, sẵn sàng cho cả không gian trong nhà lẫn hiên có mái che.',
      'Each culm is selected from plants over five years old, treated against humidity and heat-bent by hand. The result is a light, durable collection that sits as easily indoors as on a covered terrace.',
    ),
    textures: [
      ['weave', bi('Đan tre thủ công', 'Hand-woven bamboo')],
      ['curve', bi('Khung uốn nhiệt', 'Heat-bent frame')],
      ['fabric', bi('Lanh màu cát', 'Sand linen')],
    ],
    ensemble: [['lounge-chairs', '#D9CBB0'], ['coffee-tables'], ['sofas', '#D9CBB0']],
  },
  {
    slug: 'grove',
    name: 'Grove',
    setting: 'grove',
    order: 2,
    tagline: bi('Nhịp điệu của rừng tre', 'The rhythm of a bamboo grove'),
    intro: bi(
      'Grove tôn vinh đường thẳng của thân tre và những đốt tre tự nhiên. Các thiết kế cho phòng ăn và thư viện, nơi cấu trúc được để lộ một cách trung thực.',
      'Grove celebrates the straight line of the culm and its natural nodes. Pieces for dining rooms and libraries, where the structure is left honestly on view.',
    ),
    story: bi(
      'Chúng tôi giữ nguyên đốt tre như một dấu ấn của vật liệu, kết hợp với mộng ghép truyền thống và chốt tre thay vì đinh vít ở những vị trí có thể.',
      'We keep each node as a signature of the material, combined with traditional joinery and bamboo pegs instead of screws wherever possible.',
    ),
    textures: [
      ['grain', bi('Thớ tre và đốt tre', 'Grain and node')],
      ['weave', bi('Mặt đan', 'Woven panel')],
      ['curve', bi('Thanh tre ghép', 'Laminated strips')],
    ],
    ensemble: [['chairs', '#5E6B4A'], ['tables'], ['shelving']],
  },
  {
    slug: 'lantern',
    name: 'Lantern',
    setting: 'dusk',
    order: 3,
    tagline: bi('Ánh sáng qua lớp đan tre', 'Light through woven bamboo'),
    intro: bi(
      'Lấy cảm hứng từ những chiếc đèn lồng phố cổ, Lantern là bộ sưu tập ánh sáng và những món đồ nhỏ tạo không khí cho buổi tối.',
      'Inspired by the lanterns of Vietnam’s old towns, Lantern is a collection of lighting and small pieces that set the mood for the evening.',
    ),
    story: bi(
      'Chao đèn được đan từ nan tre mỏng 1,2 mm, cho ánh sáng tán xạ ấm áp và để lại những hoa văn bóng đổ trên tường.',
      'Shades are woven from 1.2 mm bamboo strips, diffusing a warm light and casting patterned shadows across the walls.',
    ),
    textures: [
      ['weave', bi('Nan tre 1,2 mm', '1.2 mm bamboo strips')],
      ['grain', bi('Thân đèn tre đặc', 'Solid bamboo stem')],
      ['fabric', bi('Đế bọc vải', 'Upholstered base')],
    ],
    ensemble: [['lamps'], ['lounge-chairs', '#B9805A'], ['ottomans', '#B9805A']],
  },
];

const P = (o) => o;
const PRODUCTS = [
  P({ slug: 'sands-sofa', name: 'Sands Sofa', nameVi: 'Sofa Sands', category: 'sofas', collection: 'the-sands', order: 1, featured: true,
    summary: bi('Khung tre uốn liền một nét ôm trọn đệm ngồi sâu, tay vịn mảnh như đường bờ biển.', 'A single heat-bent bamboo line wraps a deep seat, with arms as slim as a shoreline.'),
    dims: [2200, 920, 760, 420], fabrics: ['sand-linen', 'moss-boucle', 'ivory-canvas', 'clay'], finishes: ['natural', 'smoked'] }),
  P({ slug: 'sands-lounge-chair', name: 'Sands Lounge Chair', nameVi: 'Ghế thư giãn Sands', category: 'lounge-chairs', collection: 'the-sands', order: 2, featured: true,
    summary: bi('Tựa lưng ngả thấp và mặt ngồi võng, dành cho những buổi chiều chậm rãi.', 'A low reclined back and sling seat, made for slow afternoons.'),
    dims: [780, 900, 820, 360], fabrics: ['sand-linen', 'ivory-canvas', 'clay'], finishes: ['natural', 'smoked'] }),
  P({ slug: 'sands-ottoman', name: 'Sands Ottoman', nameVi: 'Đôn Sands', category: 'ottomans', collection: 'the-sands', order: 3,
    summary: bi('Đế đan tre chéo nâng đỡ đệm tròn, vừa là chỗ gác chân vừa là ghế phụ.', 'A cross-woven bamboo base beneath a soft cushion: footrest and extra seat in one.'),
    dims: [620, 620, 420, null], fabrics: ['sand-linen', 'moss-boucle', 'clay'], finishes: ['natural'] }),
  P({ slug: 'sands-coffee-table', name: 'Sands Coffee Table', nameVi: 'Bàn trà Sands', category: 'coffee-tables', collection: 'the-sands', order: 4, featured: true,
    summary: bi('Mặt tre ép hình bầu dục trên đế đan, đường cong mềm như cồn cát.', 'An oval pressed-bamboo top on a woven base, curved like a dune.'),
    dims: [1200, 700, 380, null], fabrics: [], finishes: ['natural', 'smoked', 'espresso'] }),
  P({ slug: 'sands-parasol', name: 'Sands Parasol', nameVi: 'Dù Sands', category: 'umbrellas', collection: 'the-sands', order: 5,
    summary: bi('Cán tre đặc và nan dù tre uốn, che nắng cho hiên và hồ bơi.', 'A solid bamboo pole and bent bamboo ribs, shading terraces and pool decks.'),
    dims: [2800, 2800, 2600, null], fabrics: ['ivory-canvas', 'sand-linen'], finishes: ['natural'] }),
  P({ slug: 'grove-dining-chair', name: 'Grove Dining Chair', nameVi: 'Ghế ăn Grove', category: 'chairs', collection: 'grove', order: 1, featured: true,
    summary: bi('Tựa lưng nan dọc giữ nguyên đốt tre, cân bằng giữa thanh mảnh và vững chãi.', 'A slatted back that keeps every node, balanced between lightness and strength.'),
    dims: [520, 560, 820, 460], fabrics: ['moss-boucle', 'sand-linen', 'clay'], finishes: ['natural', 'smoked', 'espresso'] }),
  P({ slug: 'grove-dining-table', name: 'Grove Dining Table', nameVi: 'Bàn ăn Grove', category: 'tables', collection: 'grove', order: 2, featured: true,
    summary: bi('Mặt bàn tre ghép thanh trên chân tre đôi, cho tám người quây quần.', 'A laminated bamboo top on paired culm legs, seating eight.'),
    dims: [2400, 1000, 750, null], fabrics: [], finishes: ['natural', 'smoked', 'espresso'] }),
  P({ slug: 'grove-shelf', name: 'Grove Shelf', nameVi: 'Kệ Grove', category: 'shelving', collection: 'grove', order: 3,
    summary: bi('Kệ dáng thang với bốn tầng, khung tre hơi nghiêng tạo chiều sâu.', 'A ladder-form shelf with four tiers, its frame gently tapered for depth.'),
    dims: [1000, 400, 1900, null], fabrics: [], finishes: ['natural', 'smoked'] }),
  P({ slug: 'lantern-floor-lamp', name: 'Lantern Floor Lamp', nameVi: 'Đèn cây Lantern', category: 'lamps', collection: 'lantern', order: 1, featured: true,
    summary: bi('Chao đèn đan nan tre mỏng trên thân tre đặc, ánh sáng ấm và hoa văn bóng đổ.', 'A shade of fine woven strips on a solid bamboo stem, giving warm light and patterned shadow.'),
    dims: [480, 480, 1650, null], fabrics: [], finishes: ['natural', 'smoked'] }),
  P({ slug: 'lantern-lounge-chair', name: 'Lantern Lounge Chair', nameVi: 'Ghế thư giãn Lantern', category: 'lounge-chairs', collection: 'lantern', order: 2,
    summary: bi('Phiên bản ấm áp cho phòng khách, với đệm dày và màu đất nung.', 'A warmer living-room version with a deep cushion in clay tones.'),
    dims: [800, 880, 800, 380], fabrics: ['clay', 'moss-boucle', 'sand-linen'], finishes: ['smoked', 'espresso'] }),
  P({ slug: 'lantern-ottoman', name: 'Lantern Ottoman', nameVi: 'Đôn Lantern', category: 'ottomans', collection: 'lantern', order: 3,
    summary: bi('Đôn tròn thấp, đi cùng ghế thư giãn Lantern.', 'A low round ottoman, partnering the Lantern lounge chair.'),
    dims: [560, 560, 400, null], fabrics: ['clay', 'moss-boucle'], finishes: ['smoked', 'espresso'] }),
];

const SETTING_OF = Object.fromEntries(COLLECTIONS.map((c) => [c.slug, c.setting]));
const UPHOLSTERED = (p) => p.fabrics.length > 0;

// ---------- images ----------
for (const c of COLLECTIONS) {
  const dir = `public/images/collections/${c.slug}`;
  write(`${dir}/hero.svg`, wideSVG({ setting: c.setting, text: `${c.name.toUpperCase()} · OPENING WIDE PHOTOGRAPH` }));
  c.textures.forEach(([kind], i) =>
    write(`${dir}/texture-${i + 1}.svg`, detailSVG({ kind, tone: kind === 'fabric' ? '#D9CBB0' : undefined, text: `${c.name.toUpperCase()} · TEXTURE CLOSE-UP` })),
  );
  write(`${dir}/setting.svg`, ensembleSVG({ setting: c.setting, items: c.ensemble, text: `${c.name.toUpperCase()} · PIECES IN THE SETTING` }));
}

for (const p of PRODUCTS) {
  const dir = `public/images/products/${p.slug}`;
  const cushion = p.fabrics.length ? FABRICS[p.fabrics[0]].color : '#D9CBB0';
  const setting = SETTING_OF[p.collection];
  const N = p.name.toUpperCase();
  write(`${dir}/hero.svg`, studioSVG({ category: p.category, cushion, w: 2000, h: 1300, text: `${N} · SILHOUETTE PHOTOGRAPH` }));
  write(`${dir}/architectural.svg`, sceneSVG({ setting, category: p.category, cushion, text: `${N} · ARCHITECTURAL SETTING` }));
  write(`${dir}/studio.svg`, studioSVG({ category: p.category, cushion, text: `${N} · STUDIO VIEW` }));
  write(`${dir}/detail.svg`, detailSVG({ kind: ['weave', 'curve', 'grain'][p.order % 3], text: `${N} · DETAIL CLOSE-UP` }));
  write(`${dir}/collection.svg`, ensembleSVG({ setting, items: COLLECTIONS.find((c) => c.slug === p.collection).ensemble, text: `${N} · WITH THE COLLECTION` }));
  for (const f of p.fabrics) write(`public/images/products/versions/${p.slug}-${f}.svg`, studioSVG({ category: p.category, cushion: FABRICS[f].color, text: `${N} · ${FABRICS[f].name.en.toUpperCase()}` }));
}

write('public/images/pages/home-hero-mobile.svg', sceneSVG({ setting: 'coast', category: 'sofas', cushion: '#D9CBB0', w: 1080, h: 1920, text: 'HOME · PORTRAIT CROP' }));
write('public/images/pages/home-hero.svg', sceneSVG({ setting: 'coast', category: 'sofas', cushion: '#D9CBB0', w: 2400, h: 1350, text: 'HOME · SIGNATURE PIECE IN ARCHITECTURAL SPACE' }));
[0, 1, 2].forEach((v) => write(`public/images/pages/workshop-${v + 1}.svg`, workshopSVG({ variant: v, text: ['WORKSHOP · CULMS DRYING', 'WORKSHOP · HEAT BENDING', 'WORKSHOP · CUT CULMS'][v] })));
write('public/images/pages/about-hero.svg', wideSVG({ setting: 'grove', text: 'ABOUT · BAMBOO GROVE' }));
write('public/images/pages/about-artisans.svg', workshopSVG({ variant: 1, text: 'ABOUT · ARTISANS AT WORK' }));
write('public/images/pages/about-material.svg', detailSVG({ kind: 'grain', text: 'ABOUT · MATERIAL SELECTION' }));
write('public/images/pages/about-finished.svg', sceneSVG({ setting: 'grove', category: 'chairs', cushion: '#5E6B4A', text: 'ABOUT · FINISHED PIECE' }));
write('public/images/stores/showroom.svg', ensembleSVG({ setting: 'grove', items: [['shelving'], ['sofas', '#D9CBB0'], ['lamps']], text: 'STORE · SHOWROOM PHOTO' }));
write('public/images/stores/dealer.svg', ensembleSVG({ setting: 'coast', items: [['lounge-chairs', '#D9CBB0'], ['umbrellas', '#EEE6D6']], text: 'STORE · DEALER PHOTO' }));

// ---------- content ----------
for (const c of COLLECTIONS) {
  write(`content/collections/${c.slug}.json`, {
    name: c.name,
    sample: true,
    order: c.order,
    tagline: c.tagline,
    intro: c.intro,
    story: c.story,
    heroImage: `/images/collections/${c.slug}/hero.svg`,
    heroAlt: bi(`Không gian mở đầu của bộ sưu tập ${c.name}`, `Opening landscape of the ${c.name} collection`),
    textures: c.textures.map(([, caption], i) => ({ image: `/images/collections/${c.slug}/texture-${i + 1}.svg`, caption })),
    settingImage: `/images/collections/${c.slug}/setting.svg`,
    settingAlt: bi(`Các thiết kế ${c.name} trong không gian`, `${c.name} pieces in their setting`),
  });
}

const MATERIALS = (p) => {
  const m = [
    { label: bi('Khung', 'Frame'), value: bi('Tre luồng Thanh Hoá, trên 5 năm tuổi, xử lý chống mối mọt', 'Thanh Hoa luong bamboo, 5+ years old, treated against insects') },
    { label: bi('Liên kết', 'Joinery'), value: bi('Mộng ghép và chốt tre, keo gốc nước', 'Mortise joints and bamboo pegs, water-based adhesive') },
    { label: bi('Hoàn thiện', 'Finish'), value: bi('Dầu sáp gốc nước, VOC thấp', 'Low-VOC water-based oil wax') },
  ];
  if (UPHOLSTERED(p)) m.push({ label: bi('Đệm', 'Cushion'), value: bi('Mút HR mật độ cao bọc bông polyester, vỏ tháo rời', 'High-resilience foam wrapped in fibre, removable covers') });
  if (p.category === 'lamps') m.push({ label: bi('Điện', 'Electrical'), value: bi('Đui E27, dây vải, công tắc chân', 'E27 holder, fabric cable, foot switch') });
  if (p.category === 'umbrellas') m.push({ label: bi('Tán', 'Canopy'), value: bi('Vải acrylic solution-dyed, chống UV', 'UV-resistant solution-dyed acrylic') });
  return m;
};

for (const p of PRODUCTS) {
  const [w, d, h, sh] = p.dims;
  const c = COLLECTIONS.find((c) => c.slug === p.collection);
  write(`content/products/${p.slug}.json`, {
    name: p.name,
    nameVi: p.nameVi,
    sample: true,
    category: p.category,
    collection: p.collection,
    order: p.order,
    featured: !!p.featured,
    summary: p.summary,
    story: bi(
      `Thuộc bộ sưu tập ${c.name}. ${c.story.vi}`,
      `Part of the ${c.name} collection. ${c.story.en}`,
    ),
    heroImage: `/images/products/${p.slug}/hero.svg`,
    heroAlt: bi(`${p.nameVi}, dáng tổng thể`, `${p.name}, full silhouette`),
    gallery: [
      { image: `/images/products/${p.slug}/architectural.svg`, kind: 'architectural', alt: bi(`${p.nameVi} trong không gian kiến trúc`, `${p.name} in an architectural setting`) },
      { image: `/images/products/${p.slug}/studio.svg`, kind: 'studio', alt: bi(`${p.nameVi}, ảnh studio`, `${p.name}, studio view`) },
      { image: `/images/products/${p.slug}/detail.svg`, kind: 'detail', alt: bi(`Chi tiết tre của ${p.nameVi}`, `Bamboo detail of the ${p.name}`) },
    ],
    dimensions: { width: w, depth: d, height: h, seatHeight: sh, approved: false },
    materials: MATERIALS(p),
    frameFinishes: p.finishes.map((k) => opt(FINISHES, k)),
    upholstery: p.fabrics.map((k) => opt(FABRICS, k)),
    versionImages: p.fabrics.map((f) => ({ finish: '', fabric: f, image: `/images/products/versions/${p.slug}-${f}.svg` })),
    drawings: { front: null, side: null, plan: null },
    downloads: [],
    collectionImage: `/images/products/${p.slug}/collection.svg`,
    prices: { vnd: null, usd: null, approved: false },
  });
}

write('content/pages/home.json', {
  heroCollection: 'the-sands',
  heroImage: '/images/pages/home-hero.svg',
  heroImageMobile: '/images/pages/home-hero-mobile.svg',
  heroAlt: bi('Sofa Sands trong một không gian kiến trúc mở ra biển', 'The Sands sofa in an architectural space opening onto the sea'),
  introTitle: bi('Tre Việt Nam, cho không gian đương đại', 'Vietnamese bamboo, for contemporary interiors'),
  introText: bi(
    'VBamboo thiết kế và chế tác nội thất tre cho kiến trúc sư, nhà thiết kế nội thất và các dự án khách sạn tại Việt Nam và trên thế giới. Mỗi thiết kế bắt đầu từ cây tre, và từ đôi tay của người thợ.',
    'VBamboo designs and crafts bamboo furniture for architects, interior designers and hospitality projects in Vietnam and around the world. Every piece begins with the culm, and with the hands of an artisan.',
  ),
  curatedTitle: bi('Những thiết kế tiêu biểu', 'Signature pieces'),
  workshopTitle: bi('Từ rừng tre đến xưởng', 'From the grove to the workshop'),
  workshopText: bi(
    'Tại xưởng, tre được phơi khô tự nhiên, uốn nhiệt và đan bằng tay bởi những nghệ nhân có hàng chục năm kinh nghiệm. Chúng tôi chọn từng cây, và biết tên người làm ra từng sản phẩm.',
    'In our workshop, bamboo is air-dried, heat-bent and hand-woven by artisans with decades of experience. We select every culm, and we know the name of the person who made each piece.',
  ),
  workshopImages: [
    { image: '/images/pages/workshop-1.svg', caption: bi('Phơi tre tự nhiên', 'Air-drying the culms') },
    { image: '/images/pages/workshop-2.svg', caption: bi('Uốn nhiệt bằng tay', 'Heat-bending by hand') },
    { image: '/images/pages/workshop-3.svg', caption: bi('Chọn và cắt tre', 'Selecting and cutting') },
  ],
});

write('content/pages/about.json', {
  title: bi('Về VBamboo', 'About VBamboo'),
  lead: bi(
    'Chúng tôi tin rằng tre Việt Nam xứng đáng có mặt trong những không gian nội thất đẹp nhất thế giới.',
    'We believe Vietnamese bamboo belongs in the finest interiors in the world.',
  ),
  heroImage: '/images/pages/about-hero.svg',
  chapters: [
    {
      eyebrow: bi('Khởi nguồn', 'Origins'),
      title: bi('Bắt đầu từ làng nghề', 'It began in a craft village'),
      text: bi(
        '[Nội dung mẫu] VBamboo ra đời từ những làng nghề tre truyền thống ở miền Bắc Việt Nam, với mong muốn đưa kỹ thuật của thế hệ trước vào ngôn ngữ thiết kế hôm nay.',
        '[Sample text] VBamboo grew out of the traditional bamboo villages of northern Vietnam, with the aim of bringing the techniques of earlier generations into today’s design language.',
      ),
      image: '/images/pages/about-artisans.svg',
      alt: bi('Nghệ nhân đang uốn tre', 'Artisans bending bamboo'),
    },
    {
      eyebrow: bi('Vật liệu', 'Material'),
      title: bi('Chọn tre như chọn gỗ quý', 'Selecting bamboo like fine timber'),
      text: bi(
        '[Nội dung mẫu] Chúng tôi chỉ dùng tre trên năm năm tuổi, khai thác có chọn lọc để rừng tre tiếp tục tái sinh. Mỗi cây được phân loại theo độ dày, độ thẳng và màu sắc.',
        '[Sample text] We use only culms over five years old, selectively harvested so the grove keeps regenerating. Each is graded by wall thickness, straightness and colour.',
      ),
      image: '/images/pages/about-material.svg',
      alt: bi('Thớ tre cận cảnh', 'Close-up of bamboo grain'),
    },
    {
      eyebrow: bi('Trách nhiệm', 'Responsibility'),
      title: bi('Sản xuất có trách nhiệm', 'Responsible production'),
      text: bi(
        '[Nội dung mẫu] Hoàn thiện gốc nước, đóng gói giảm nhựa, và chế độ đãi ngộ công bằng cho người thợ. Chúng tôi muốn mỗi sản phẩm bền lâu, sửa được và tái chế được.',
        '[Sample text] Water-based finishes, reduced-plastic packaging and fair conditions for our artisans. We want every piece to last, to be repairable and recyclable.',
      ),
      image: '/images/pages/about-finished.svg',
      alt: bi('Ghế Grove hoàn thiện', 'A finished Grove chair'),
    },
  ],
  principles: [
    { title: bi('Thủ công', 'Craftsmanship'), text: bi('Kỹ thuật truyền thống, độ chính xác của xưởng hiện đại.', 'Traditional techniques with the precision of a modern workshop.') },
    { title: bi('Vật liệu', 'Material'), text: bi('Tre Việt Nam được chọn lọc, xử lý và hoàn thiện tự nhiên.', 'Vietnamese bamboo, carefully selected, treated and naturally finished.') },
    { title: bi('Trách nhiệm', 'Responsibility'), text: bi('Rừng tre tái sinh, người thợ được trân trọng.', 'Regenerating groves, and artisans who are valued.') },
  ],
});

write('content/pages/site.json', {
  email: 'hello@vbamboo.example',
  phone: '+84 00 000 0000',
  address: bi('[Địa chỉ văn phòng — cần bổ sung]', '[Head office address — to be supplied]'),
  instagram: null,
  facebook: null,
  linkedin: null,
  footerNote: bi('Thiết kế và chế tác tại Việt Nam.', 'Designed and made in Vietnam.'),
  showPrices: false,
});

const store = (slug, o) => write(`content/stores/${slug}.json`, { sample: true, bookingUrl: null, ...o });
store('vbamboo-showroom-hanoi', {
  name: 'VBamboo Showroom Hà Nội',
  kind: 'showroom',
  order: 1,
  city: bi('Hà Nội', 'Hanoi'),
  country: bi('Việt Nam', 'Vietnam'),
  address: bi('[Địa chỉ mẫu] Quận Tây Hồ, Hà Nội', '[Sample address] Tay Ho District, Hanoi'),
  hours: bi('Thứ Hai – Thứ Bảy: 9:00 – 18:00\nChủ nhật: theo lịch hẹn', 'Mon – Sat: 9:00 – 18:00\nSunday: by appointment'),
  phone: '+84 00 000 0001',
  email: 'hanoi@vbamboo.example',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tay+Ho+Hanoi',
  appointmentRequired: false,
  image: '/images/stores/showroom.svg',
});
store('vbamboo-studio-hcmc', {
  name: 'VBamboo Studio TP.HCM',
  kind: 'showroom',
  order: 2,
  city: bi('TP. Hồ Chí Minh', 'Ho Chi Minh City'),
  country: bi('Việt Nam', 'Vietnam'),
  address: bi('[Địa chỉ mẫu] Thủ Đức, TP. Hồ Chí Minh', '[Sample address] Thu Duc, Ho Chi Minh City'),
  hours: bi('Thứ Ba – Thứ Bảy: 10:00 – 18:00', 'Tue – Sat: 10:00 – 18:00'),
  phone: '+84 00 000 0002',
  email: 'hcmc@vbamboo.example',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Thu+Duc+Ho+Chi+Minh+City',
  appointmentRequired: true,
  image: '/images/stores/showroom.svg',
});
store('dealer-singapore', {
  name: 'Sample Dealer Singapore',
  kind: 'dealer',
  order: 3,
  city: bi('Singapore', 'Singapore'),
  country: bi('Singapore', 'Singapore'),
  address: bi('[Địa chỉ mẫu] Singapore', '[Sample address] Singapore'),
  hours: bi('Thứ Hai – Thứ Sáu: 10:00 – 19:00', 'Mon – Fri: 10:00 – 19:00'),
  phone: '+65 0000 0000',
  email: 'dealer@example.com',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Singapore',
  appointmentRequired: true,
  image: '/images/stores/dealer.svg',
});

console.log('Placeholders and sample content written.');
