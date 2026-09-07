from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from .models import Award, Certification, ContactMessage, Education, Experience, Profile, Project, Skill, SocialLink, SoftSkill
from .serializers import AwardSerializer, CertificationSerializer, ContactMessageSerializer, EducationSerializer, ExperienceSerializer, ProfileSerializer, ProjectSerializer, SkillSerializer, SocialLinkSerializer, SoftSkillSerializer

class ContactThrottle(AnonRateThrottle):
    scope = "contact"

@api_view(["GET"])
def portfolio(request):
    visible = {"is_visible": True}
    profile = Profile.objects.first()
    return Response({
        "profile": ProfileSerializer(profile).data if profile else None,
        "socials": SocialLinkSerializer(SocialLink.objects.filter(**visible), many=True).data,
        "experiences": ExperienceSerializer(Experience.objects.filter(**visible), many=True).data,
        "education": EducationSerializer(Education.objects.filter(**visible), many=True).data,
        "projects": ProjectSerializer(Project.objects.filter(**visible), many=True).data,
        "skills": SkillSerializer(Skill.objects.filter(**visible), many=True).data,
        "soft_skills": SoftSkillSerializer(SoftSkill.objects.filter(**visible), many=True).data,
        "awards": AwardSerializer(Award.objects.filter(**visible), many=True).data,
        "certifications": CertificationSerializer(Certification.objects.filter(**visible), many=True).data,
    })

@api_view(["GET"])
@throttle_classes([])
def health(request): return Response({"status": "ok"})

@api_view(["POST"])
@throttle_classes([ContactThrottle])
def contact(request):
    serializer = ContactMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"message": "Tin nhắn đã được gửi. Cảm ơn bạn!"}, status=status.HTTP_201_CREATED)
