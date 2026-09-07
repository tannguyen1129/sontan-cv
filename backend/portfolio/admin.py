import base64
from datetime import datetime
from django import forms
from django.contrib import admin
from .models import Award, Certification, ContactMessage, Education, Experience, Profile, Project, Skill, SocialLink, SoftSkill

admin.site.register(Profile)

MONTH_YEAR_HELP = "Nhập theo định dạng MM/YYYY, ví dụ 06/2025."

def parse_month_year(value, label, required=True):
    if not value:
        if required:
            raise forms.ValidationError(f"{label} là bắt buộc.")
        return None
    try:
        return datetime.strptime(value.strip(), "%m/%Y").date().replace(day=1)
    except ValueError as exc:
        raise forms.ValidationError(f"{label} phải đúng định dạng MM/YYYY.") from exc

class MonthYearInput(forms.TextInput):
    def __init__(self, **kwargs):
        attrs = {"placeholder": "MM/YYYY", "inputmode": "numeric", "pattern": "(0[1-9]|1[0-2])/\\d{4}", "maxlength": "7"}
        attrs.update(kwargs.pop("attrs", {}))
        super().__init__(attrs=attrs, **kwargs)

@admin.register(SocialLink, SoftSkill)
class SimpleOrderedAdmin(admin.ModelAdmin):
    list_display = ("__str__", "order", "is_visible")
    list_editable = ("order", "is_visible")

class ExperienceAdminForm(forms.ModelForm):
    start_period = forms.CharField(label="Bắt đầu", help_text=MONTH_YEAR_HELP, widget=MonthYearInput())
    end_period = forms.CharField(label="Kết thúc", help_text="Để trống nếu đang làm việc.", required=False, widget=MonthYearInput())
    logo_upload = forms.ImageField(
        label="Tải logo công ty", required=False,
        help_text="PNG, JPG hoặc WebP; tối đa 512 KB. Để trống để giữ logo hiện tại.",
    )
    remove_logo = forms.BooleanField(label="Xóa logo hiện tại", required=False)

    class Meta:
        model = Experience
        exclude = ("company_logo", "start_date", "end_date")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["start_period"].initial = self.instance.start_date.strftime("%m/%Y")
            self.fields["end_period"].initial = self.instance.end_date.strftime("%m/%Y") if self.instance.end_date else ""

    def clean(self):
        cleaned = super().clean()
        start = parse_month_year(cleaned.get("start_period"), "Bắt đầu")
        end = parse_month_year(cleaned.get("end_period"), "Kết thúc", required=False)
        if cleaned.get("is_current"):
            end = None
        elif not end:
            self.add_error("end_period", "Hãy nhập tháng kết thúc hoặc chọn Đang làm việc.")
        if start and end and end < start:
            self.add_error("end_period", "Tháng kết thúc không được trước tháng bắt đầu.")
        cleaned["parsed_start"] = start
        cleaned["parsed_end"] = end
        return cleaned

    def clean_logo_upload(self):
        logo = self.cleaned_data.get("logo_upload")
        if logo and logo.size > 512 * 1024:
            raise forms.ValidationError("Logo phải nhỏ hơn hoặc bằng 512 KB.")
        return logo

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.start_date = self.cleaned_data["parsed_start"]
        instance.end_date = self.cleaned_data["parsed_end"]
        logo = self.cleaned_data.get("logo_upload")
        if self.cleaned_data.get("remove_logo"):
            instance.company_logo = ""
        elif logo:
            mime = logo.content_type or "image/png"
            instance.company_logo = f"data:{mime};base64,{base64.b64encode(logo.read()).decode('ascii')}"
        if commit:
            instance.save()
            self.save_m2m()
        return instance

class EducationAdminForm(forms.ModelForm):
    start_period = forms.CharField(label="Bắt đầu", help_text=MONTH_YEAR_HELP, widget=MonthYearInput())
    end_period = forms.CharField(label="Kết thúc", help_text="Có thể trùng tháng bắt đầu hoặc để trống nếu đang học.", required=False, widget=MonthYearInput())
    logo_upload = forms.ImageField(
        label="Tải logo trường", required=False,
        help_text="PNG, JPG hoặc WebP; tối đa 512 KB. Để trống để giữ logo hiện tại.",
    )
    remove_logo = forms.BooleanField(label="Xóa logo hiện tại", required=False)

    class Meta:
        model = Education
        exclude = ("school_logo", "start_month", "start_year", "end_month", "end_year")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["start_period"].initial = f"{self.instance.start_month:02d}/{self.instance.start_year}"
            self.fields["end_period"].initial = f"{self.instance.end_month:02d}/{self.instance.end_year}" if self.instance.end_year else ""

    def clean(self):
        cleaned = super().clean()
        start = parse_month_year(cleaned.get("start_period"), "Bắt đầu")
        end = parse_month_year(cleaned.get("end_period"), "Kết thúc", required=False)
        if start and end and end < start:
            self.add_error("end_period", "Tháng kết thúc không được trước tháng bắt đầu.")
        cleaned["parsed_start"] = start
        cleaned["parsed_end"] = end
        return cleaned

    def clean_logo_upload(self):
        logo = self.cleaned_data.get("logo_upload")
        if logo and logo.size > 512 * 1024:
            raise forms.ValidationError("Logo phải nhỏ hơn hoặc bằng 512 KB.")
        return logo

    def save(self, commit=True):
        instance = super().save(commit=False)
        start = self.cleaned_data["parsed_start"]
        end = self.cleaned_data["parsed_end"]
        instance.start_month, instance.start_year = start.month, start.year
        instance.end_month = end.month if end else 12
        instance.end_year = end.year if end else None
        logo = self.cleaned_data.get("logo_upload")
        if self.cleaned_data.get("remove_logo"):
            instance.school_logo = ""
        elif logo:
            mime = logo.content_type or "image/png"
            instance.school_logo = f"data:{mime};base64,{base64.b64encode(logo.read()).decode('ascii')}"
        if commit:
            instance.save()
            self.save_m2m()
        return instance

class CertificationAdminForm(forms.ModelForm):
    issued_period = forms.CharField(label="Ngày cấp", help_text=MONTH_YEAR_HELP, required=False, widget=MonthYearInput())
    expires_period = forms.CharField(label="Ngày hết hạn", help_text="Để trống nếu chứng chỉ không hết hạn.", required=False, widget=MonthYearInput())

    class Meta:
        model = Certification
        exclude = ("issued_date", "expires_date")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["issued_period"].initial = self.instance.issued_date.strftime("%m/%Y") if self.instance.issued_date else ""
            self.fields["expires_period"].initial = self.instance.expires_date.strftime("%m/%Y") if self.instance.expires_date else ""

    def clean(self):
        cleaned = super().clean()
        issued = parse_month_year(cleaned.get("issued_period"), "Ngày cấp", required=False)
        expires = parse_month_year(cleaned.get("expires_period"), "Ngày hết hạn", required=False)
        if issued and expires and expires < issued:
            self.add_error("expires_period", "Ngày hết hạn không được trước ngày cấp.")
        cleaned["parsed_issued"] = issued
        cleaned["parsed_expires"] = expires
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.issued_date = self.cleaned_data["parsed_issued"]
        instance.expires_date = self.cleaned_data["parsed_expires"]
        if commit:
            instance.save()
            self.save_m2m()
        return instance

class SinglePeriodFormMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["period"].initial = f"{self.instance.month:02d}/{self.instance.year}"

    def clean(self):
        cleaned = super().clean()
        cleaned["parsed_period"] = parse_month_year(cleaned.get("period"), "Thời gian")
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        period = self.cleaned_data["parsed_period"]
        instance.month, instance.year = period.month, period.year
        if commit:
            instance.save()
            self.save_m2m()
        return instance

class ProjectAdminForm(SinglePeriodFormMixin, forms.ModelForm):
    period = forms.CharField(label="Thời gian", help_text=MONTH_YEAR_HELP, widget=MonthYearInput())

    class Meta:
        model = Project
        exclude = ("month", "year")

class AwardAdminForm(SinglePeriodFormMixin, forms.ModelForm):
    period = forms.CharField(label="Thời gian", help_text=MONTH_YEAR_HELP, widget=MonthYearInput())

    class Meta:
        model = Award
        exclude = ("month", "year")

@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    form = ExperienceAdminForm
    list_display = ("role", "company", "start_date", "is_current", "order", "is_visible")
    list_editable = ("order", "is_visible")
    list_filter = ("is_current", "is_visible")

@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    form = EducationAdminForm
    list_display = ("school", "degree", "program_type", "start_month", "start_year", "end_month", "end_year", "order", "is_visible")
    list_editable = ("order", "is_visible")
    list_filter = ("program_type", "is_visible")

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectAdminForm
    list_display = ("title", "month", "year", "is_featured", "order", "is_visible")
    list_editable = ("is_featured", "order", "is_visible")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("year", "is_featured", "is_visible")

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "level", "order", "is_visible")
    list_editable = ("level", "order", "is_visible")
    list_filter = ("category", "is_visible")

@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    form = AwardAdminForm
    list_display = ("__str__", "issuer", "month", "year", "order", "is_visible")
    list_editable = ("order", "is_visible")

@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    form = CertificationAdminForm
    list_display = ("name", "issuer", "issued_date", "expires_date", "order", "is_visible")
    list_editable = ("order", "is_visible")

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at", "is_read")
    list_editable = ("is_read",)
    list_filter = ("is_read", "created_at")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("name", "email", "subject", "message", "created_at")
