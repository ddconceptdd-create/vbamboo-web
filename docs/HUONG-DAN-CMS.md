# Hướng dẫn quản trị nội dung VBamboo (trang /admin)

Trang quản trị cho phép cả team thêm và sửa **sản phẩm, bộ sưu tập, cửa hàng / đại lý, trang chủ, trang Giới thiệu và Liên hệ** ngay trên trình duyệt, không cần cài phần mềm hay sửa file tay.

Địa chỉ: **https://<tên-miền-website>/admin**

## 1. Cách hoạt động (đọc 1 lần)

1. Bạn sửa nội dung trong form và bấm **Công bố → Công bố ngay**.
2. Trang quản trị lưu thay đổi vào kho GitHub `ddconceptdd-create/vbamboo-web`, đúng vào file `content/.../info.txt` và thư mục ảnh như khi sửa tay.
3. Vercel tự dựng lại website. Sau khoảng **1 đến 3 phút** thay đổi xuất hiện trên web.

Mỗi lần bấm Công bố là một bản lưu có ghi tên người sửa trên GitHub, nên luôn xem lại được ai sửa gì và quay lại bản cũ khi cần.

**"Công bố" trong trang quản trị KHÔNG có nghĩa là hiện trên website.** Việc sản phẩm có hiện trên website chính thức hay không do ô **Trạng thái** quyết định (mục 4).

## 2. Cài đặt một lần (dành cho DD, người quản lý kho GitHub)

### 2.1. Tạo GitHub OAuth App (để team đăng nhập)

1. Mở https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**.
2. Điền:
   - Application name: `VBamboo CMS`
   - Homepage URL: `https://<tên-miền-website>`
   - Authorization callback URL: `https://<tên-miền-website>/api/decap/callback`
3. Bấm **Register application**, rồi **Generate a new client secret**. Chép lại **Client ID** và **Client secret** (secret chỉ hiện 1 lần).

### 2.2. Khai báo trên Vercel

Vercel → dự án vbamboo-web → **Settings → Environment Variables**, thêm 2 biến cho môi trường **Production**:

| Tên biến | Giá trị |
|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | Client ID ở bước trên |
| `GITHUB_OAUTH_CLIENT_SECRET` | Client secret ở bước trên |

Sau đó vào **Deployments → Redeploy** bản mới nhất để biến có hiệu lực.

### 2.3. Thêm thành viên team

Mỗi người cần **1 tài khoản GitHub** (miễn phí). Vào https://github.com/ddconceptdd-create/vbamboo-web/settings/access → **Add people** → chọn quyền **Write**. Người được mời phải bấm chấp nhận lời mời trong email.

Người có quyền Write sửa được mọi nội dung và cả mã nguồn trên GitHub. Chỉ mời người trong team bạn tin tưởng. Rút quyền ở cùng trang khi có người nghỉ.

## 3. Đăng nhập

1. Mở `https://<tên-miền-website>/admin`.
2. Bấm **Đăng nhập bằng GitHub**, cho phép **VBamboo CMS** trong cửa sổ hiện ra (chỉ hỏi lần đầu).
3. Màn hình chính có các mục bên trái: Sản phẩm, Bộ sưu tập, Cửa hàng & đại lý, Trang chủ, Giới thiệu (About), Liên hệ & chân trang.

Đăng nhập chỉ dùng được trên tên miền chính. Các link xem trước (preview) của Vercel không đăng nhập được.

## 4. Trạng thái và quy trình duyệt

Mỗi sản phẩm, bộ sưu tập và cửa hàng có ô **Trạng thái**:

| Trạng thái | Website chính thức | Link xem trước (preview) |
|---|---|---|
| **Nháp** (draft) | Không hiện | Hiện, có nhãn "Bản nháp" |
| **Đã duyệt** (approved) | Không hiện | Hiện, có nhãn "Bản nháp" |
| **Đăng** (published) | Hiện | Hiện |

Quy trình đề xuất:

1. Người nhập liệu tạo hoặc sửa sản phẩm, để **Nháp**.
2. Người kiểm tra xem lại thông tin, ảnh, kích thước, rồi đổi sang **Đã duyệt**.
3. Người phụ trách đăng đổi sang **Đăng** khi muốn đưa lên web.

Lưu ý: trang quản trị không chặn quyền theo vai trò. Ai có quyền vào /admin cũng đổi được trạng thái, nên quy trình trên dựa vào thỏa thuận trong team. Nếu cần bắt buộc duyệt qua người khác, xem mục 9.

Kích thước và giá có ô duyệt riêng: **Kích thước đã xác nhận** và **Giá đã duyệt**. Chưa tick thì website chính thức không hiện kích thước / giá.

## 5. Thêm sản phẩm mới

1. Chọn **Sản phẩm** → **+ sản phẩm**.
2. **Tên sản phẩm (tiếng Anh)**: bắt buộc. Tên này tạo luôn tên thư mục và địa chỉ trang (vd "Ponti Chair" → `/products/ponti-chair`). **Đặt đúng ngay từ đầu**, vì sau khi lưu không đổi được tên thư mục.
3. **Tên tiếng Việt**: để trống nếu giống tên tiếng Anh.
4. **Phân loại**: chọn Bộ sưu tập, Loại sản phẩm (dùng cho menu lọc), Kiểu (VI / EN), tick Sản phẩm tiêu biểu nếu muốn hiện ở trang chủ, Thứ tự hiển thị nếu muốn đặt vị trí.
5. **Kích thước (mm)**: nhập số vào Rộng, Sâu, Cao, Cao mặt ngồi. Chỉ nhập số, không ghi "mm".
6. **Ảnh**: bấm vào từng ô để tải ảnh lên (mục 6).
7. **Nội dung tiếng Việt / tiếng Anh**: Mô tả (đoạn đầu là mô tả ngắn, cách 1 dòng trống để thêm đoạn), Đặc điểm thiết kế (mỗi ý 1 dòng, bấm "Add" để thêm), Chất liệu (vd `Khung: Tre tự nhiên`).
8. Để Trạng thái **Nháp**, bấm **Công bố → Công bố ngay**.

Sản phẩm mới tự hiện cuối danh sách. Muốn đưa lên trước, điền **Thứ tự hiển thị** (mục 7).

## 6. Ảnh

Ảnh tải lên được lưu chung thư mục với sản phẩm (`content/products/<tên-sản-phẩm>/`).

| Ô trong form | Dùng cho |
|---|---|
| Ảnh chính (cutout) | Ảnh sản phẩm tách nền hoặc chụp studio nền trắng, hiện đầu trang sản phẩm |
| Kiểu ảnh chính | Cutout / nền trắng hoặc Ảnh không gian |
| Ảnh khi rê chuột | Ảnh không gian hiện khi rê chuột lên thẻ sản phẩm |
| Ảnh hero, Ảnh không gian (room), Ảnh studio, Ảnh chi tiết (detail) | Bộ ảnh trên trang sản phẩm, theo đúng thứ tự này |
| Bản vẽ kỹ thuật | File bản vẽ, tên hình chiếu VI / EN, màu nền |
| Mẫu vật liệu | Ảnh vuông của vật liệu, tên VI / EN |

Quy tắc:

- **Đặt tên file trước khi tải lên**: chữ thường không dấu, không khoảng trắng, vd `hero.jpg`, `room-01.jpg`, `studio-01.jpg`, `detail-01.jpg`, `drawing-01.png`, `swatch-may-dan.jpg`. Tên file trùng với ảnh đã có sẽ ghi đè ảnh cũ.
- Nếu để trống cả 4 ô hero / room / studio / detail, website tự lấy ảnh trong thư mục theo tên file (hero*, room*, studio*, detail*), giống cách cũ. Các sản phẩm đang có dùng cách này, nên form của chúng để trống 4 ô đó là bình thường.
- Ảnh nên rộng 1600 đến 2400 px, mỗi ảnh dưới khoảng 800 KB (JPG chất lượng 75 đến 80). Website tự nén cho điện thoại. Ảnh quá 25 MB sẽ làm web chậm.
- Xóa ảnh khỏi ô chỉ gỡ ảnh khỏi trang, file vẫn còn trong thư mục. Muốn xóa hẳn file, bấm vào ô ảnh để mở cửa sổ chọn ảnh của sản phẩm đó, chọn ảnh rồi bấm xóa.

## 7. Thứ tự hiển thị

- Mặc định, thứ tự theo file `index.txt` của từng mục. Mục thứ N trong `index.txt` có vị trí **N × 10** (sản phẩm thứ 3 là 30, thứ 8 là 80).
- Mục tạo mới ở /admin chưa có trong `index.txt` nên hiện cuối cùng.
- Muốn chen sản phẩm vào giữa, điền **Thứ tự hiển thị**: vd 35 để nằm giữa sản phẩm thứ 3 (30) và thứ 4 (40).

## 8. Bộ sưu tập, cửa hàng và các trang

- **Bộ sưu tập**: tên, câu giới thiệu VI / EN, ảnh mở đầu, nét vẽ, ảnh không gian, 3 ảnh cận chất liệu, đoạn giới thiệu và trích dẫn. Bộ sưu tập mới xuất hiện trong ô chọn "Bộ sưu tập" của sản phẩm **sau khi website dựng lại xong** (1 đến 3 phút sau khi công bố, tải lại trang /admin).
- **Cửa hàng & đại lý**: loại (showroom / đại lý), địa chỉ và giờ mở cửa (mỗi dòng 1 dòng), điện thoại, link Google Maps, có đặt lịch hay không.
- **Trang chủ**: ảnh mở đầu, bộ sưu tập giới thiệu, các tiêu đề, phần Xưởng & con người.
- **Giới thiệu (About)**: lời mở đầu, các chương (mỗi chương có tiêu đề nhỏ, tiêu đề, ảnh dọc 4:5, nội dung VI / EN), trích dẫn, giá trị cốt lõi.
- **Liên hệ & chân trang**: địa chỉ, điện thoại, email, mạng xã hội, dòng chân trang, bật / tắt hiện giá.

Các ô **Nâng cao** giữ các dòng đặc biệt (Finish, Fabric, VersionPhoto…). Chỉ sửa khi biết rõ.

## 9. Những điều cần biết

- **Hai người sửa cùng một mục cùng lúc**: người bấm Công bố sau có thể ghi đè hoặc bị báo lỗi. Hãy chia việc theo sản phẩm, và tải lại trang trước khi sửa mục người khác vừa sửa.
- **Không xóa được mục trong /admin** (đã tắt để tránh xóa nhầm). Muốn gỡ khỏi web: đổi Trạng thái sang Nháp. Muốn xóa hẳn: nhờ người quản lý kho GitHub.
- **Đổi tên sản phẩm** sau khi đã đăng không đổi địa chỉ trang. Nếu thật sự cần địa chỉ mới, điền ô **Địa chỉ trang (Slug)** trong Nâng cao, nhưng link cũ đã gửi khách sẽ hỏng.
- **Website chưa cập nhật?** Chờ 3 phút rồi tải lại trang (Ctrl + F5). Nếu vẫn chưa, xem tab Deployments trên Vercel có báo lỗi không.
- **Bắt buộc duyệt qua người khác** (chưa bật): trang quản trị có chế độ "editorial workflow". Khi bật, mỗi thay đổi thành một đề xuất (pull request) có link xem trước riêng, và chỉ người được phép mới bấm đăng. Cần bật thêm bảo vệ nhánh `main` trên GitHub. Báo người quản lý kỹ thuật nếu team cần.
- **Sửa tay vẫn được**: các file `info.txt` giữ nguyên định dạng (xem HUONG-DAN.txt). Lần đầu một mục được lưu qua /admin, dòng `Draft: yes/no` sẽ được đổi thành `Status: draft/published` và thứ tự các dòng được sắp lại. Nội dung không đổi.

## 10. Dành cho người kỹ thuật

- Mã trang quản trị: `public/admin/` (`index.html`, `config.js` là cấu hình form, `vbamboo-formats.js` đọc / ghi `info.txt`). Đăng nhập GitHub: `src/app/api/decap/`.
- Decap CMS bản 3.17.3, tải từ unpkg.
- Sửa trên máy không cần đăng nhập: chạy `npm run dev`, mở thêm một cửa sổ chạy `npx decap-server`, rồi vào http://localhost:3000/admin. Thay đổi ghi thẳng vào thư mục trên máy.
