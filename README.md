# Thiệp mời Tốt nghiệp 2026

Landing page tốt nghiệp tương tác: hiển thị ảnh ngẫu nhiên từ thư viện, nhận lời chúc và giữ thiệp mời ở một đường dẫn riêng.

## Xem trên máy

Mở `index.html` trực tiếp hoặc chạy một web server đơn giản:

```bash
python3 -m http.server 8080
```

Sau đó truy cập `http://localhost:8080`.

## Kho ảnh trực tuyến

1. Chạy `supabase-setup.sql` một lần trong Supabase SQL Editor.
2. Tạo tài khoản quản trị trong **Authentication > Users** với email đã cấu hình.
3. Chạy `node build-config.js` trước khi xem trên máy.
4. Khi deploy Blueprint, nhập `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong Render.

Nút **Quản trị** ở footer cho phép tài khoản quản trị thêm/xóa ảnh và xóa lời chúc. Khách truy cập có thể xem ảnh, xem lời chúc và gửi lời chúc mới.

Sau khi cập nhật phiên bản có sổ lời chúc, hãy chạy lại toàn bộ `supabase-setup.sql` trong SQL Editor một lần để tạo bảng và các chính sách RLS cần thiết.

## Kiểm thử VnCDN purge API

Runner được khóa cứng và chỉ thao tác trên `graduation.sontan.info`, trong vùng `/cdn-test/`.
Thêm `VNCDN_API_KEY` vào `.env`, sau đó chạy từng boundary test:

```bash
node cdn-api-test.js url 1
node cdn-api-test.js url 10
node cdn-api-test.js url 50
node cdn-api-test.js url 100
node cdn-api-test.js prefix 100
node cdn-api-test.js prefix 500
node cdn-api-test.js prefix 1000
```

Hoặc chạy toàn bộ bằng `node cdn-api-test.js all`. Script không hiển thị API key trong log.

## Thay ảnh mặc định

- Cách nhanh: nhấn **Thay ảnh** ngay trên website. Ảnh chỉ được xử lý trong trình duyệt.
- Cách cố định: thay `assets/portrait-placeholder.svg` bằng ảnh của bạn và sửa đường dẫn `src` trong `index.html`.

Nên dùng ảnh chân dung dọc tỷ lệ 4:5, độ phân giải từ 1200 × 1500 px.

## Deploy lên Render

1. Đẩy thư mục này lên một repository GitHub.
2. Trong Render, chọn **New > Blueprint** và kết nối repository.
3. Render sẽ đọc `render.yaml`; xác nhận tạo Static Site.

Không cần lệnh build. Thư mục publish là thư mục gốc (`.`).
