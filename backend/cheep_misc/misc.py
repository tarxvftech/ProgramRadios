
import os
import re
import json
import datetime
import requests
from django.contrib.auth import get_user_model
from django.conf import settings
from github import Github
from django.core.cache import cache
import cheep_api.models as camodels
import glob
import logging

logging.basicConfig()
log = logging.getLogger('misc')
# log.setLevel(logging.DEBUG)

cine = camodels.cine

class attrdict(dict):
    def __getattr__(self, key):
        return self[key]
    def __setattr__(self, key, value):
        self[key] = value



def checkfirmwarehashes():
    pass

def checkmodeltags():
    """
    to fix up the OpenRTX for_radios values into tags:
    md3x0
    mduv380
    md380
    md390
    dm1801
    gd77
    """
    openrtx = camodels.Tag.objects.get(name="OpenRTX/OpenRTX")
    for f in openrtx.firmware_set.all():
        print()
        print(f.filename)
        print(f.for_radios)
        print(f.tags.all())
        if f.for_radios in ["mduv380","mduv3x0"]:
            m = cine(camodels.Tag, name="MD-UV380")
            f.tags.add(m)
            f.save()
        if f.for_radios in ["md390","md380","md3x0"]:
            m = cine(camodels.Tag, name="MD-380")
            f.tags.add(m)
            f.save()


def openrtx_filename_to_radios_supported(filename):
    parts = filename.split("_")
    radiostr = parts[1]
    tab = {
            "gd77":   ["GD77"],
            "dm1801": ["DM-1801"],
            "md3x0":  ["MD-380", "MD-390"],
            "mduv3x0":["MD-UV380","MD-UV390"],
            "md9600":["MD-9600"],
            "linux":[],

            #historical:
            "mduv380":["MD-UV380"],
            "md380":["MD-380"],
            "md390":["MD-390"],
            # "gd77":   ["Radioddity/GD77"],
            # "dm1801": ["Baofeng/DM-1801"],
            # "md3x0":  ["TYT/MD-380", "TYT/MD-390"],
            # "mduv3x0":["TYT/MD-UV380","TYT/MD-UV390"],
            }
    return tab[radiostr]

def load_all_firmware():
    load_openrtx_releases()
    load_openrtx_nightlies()
    load_oem_firmware()

def load_openrtx_nightlies():
    baseurl="https://openrtx.schinken-radio.de/nightly/"
    files = [
            "openrtx_md3x0_wrap",
            "openrtx_mduv3x0_wrap",
            # "openrtx_dm1801_wrap",
            # "openrtx_gd77_wrap.sgl",
            ]
    for filename in files:
        url = baseurl + filename
        strdate = datetime.datetime.now().strftime("%D").replace("/","_")
        version = "nightly_%s"%(strdate)
        radios = openrtx_filename_to_radios_supported(filename)
        res = camodels.Firmware.from_url(url=url, filename=filename, version=version, distribution="OpenRTX/OpenRTX", radios=radios, dated=True, clobber=False)

        t = cine(camodels.Tag, name="Nightly Build")
        if t not in res.tags.all():
            res.tags.add(t)
            res.save()
        # print(filename,res)

def drop_all_firmware():
    for fw in camodels.Firmware.objects.all():
        fw.delete()
    for fw in camodels.Firmware.objects.all():
        print(fw)

def load_oem_firmware():
    """
    as long as meets radio_firmware / manufacturer / model_number / firmware.bin
    then this will work (on linux)

    TODO: watch for file changes in this directory and run on change
    and run periodically, too
    """
    for root, dirs, files in os.walk("/staticdata/radio_firmware/", topdown=False):
        for name in files:
            try:
                _,_,_,manufacturer,model = root.split("/")
            except:
                print("failed to split path into manufacturer and model: ",root)
                continue
            try:
                f = camodels.Firmware.objects.get(filename=name,distribution="OEM")
                modeltag = cine(camodels.Tag, name=model)
                f.tags.add(modeltag)
                log.debug("load_oem_firmware: already have %s, skipping"%(name))
                continue
            except camodels.Firmware.DoesNotExist as e: 
                print("Adding", manufacturer, model, name)
                pass
            nameparts = re.split("_|-|\.|\(|\)",name.strip(".bin"))
            def dropnotversion(x):
                dropthese = [
                        manufacturer, model,
                        model.replace("-",""),
                        manufacturer + model,
                        manufacturer + model.replace("-",""),
                        "TYT2017",
                        "UV"
                        ] + model.split("-")
                if x not in dropthese:
                    return x
            version = ".".join( filter(dropnotversion, nameparts) )
            # print(version, nameparts)
            fullpath = os.path.join(root,name)
            f = camodels.Firmware.from_file(fullpath,filename=name,distribution="OEM",version=version,radios=[model])


def load_openrtx_releases():
    """
    TODO: run periodically
    """
    releases = openrtx_releases_binaries()
    for releasename,data in releases.items():
        print(releasename)
        for asset in data:
            try:
                filename = asset['filename']
                f = camodels.Firmware.objects.get(filename=filename)
                log.debug("load_openrtx_releases: already have %s, skipping"%(filename))
                continue
            except camodels.Firmware.DoesNotExist as e:
                pass
            radios = openrtx_filename_to_radios_supported(filename)
            res = camodels.Firmware.from_url(**asset, radios=radios, dated=True, clobber=False)



def openrtx_releases_binaries(repo = "OpenRTX/OpenRTX"):
    def fetcher():
        gh_rels = github_releases(repo)
        rels = {}
        for r in gh_rels:
            rels[r.title] = []
            assetjsons = []
            asset_pages = r.get_assets()
            i = 0
            while len(assetjsons) < asset_pages.totalCount:
                assetjsons += asset_pages.get_page(i)
                i+=1
            for asset in assetjsons:
                a = attrdict({})
                a.tags = [r.title]
                a.version = r.tag_name
                a.notes = r.body
                a.date = r.last_modified
                a.distribution = repo
                a.filename = asset.name
                a.url = asset.browser_download_url
                rels[r.title].append(dict(a))
        return rels
    return fetcher()
    # return cacher("openrtx_releases_binaries", fetcher, 30*60)

def github_releases(reponame):
    def fetcher():
        print("fetching %s"%(reponame))
        token = settings.GITHUB_API_KEY
        g = Github(token)
        pages = g.get_repo(reponame).get_releases()
        releases = []
        if pages:
            i = 0
            while len(releases) < pages.totalCount:
                releases += pages.get_page(i)
                i += 1
            print(releases)
        return releases
    key = reponame + "/releases"
    # res = cacher(key, fetcher, 30*60) #15 mins
    res = fetcher()
    return res

def cacher(key, fetcher, ttl):
    keyhash = sha256(key.encode("utf-8")).hexdigest()
    x = cache.get(keyhash)
    if x != None:
        print("found in cache", x)
        return x
    else:
        print("not in cache, running fetcher")
        result = fetcher()
        print("got: ", result)
        cache.set(key, result, ttl)
        return result

