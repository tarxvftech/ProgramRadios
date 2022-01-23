from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views import generic
from rest_framework import routers, serializers, viewsets, permissions, views, response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from . import rest, models

def version(request):
    return HttpResponse("0.0.1")

def ping(request):
    return HttpResponse("ok")

def get_file(request,storagetype,owner,filename):
    print(request)
    import pdb; pdb.set_trace()

class SignUpView(generic.CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'

class FirmwareForRadio(views.APIView):
    #authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [rest.FirmwarePermissions]
    @method_decorator(cache_page(15))
    def get(self, request, radiomodel, format=None):
        print(radiomodel)
        radiomodel = radiomodel.upper()
        modeltranslator={
                "D680":"CS-700", #Not sure that'll work for CS750, CS751, etc...
                #in fact, try not to list under CS-700 model number and stick to D680
                "DR780":"MD-380", #this includes non-GPS 380V
                "MD390":"MD-390", #this includes GPS 380V. Not sure about GPS 380U
                "2017": "MD-2017",
                #TODO: double check these
                }
        if radiomodel in modeltranslator.keys():
            radiomodel = modeltranslator[radiomodel]
        try:
            modeltag = models.Tag.objects.get(name__iexact=radiomodel)
        except Exception as e:
            #TODO: report error back sanely
            #TODO: narrow exception (i think it's django model.DoesNotExist
            print("No firmware for this model by this name", e)
            return response.Response([]) #TODO bad api response to just say []
        firmwares = modeltag.firmware_set.order_by('filename').all()
        # print(firmwares)
        # keyedfirmwares = {}
        # for fw in firmwares:
            # for t in fw.tags.all():
                # if t.name not in keyedfirmwares.keys():
                    # keyedfirmwares[t.name] = []
                # keyedfirmwares[t.name].append(fw)
        # print(keyedfirmwares)

        serialized = rest.FirmwareSerializerSmall(firmwares,many=True,context={'request':request}).data
        return response.Response(serialized)
