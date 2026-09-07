import os
from django import forms
from django.test import override_settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient
from .models import ContactMessage, Profile, Skill
from .admin import parse_month_year

class PortfolioApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.profile = Profile.objects.create(full_name="Test User", headline="Developer", short_bio="Bio", email="test@example.com")
        Skill.objects.create(name="Python", category="backend", level=90)
        Skill.objects.create(name="Hidden", category="other", level=50, is_visible=False)

    def test_portfolio_only_returns_visible_content(self):
        response = self.client.get("/api/", secure=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["profile"]["full_name"], "Test User")
        self.assertEqual([item["name"] for item in response.data["skills"]], ["Python"])
        self.assertIn("headline_en", response.data["profile"])

    def test_contact_message_is_saved(self):
        response = self.client.post("/api/contact/", {"name":"Visitor", "email":"visitor@example.com", "subject":"Hello", "message":"A useful message"}, format="json", secure=True)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ContactMessage.objects.filter(email="visitor@example.com").exists())

    @override_settings(CORS_ALLOWED_ORIGINS=["https://sontan.info"])
    def test_custom_domain_receives_cors_header(self):
        response = self.client.get("/api/", secure=True, HTTP_ORIGIN="https://sontan.info")
        self.assertEqual(response["Access-Control-Allow-Origin"], "https://sontan.info")

    def test_health_check_is_not_rate_limited(self):
        for _ in range(130):
            response = self.client.get("/api/health/", secure=True)
            self.assertEqual(response.status_code, 200)

    def test_admin_command_uses_environment(self):
        values = {"DJANGO_SUPERUSER_USERNAME":"owner", "DJANGO_SUPERUSER_EMAIL":"owner@example.com", "DJANGO_SUPERUSER_PASSWORD":"a-strong-test-password"}
        previous = {key: os.environ.get(key) for key in values}
        try:
            os.environ.update(values)
            call_command("create_admin")
        finally:
            for key, value in previous.items():
                if value is None: os.environ.pop(key, None)
                else: os.environ[key] = value
        user = get_user_model().objects.get(username="owner")
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("a-strong-test-password"))

    def test_month_year_parser_accepts_expected_format(self):
        parsed = parse_month_year("06/2025", "Thời gian")
        self.assertEqual((parsed.month, parsed.year, parsed.day), (6, 2025, 1))
        with self.assertRaises(forms.ValidationError):
            parse_month_year("2025-06", "Thời gian")
