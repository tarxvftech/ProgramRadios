from django.db import models
from django.contrib.auth import get_user_model

from django.core.files.base import ContentFile
from django.core.files import File

from hashlib import sha256
import requests

import os
import datetime
import hashlib
import logging

log = logging.getLogger("cheep_api.models")

filename_hash_pepper = b"XRmp6lBi3RB7BqHvXTA99dCTnp7C9oyboaH0bXqXtpThSBB93et7ko7p6F9aHS31e+9eDbGY53vu"

def cine(model, *args, **kwargs):
    """create if not exist"""
    o, created = model.objects.get_or_create(*args, **kwargs)
    return o

def contentshash(contents):
    h = sha256()
    h.update(contents)
    return h.hexdigest()

def filehash(path):
    h = sha256()
    with open(path,"rb") as fd:
        x = fd.read(4096)
        while len(x) > 0:
            h.update(x)
            x = fd.read(4096)
    return h.hexdigest()

def codeplug_storage(instance, filename):
    namehash = hashlib.sha256()
    userhash = hashlib.sha256()
    namehash.update(filename_hash_pepper)
    userhash.update(filename_hash_pepper)
    namehash.update(filename.encode("utf-8"))
    try:
        email = instance.owner.email.encode("utf-8")
    except:
        email = b""
    userhash.update(email)
    userpath = userhash.hexdigest()[:16]
    # namepath = namehash.hexdigest()[:16]
    namepath = filename
    return 'codeplugs/{0}/{1}'.format(userpath, namepath)
user_storage = codeplug_storage #allow old migrations to work

def firmware_storage(instance, filename):
    namehash = hashlib.sha256()
    userhash = hashlib.sha256()
    namehash.update(filename_hash_pepper)
    userhash.update(filename_hash_pepper)
    namehash.update(filename.encode("utf-8"))
    try:
        email = instance.owner.email.encode("utf-8")
    except:
        email = b""
    userhash.update(email)
    userpath = userhash.hexdigest()[:16]
    # namepath = namehash.hexdigest()[:16]
    namepath = filename
    return 'firmware/{0}/{1}'.format(userpath, namepath)

class Codeplug(models.Model):
    filename = models.CharField(max_length=128)
    for_radio = models.ManyToManyField("RadioModel")
    sizebytes = models.PositiveIntegerField()
    owner = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True)
    contents = models.FileField(upload_to=codeplug_storage)
    tags = models.ManyToManyField("Tag")
    #TODO: change contents to url or file?
    def __str__(self):
        try:
            owner = self.owner.username
        except:
            owner = "(null)"
        return "[%s] %s"%(owner, self.filename)

class Firmware(models.Model):
    #can add help_text to a field: models.CharField(help_text="Please use the following format: <em>YYYY-MM-DD</em>.", ...)
    unique_together = [["distribution","filename","version"]]
    owner = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True)

    add = models.DateTimeField(auto_now_add=True)

    filename = models.CharField(max_length=128)
    sha256hash = models.CharField(max_length=64, null=True)
    distribution = models.CharField(max_length=128, null=True, default="OEM")
    version = models.CharField(max_length=128, null=True)

    notes = models.TextField(null=True)
    tags = models.ManyToManyField("Tag")

    sizebytes = models.PositiveIntegerField()
    contents = models.FileField(upload_to=firmware_storage)
    #TODO: change contents to url or file?
    def __str__(self):
        try:
            owner = self.owner.username
        except:
            owner = "<no owner>"
        return "[%s] (%s %s) %s"%(owner, self.distribution, self.version, self.filename)

    # def save(self, *args, **kwargs):
        # self.sha256hash = contentshash(self.contents)
        # super().save(*args,**kwargs)

    @classmethod
    def from_url(cls, 
            url:str, 
            filename:str,
            distribution:str,
            version:str,
            radios:list,
            *args, **kwargs):
        me = cls()
        me.filename = filename
        me.distribution = distribution
        me.version = version

        try:
            existing = cls.objects.get(filename=filename, distribution=distribution, version=version)
            del me
            return existing
        except cls.DoesNotExist:
            pass
        req = requests.get(url)
        if req.status_code == 200:
            me.hash = contentshash(req.content)
            me.sizebytes = len(req.content)
            me.contents.save(filename, ContentFile(req.content))
            log.debug("Downloaded %s for %s, status %d %s"%(url, version, req.status_code, req.reason))
        else:
            log.debug("Couldn't download %s for %s, status %d %s"%(url, version, req.status_code, req.reason))
            del me
            raise(Exception("Couldn't download %s for %s, status %d %s"%(url, version, req.status_code, req.reason)))
        me.save()

        
        try:
            me.owner = get_user_model().objects.get(pk=1)
        except Exception as e:
            print(e)
            log.error("Added a firmware without an owner, you need to fix this!")
        distributiontag = cine(Tag, name=distribution)
        me.tags.add(distributiontag)
        for radio in radios:
            modeltag = cine(Tag, name=radio)
            me.tags.add(modeltag)
        me.notes = kwargs.get("notes","")
        me.save()
        return me

    @classmethod
    def from_file(cls, 
            fullpath:str, 
            filename:str,
            distribution:str,
            version:str,
            radios:list,
            *args, **kwargs):
        me = cls()
        me.filename = filename
        me.distribution = distribution
        me.version = version
        try:
            existing = cls.objects.get(filename=filename, distribution=distribution, version=version)
            del me
            return existing
        except cls.DoesNotExist:
            pass
        
        me.hash = filehash(fullpath)
        me.sizebytes = os.path.getsize(fullpath)
        fd = open(fullpath,"rb")
        me.contents.save(filename, File(fd))
        fd.close()
        me.save()


        ## exact same as in from_url
        try:
            me.owner = get_user_model().objects.get(pk=1)
        except Exception as e:
            print(e)
            log.error("Added a firmware without an owner, you need to fix this!")
        distributiontag = cine(Tag, name=distribution)
        me.tags.add(distributiontag)
        for radio in radios:
            modeltag = cine(Tag, name=radio)
            me.tags.add(modeltag)
        me.notes = kwargs.get("notes","")
        me.save()
        return me


class RadioModel(models.Model):
    unique_together = [["name","manufacturer"]]
    name = models.CharField(max_length=128)
    aliases = models.CharField(max_length=256)
    manufacturer = models.CharField(max_length=128)
    # codeplug_compatible_with = models.ManyToManyField( "RadioModel")
    # firmware_compatible_with = models.ManyToManyField( "RadioModel")

class RadioManufacturer(models.Model):
    name = models.CharField(max_length=128, unique=True)

class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)
    def __str__(self):
        return "%s"%(self.name)

