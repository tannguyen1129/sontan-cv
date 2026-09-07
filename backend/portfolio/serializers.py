from rest_framework import serializers
from .models import Award, Certification, ContactMessage, Education, Experience, Profile, Project, Skill, SocialLink, SoftSkill

class ProfileSerializer(serializers.ModelSerializer):
    class Meta: model = Profile; exclude = ()
class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta: model = SocialLink; exclude = ("is_visible", "order")
class ExperienceSerializer(serializers.ModelSerializer):
    class Meta: model = Experience; exclude = ("is_visible", "order")
class EducationSerializer(serializers.ModelSerializer):
    class Meta: model = Education; exclude = ("is_visible", "order")
class ProjectSerializer(serializers.ModelSerializer):
    class Meta: model = Project; exclude = ("is_visible", "order")
class SkillSerializer(serializers.ModelSerializer):
    class Meta: model = Skill; exclude = ("is_visible", "order")
class SoftSkillSerializer(serializers.ModelSerializer):
    class Meta: model = SoftSkill; exclude = ("is_visible", "order")
class AwardSerializer(serializers.ModelSerializer):
    class Meta: model = Award; exclude = ("is_visible", "order")
class CertificationSerializer(serializers.ModelSerializer):
    class Meta: model = Certification; exclude = ("is_visible", "order")
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta: model = ContactMessage; fields = ("name", "email", "subject", "message")

