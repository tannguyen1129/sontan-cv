import base64
from django import forms
from django.contrib import admin
from .models import Award, Certification, ContactMessage, Education, Experience, Profile, Project, Skill, SocialLink, SoftSkill

admin.site.register(Profile)

@admin.register(SocialLink, SoftSkill)
class SimpleOrderedAdmin(admin.ModelAdmin):
    list_display = ("__str__", "order", "is_visible")
    list_editable = ("order", "is_visible")

class ExperienceAdminForm(forms.ModelForm):
    logo_upload = forms.ImageField(
        label="Tải logo công ty", required=False,
        help_text="PNG, JPG hoặc WebP; tối đa 512 KB. Để trống để giữ logo hiện tại.",
    )
    remove_logo = forms.BooleanField(label="Xóa logo hiện tại", required=False)

    class Meta:
        model = Experience
        exclude = ("company_logo",)

    def clean_logo_upload(self):
        logo = self.cleaned_data.get("logo_upload")
        if logo and logo.size > 512 * 1024:
            raise forms.ValidationError("Logo phải nhỏ hơn hoặc bằng 512 KB.")
        return logo

    def save(self, commit=True):
        instance = super().save(commit=False)
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
    logo_upload = forms.ImageField(
        label="Tải logo trường", required=False,
        help_text="PNG, JPG hoặc WebP; tối đa 512 KB. Để trống để giữ logo hiện tại.",
    )
    remove_logo = forms.BooleanField(label="Xóa logo hiện tại", required=False)

    class Meta:
        model = Education
        exclude = ("school_logo",)

    def clean_logo_upload(self):
        logo = self.cleaned_data.get("logo_upload")
        if logo and logo.size > 512 * 1024:
            raise forms.ValidationError("Logo phải nhỏ hơn hoặc bằng 512 KB.")
        return logo

    def save(self, commit=True):
        instance = super().save(commit=False)
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
    list_display = ("title", "year", "is_featured", "order", "is_visible")
    list_editable = ("is_featured", "order", "is_visible")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("year", "is_featured", "is_visible")

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "level", "order", "is_visible")
    list_editable = ("level", "order", "is_visible")
    list_filter = ("category", "is_visible")

@admin.register(Award, Certification)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("__str__", "issuer", "order", "is_visible")
    list_editable = ("order", "is_visible")

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at", "is_read")
    list_editable = ("is_read",)
    list_filter = ("is_read", "created_at")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("name", "email", "subject", "message", "created_at")
