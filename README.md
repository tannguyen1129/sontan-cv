# Sơn Tân — Developer Portfolio & CMS

CV điện tử full-stack với giao diện hiện đại, Django Admin làm CMS và Next.js làm frontend tĩnh tốc độ cao.

## Công nghệ

- **Backend:** Django 5, Django REST Framework, PostgreSQL/SQLite, Gunicorn, WhiteNoise
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide Icons
- **Deploy:** Render Blueprint gồm Static Site, Python Web Service và PostgreSQL

## Nội dung quản lý trong CMS

- Hồ sơ cá nhân, avatar URL, CV PDF, thông tin liên hệ
- Học vấn và kinh nghiệm làm việc
- Dự án nổi bật, link demo/source, tech stack và màu nhận diện
- Kỹ năng chuyên môn theo nhóm và mức độ
- Kỹ năng mềm, giải thưởng và chứng chỉ
- Liên kết mạng xã hội và tin nhắn từ form liên hệ
- Nội dung tiếng Việt và tiếng Anh, chuyển đổi trực tiếp trên giao diện
- Upload logo công ty trực tiếp trong mục kinh nghiệm

## Chạy local

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API ở `http://localhost:8000/api/`, CMS ở `http://localhost:8000/admin/`.

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Website ở `http://localhost:3000`.

## Deploy miễn phí trên Render

1. Push repository lên GitHub/GitLab.
2. Trong Render chọn **New > Blueprint**, kết nối repository và chọn `render.yaml`.
3. Nhập `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL` và `DJANGO_SUPERUSER_PASSWORD`. Mật khẩu do bạn tự đặt và không nằm trong source code.
4. Sau khi deploy, mở `https://sontan-portfolio-api.onrender.com/admin/` để điền nội dung thật.

Nếu tên service đã tồn tại, đổi tên trong `render.yaml`, rồi cập nhật `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` và `NEXT_PUBLIC_API_URL` theo URL mới.

> Lưu ý: web service miễn phí sẽ ngủ khi không hoạt động. PostgreSQL miễn phí của Render hiện hết hạn sau 30 ngày; để CMS lưu bền lâu cần nâng database hoặc trỏ `DATABASE_URL` sang PostgreSQL bên ngoài. Không dùng SQLite trên Render vì filesystem là tạm thời.

Biến môi trường mẫu nằm trong `backend/.env.example` và `frontend/.env.example`.
