/*
 * Reads and writes the content/ info.txt files for the /admin editor.
 *
 * The website reads info.txt with src/lib/folders.ts. This file turns the same
 * text into form fields and back, so content made in /admin and content edited
 * by hand stay in one format. Each kind of page has a pair of functions:
 *   from(text) -> form data,  to(data) -> text.
 *
 * Works in the browser (window.VBFormats) and in Node (require) for tests.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ parse */

  function parse(text) {
    const lines = String(text || '')
      .replace(/^﻿/, '')
      .replace(/\r\n?/g, '\n')
      .split('\n');
    const header = [];
    const fields = []; // [key, value]
    let i = 0;
    let sawField = false;
    let sawRule = false;
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '---') {
        sawRule = true;
        i++;
        break;
      }
      if (!line) continue;
      if (line.startsWith('#')) {
        if (!sawField) header.push(lines[i].replace(/\s+$/, ''));
        continue;
      }
      const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]*?)\s*:\s*(.*)$/);
      if (!m) continue;
      sawField = true;
      fields.push([m[1], m[2].trim()]);
    }
    const parts = { vi: [], en: [] };
    let lang = 'vi';
    for (; i < lines.length; i++) {
      const marker = lines[i].trim().match(/^\[(VI|EN)\]$/i);
      if (marker) {
        lang = marker[1].toLowerCase();
        continue;
      }
      if (lines[i].trim() === '---') continue;
      parts[lang].push(lines[i]);
    }
    return { header, fields, sawField, sawRule, vi: block(parts.vi), en: block(parts.en) };
  }

  function paragraphs(lines) {
    const out = [];
    let cur = [];
    for (const l of lines) {
      if (l.trim() === '') {
        if (cur.length) out.push(cur.join('\n').trim());
        cur = [];
      } else cur.push(l);
    }
    if (cur.length) out.push(cur.join('\n').trim());
    return out.filter(Boolean);
  }

  function block(lines) {
    const intro = [];
    const sections = [];
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      const h = line.match(/^##\s+(.*)$/);
      if (h) {
        sections.push({ heading: h[1].trim(), lines: [] });
        continue;
      }
      if (/^#/.test(line.trim())) continue;
      (sections.length ? sections[sections.length - 1].lines : intro).push(line);
    }
    return { paragraphs: paragraphs(intro), sections };
  }

  const keyOf = (k) => String(k).toLowerCase().replace(/[\s_-]+/g, '');

  /** Helper over the parsed fields: get(), all(), and the keys not yet used. */
  function reader(doc) {
    const used = new Set();
    return {
      get(key) {
        used.add(keyOf(key));
        const f = doc.fields.find(([k]) => keyOf(k) === keyOf(key));
        return f ? f[1] : '';
      },
      all(key) {
        used.add(keyOf(key));
        return doc.fields.filter(([k]) => keyOf(k) === keyOf(key)).map(([, v]) => v).filter(Boolean);
      },
      has(key) {
        return doc.fields.some(([k]) => keyOf(k) === keyOf(key));
      },
      /** Lines for fields this form does not show, kept as they are. */
      rest() {
        return doc.fields
          .filter(([k]) => !used.has(keyOf(k)))
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
      },
    };
  }

  const splitBi = (v) => {
    const s = String(v || '');
    const i = s.indexOf('|');
    if (i === -1) return [s.trim(), s.trim()];
    return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  };
  const cells = (v) => String(v || '').split('|').map((c) => c.trim());
  const yes = (v) => /^(yes|y|true|có|co|x|1|on)$/i.test(String(v || '').trim());
  const num = (v) => {
    const s = String(v == null ? '' : v).replace(/[\s.,]/g, '');
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const sectionOf = (b, names) =>
    b.sections.find((s) => names.includes(s.heading.toLowerCase().split('|')[0].trim())) || null;
  const sectionText = (s) => (s ? paragraphs(s.lines).join('\n\n') : '');
  const listItems = (s) =>
    (s ? s.lines : [])
      .map((l) => l.trim())
      .filter((l) => /^[-•*]\s+/.test(l))
      .map((l) => l.replace(/^[-•*]\s+/, '').trim());
  /** Sections other than the named ones, kept as text. */
  const otherSections = (b, names) =>
    b.sections
      .filter((s) => !names.includes(s.heading.toLowerCase().split('|')[0].trim()))
      .map((s) => [`## ${s.heading}`, ...trimLines(s.lines)].join('\n'))
      .join('\n\n');
  const trimLines = (lines) => {
    const out = lines.map((l) => l.replace(/\s+$/, ''));
    while (out.length && !out[0]) out.shift();
    while (out.length && !out[out.length - 1]) out.pop();
    return out;
  };

  /** "index" (a list of folders), "template" (_TEMPLATE, no name) or "entry". */
  function kindOf(doc, r, nameKey) {
    if (!doc.sawField && !doc.sawRule) return 'index';
    return r.get(nameKey) ? 'entry' : 'template';
  }

  /** draft / approved / published. Older files use "Draft: yes|no". */
  function statusOf(r) {
    const s = r.get('Status').toLowerCase();
    r.get('Draft');
    if (['draft', 'approved', 'published'].includes(s)) return s;
    if (s) return 'draft';
    return yes(r.get('Draft')) ? 'draft' : 'published';
  }

  /* ------------------------------------------------------------------ write */

  const clean = (v) => String(v == null ? '' : v).replace(/\s*[\r\n]+\s*/g, ' ').trim();
  const biOut = (vi, en) => {
    vi = clean(vi);
    en = clean(en);
    if (!en || en === vi) return vi;
    if (!vi) return en;
    return `${vi} | ${en}`;
  };
  const cellsOut = (...c) => {
    const out = c.map(clean);
    while (out.length > 1 && !out[out.length - 1]) out.pop();
    return out.join(' | ');
  };
  const yn = (b) => (b ? 'yes' : 'no');
  const numOut = (n) => (n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? '' : String(Math.round(Number(n))));
  const arr = (v) => (Array.isArray(v) ? v : v && typeof v.toJS === 'function' ? v.toJS() : []);
  const textBlock = (t) =>
    String(t || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join('\n\n');
  const listOut = (items) =>
    arr(items)
      .map((x) => clean(typeof x === 'object' && x !== null ? Object.values(x)[0] : x))
      .filter(Boolean)
      .map((x) => `- ${x}`)
      .join('\n');

  function write(header, fieldLines, body) {
    const out = [];
    // Older headers explain "Draft:"; the editor writes "Status:" instead.
    header = String(header || '').replace(
      /^#\s*Draft:.*$/m,
      '# Status: draft = bản nháp, approved = đã duyệt (chờ đăng), published = hiện trên website chính thức. Chỉ "published" hiện trên tên miền chính.',
    );
    if (header.trim()) out.push(header.trim(), '');
    out.push(...fieldLines.filter((l) => l !== null && l !== undefined));
    if (body !== null) {
      out.push('---');
      out.push(body.replace(/\n{3,}/g, '\n\n').trim());
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  const kv = (k, v) => `${k}: ${v == null ? '' : v}`.replace(/\s+$/, '');
  const opt = (k, v) => (clean(v) ? kv(k, clean(v)) : null);
  const extra = (t) =>
    String(t || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && /^[A-Za-z][A-Za-z0-9 _-]*\s*:/.test(l));
  const join = (...parts) => parts.map((p) => (p || '').trim()).filter(Boolean).join('\n\n');

  /* --------------------------------------------------------------- products */

  const FEATURES = ['đặc điểm thiết kế', 'đặc điểm', 'design features', 'features'];
  const MATERIALS = ['chất liệu', 'vật liệu', 'materials', 'material'];

  const PRODUCT_HEADER = [
    '# SẢN PHẨM. Tệp này có thể sửa ở trang quản trị /admin hoặc sửa tay. Hướng dẫn: HUONG-DAN.txt',
    '# Trường 2 ngôn ngữ: Tiếng Việt | English. Status: draft (nháp), approved (đã duyệt, chờ đăng), published (hiện trên web).',
    '# Hero / Room / Studio / Detail: ảnh theo vai trò. Không có các dòng này thì website tự lấy ảnh theo tên file (Images: all).',
  ].join('\n');

  const product = {
    from(text) {
      const doc = parse(text);
      const r = reader(doc);
      const [nameVi, nameEn] = splitBi(r.get('Name'));
      const [typeVi, typeEn] = splitBi(r.get('Type'));
      const size = (r.get('Size').match(/\d+/g) || []).map(Number);
      const images = r.get('Images');
      const data = {
        _kind: kindOf(doc, r, 'Name'),
        name_vi: nameVi,
        name_en: nameEn,
        collection: r.get('Collection'),
        category: r.get('Category'),
        type_vi: typeVi,
        type_en: typeEn,
        featured: yes(r.get('Featured')),
        status: statusOf(r),
        order: num(r.get('Order')),
        width: size[0] ?? null,
        depth: size[1] ?? null,
        height: size[2] ?? null,
        seat_height: num(r.get('SeatHeight')),
        size_approved: yes(r.get('SizeApproved')),
        photo: r.get('Photo'),
        photo_style: /^photo/i.test(r.get('PhotoStyle')) ? 'photo' : 'cutout',
        card_photo: r.get('CardPhoto'),
        hero: r.get('Hero'),
        rooms: r.all('Room'),
        studios: r.all('Studio'),
        details: r.all('Detail'),
        _images: images && !/^all$/i.test(images) ? images : '',
        drawings: r.all('Drawing').map((v) => {
          const [file = '', vi = '', en = '', bg = ''] = cells(v);
          return { file, vi, en: en || vi, background: /^(green|xanh|dark|tối)/i.test(bg) ? 'green' : 'ivory' };
        }),
        swatches: r.all('Swatch').map((v) => {
          const [file = '', vi = '', en = ''] = cells(v);
          return { file, vi, en: en || vi };
        }),
        downloads: r.all('Download').map((v) => {
          const [file = '', kind = 'sheet', vi = '', en = ''] = cells(v);
          return { file, kind: ['sheet', '2d', '3d'].includes(kind.toLowerCase()) ? kind.toLowerCase() : 'sheet', vi, en: en || vi };
        }),
        price_vnd: num(r.get('PriceVND')),
        price_usd: num(r.get('PriceUSD')),
        price_approved: yes(r.get('PriceApproved')),
        collection_photo: r.get('CollectionPhoto'),
        slug_url: r.get('Slug'),
        desc_vi: doc.vi.paragraphs.join('\n\n'),
        features_vi: listItems(sectionOf(doc.vi, FEATURES)),
        materials_vi: listItems(sectionOf(doc.vi, MATERIALS)),
        extra_vi: otherSections(doc.vi, [...FEATURES, ...MATERIALS]),
        desc_en: doc.en.paragraphs.join('\n\n'),
        features_en: listItems(sectionOf(doc.en, FEATURES)),
        materials_en: listItems(sectionOf(doc.en, MATERIALS)),
        extra_en: otherSections(doc.en, [...FEATURES, ...MATERIALS]),
      };
      data._advanced = r.rest();
      data._header = doc.header.join('\n');
      return data;
    },
    to(d) {
      const roles = [clean(d.hero), ...arr(d.rooms), ...arr(d.studios), ...arr(d.details)].some((x) => clean(x));
      const size = [d.width, d.depth, d.height].map(numOut);
      const fields = [
        kv('Name', biOut(d.name_vi, d.name_en)),
        kv('Collection', clean(d.collection).replace(/^\d+[-_ .]*/, '')),
        kv('Category', clean(d.category)),
        kv('Type', biOut(d.type_vi, d.type_en)),
        kv('Featured', yn(d.featured)),
        kv('Status', d.status || 'draft'),
        opt('Order', numOut(d.order)),
        kv('Size', size.some(Boolean) ? size.map((s) => s || '0').join(' x ') : ''),
        kv('SeatHeight', numOut(d.seat_height)),
        kv('SizeApproved', yn(d.size_approved)),
        kv('Photo', clean(d.photo)),
        kv('PhotoStyle', d.photo_style === 'photo' ? 'photo' : 'cutout'),
        kv('CardPhoto', clean(d.card_photo)),
        ...(roles
          ? [
              opt('Hero', d.hero),
              ...arr(d.rooms).map((f) => opt('Room', f)),
              ...arr(d.studios).map((f) => opt('Studio', f)),
              ...arr(d.details).map((f) => opt('Detail', f)),
            ]
          : [kv('Images', clean(d._images) || 'all')]),
        ...arr(d.drawings)
          .filter((x) => clean(x.file))
          .map((x) => kv('Drawing', cellsOut(x.file, x.vi, x.en, x.background === 'green' ? 'green' : 'ivory'))),
        ...arr(d.swatches)
          .filter((x) => clean(x.file))
          .map((x) => kv('Swatch', cellsOut(x.file, x.vi, x.en))),
        ...arr(d.downloads)
          .filter((x) => clean(x.file))
          .map((x) => kv('Download', cellsOut(x.file, x.kind || 'sheet', x.vi, x.en))),
        kv('PriceVND', numOut(d.price_vnd)),
        kv('PriceUSD', numOut(d.price_usd)),
        kv('PriceApproved', yn(d.price_approved)),
        opt('CollectionPhoto', d.collection_photo),
        opt('Slug', d.slug_url),
        ...extra(d._advanced),
      ];
      const lang = (desc, feats, mats, ext, fh, mh) =>
        join(textBlock(desc), listOut(feats) && `## ${fh}\n${listOut(feats)}`, listOut(mats) && `## ${mh}\n${listOut(mats)}`, ext);
      const body =
        '[VI]\n' +
        lang(d.desc_vi, d.features_vi, d.materials_vi, d.extra_vi, 'Đặc điểm thiết kế', 'Chất liệu') +
        '\n\n[EN]\n' +
        lang(d.desc_en, d.features_en, d.materials_en, d.extra_en, 'Design features', 'Materials');
      return write(d._header || PRODUCT_HEADER, fields, body);
    },
  };

  /* ------------------------------------------------------------ collections */

  const QUOTE = ['trích dẫn', 'quote'];
  const collection = {
    from(text) {
      const doc = parse(text);
      const r = reader(doc);
      const [tagVi, tagEn] = splitBi(r.get('Tagline'));
      const [altVi, altEn] = splitBi(r.get('PhotoAlt'));
      const data = {
        _kind: kindOf(doc, r, 'Name'),
        name: r.get('Name'),
        tagline_vi: tagVi,
        tagline_en: tagEn,
        status: statusOf(r),
        order: num(r.get('Order')),
        photo: r.get('Photo'),
        photo_alt_vi: altVi,
        photo_alt_en: altEn,
        sketch: r.get('Sketch'),
        setting: r.get('Setting'),
        textures: r.all('Texture').map((v) => {
          const [file = '', vi = '', en = ''] = cells(v);
          return { file, vi, en: en || vi };
        }),
        slug_url: r.get('Slug'),
        intro_vi: doc.vi.paragraphs.join('\n\n'),
        quote_vi: sectionText(sectionOf(doc.vi, QUOTE)),
        extra_vi: otherSections(doc.vi, QUOTE),
        intro_en: doc.en.paragraphs.join('\n\n'),
        quote_en: sectionText(sectionOf(doc.en, QUOTE)),
        extra_en: otherSections(doc.en, QUOTE),
      };
      data._advanced = r.rest();
      data._header = doc.header.join('\n');
      return data;
    },
    to(d) {
      const fields = [
        kv('Name', clean(d.name)),
        kv('Tagline', biOut(d.tagline_vi, d.tagline_en)),
        kv('Status', d.status || 'draft'),
        opt('Order', numOut(d.order)),
        kv('Photo', clean(d.photo)),
        opt('PhotoAlt', biOut(d.photo_alt_vi, d.photo_alt_en)),
        kv('Sketch', clean(d.sketch)),
        kv('Setting', clean(d.setting)),
        ...arr(d.textures)
          .filter((x) => clean(x.file))
          .map((x) => kv('Texture', cellsOut(x.file, x.vi, x.en))),
        opt('Slug', d.slug_url),
        ...extra(d._advanced),
      ];
      const lang = (intro, quote, ext, qh) => join(textBlock(intro), textBlock(quote) && `## ${qh}\n${textBlock(quote)}`, ext);
      const body = '[VI]\n' + lang(d.intro_vi, d.quote_vi, d.extra_vi, 'Trích dẫn') + '\n\n[EN]\n' + lang(d.intro_en, d.quote_en, d.extra_en, 'Quote');
      return write(d._header || '# BỘ SƯU TẬP. Sửa ở /admin hoặc sửa tay. Hướng dẫn: HUONG-DAN.txt', fields, body);
    },
  };

  /* ----------------------------------------------------------------- stores */

  const semi = (t) => String(t || '').split(/\s*;\s*|\r?\n/).map((s) => s.trim()).filter(Boolean);
  const store = {
    from(text) {
      const doc = parse(text);
      const r = reader(doc);
      const bi = (k) => splitBi(r.get(k));
      const [cityVi, cityEn] = bi('City');
      const [countryVi, countryEn] = bi('Country');
      const [addrVi, addrEn] = bi('Address');
      const [hoursVi, hoursEn] = bi('Hours');
      const data = {
        _kind: kindOf(doc, r, 'Name'),
        name: r.get('Name'),
        kind: /^dealer|đại lý/i.test(r.get('Kind')) ? 'dealer' : 'showroom',
        status: statusOf(r),
        order: num(r.get('Order')),
        city_vi: cityVi,
        city_en: cityEn,
        country_vi: countryVi,
        country_en: countryEn,
        address_vi: semi(addrVi).join('\n'),
        address_en: semi(addrEn).join('\n'),
        hours_vi: semi(hoursVi).join('\n'),
        hours_en: semi(hoursEn).join('\n'),
        tel: r.get('Tel') || r.get('Phone'),
        email: r.get('Email'),
        map: r.get('Map'),
        appointment: yes(r.get('Appointment')),
        booking: r.get('Booking'),
        photo: r.get('Photo'),
        slug_url: r.get('Slug'),
      };
      data._advanced = r.rest();
      data._header = doc.header.join('\n');
      return data;
    },
    to(d) {
      const lines = (t) => semi(t).join('; ');
      const fields = [
        kv('Name', clean(d.name)),
        kv('Kind', d.kind === 'dealer' ? 'dealer' : 'showroom'),
        kv('Status', d.status || 'draft'),
        opt('Order', numOut(d.order)),
        kv('City', biOut(d.city_vi, d.city_en)),
        kv('Country', biOut(d.country_vi, d.country_en)),
        kv('Address', biOut(lines(d.address_vi), lines(d.address_en))),
        kv('Hours', biOut(lines(d.hours_vi), lines(d.hours_en))),
        kv('Tel', clean(d.tel)),
        kv('Email', clean(d.email)),
        kv('Map', clean(d.map)),
        kv('Appointment', yn(d.appointment)),
        kv('Booking', clean(d.booking)),
        kv('Photo', clean(d.photo)),
        opt('Slug', d.slug_url),
        ...extra(d._advanced),
      ];
      return write(d._header || '# CỬA HÀNG / ĐẠI LÝ. Sửa ở /admin hoặc sửa tay. Hướng dẫn: HUONG-DAN.txt', fields, null);
    },
  };

  /* ------------------------------------------------------------------- home */

  const INTRO = ['giới thiệu', 'introduction', 'intro'];
  const WORKSHOP = ['xưởng', 'xưởng & con người', 'workshop'];
  const home = {
    from(text) {
      const doc = parse(text);
      const r = reader(doc);
      const bi = (k) => splitBi(r.get(k));
      const [altVi, altEn] = bi('PhotoAlt');
      const [itVi, itEn] = bi('IntroTitle');
      const [ctVi, ctEn] = bi('CuratedTitle');
      const [wtVi, wtEn] = bi('WorkshopTitle');
      const data = {
        collection: r.get('Collection'),
        photo: r.get('Photo'),
        photo_mobile: r.get('PhotoMobile'),
        photo_alt_vi: altVi,
        photo_alt_en: altEn,
        intro_title_vi: itVi,
        intro_title_en: itEn,
        curated_title_vi: ctVi,
        curated_title_en: ctEn,
        workshop_title_vi: wtVi,
        workshop_title_en: wtEn,
        workshop: r.all('Workshop').map((v) => {
          const [file = '', vi = '', en = ''] = cells(v);
          return { file, vi, en: en || vi };
        }),
        intro_vi: sectionText(sectionOf(doc.vi, INTRO)),
        workshop_text_vi: sectionText(sectionOf(doc.vi, WORKSHOP)),
        intro_en: sectionText(sectionOf(doc.en, INTRO)),
        workshop_text_en: sectionText(sectionOf(doc.en, WORKSHOP)),
        extra_vi: join(doc.vi.paragraphs.join('\n\n'), otherSections(doc.vi, [...INTRO, ...WORKSHOP])),
        extra_en: join(doc.en.paragraphs.join('\n\n'), otherSections(doc.en, [...INTRO, ...WORKSHOP])),
      };
      data._advanced = r.rest();
      data._header = doc.header.join('\n');
      return data;
    },
    to(d) {
      const fields = [
        kv('Collection', clean(d.collection).replace(/^\d+[-_ .]*/, '')),
        kv('Photo', clean(d.photo)),
        kv('PhotoMobile', clean(d.photo_mobile)),
        kv('PhotoAlt', biOut(d.photo_alt_vi, d.photo_alt_en)),
        kv('IntroTitle', biOut(d.intro_title_vi, d.intro_title_en)),
        kv('CuratedTitle', biOut(d.curated_title_vi, d.curated_title_en)),
        kv('WorkshopTitle', biOut(d.workshop_title_vi, d.workshop_title_en)),
        ...arr(d.workshop)
          .filter((x) => clean(x.file))
          .map((x) => kv('Workshop', cellsOut(x.file, x.vi, x.en))),
        ...extra(d._advanced),
      ];
      const lang = (intro, ws, ext, ih, wh) =>
        join(textBlock(intro) && `## ${ih}\n${textBlock(intro)}`, textBlock(ws) && `## ${wh}\n${textBlock(ws)}`, ext);
      const body =
        '[VI]\n' + lang(d.intro_vi, d.workshop_text_vi, d.extra_vi, 'Giới thiệu', 'Xưởng') + '\n\n[EN]\n' + lang(d.intro_en, d.workshop_text_en, d.extra_en, 'Introduction', 'Workshop');
      return write(d._header || '# TRANG CHỦ. Sửa ở /admin hoặc sửa tay. Hướng dẫn: HUONG-DAN.txt', fields, body);
    },
  };

  /* ---------------------------------------------------------------- contact */

  const contact = {
    from(text) {
      const doc = parse(text);
      const r = reader(doc);
      const [addrVi, addrEn] = splitBi(r.get('Address'));
      const [footVi, footEn] = splitBi(r.get('Footer'));
      const data = {
        company: r.get('Company'),
        address_vi: addrVi,
        address_en: addrEn,
        tel: r.get('Tel') || r.get('Phone'),
        email: r.get('Email'),
        facebook: r.get('Facebook'),
        instagram: r.get('Instagram'),
        linkedin: r.get('LinkedIn'),
        footer_vi: footVi,
        footer_en: footEn,
        show_prices: yes(r.get('ShowPrices')),
      };
      data._advanced = r.rest();
      data._header = doc.header.join('\n');
      return data;
    },
    to(d) {
      const fields = [
        kv('Company', clean(d.company)),
        kv('Address', biOut(d.address_vi, d.address_en)),
        kv('Tel', clean(d.tel)),
        kv('Email', clean(d.email)),
        kv('Facebook', clean(d.facebook)),
        kv('Instagram', clean(d.instagram)),
        kv('LinkedIn', clean(d.linkedin)),
        kv('Footer', biOut(d.footer_vi, d.footer_en)),
        kv('ShowPrices', yn(d.show_prices)),
        ...extra(d._advanced),
      ];
      return write(d._header || '# LIÊN HỆ & CHÂN TRANG. Sửa ở /admin hoặc sửa tay. Hướng dẫn: HUONG-DAN.txt', fields, null);
    },
  };

  /* ------------------------------------------------------------------ about */

  const VALUES = ['giá trị cốt lõi', 'core values', 'values'];
  const PHOTO_LINE = /^\s*(?:Ảnh|Anh|Photo|Image)\s*:\s*(.*)$/i;
  const about = {
    from(text) {
      const doc = parse(text);
      const r = reader(doc);
      const [titleVi, titleEn] = splitBi(r.get('Title'));
      const special = [...QUOTE, ...VALUES];
      const chapters = (b) =>
        b.sections
          .filter((s) => !special.includes(s.heading.toLowerCase()))
          .map((s) => {
            const [eyebrow, title] = s.heading.includes('|') ? cells(s.heading) : ['', s.heading];
            const img = s.lines.map((l) => (l.match(PHOTO_LINE) || [])[1]).find(Boolean) || '';
            const lines = s.lines.filter((l) => !PHOTO_LINE.test(l));
            return { eyebrow, title, img: img.trim(), text: paragraphs(lines).join('\n\n') };
          });
      const values = (b) =>
        listItems(sectionOf(b, VALUES)).map((l) => {
          const i = l.indexOf(': ');
          return i > 0 ? [l.slice(0, i), l.slice(i + 2)] : [l, ''];
        });
      const cv = chapters(doc.vi);
      const ce = chapters(doc.en);
      const vv = values(doc.vi);
      const ve = values(doc.en);
      const data = {
        title_vi: titleVi,
        title_en: titleEn,
        photo: r.get('Photo'),
        quote_photo: r.get('QuotePhoto'),
        lead_vi: doc.vi.paragraphs.join('\n\n'),
        lead_en: doc.en.paragraphs.join('\n\n'),
        chapters: Array.from({ length: Math.max(cv.length, ce.length) }, (_, i) => ({
          eyebrow_vi: cv[i]?.eyebrow ?? '',
          title_vi: cv[i]?.title ?? '',
          eyebrow_en: ce[i]?.eyebrow ?? '',
          title_en: ce[i]?.title ?? '',
          image: cv[i]?.img || ce[i]?.img || '',
          text_vi: cv[i]?.text ?? '',
          text_en: ce[i]?.text ?? '',
        })),
        quote_vi: sectionText(sectionOf(doc.vi, QUOTE)),
        quote_en: sectionText(sectionOf(doc.en, QUOTE)),
        values: Array.from({ length: Math.max(vv.length, ve.length) }, (_, i) => ({
          title_vi: vv[i]?.[0] ?? '',
          text_vi: vv[i]?.[1] ?? '',
          title_en: ve[i]?.[0] ?? '',
          text_en: ve[i]?.[1] ?? '',
        })),
      };
      data._advanced = r.rest();
      data._header = doc.header.join('\n');
      return data;
    },
    to(d) {
      const fields = [kv('Title', biOut(d.title_vi, d.title_en)), kv('Photo', clean(d.photo)), kv('QuotePhoto', clean(d.quote_photo)), ...extra(d._advanced)];
      const heading = (eyebrow, title) => (clean(eyebrow) ? `${clean(eyebrow)} | ${clean(title)}` : clean(title));
      const lang = (l) => {
        const ch = arr(d.chapters)
          .filter((c) => clean(c[`title_${l}`]) || textBlock(c[`text_${l}`]))
          .map((c) => [`## ${heading(c[`eyebrow_${l}`], c[`title_${l}`])}`, l === 'vi' && clean(c.image) ? `Ảnh: ${clean(c.image)}` : null, textBlock(c[`text_${l}`])].filter(Boolean).join('\n'));
        const vals = arr(d.values)
          .filter((v) => clean(v[`title_${l}`]))
          .map((v) => `- ${clean(v[`title_${l}`])}${clean(v[`text_${l}`]) ? ': ' + clean(v[`text_${l}`]) : ''}`)
          .join('\n');
        return join(
          textBlock(d[`lead_${l}`]),
          ...ch,
          textBlock(d[`quote_${l}`]) && `## ${l === 'vi' ? 'Trích dẫn' : 'Quote'}\n${textBlock(d[`quote_${l}`])}`,
          vals && `## ${l === 'vi' ? 'Giá trị cốt lõi' : 'Core values'}\n${vals}`,
        );
      };
      const body = '[VI]\n' + lang('vi') + '\n\n[EN]\n' + lang('en');
      return write(d._header || '# GIỚI THIỆU. Sửa ở /admin hoặc sửa tay. Hướng dẫn: HUONG-DAN.txt', fields, body);
    },
  };

  const api = { parse, product, collection, store, home, contact, about };

  // admin/config.js registers these with Decap CMS.
  root.VBFormats = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
