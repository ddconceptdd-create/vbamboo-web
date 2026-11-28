/*
 * Settings for the content editor at /admin (Decap CMS).
 *
 * Everything is saved to the content/ folder of the GitHub repository, in the
 * same info.txt format the website already reads (see vbamboo-formats.js).
 * Each save is a commit on "main", and Vercel then rebuilds the website.
 */
(function () {
  'use strict';

  const REPO = 'ddconceptdd-create/vbamboo-web';
  const BRANCH = 'main';

  /* Collections and categories for the drop-downs. options.json is written by
     scripts/sync-content.mjs at every build, so a collection added in /admin
     shows here after the next deploy. */
  const CATEGORIES = [
    { value: 'sofas', label: 'Sofa (sofas)' },
    { value: 'chairs', label: 'Ghế (chairs)' },
    { value: 'lounge-chairs', label: 'Ghế thư giãn (lounge-chairs)' },
    { value: 'ottomans', label: 'Đôn (ottomans)' },
    { value: 'tables', label: 'Bàn (tables)' },
    { value: 'coffee-tables', label: 'Bàn trà (coffee-tables)' },
    { value: 'lamps', label: 'Đèn (lamps)' },
    { value: 'shelving', label: 'Kệ (shelving)' },
    { value: 'umbrellas', label: 'Dù / võng (umbrellas)' },
  ];
  const STATUS = [
    { value: 'draft', label: 'Nháp (chỉ hiện ở bản xem trước)' },
    { value: 'approved', label: 'Đã duyệt (chờ đăng)' },
    { value: 'published', label: 'Đăng (hiện trên website)' },
  ];

  /* --------------------------------------------------------------- helpers */
  const str = (name, label, extra) => ({ name, label, widget: 'string', required: false, ...extra });
  const txt = (name, label, extra) => ({ name, label, widget: 'text', required: false, ...extra });
  const int = (name, label, extra) => ({ name, label, widget: 'number', value_type: 'int', min: 0, required: false, ...extra });
  const bool = (name, label, extra) => ({ name, label, widget: 'boolean', default: false, required: false, ...extra });
  const img = (name, label, extra) => ({ name, label, widget: 'image', required: false, choose_url: false, ...extra });
  const file = (name, label, extra) => ({ name, label, widget: 'file', required: false, choose_url: false, ...extra });
  const hidden = (name, value) => ({ name, label: name, widget: 'hidden', required: false, default: value ?? '' });
  const imgs = (name, label, hint) => ({ name, label, label_singular: 'ảnh', widget: 'list', required: false, hint, field: img('file', 'Ảnh') });
  const lines = (name, label, hint) => ({ name, label, label_singular: 'dòng', widget: 'list', required: false, hint, field: str('line', 'Dòng') });
  const status = { name: 'status', label: 'Trạng thái', widget: 'select', options: STATUS, default: 'draft', hint: 'Chỉ "Đăng" hiện trên website chính thức. Nháp và Đã duyệt chỉ hiện ở bản xem trước.' };
  const order = int('order', 'Thứ tự hiển thị', { hint: 'Số nhỏ hiện trước. Để trống = theo index.txt (vị trí × 10, vd sản phẩm thứ 3 = 30).' });
  /** A collapsible group. Its fields are saved flat in info.txt. */
  const group = (name, label, fields, collapsed = true) => ({ name, label, widget: 'object', collapsed, required: false, fields });

  let collectionOptions = [];

  function productFields() {
    return [
      hidden('_kind', 'entry'),
      hidden('_header'),
      hidden('_images'),
      str('name_en', 'Tên sản phẩm (tiếng Anh)', { required: true, hint: 'Tên chính, dùng để tạo địa chỉ trang, vd "Ponti Chair". Không đổi sau khi đã đăng.' }),
      str('name_vi', 'Tên sản phẩm (tiếng Việt)', { hint: 'Để trống nếu giống tên tiếng Anh.' }),
      status,
      group('basic', 'Phân loại', [
        collectionOptions.length
          ? { name: 'collection', label: 'Bộ sưu tập', widget: 'select', options: collectionOptions, required: false }
          : str('collection', 'Bộ sưu tập', { hint: 'Tên thư mục bộ sưu tập, bỏ số đầu (vd sofa, the-nobility).' }),
        { name: 'category', label: 'Loại sản phẩm (menu)', widget: 'select', options: CATEGORIES, default: 'chairs' },
        str('type_vi', 'Kiểu (tiếng Việt)', { hint: 'vd Ghế thư giãn' }),
        str('type_en', 'Kiểu (tiếng Anh)', { hint: 'vd Lounge chair' }),
        bool('featured', 'Sản phẩm tiêu biểu (hiện ở trang chủ)'),
        order,
      ], false),
      group('size', 'Kích thước (mm)', [
        int('width', 'Rộng (W)'),
        int('depth', 'Sâu (D)'),
        int('height', 'Cao (H)'),
        int('seat_height', 'Cao mặt ngồi'),
        bool('size_approved', 'Kích thước đã xác nhận', { hint: 'Chưa xác nhận thì website chính thức không hiện kích thước.' }),
      ], false),
      group('images', 'Ảnh', [
        img('photo', 'Ảnh chính (cutout tách nền / studio nền trắng)'),
        { name: 'photo_style', label: 'Kiểu ảnh chính', widget: 'select', default: 'cutout', options: [{ value: 'cutout', label: 'Cutout / nền trắng' }, { value: 'photo', label: 'Ảnh không gian' }] },
        img('card_photo', 'Ảnh khi rê chuột lên thẻ sản phẩm', { hint: 'Thường là ảnh hero.' }),
        img('hero', 'Ảnh hero (không gian, ngang)', { hint: 'Để trống cả 4 mục hero / room / studio / detail = website tự lấy ảnh theo tên file (hero-, room-, studio-, detail-).' }),
        imgs('rooms', 'Ảnh không gian (room)'),
        imgs('studios', 'Ảnh studio'),
        imgs('details', 'Ảnh chi tiết (detail)'),
        {
          name: 'drawings', label: 'Bản vẽ kỹ thuật', label_singular: 'bản vẽ', widget: 'list', required: false, summary: '{{fields.vi}}',
          fields: [
            img('file', 'File bản vẽ'),
            str('vi', 'Tên hình chiếu (VI)', { hint: 'vd Mặt đứng chính' }),
            str('en', 'Tên hình chiếu (EN)', { hint: 'vd Front elevation' }),
            { name: 'background', label: 'Nền', widget: 'select', default: 'ivory', options: [{ value: 'ivory', label: 'Ngà (nét đen)' }, { value: 'green', label: 'Xanh (nét trắng)' }] },
          ],
        },
        {
          name: 'swatches', label: 'Mẫu vật liệu', label_singular: 'mẫu', widget: 'list', required: false, summary: '{{fields.vi}}',
          fields: [img('file', 'Ảnh mẫu'), str('vi', 'Tên vật liệu (VI)'), str('en', 'Tên vật liệu (EN)')],
        },
      ]),
      group('text_vi', 'Nội dung tiếng Việt', [
        txt('desc_vi', 'Mô tả', { hint: 'Đoạn đầu là mô tả ngắn. Cách 1 dòng trống để thêm đoạn.' }),
        lines('features_vi', 'Đặc điểm thiết kế'),
        lines('materials_vi', 'Chất liệu', 'Mỗi dòng một vật liệu, có thể ghi "Khung: Tre tự nhiên".'),
        txt('extra_vi', 'Mục khác (nâng cao)', { hint: 'Các mục ## khác, giữ nguyên như trong info.txt.' }),
      ], false),
      group('text_en', 'Nội dung tiếng Anh', [
        txt('desc_en', 'Description', { hint: 'First paragraph is the short summary.' }),
        lines('features_en', 'Design features'),
        lines('materials_en', 'Materials', 'One per line, may be "Frame: Natural bamboo".'),
        txt('extra_en', 'Other sections (advanced)'),
      ], false),
      group('price', 'Giá', [
        int('price_vnd', 'Giá VND'),
        int('price_usd', 'Giá USD'),
        bool('price_approved', 'Giá đã duyệt', { hint: 'Giá chỉ hiện khi đã duyệt và trang Liên hệ bật "Hiện giá".' }),
      ]),
      group('advanced', 'Nâng cao', [
        {
          name: 'downloads', label: 'Tài liệu tải về', label_singular: 'tài liệu', widget: 'list', required: false, summary: '{{fields.vi}}',
          fields: [
            file('file', 'File'),
            { name: 'kind', label: 'Loại', widget: 'select', default: 'sheet', options: [{ value: 'sheet', label: 'Catalogue / thông số' }, { value: '2d', label: 'Bản vẽ 2D' }, { value: '3d', label: 'Mô hình 3D' }] },
            str('vi', 'Nhãn (VI)'),
            str('en', 'Nhãn (EN)'),
          ],
        },
        img('collection_photo', 'Ảnh trên trang bộ sưu tập'),
        str('slug_url', 'Địa chỉ trang (Slug)', { hint: 'Để trống = lấy từ tên thư mục. Đổi sẽ làm hỏng link cũ.' }),
        txt('_advanced', 'Dòng nâng cao', { hint: 'Finish, Fabric, VersionPhoto… mỗi dòng "Khoá: giá trị", giữ nguyên như info.txt.' }),
      ]),
    ];
  }

  function collectionFields() {
    return [
      hidden('_kind', 'entry'),
      hidden('_header'),
      str('name', 'Tên bộ sưu tập', { required: true }),
      status,
      str('tagline_vi', 'Câu giới thiệu ngắn (VI)'),
      str('tagline_en', 'Câu giới thiệu ngắn (EN)'),
      order,
      group('images', 'Ảnh', [
        img('photo', 'Ảnh mở đầu (ngang)'),
        str('photo_alt_vi', 'Mô tả ảnh mở đầu (VI)'),
        str('photo_alt_en', 'Mô tả ảnh mở đầu (EN)'),
        img('sketch', 'Nét vẽ (nền trong suốt)'),
        img('setting', 'Ảnh sản phẩm trong không gian (ngang)'),
        {
          name: 'textures', label: 'Ảnh cận chất liệu (nên có 3)', label_singular: 'ảnh', widget: 'list', required: false, summary: '{{fields.vi}}',
          fields: [img('file', 'Ảnh'), str('vi', 'Chú thích (VI)'), str('en', 'Caption (EN)')],
        },
      ], false),
      group('text', 'Nội dung', [
        txt('intro_vi', 'Giới thiệu (VI)'),
        txt('quote_vi', 'Trích dẫn (VI)'),
        txt('intro_en', 'Introduction (EN)'),
        txt('quote_en', 'Quote (EN)'),
      ], false),
      group('advanced', 'Nâng cao', [
        str('slug_url', 'Địa chỉ trang (Slug)', { hint: 'Để trống = lấy từ tên thư mục.' }),
        txt('extra_vi', 'Mục khác (VI)'),
        txt('extra_en', 'Mục khác (EN)'),
        txt('_advanced', 'Dòng nâng cao'),
      ]),
    ];
  }

  function storeFields() {
    return [
      hidden('_kind', 'entry'),
      hidden('_header'),
      str('name', 'Tên cửa hàng', { required: true }),
      status,
      { name: 'kind', label: 'Loại', widget: 'select', default: 'dealer', options: [{ value: 'showroom', label: 'Showroom VBamboo' }, { value: 'dealer', label: 'Đại lý chính thức' }] },
      order,
      group('place', 'Địa điểm', [
        str('city_vi', 'Thành phố (VI)'),
        str('city_en', 'City (EN)'),
        str('country_vi', 'Quốc gia (VI)'),
        str('country_en', 'Country (EN)'),
        txt('address_vi', 'Địa chỉ (VI)', { hint: 'Mỗi dòng một dòng địa chỉ.' }),
        txt('address_en', 'Address (EN)'),
        txt('hours_vi', 'Giờ mở cửa (VI)', { hint: 'Mỗi dòng một khung giờ.' }),
        txt('hours_en', 'Opening hours (EN)'),
      ], false),
      group('contact', 'Liên hệ', [
        str('tel', 'Điện thoại'),
        str('email', 'Email'),
        str('map', 'Link Google Maps'),
        bool('appointment', 'Tham quan theo lịch hẹn (hiện form đặt lịch)'),
        str('booking', 'Link đặt lịch bên ngoài'),
        img('photo', 'Ảnh cửa hàng (ngang 3:2)'),
      ], false),
      group('advanced', 'Nâng cao', [str('slug_url', 'Slug'), txt('_advanced', 'Dòng nâng cao')]),
    ];
  }

  function homeFields() {
    return [
      hidden('_header'),
      group('hero', 'Ảnh mở đầu', [
        collectionOptions.length
          ? { name: 'collection', label: 'Bộ sưu tập trên ảnh mở đầu', widget: 'select', options: collectionOptions, required: false }
          : str('collection', 'Bộ sưu tập trên ảnh mở đầu'),
        img('photo', 'Ảnh mở đầu (ngang, toàn màn hình)'),
        img('photo_mobile', 'Ảnh cho điện thoại (dọc)'),
        str('photo_alt_vi', 'Mô tả ảnh (VI)'),
        str('photo_alt_en', 'Mô tả ảnh (EN)'),
      ], false),
      group('intro', 'Giới thiệu', [
        str('intro_title_vi', 'Tiêu đề (VI)'),
        str('intro_title_en', 'Tiêu đề (EN)'),
        txt('intro_vi', 'Nội dung (VI)'),
        txt('intro_en', 'Nội dung (EN)'),
        str('curated_title_vi', 'Tiêu đề "sản phẩm tiêu biểu" (VI)', { hint: 'Sản phẩm tiêu biểu: bật "Sản phẩm tiêu biểu" trong từng sản phẩm.' }),
        str('curated_title_en', 'Tiêu đề "sản phẩm tiêu biểu" (EN)'),
      ], false),
      group('workshop_group', 'Xưởng & con người', [
        str('workshop_title_vi', 'Tiêu đề (VI)'),
        str('workshop_title_en', 'Tiêu đề (EN)'),
        txt('workshop_text_vi', 'Nội dung (VI)'),
        txt('workshop_text_en', 'Nội dung (EN)'),
        {
          name: 'workshop', label: 'Ảnh xưởng (nên có 3)', label_singular: 'ảnh', widget: 'list', required: false, summary: '{{fields.vi}}',
          fields: [img('file', 'Ảnh'), str('vi', 'Chú thích (VI)'), str('en', 'Caption (EN)')],
        },
      ], false),
      group('advanced', 'Nâng cao', [txt('extra_vi', 'Mục khác (VI)'), txt('extra_en', 'Mục khác (EN)'), txt('_advanced', 'Dòng nâng cao')]),
    ];
  }

  function contactFields() {
    return [
      hidden('_header'),
      str('company', 'Tên công ty'),
      str('address_vi', 'Địa chỉ (VI)'),
      str('address_en', 'Address (EN)'),
      str('tel', 'Điện thoại'),
      str('email', 'Email nhận yêu cầu (hiện ở chân trang)'),
      str('facebook', 'Facebook (link)'),
      str('instagram', 'Instagram (link)'),
      str('linkedin', 'LinkedIn (link)'),
      str('footer_vi', 'Dòng chân trang (VI)'),
      str('footer_en', 'Footer line (EN)'),
      bool('show_prices', 'Hiện giá trên website', { hint: 'VND cho tiếng Việt, USD cho tiếng Anh, chỉ với sản phẩm có "Giá đã duyệt".' }),
      txt('_advanced', 'Dòng nâng cao'),
    ];
  }

  function aboutFields() {
    return [
      hidden('_header'),
      str('title_vi', 'Tiêu đề (VI)'),
      str('title_en', 'Title (EN)'),
      img('photo', 'Ảnh mở đầu (ngang)'),
      img('quote_photo', 'Ảnh nền câu trích dẫn'),
      txt('lead_vi', 'Lời mở đầu (VI)'),
      txt('lead_en', 'Lead (EN)'),
      {
        name: 'chapters', label: 'Các chương', label_singular: 'chương', widget: 'list', required: false, summary: '{{fields.title_vi}}',
        fields: [
          str('eyebrow_vi', 'Tiêu đề nhỏ (VI)', { hint: 'vd Về chúng tôi' }),
          str('title_vi', 'Tiêu đề (VI)'),
          str('eyebrow_en', 'Eyebrow (EN)'),
          str('title_en', 'Title (EN)'),
          img('image', 'Ảnh (dọc 4:5)'),
          txt('text_vi', 'Nội dung (VI)'),
          txt('text_en', 'Text (EN)'),
        ],
      },
      txt('quote_vi', 'Trích dẫn (VI)'),
      txt('quote_en', 'Quote (EN)'),
      {
        name: 'values', label: 'Giá trị cốt lõi', label_singular: 'giá trị', widget: 'list', required: false, summary: '{{fields.title_vi}}',
        fields: [str('title_vi', 'Tên (VI)'), txt('text_vi', 'Nội dung (VI)'), str('title_en', 'Name (EN)'), txt('text_en', 'Text (EN)')],
      },
      txt('_advanced', 'Dòng nâng cao'),
    ];
  }

  /* ------------------------------------------------ flat file <-> form groups */
  // info.txt is flat; the form groups fields into collapsible boxes.
  function groupsOf(fields) {
    const map = {};
    for (const f of fields) if (f.widget === 'object' && !f.list) map[f.name] = f.fields.map((x) => x.name);
    return map;
  }
  function nest(flat, groups) {
    const out = { ...flat };
    for (const [g, keys] of Object.entries(groups)) {
      out[g] = {};
      for (const k of keys) {
        if (k in out) out[g][k] = out[k];
        delete out[k];
      }
    }
    return out;
  }
  function flatten(data, groups) {
    const out = { ...data };
    for (const g of Object.keys(groups)) {
      Object.assign(out, out[g] || {});
      delete out[g];
    }
    return out;
  }

  function register(name, fields) {
    const groups = groupsOf(fields);
    const fmt = window.VBFormats[name];
    window.CMS.registerCustomFormat(`vb-${name}`, 'txt', {
      fromFile: (text) => nest(fmt.from(text), groups),
      toFile: (data) => fmt.to(flatten(data, groups)),
    });
  }

  /* ------------------------------------------------------------- the config */
  function config() {
    const products = productFields();
    const collections = collectionFields();
    const stores = storeFields();
    const home = homeFields();
    const contact = contactFields();
    const about = aboutFields();
    register('product', products);
    register('collection', collections);
    register('store', stores);
    register('home', home);
    register('contact', contact);
    register('about', about);

    const folder = (name, label, singular, dir, format, fields, summary) => ({
      name, label, label_singular: singular, folder: dir, path: '{{slug}}/info', extension: 'txt', format,
      create: true, delete: false, slug: '{{slug}}', filter: { field: '_kind', value: 'entry' },
      media_folder: '', public_folder: '', summary, fields,
      sortable_fields: ['status'],
      view_groups: [{ label: 'Trạng thái', field: 'status' }],
    });
    const page = (name, label, path, format, fields) => ({
      name, label, format, extension: 'txt', media_folder: '', public_folder: '', delete: false,
      files: [{ name, label, file: path, fields }],
    });

    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    return {
      load_config_file: false,
      locale: 'vi',
      backend: {
        name: 'github',
        repo: REPO,
        branch: BRANCH,
        base_url: location.origin,
        auth_endpoint: 'api/decap/auth',
        commit_messages: {
          create: 'Thêm {{collection}} "{{slug}}" (qua /admin)',
          update: 'Sửa {{collection}} "{{slug}}" (qua /admin)',
          delete: 'Xoá {{collection}} "{{slug}}" (qua /admin)',
          uploadMedia: 'Tải ảnh "{{path}}" (qua /admin)',
          deleteMedia: 'Xoá ảnh "{{path}}" (qua /admin)',
        },
      },
      // On your own computer, run "npx decap-server" to edit the local files without signing in.
      local_backend: local,
      site_url: location.origin,
      display_url: location.origin,
      logo_url: '/brand/vbamboo-logo-green.svg',
      media_folder: 'content/_uploads',
      public_folder: '',
      collections: [
        {
          ...folder('products', 'Sản phẩm', 'sản phẩm', 'content/products', 'vb-product', products, '{{name_en}} · {{status}}'),
          identifier_field: 'name_en',
          sortable_fields: ['name_en', 'status'],
        },
        { ...folder('collections', 'Bộ sưu tập', 'bộ sưu tập', 'content/collections', 'vb-collection', collections, '{{name}} · {{status}}'), identifier_field: 'name' },
        { ...folder('stores', 'Cửa hàng & đại lý', 'cửa hàng', 'content/stores', 'vb-store', stores, '{{name}} · {{status}}'), identifier_field: 'name' },
        page('home', 'Trang chủ', 'content/home/info.txt', 'vb-home', home),
        page('about', 'Giới thiệu (About)', 'content/about/info.txt', 'vb-about', about),
        page('contact', 'Liên hệ & chân trang', 'content/contact/info.txt', 'vb-contact', contact),
      ],
    };
  }

  /** backend: optional override, e.g. { name: 'test-repo' } for trying the editor offline. */
  window.startEditor = async function (backend) {
    try {
      const r = await fetch('/admin/options.json', { cache: 'no-store' });
      if (r.ok) collectionOptions = (await r.json()).collections || [];
    } catch {
      /* the field falls back to free text */
    }
    const c = config();
    if (backend) c.backend = { ...c.backend, ...backend };
    window.CMS.init({ config: c });
  };
})();
