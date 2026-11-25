"""
One-off import of the VBamboo 2026 catalogue (exported from Canva) into the site.

    python3 scripts/catalogue/import.py /path/to/assets

Reads catalogue-data.json and images.json from the export folder, optimises the
photos into public/images/… (following Keystatic's folder convention so every
image is editable in /keystatic) and writes the content JSON in content/….

Re-running overwrites catalogue entries, so after the team has edited content
in /keystatic, don't run it again.
"""
import json
import os
import shutil
import sys

from PIL import Image, ImageChops

sys.path.insert(0, os.path.dirname(__file__))
import translations as T  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/vbamboo-web/assets'
DATA = json.load(open(os.path.join(SRC, 'catalogue-data.json')))
IMAGES = json.load(open(os.path.join(SRC, 'images.json')))
SIZE = {i['file']: (i['width'], i['height']) for i in IMAGES}

PUBLIC = os.path.join(ROOT, 'public')
CONTENT = os.path.join(ROOT, 'content')


def bi(vi, en=''):
    return {'vi': vi or '', 'en': en or ''}


# ---------------------------------------------------------------- images

def trim(im, margin=0.04):
    """Crop empty space around a cut-out (transparent) or studio shot (white)."""
    if im.mode in ('RGBA', 'LA') or 'transparency' in im.info:
        box = im.convert('RGBA').getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    else:
        rgb = im.convert('RGB')
        diff = ImageChops.difference(rgb, Image.new('RGB', rgb.size, (255, 255, 255))).convert('L')
        box = diff.point(lambda v: 255 if v > 14 else 0).getbbox()
    if not box:
        return im
    m = int(max(im.size) * margin)
    l, t, r, b = box
    return im.crop((max(0, l - m), max(0, t - m), min(im.width, r + m), min(im.height, b + m)))


def save_image(src_rel, dest_rel, max_side=1800, crop=False):
    """Optimise one image. Returns the public URL."""
    src = os.path.join(SRC, src_rel)
    dest = os.path.join(PUBLIC, dest_rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im = Image.open(src)
    if crop:
        im = trim(im)
    if max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    if dest.endswith('.webp'):
        im.save(dest, 'WEBP', quality=86, method=6)
    else:
        im.convert('RGB').save(dest, 'JPEG', quality=80, optimize=True, progressive=True)
    return '/' + dest_rel


def ahash(src_rel):
    im = Image.open(os.path.join(SRC, src_rel)).convert('L').resize((16, 16), Image.BILINEAR)
    px = list(im.getdata()) if not hasattr(im, 'get_flattened_data') else list(im.get_flattened_data())
    avg = sum(px) / len(px)
    return [p > avg for p in px]


def similar(a, b):
    return sum(x != y for x, y in zip(a, b)) < 26


def line_brightness(src_rel):
    im = Image.open(os.path.join(SRC, src_rel)).convert('RGBA')
    data = im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()
    px = [(r, g, b) for r, g, b, a in data if a > 128]
    if not px:
        return 0
    return sum(0.3 * r + 0.59 * g + 0.11 * b for r, g, b in px) / len(px)


def files(slug, prefix):
    d = os.path.join(SRC, 'products', slug)
    if not os.path.isdir(d):
        return []
    return sorted(f for f in os.listdir(d) if f.startswith(prefix))


# ---------------------------------------------------------------- decisions

# The clearest whole-piece image for the product introduction.
# 'cutout' images are shown whole on ivory; 'photo' fills the frame.
SILHOUETTE = {
    'bosento-sofa': 'cutout-01.webp',
    'borsani-sofa': 'overview-studio.jpg',
    'wave-sofa': 'overview-studio.jpg',
    'embrace-sofa-a': 'overview-cutout.webp',
    'tabouret-table': 'cutout-01.webp',
    'tabouret-chair': 'cutout-01.webp',
    'nan-chair': 'cutout-01.webp',
    'gentleman-chair': 'cutout-01.webp',
    'voyager': 'overview-studio.jpg',
    'captain-chair': 'cutout-01.webp',
    'baron-chair': 'cutout-01.webp',
    'baroness-chair': 'overview-studio.jpg',
    'explorer-chair': 'cutout-01.webp',
    'verner-hammock': 'cutout-01.webp',
    'moonlight-hammock': 'cutout-01.webp',
    'xchair': 'cutout-01.webp',
    'sandy-chair': 'cutout-01.webp',
    'beach-hammock-a': 'overview-studio.jpg',
    'beach-hammock-b': 'overview-studio.jpg',
    'oasis-parasol': 'overview-cutout.webp',
    'lotus-chair': 'overview-cutout.webp',
    'a-line-lamp': 'overview-studio.jpg',  # only 512 px: ask VBamboo for a larger one
    'kink-lamp': 'overview-studio.jpg',
    # no clean studio shot at a usable size: use the architectural photo
    'tam-chair': None,
    'forest-chair': None,
    'commander-chair': None,
}

# Photos that belong to another product (catalogue layout errors).
EXCLUDE = {
    'a-line-lamp': {'hero.jpg'},  # shows the Kink lamp
}

# Not published on the live site until VBamboo confirms them.
DRAFTS = {'voyager', 'oasis-parasol'}

# Catalogue figures that contradict each other; shown on previews only, marked as sample.
DIMS_UNCONFIRMED = {'borsani-sofa', 'baroness-chair', 'sandy-chair', 'captain-chair'}

# Catalogue descriptions that belong to a different product.
SKIP_DESCRIPTION = {'explorer-chair'}

FEATURED = ['bosento-sofa', 'wave-sofa', 'gentleman-chair', 'captain-chair', 'verner-hammock', 'kink-lamp']

VIEW = {
    'front': ('Mặt đứng chính', 'Front elevation'),
    'side': ('Mặt đứng bên', 'Side elevation'),
    'rear': ('Mặt sau', 'Rear elevation'),
    'plan': ('Mặt bằng', 'Top plan'),
    'all': ('Các hình chiếu', 'Elevations and plan'),
}
VIEW_ORDER = ['front', 'side', 'rear', 'plan', 'all']
DRAWINGS = {
    'a-line-lamp': ['all'],
    'baron-chair': ['all'],
    'beach-hammock-b': ['plan', 'front', 'side'],
    'bosento-sofa': ['front'],
    'embrace-sofa-a': ['plan', 'front', 'side'],
    'explorer-chair': ['front', 'side', 'plan'],
    'gentleman-chair': ['front', 'side'],
    'kink-lamp': ['side', 'front', 'rear'],
    'moonlight-hammock': ['side', 'front', 'rear'],
    'tabouret-chair': ['plan', 'front'],
    'tabouret-table': ['side', 'front'],
    'verner-hammock': ['all'],
    'wave-sofa': ['plan', 'front', 'side'],
    'xchair': ['front'],
}

SWATCH_NAMES = {
    'leather-brown': ('Đai da nâu', 'Brown leather strap'),
    'leather-cognac': ('Da nâu cognac', 'Cognac leather'),
    'bamboo': ('Tre', 'Bamboo'),
    'brass-fitting': ('Phụ kiện đồng thau', 'Brass fitting'),
    'leather-strap': ('Đai da khâu tay', 'Hand-stitched leather strap'),
}

COLLECTION_IMAGES = {
    'sofa': dict(
        hero='products/wave-sofa/hero.jpg',
        setting='products/borsani-sofa/room-01.jpg',
        textures=[
            ('products/bosento-sofa/detail-01.jpg', 'Đai da và khóa kim loại', 'Leather strap and metal buckle'),
            ('products/wave-sofa/detail-01.jpg', 'Mây đan chữ X trên nan tre', 'Rattan crossed over bamboo strips'),
            ('products/borsani-sofa/detail-01.jpg', 'Nhịp thanh tre và đai nâu', 'Bamboo slats and a brown strap'),
        ],
    ),
    'slender-lines': dict(
        hero='collections/slender-lines/collection-lifestyle.jpg',
        setting='products/nan-chair/room-01.jpg',
        textures=[
            ('products/tabouret-chair/room-02.jpg', 'Nan song song chuyển cong từ lưng xuống mặt ngồi', 'Parallel strips curving from back to seat'),
            ('products/tabouret-table/detail-01.jpg', 'Mặt bàn trên chân kim loại mảnh', 'A table top on slender metal legs'),
            ('products/tabouret-chair/studio-01.jpg', 'Dáng nghiêng của ghế Tabouret', 'The Tabouret chair in profile'),
        ],
    ),
    'the-nobility': dict(
        hero='products/gentleman-chair/hero.jpg',
        setting='products/gentleman-chair/room-02.jpg',
        textures=[
            ('products/gentleman-chair/detail-02.jpg', 'Da cognac và khóa đồng', 'Cognac leather and brass buckles'),
            ('products/captain-chair/detail-01.jpg', 'Da nâu trên khung tre sẫm', 'Brown leather on a dark bamboo frame'),
            ('products/baron-chair/detail-02.jpg', 'Đường may trên da đen', 'Stitching on black leather'),
        ],
    ),
    'the-sands': dict(
        hero='products/verner-hammock/room-03.jpg',
        setting='products/beach-hammock-b/room-03.jpg',
        textures=[
            ('products/verner-hammock/detail-01.jpg', 'Nút buộc trên đỉnh khung tre', 'The knot at the top of the bamboo frame'),
            ('products/sandy-chair/detail-01.jpg', 'Khớp tre và vải màu cát', 'Bamboo joint and sand-coloured fabric'),
            ('products/beach-hammock-b/detail-02.jpg', 'Đai da nâu trên khung tre mật ong', 'Brown leather strap on honey bamboo'),
        ],
    ),
    'the-light': dict(
        hero='products/kink-lamp/hero.jpg',
        setting='products/a-line-lamp/hero.jpg',
        textures=[
            ('products/a-line-lamp/detail-02.jpg', 'Đầu đèn tre hình trụ', 'The cylindrical bamboo head'),
            ('products/a-line-lamp/detail-01.jpg', 'Đế kim loại đen mờ', 'Matte black metal base'),
            ('products/kink-lamp/studio-02.jpg', 'Khung kim loại gấp khúc', 'The folded metal frame'),
        ],
    ),
}


# ---------------------------------------------------------------- products

def split_line(vi, en):
    for sep in (' · ', ': '):
        if sep in vi and sep in en:
            lv, vv = vi.split(sep, 1)
            le, ve = en.split(sep, 1)
            return {'label': bi(lv, le), 'value': bi(vv.rstrip('.'), ve.rstrip('.'))}
    return {'label': bi('', ''), 'value': bi(vi.rstrip('.'), en.rstrip('.'))}


def product_entry(p, order):
    slug = p['slug']
    name = T.NAMES[slug]
    excluded = EXCLUDE.get(slug, set())
    base = f'images/products/{slug}'
    alt = lambda vi, en: bi(vi.format(n=name), en.format(n=name))  # noqa: E731

    sil = SILHOUETTE.get(slug)
    style = 'cutout' if sil else 'photo'
    room_files = [f for f in (['hero.jpg'] if os.path.exists(os.path.join(SRC, 'products', slug, 'hero.jpg')) else []) + files(slug, 'room-') if f not in excluded]

    if sil:
        ext = '.webp' if sil.endswith('.webp') else '.jpg'
        hero = save_image(f'products/{slug}/{sil}', f'{base}/silhouette{ext}', 1600, crop=True)
    elif room_files:
        hero = save_image(f'products/{slug}/{room_files[0]}', f'{base}/{room_files[0]}')
    else:
        hero = None

    # Gallery: architectural → studio → detail, without near-duplicates.
    seen = []
    if style == 'photo' and room_files:
        seen.append(ahash(f'products/{slug}/{room_files[0]}'))
        room_files = room_files[1:]
    gallery = []
    plan = [('architectural', room_files, 3), ('studio', [f for f in files(slug, 'studio-') if f not in excluded], 3),
            ('detail', [f for f in files(slug, 'detail-') if f not in excluded], 2)]
    kind_alt = {
        'architectural': ('{n} trong không gian kiến trúc', '{n} in an architectural setting'),
        'studio': ('{n}, ảnh studio', '{n}, studio view'),
        'detail': ('Chi tiết {n}', '{n}, detail'),
    }
    for kind, fs, limit in plan:
        n = 0
        for f in fs:
            if n >= limit:
                break
            h = ahash(f'products/{slug}/{f}')
            if any(similar(h, s) for s in seen):
                continue
            seen.append(h)
            gallery.append({'image': save_image(f'products/{slug}/{f}', f'{base}/{f}'), 'kind': kind, 'alt': alt(*kind_alt[kind])})
            n += 1

    # Card hover image: the first architectural photo in the gallery, else the hero photo.
    card = next((g['image'] for g in gallery if g['kind'] == 'architectural'), None)

    # Drawings on panels that suit their line colour.
    drawings = []
    views = DRAWINGS.get(slug, [])
    dfiles = files(slug, 'drawing-')
    pairs = sorted(zip(views, dfiles), key=lambda x: VIEW_ORDER.index(x[0]))
    for view, f in pairs:
        light_lines = line_brightness(f'products/{slug}/{f}') > 100
        drawings.append({
            'image': save_image(f'products/{slug}/{f}', f'images/drawings/{slug}/{f}', 1800),
            'caption': bi(*VIEW[view]),
            'background': 'dark' if light_lines else 'light',
        })

    swatches = []
    for f in files(slug, 'swatch-'):
        key = f.split('-', 2)[2].rsplit('.', 1)[0]
        vi, en = SWATCH_NAMES[key]
        swatches.append({'image': save_image(f'products/{slug}/{f}', f'images/products/swatches/{slug}/{key}.jpg', 800), 'name': bi(vi, en)})

    lines = lambda key: [l for l in p[key] if '[xác nhận' not in l]  # noqa: E731
    features = [bi(l, T.LINES_EN.get(l, '')) for l in lines('features_vi')]
    materials = [split_line(l, T.LINES_EN.get(l, '')) for l in lines('materials_vi')]

    desc_vi = '' if slug in SKIP_DESCRIPTION else (p.get('description_vi') or '')
    desc_en = '' if slug in SKIP_DESCRIPTION else T.DESC_EN.get(slug, '')
    dims = p.get('dimensions_mm') or {}

    return {
        'name': name,
        'nameVi': '',
        'sample': slug in DRAFTS,
        'category': p['category'],
        'collection': p['collection'],
        'order': order,
        'featured': slug in FEATURED,
        'typeLabel': bi(p.get('type_vi', ''), T.TYPE_EN.get(p.get('type_vi', ''), '')),
        'summary': bi(desc_vi, desc_en),
        'story': bi('', ''),
        'heroImage': hero,
        'heroStyle': style,
        'cardImage': card,
        'heroAlt': alt('{n}, toàn bộ sản phẩm', '{n}, full view'),
        'gallery': gallery,
        'dimensions': {
            'width': dims.get('w'),
            'depth': dims.get('d'),
            'height': dims.get('h'),
            'seatHeight': None,
            'approved': slug not in DIMS_UNCONFIRMED,
        },
        'features': features,
        'materials': materials,
        'materialSwatches': swatches,
        'frameFinishes': [],
        'upholstery': [],
        'versionImages': [],
        'drawings': drawings,
        'downloads': [],
        'collectionImage': None,
        'prices': {'vnd': None, 'usd': None, 'approved': False},
    }


# ---------------------------------------------------------------- collections

def collection_entry(slug):
    c = T.COLLECTIONS[slug]
    im = COLLECTION_IMAGES[slug]
    base = f'images/collections/{slug}'
    quote = DATA['brand']['interlude_quotes_vi'][c['quote']]
    return {
        'name': c['name'],
        'sample': False,
        'order': c['order'],
        'tagline': bi(*c['tagline']),
        'intro': bi(*c['intro']),
        'story': bi(quote, T.QUOTES_EN[c['quote']]),
        'heroImage': save_image(im['hero'], f'{base}/hero.jpg'),
        'heroAlt': bi(f"Không gian mở đầu bộ sưu tập {c['name']}", f"Opening view of the {c['name']} collection"),
        'sketch': save_image(f'brand/sketches/sketch-{slug}.webp', f'{base}/sketch.webp', 1400),
        'textures': [
            {'image': save_image(src, f'{base}/texture-{i + 1}.jpg', 1400), 'caption': bi(vi, en)}
            for i, (src, vi, en) in enumerate(im['textures'])
        ],
        'settingImage': save_image(im['setting'], f'{base}/setting.jpg'),
        'settingAlt': bi(f"Các thiết kế {c['name']} trong không gian", f"{c['name']} pieces in their setting"),
    }


# ---------------------------------------------------------------- pages

def pages():
    b = DATA['brand']
    a = b['about_copy_vi']
    E = T.ABOUT_EN
    p = 'images/pages'

    home = {
        'heroCollection': 'the-nobility',
        'heroImage': save_image('products/captain-chair/hero.jpg', f'{p}/home-hero.jpg'),
        'heroImageMobile': save_image('collections/the-nobility/collection-lifestyle.jpg', f'{p}/home-hero-mobile.jpg'),
        'heroAlt': bi('Ghế Captain và đôn gác chân trong một không gian kiến trúc mở ra mặt nước',
                      'The Captain chair and footstool in an architectural space opening onto water'),
        'introTitle': bi(b['tagline_vi'], 'Vietnamese bamboo, Vietnamese ingenuity'),
        'introText': bi(
            'VBamboo thiết kế nội thất tre cho không gian sống đương đại, nơi vẻ đẹp mộc mạc và độc bản của tre Việt gặp tư duy thiết kế hiện đại. Mỗi sản phẩm là một bước trên hành trình đưa nội thất tre Việt ra thế giới.',
            'VBamboo designs bamboo furniture for contemporary living, where the simple, one-of-a-kind beauty of Vietnamese bamboo meets modern design thinking. Each piece is a step on the journey of bringing Vietnamese bamboo furniture to the world.'),
        'curatedTitle': bi('Những thiết kế tiêu biểu', 'Signature pieces'),
        'workshopTitle': bi('Những người thợ hiểu tre', 'The craftsmen who understand bamboo'),
        'workshopText': bi(b['interlude_quotes_vi']['p16'], T.QUOTES_EN['p16']),
        'workshopImages': [
            {'image': save_image('about/artisans-workshop-01.jpg', f'{p}/workshop-1.jpg'), 'caption': bi('Tre nguyên liệu', 'Raw bamboo')},
            {'image': save_image('about/artisans-workshop-02.jpg', f'{p}/workshop-2.jpg'), 'caption': bi('Chọn từng cây tre', 'Choosing each culm')},
            {'image': save_image('about/artisans-workshop-11.jpg', f'{p}/workshop-3.jpg'), 'caption': bi('Đôi tay người thợ đan', 'A weaver’s hands')},
        ],
    }

    about = {
        'title': bi(b['tagline_vi'], 'Vietnamese bamboo, Vietnamese ingenuity'),
        'lead': bi(a['tam_nhin'], E['tam_nhin']),
        'heroImage': save_image('about/bamboo-grove-13.jpg', f'{p}/about-hero.jpg'),
        'chapters': [
            {'eyebrow': bi('Về chúng tôi', 'About us'), 'title': bi('Tre, bằng một ngôn ngữ mới', 'Bamboo, in a new language'),
             'text': bi(a['ve_chung_toi'], E['ve_chung_toi']),
             'image': save_image('about/bamboo-grove-09.jpg', f'{p}/about-1.jpg'),
             'alt': bi('Măng tre vươn lên giữa rừng tre', 'A bamboo shoot rising in the grove')},
            {'eyebrow': bi('Câu chuyện thương hiệu', 'Our story'), 'title': bi('Từ nguyên liệu thô đến thiết kế Việt', 'From raw material to Vietnamese design'),
             'text': bi(a['cau_chuyen_thuong_hieu'], E['cau_chuyen_thuong_hieu']),
             'image': save_image('about/artisans-workshop-10.jpg', f'{p}/about-2.jpg'),
             'alt': bi('Người thợ chuốt nan tre', 'A craftsman shaping a bamboo strip')},
            {'eyebrow': bi('Sứ mệnh', 'Mission'), 'title': bi('Đưa tre Việt ra thế giới', 'Bringing Vietnamese bamboo to the world'),
             'text': bi(a['su_menh'], E['su_menh']),
             'image': save_image('about/artisans-workshop-07.jpg', f'{p}/about-3.jpg'),
             'alt': bi('Đôi tay lắp chụp đèn tre', 'Hands fitting a bamboo lampshade')},
            {'eyebrow': bi('Phát triển bền vững', 'Sustainability'), 'title': bi('Vẻ đẹp song hành cùng tính bền vững', 'Beauty alongside sustainability'),
             'text': bi(a['ben_vung'], E['ben_vung']),
             'image': save_image('about/bamboo-grove-06.jpg', f'{p}/about-4.jpg'),
             'alt': bi('Nhìn lên tán rừng tre', 'Looking up into the bamboo canopy')},
        ],
        'quote': bi(b['interlude_quotes_vi']['p16'], T.QUOTES_EN['p16']),
        'quoteImage': save_image('about/artisans-workshop-08.jpg', f'{p}/about-quote.jpg'),
        'principles': [
            {'title': bi(v, T.VALUES_EN[v][0]), 'text': bi(a['gia_tri_cot_loi'][v], T.VALUES_EN[v][1])}
            for v in b['core_values_vi']
        ],
    }

    site_path = os.path.join(CONTENT, 'pages', 'site.json')
    site = json.load(open(site_path))
    site.update({
        'email': '',
        'phone': '+84 905 289 898',
        'address': bi('63 Đường 51, Phường Bình Thuận, Quận 7\nTP. Hồ Chí Minh, Việt Nam', '63 Street 51, Binh Thuan Ward, District 7\nHo Chi Minh City, Vietnam'),
    })

    store = {
        'name': 'VBamboo Hồ Chí Minh',
        'sample': True,
        'kind': 'showroom',
        'order': 1,
        'city': bi('TP. Hồ Chí Minh', 'Ho Chi Minh City'),
        'country': bi('Việt Nam', 'Vietnam'),
        'address': bi('63 Đường 51, Phường Bình Thuận, Quận 7', '63 Street 51, Binh Thuan Ward, District 7'),
        'hours': bi('', ''),
        'phone': '+84 905 289 898',
        'email': '',
        'mapsUrl': 'https://www.google.com/maps/search/?api=1&query=63+Street+51+Binh+Thuan+District+7+Ho+Chi+Minh+City',
        'appointmentRequired': True,
        'bookingUrl': None,
        'image': None,
    }
    return home, about, site, store


# ---------------------------------------------------------------- write

def write(rel, obj):
    path = os.path.join(CONTENT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')


def main():
    for d in ('images/products', 'images/collections', 'images/drawings', 'images/stores'):
        shutil.rmtree(os.path.join(PUBLIC, d), ignore_errors=True)
    for d in ('products', 'collections', 'stores'):
        shutil.rmtree(os.path.join(CONTENT, d), ignore_errors=True)
    pages_dir = os.path.join(PUBLIC, 'images/pages')
    if os.path.isdir(pages_dir):
        for f in os.listdir(pages_dir):
            os.unlink(os.path.join(pages_dir, f))

    coll_order = {s: c['order'] for s, c in T.COLLECTIONS.items()}
    products = sorted(DATA['products'], key=lambda p: coll_order[p['collection']])
    for i, p in enumerate(products):
        write(f"products/{p['slug']}.json", product_entry(p, (i + 1) * 10))
        print('product', p['slug'])
    for slug in T.COLLECTIONS:
        write(f'collections/{slug}.json', collection_entry(slug))
        print('collection', slug)
    home, about, site, store = pages()
    write('pages/home.json', home)
    write('pages/about.json', about)
    write('pages/site.json', site)
    write('stores/vbamboo-ho-chi-minh.json', store)
    os.makedirs(os.path.join(PUBLIC, 'images/stores'), exist_ok=True)
    print('done')


if __name__ == '__main__':
    main()
