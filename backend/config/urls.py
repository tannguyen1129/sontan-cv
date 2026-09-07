from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

admin.site.site_header = "Portfolio CMS"
admin.site.site_title = "Portfolio CMS"
admin.site.index_title = "Quản trị hồ sơ cá nhân"

urlpatterns = [
    path("", RedirectView.as_view(url="/api/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/", include("portfolio.urls")),
]

