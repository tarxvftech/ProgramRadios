from django.contrib.auth import get_user_model
from rest_framework import routers, serializers, viewsets, permissions
import pprint
pp = pprint.pprint
from rest_framework.reverse import reverse


from . import models

User = get_user_model()

def read_only(request, view, obj):
    if request.method in permissions.SAFE_METHODS:
        return True
def owns_it(request,view,obj):
    return obj.owner == request.user

def is_staff(request,view,obj):
    return request.user and request.user.is_staff

def is_it(request,view,obj):
    return request.user and request.user == obj

def check_any(conditions, *args):
    return any(map(lambda x: x(*args), conditions))


class CodeplugPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return check_any([
            read_only, 
            owns_it, 
            is_staff
            ], request, view, obj);

class UserPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return check_any([
            read_only, 
            is_staff,
            is_it
            ], request, view, obj);
class FirmwarePermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return check_any([
            read_only, 
            owns_it, 
            is_staff
            ], request, view, obj);

class TagPermissions(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return check_any([
            read_only, 
            is_staff
            ], request, view, obj);

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'firmware_set','codeplug_set']

class CodeplugSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Codeplug
        fields = ['owner','filename','sizebytes','contents']

class FirmwareSerializer(serializers.HyperlinkedModelSerializer):
    tags = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
     )
    class Meta:
        model = models.Firmware
        fields = ['owner','filename','sizebytes','contents','id','tags']

class FirmwareSerializerSmall(serializers.ModelSerializer):
    class Meta:
        model = models.Firmware
        fields = ['filename','distribution','version','sizebytes','contents','id']
# print(repr(FirmwareSerializer()))

class TagSerializer(serializers.HyperlinkedModelSerializer):
    # url = serializers.HyperlinkedIdentityField(
        # view_name='tag-detail',
        # lookup_field="name"
    # )
    class Meta:
        model = models.Tag
        # fields = ['name']
        # fields = ['name','codeplug_set','firmware_set','url']
        fields = ['name','codeplug_set','firmware_set']
        lookup_field = "name"
        lookup_url_kwarg = 'name'
        extra_kwargs = {
            # 'url': {'view_name': 'tag-detail', 'lookup_field': 'name'},
            }
            # 'tags': {'lookup_field': 'username'}
        # }
# print(repr(TagSerializer()))

class RadioManufacturerSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.RadioManufacturer
        fields = ['name']

class RadioModelSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.RadioModel
        fields = ['name']

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [UserPermissions, permissions.IsAuthenticated]

class CodeplugViewSet(viewsets.ModelViewSet):
    queryset = models.Codeplug.objects.all()
    serializer_class = CodeplugSerializer
    permission_classes = [CodeplugPermissions]

class FirmwareViewSet(viewsets.ModelViewSet):
    queryset = models.Firmware.objects.all()
    serializer_class = FirmwareSerializer
    permission_classes = [FirmwarePermissions]


class TagViewSet(viewsets.ModelViewSet):
    queryset = models.Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [TagPermissions]
    lookup_field = "name"

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'user', UserViewSet)
router.register(r'codeplug', CodeplugViewSet)
router.register(r'firmware', FirmwareViewSet)

router.register(r'tag', TagViewSet)
# pp(router.urls)

#TODO:
#need a user profile page
#need an api for repeaters
#need an api for fcc license lookup and parsing

#myuser https://stackoverflow.com/questions/55913920/django-rest-framework-displaying-the-users-profile
#should include the subscription status along with the user model
#which includes software license terms?
#list of radios the person owns

#https://www.coredna.com/blogs/general-data-protection-regulation
#TODO: change away from hyperlinked model serializer and go to something like a pk serializer?

#TODO: api for radio models 
#TODO: catch and report errors back for radios and actions in addition to printing them


