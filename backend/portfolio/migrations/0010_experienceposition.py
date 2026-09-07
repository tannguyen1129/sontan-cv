from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("portfolio", "0009_award_month_project_month")]

    operations = [
        migrations.CreateModel(
            name="ExperiencePosition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="Thứ tự")),
                ("is_visible", models.BooleanField(default=True, verbose_name="Hiển thị")),
                ("role", models.CharField(max_length=120, verbose_name="Vị trí")),
                ("role_en", models.CharField(blank=True, max_length=120, verbose_name="Role (English)")),
                ("start_date", models.DateField(verbose_name="Bắt đầu")),
                ("end_date", models.DateField(blank=True, null=True, verbose_name="Kết thúc")),
                ("is_current", models.BooleanField(default=False, verbose_name="Đang làm việc")),
                ("employment_type", models.CharField(blank=True, max_length=50, verbose_name="Hình thức")),
                ("employment_type_en", models.CharField(blank=True, max_length=50, verbose_name="Employment type (English)")),
                ("description", models.TextField(blank=True, verbose_name="Mô tả")),
                ("description_en", models.TextField(blank=True, verbose_name="Description (English)")),
                ("experience", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="positions", to="portfolio.experience", verbose_name="Công ty")),
            ],
            options={"verbose_name": "Giai đoạn chức danh", "verbose_name_plural": "Các giai đoạn chức danh", "ordering": ("order", "-id")},
        ),
    ]
