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
    headline_en = models.CharField("Job title (English)", max_length=180, blank=True)
    short_bio = models.TextField("Giới thiệu ngắn", max_length=420)
    short_bio_en = models.TextField("Short bio (English)", max_length=420, blank=True)
    long_bio = models.TextField("Giới thiệu chi tiết", blank=True)
    long_bio_en = models.TextField("Detailed bio (English)", blank=True)
    email = models.EmailField("Email")
    phone = models.CharField("Số điện thoại", max_length=30, blank=True)
    location = models.CharField("Địa điểm", max_length=120, blank=True)
    location_en = models.CharField("Location (English)", max_length=120, blank=True)
    availability = models.CharField("Trạng thái làm việc", max_length=120, default="Open to opportunities")
    availability_en = models.CharField("Availability (English)", max_length=120, blank=True)
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
    label_en = models.CharField("Social label (English)", max_length=50, blank=True)
    url = models.URLField("Đường dẫn")
    icon = models.CharField("Icon", max_length=30, help_text="github, linkedin, facebook, globe...")
    class Meta(OrderedModel.Meta): verbose_name = "Liên kết"; verbose_name_plural = "Liên kết"
    def __str__(self): return self.label

class Experience(OrderedModel):
    company = models.CharField("Công ty", max_length=120)
    company_en = models.CharField("Company name (English)", max_length=120, blank=True)
    company_logo = models.TextField("Logo công ty", blank=True, help_text="Logo tải lên từ CMS, tối đa 512 KB")
    role = models.CharField("Vị trí", max_length=120)
    role_en = models.CharField("Role (English)", max_length=120, blank=True)
    start_date = models.DateField("Bắt đầu")
    end_date = models.DateField("Kết thúc", null=True, blank=True)
    is_current = models.BooleanField("Đang làm việc", default=False)
    location = models.CharField("Địa điểm", max_length=120, blank=True)
    location_en = models.CharField("Location (English)", max_length=120, blank=True)
    employment_type = models.CharField("Hình thức", max_length=50, blank=True)
    employment_type_en = models.CharField("Employment type (English)", max_length=50, blank=True)
    description = models.TextField("Mô tả")
    description_en = models.TextField("Description (English)", blank=True)
    highlights = models.JSONField("Điểm nổi bật", default=list, blank=True, help_text='Danh sách JSON, ví dụ ["Tăng tốc độ 40%"]')
    highlights_en = models.JSONField("Highlights (English)", default=list, blank=True, help_text='JSON list, e.g. ["Improved performance by 40%"]')
    technologies = models.JSONField("Công nghệ", default=list, blank=True)
    company_url = models.URLField("Website công ty", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Kinh nghiệm"; verbose_name_plural = "Kinh nghiệm"
    def __str__(self): return f"{self.role} @ {self.company}"

class Education(OrderedModel):
    class Month(models.IntegerChoices):
        JAN = 1, "01 - Tháng 1 / January"
        FEB = 2, "02 - Tháng 2 / February"
        MAR = 3, "03 - Tháng 3 / March"
        APR = 4, "04 - Tháng 4 / April"
        MAY = 5, "05 - Tháng 5 / May"
        JUN = 6, "06 - Tháng 6 / June"
        JUL = 7, "07 - Tháng 7 / July"
        AUG = 8, "08 - Tháng 8 / August"
        SEP = 9, "09 - Tháng 9 / September"
        OCT = 10, "10 - Tháng 10 / October"
        NOV = 11, "11 - Tháng 11 / November"
        DEC = 12, "12 - Tháng 12 / December"

    PROGRAM_TYPES = [
        ("degree", "Bằng cấp / Degree"),
        ("exchange", "Trao đổi sinh viên / Student exchange"),
        ("course", "Khóa học / Course"),
        ("other", "Khác / Other"),
    ]
    school = models.CharField("Trường", max_length=180)
    school_en = models.CharField("School name (English)", max_length=180, blank=True)
    school_logo = models.TextField("Logo trường", blank=True, help_text="Logo tải lên từ CMS, tối đa 512 KB")
    program_type = models.CharField("Loại chương trình", max_length=20, choices=PROGRAM_TYPES, default="degree")
    degree = models.CharField("Tên bằng cấp / chương trình", max_length=150)
    degree_en = models.CharField("Degree / program name (English)", max_length=150, blank=True)
    field_of_study = models.CharField("Chuyên ngành", max_length=150, blank=True, help_text="Chỉ dùng cho chương trình bằng cấp")
    field_of_study_en = models.CharField("Field of study (English)", max_length=150, blank=True, help_text="Only used for degree programs")
    start_month = models.PositiveSmallIntegerField("Tháng bắt đầu", choices=Month.choices, default=1)
    start_year = models.PositiveSmallIntegerField("Năm bắt đầu")
    end_month = models.PositiveSmallIntegerField("Tháng kết thúc", choices=Month.choices, default=12)
    end_year = models.PositiveSmallIntegerField("Năm kết thúc", null=True, blank=True)
    grade = models.CharField("Xếp loại / GPA", max_length=50, blank=True)
    description = models.TextField("Mô tả", blank=True)
    description_en = models.TextField("Description (English)", blank=True)
    school_url = models.URLField("Website trường", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Học vấn"; verbose_name_plural = "Học vấn"
    def __str__(self): return self.school

class Project(OrderedModel):
    title = models.CharField("Tên dự án", max_length=140)
    title_en = models.CharField("Project title (English)", max_length=140, blank=True)
    slug = models.SlugField(unique=True)
    tagline = models.CharField("Mô tả ngắn", max_length=220)
    tagline_en = models.CharField("Tagline (English)", max_length=220, blank=True)
    description = models.TextField("Mô tả chi tiết")
    description_en = models.TextField("Detailed description (English)", blank=True)
    cover_url = models.URLField("URL ảnh bìa", blank=True)
    live_url = models.URLField("Website", blank=True)
    source_url = models.URLField("Mã nguồn", blank=True)
    technologies = models.JSONField("Công nghệ", default=list)
    month = models.PositiveSmallIntegerField("Tháng", choices=Education.Month.choices, default=1)
    year = models.PositiveSmallIntegerField("Năm")
    is_featured = models.BooleanField("Dự án nổi bật", default=False)
    accent = models.CharField("Màu nhấn", max_length=20, default="#7c3aed")
    class Meta(OrderedModel.Meta): verbose_name = "Dự án"; verbose_name_plural = "Dự án"
    def __str__(self): return self.title

class Skill(OrderedModel):
    CATEGORY = [("frontend", "Frontend"), ("backend", "Backend"), ("database", "Database"), ("devops", "DevOps & Tools"), ("other", "Khác")]
    name = models.CharField("Kỹ năng", max_length=80)
    name_en = models.CharField("Skill name (English)", max_length=80, blank=True)
    category = models.CharField("Nhóm", max_length=20, choices=CATEGORY)
    level = models.PositiveSmallIntegerField("Mức độ (%)", default=75)
    icon = models.CharField("Icon / mã ngắn", max_length=30, blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Kỹ năng chuyên môn"; verbose_name_plural = "Kỹ năng chuyên môn"
    def __str__(self): return self.name

class SoftSkill(OrderedModel):
    name = models.CharField("Kỹ năng mềm", max_length=100)
    name_en = models.CharField("Soft skill (English)", max_length=100, blank=True)
    description = models.CharField("Mô tả", max_length=240, blank=True)
    description_en = models.CharField("Description (English)", max_length=240, blank=True)
    icon = models.CharField("Icon", max_length=30, default="sparkles")
    class Meta(OrderedModel.Meta): verbose_name = "Kỹ năng mềm"; verbose_name_plural = "Kỹ năng mềm"
    def __str__(self): return self.name

class Award(OrderedModel):
    title = models.CharField("Tên giải thưởng", max_length=180)
    title_en = models.CharField("Award title (English)", max_length=180, blank=True)
    issuer = models.CharField("Đơn vị cấp", max_length=140)
    issuer_en = models.CharField("Issuer (English)", max_length=140, blank=True)
    month = models.PositiveSmallIntegerField("Tháng", choices=Education.Month.choices, default=1)
    year = models.PositiveSmallIntegerField("Năm")
    description = models.TextField("Mô tả", blank=True)
    description_en = models.TextField("Description (English)", blank=True)
    credential_url = models.URLField("Minh chứng", blank=True)
    class Meta(OrderedModel.Meta): verbose_name = "Giải thưởng"; verbose_name_plural = "Giải thưởng"
    def __str__(self): return self.title

class Certification(OrderedModel):
    name = models.CharField("Chứng chỉ", max_length=180)
    name_en = models.CharField("Certification name (English)", max_length=180, blank=True)
    issuer = models.CharField("Đơn vị cấp", max_length=140)
    issuer_en = models.CharField("Issuer (English)", max_length=140, blank=True)
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
