# Cheep backend

Issues:
https://stackoverflow.com/questions/67358268/django-python-django-core-exceptions-improperlyconfigured-cannot-import-conta

radio_firmware to be stored in git-lfs in another repo?

dj-stripe
https://github.com/skorokithakis/django-annoying
https://www.django-rest-framework.org/
https://www.intenct.nl/projects/django-allauth/
  https://github.com/pennersr/django-allauth/
https://github.com/pydanny/awesome-django
https://github.com/mgrouchy/django-stronghold/
https://github.com/bennylope/django-organizations
https://github.com/pydanny/awesome-django

djangorestframework and django-cors-headers
https://djangowaves.com/tutorial/how-to-use-vue-and-django/

2021 02 01
  what to do today?
  Let's literally just deploy a single test api endpoint. anything else is gravy.
  ta-da, /api/version is working
  get stripe webhook working for dev.dmr.tools through the revproxy
  done!
  and play around with djstripe models a little
  get a little more done with codeplug uploads
  still need to fix the user login to use my own user objects
2021 02 02
  might skip it for a bit, do some other projects


JSON API only - admin views for debugging, maintenance, etc only!
will make a mobile app MUCH easier, i think, or a PWA

* email setup
  * backup email setup for bounces
    if i send email using my own domain and email system and it bounces,
    resend with SES or somnething to make sure it delivers while i get
    approved for sending for whoever that is
* user system and database with authentication
  * don't require proof of anything to get started! low barrier to entry!
  * if they don't verify email within a week, disable account? can only set password by clicking email link?
* for each item type:
  * rest api for getting a list of items
  * getting a specific item, deleting an item, and for posting a new item
    * delete doesn't actually delete it for most things
    * can put codeplugs in the trash, though
  * when putting a new item
    * need to verify it's a valid codeplug
    * need to verify we are within limits (like no more than 25 codeplugs maybe)

# Data types
callsigns associated with a user (e.g. W2FBI, WREQ214, ... )
	auto-load the channels for those callsigns if possible!
list of DMRIDs and callsigns for generating codeplugs for groups
list of users radios (digital only?)(exhaustive for digital would be nice! then i can prioritize what to build for)
saved users list
saved repeaters list
fcc database mirror to find new itinerant users?
codeplugs
	which have a filename
	a radio model (which includes bands) and potentially firmware and firmware version number

database view with filtering:
* the DMRID database of users
* the radioid.net database of repeaters


other:
* stripe api connection
* a way to charge users a subscription!
* realtime websocket connection to some frontends
  * to allow for remote programming, like to a raspi or something
  * windows client
  * automatic command line client for linux, mac, windows
* chirp codeplug renderer given a csv file
* live csv editor for advanced users
* minimal interest check thing that i can spin off later
  * pay/pledge some money to make sure a thing happens and prove interest
  * money-\>mouth

decoupled profiles vs login accounts, and profiles can have multiple
login accounts to control it?
that's so far into the future, it's silly to write it down..

# frontend needs

* load lists of codeplugs from a zip file like we generate already
* ✔	firmware upload support for MD-380, MD-2017, and MD-UV380  (haven't checked md-2017, but considering its a port of the md2017 code that works for mduv380 and md380, eh)
* websocket to backend


2021 02 27
I FOUND OUT THE HARD WAY (HOURS) that having VOLUME in Dockerfile will make any changes after it fail!
has to be at the end of the file!
