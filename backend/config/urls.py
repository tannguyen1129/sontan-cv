from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

admin.site.site_header = "Sơn Tân · Portfolio CMS"
admin.site.site_title = "Sơn Tân CMS"
admin.site.index_title = "Quản trị nội dung / Content management"

urlpatterns = [
    path("", RedirectView.as_view(url="/api/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/", include("portfolio.urls")),
]
