from django.db import models

class OrderedModel(models.Model):
    order = models.PositiveIntegerField("Thứ tự", default=0)
    is_visible = models.BooleanField("Hiển thị", default=True)
    class Meta:
        abstract = True
        ordering = ("order", "-id")

class Profile(models.Model):
    full_name = models.CharField("Họ và tên", max_length=120)
    headline = models.CharField("Chức danh", max_length=180)
    short_bio = models.TextField("Giới thiệu ngắn", max_length=420)
    long_bio = models.TextField("Giới thiệu chi tiết", blank=True)
    email = models.EmailField("Email")
    phone = models.CharField("Số điện thoại", max_length=30, blank=True)
    location = models.CharField("Địa điểm", max_length=120, blank=True)
    availability = models.CharField("Trạng thái làm việc", max_length=120, default="Open to opportunities")
    avatar_url = models.URLField("URL ảnh đại diện", blank=True)
    resume_url = models.URLField("URL CV PDF", blank=True)
    years_experience = models.PositiveSmallIntegerField("Số năm kinh nghiệm", default=0)
    projects_count = models.PositiveSmallIntegerField("Số dự án", default=0)
    coffee_count = models.PositiveIntegerField("Số ly cà phê", default=100)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: verbose_name = "Hồ sơ"; verbose_name_plural = "Hồ sơ"
    def __str__(self): return self.full_name

class SocialLink(OrderedModel):
    label = models.CharField("Tên mạng", max_length=50)
    url = models.URLField("Đường dẫn")
    icon = models.CharField("Icon", max_length=30, help_text="github, linkedin, facebook, globe...")
    class Meta(OrderedModel.Meta): verbose_name = "Liên kết"; verbose_name_plural = "Liên kết"
    def __str__(self): return self.label

class Experience(OrderedModel):
    company = models.CharField("Công ty", max_length=120)
    company_logo = models.TextField("Logo công ty", blank=True, help_text="Logo tải lên từ CMS, tối đa 512 KB")
    role = models.CharField("Vị trí", max_length=120)
    start_date = models.DateField("Bắt đầu")
    end_date = models.DateField("Kết thúc", null=True, blank=True)
    is_current = models.BooleanField("Đang làm việc", default=False)
    location = models.CharField("Địa điểm", max_length=120, blank=True)
    employment_type = models.CharField("Hình thức", max_length=50, blank=True)
    description = models.TextField("Mô tả")
    highlights = models.JSONField("Điểm nổi bật", default=list, blank=True, help_text='Danh sách JSON, ví dụ ["Tăng tốc độ 40%"]')
    technologies = models.JSONField("Công nghệ", default=list, blank=True)
    company_url = models.URLField("Website công ty", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Kinh nghiệm"; verbose_name_plural = "Kinh nghiệm"
    def __str__(self): return f"{self.role} @ {self.company}"

class Education(OrderedModel):
    school = models.CharField("Trường", max_length=180)
    degree = models.CharField("Bằng cấp", max_length=150)
    field_of_study = models.CharField("Chuyên ngành", max_length=150, blank=True)
    start_year = models.PositiveSmallIntegerField("Năm bắt đầu")
    end_year = models.PositiveSmallIntegerField("Năm kết thúc", null=True, blank=True)
    grade = models.CharField("Xếp loại / GPA", max_length=50, blank=True)
    description = models.TextField("Mô tả", blank=True)
    school_url = models.URLField("Website trường", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Học vấn"; verbose_name_plural = "Học vấn"
    def __str__(self): return self.school

class Project(OrderedModel):
    title = models.CharField("Tên dự án", max_length=140)
    slug = models.SlugField(unique=True)
    tagline = models.CharField("Mô tả ngắn", max_length=220)
    description = models.TextField("Mô tả chi tiết")
    cover_url = models.URLField("URL ảnh bìa", blank=True)
    live_url = models.URLField("Website", blank=True)
    source_url = models.URLField("Mã nguồn", blank=True)
    technologies = models.JSONField("Công nghệ", default=list)
    year = models.PositiveSmallIntegerField("Năm")
    is_featured = models.BooleanField("Dự án nổi bật", default=False)
    accent = models.CharField("Màu nhấn", max_length=20, default="#7c3aed")
    class Meta(OrderedModel.Meta): verbose_name = "Dự án"; verbose_name_plural = "Dự án"
    def __str__(self): return self.title

class Skill(OrderedModel):
    CATEGORY = [("frontend", "Frontend"), ("backend", "Backend"), ("database", "Database"), ("devops", "DevOps & Tools"), ("other", "Khác")]
    name = models.CharField("Kỹ năng", max_length=80)
    category = models.CharField("Nhóm", max_length=20, choices=CATEGORY)
    level = models.PositiveSmallIntegerField("Mức độ (%)", default=75)
    icon = models.CharField("Icon / mã ngắn", max_length=30, blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Kỹ năng chuyên môn"; verbose_name_plural = "Kỹ năng chuyên môn"
    def __str__(self): return self.name

class SoftSkill(OrderedModel):
    name = models.CharField("Kỹ năng mềm", max_length=100)
    description = models.CharField("Mô tả", max_length=240, blank=True)
    icon = models.CharField("Icon", max_length=30, default="sparkles")
    class Meta(OrderedModel.Meta): verbose_name = "Kỹ năng mềm"; verbose_name_plural = "Kỹ năng mềm"
    def __str__(self): return self.name

class Award(OrderedModel):
    title = models.CharField("Tên giải thưởng", max_length=180)
    issuer = models.CharField("Đơn vị cấp", max_length=140)
    year = models.PositiveSmallIntegerField("Năm")
    description = models.TextField("Mô tả", blank=True)
    credential_url = models.URLField("Minh chứng", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Giải thưởng"; verbose_name_plural = "Giải thưởng"
    def __str__(self): return self.title

class Certification(OrderedModel):
    name = models.CharField("Chứng chỉ", max_length=180)
    issuer = models.CharField("Đơn vị cấp", max_length=140)
    issued_date = models.DateField("Ngày cấp", null=True, blank=True)
    expires_date = models.DateField("Ngày hết hạn", null=True, blank=True)
    credential_id = models.CharField("Mã chứng chỉ", max_length=120, blank=True)
    credential_url = models.URLField("Đường dẫn", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Chứng chỉ"; verbose_name_plural = "Chứng chỉ"
    def __str__(self): return self.name

class ContactMessage(models.Model):
    name = models.CharField("Họ tên", max_length=120)
    email = models.EmailField("Email")
    subject = models.CharField("Chủ đề", max_length=180)
    message = models.TextField("Nội dung", max_length=3000)
    is_read = models.BooleanField("Đã đọc", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ("-created_at",); verbose_name = "Tin nhắn"; verbose_name_plural = "Tin nhắn liên hệ"
    def __str__(self): return f"{self.name}: {self.subject}"
