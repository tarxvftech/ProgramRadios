# ProgramRadios 

A capable but perhaps overly ambitious Vue3/Django WebUSB-capable radio programming tool.

I can't make it feature complete to my dreams without having 48 hours
in a day and unlimited money. So now it's open, in hopes others see
the potential.

You can find versions of ProgramRadios on:

* DMR.Tools
* ProgramRadios.com

## Radios/Drivers/Supported platforms
Currently it supports TYT MD-380, MD-2017, MD-UV380 and radios similar
enough (CS700, RT3, RT3S) to those radios to be compatible. 

For these radios, firmware upgrades, codeplug reading and writing,
and codeplug editing are fairly well supported. There's a few features
I'm a fan of, like single-line channel settings, the best firmware
upgrade process you'll find, and a binary file proxy approach to updating and rendering
the codeplug files in real time. Others below.

By the nature of WebUSB and Windows drivers, WebUSB features will not work on
Windows with TYT radios without replacing the driver - which means that
you would no longer be able to use the OEM software. I have no interest in
supporting this complexity for free, and it's not in a state to monetize. 
More on that in a bit.

WebUSB is effectively exclusive to Chrome/Chromium users on Linux, Mac, and Android.
You may find it works with other browsers, if they are based on Chromium.

It should not require any custom drivers installed, but on those Linuxen with
Udev you will need to instruct udev that your user has permission to
access the USB device. Mac and Android should Just Work(tm).

## Features
* Channel editing, adding
* Zone editing, clearing
* Zone reordering (drag and drop) and restacking (no gaps)
* Channel filtering by property or name substring
* Group add all visible channels
* (On small codeplugs) Zone and channel inclusion highlighting
* Single-line channel editing (e.g. type "451.8 NFM PL110.9" which gets
turned into a 12.5khz analog FM simplex channel with CTCSS encoding (EN)
and squelch (DE), or "145.110- EN77", "147.075+ DMR CC6 TG9", etc).
* The simplest firmware upgrades you'll ever see (including OpenRTX releases and nightlies!)


## License, history
Licensed under AGPL. 

Also please provide Travis Goodspeed 2L of good IPA in a bar with as
few TVs as possible. (I never was actually compliant with the md380tools license.)

This really all started when Travis Goodspeed gave a talk about a lovely
little patch he made to his MD-380. I sent Travis a patch via email,
my first ever contribution to anything, implementing the firmware
upgrade process from linux by looking at the USB packets over Wireshark
and copying the process. All new to me, but it was a blast to contribute.

I knew nothing about USB, DFU, or radios, so I learned a lot in doing it but it
worked and it showed, but it served for a while. I eventually improved
it, tried to add more to md38tools where I could, added MD-2017 support,
and a good time was had by all. I enjoyed that.

Internally I named this "cheep" as a nod to Chirp, which is a lovely
project. Travis had basic codeplug reading and writing working and a chirp
driver supporting most of the important stuff, but No one wants to update
Chirp to add DMR support because DMR makes the simpler spreadsheet-like
editing UIs unworkable. 

Well, no one wants to do the UI work. The actual
work to add DMR isn't too bad, but then you're stuck with replacing the
UI. I ended up making a command shell chirp client that was absurdly clunky
but served my needs well enough for some time.

Later, I thought that WebUSB was cool and wanted to play with it. 
I also thought about it, and decided I might try having channels
along the Y axis and talkgroups along the X axis and use checkboxes to
indicate inclusion in the codeplug. Tagging each generated channel with
talkgroups, timeslots, repeaters, location, etc would allow for automated
zone creation. I created this as my first Vue project ever, and used it
to generate M17 codeplugs and JSON codeplugs, but it was a demo, not a product.

Eventually I saw Dale Farnsworth's EditCP, which used a JSON description
of the codeplug layouts, and figured I could use that somehow. I figured
I could use it to make a binary file proxy - a deeply nested structure
using ES6 Proxies (originally with Vue2 and Object.defineProperty()). 
This means fields are read straight out of the bytes of the codeplug file, and written straight back in - there's no rendering step.

This ought to be super slow, except Vue3 works its magic and makes it
not suck too much. As codeplugs get bigger (>10k channels), this might
need to be revisited!

Thus the early versions of dmr.tools, which quickly grew out of hand.

What you're seeing now is the public release of something I've worked
on, off and on, for some time. It's clear that I cannot make this the
perfect codeplug editing tool that I want to exist entirely by myself -
adding all the features I want, with all the radios I want - I wouldn't
be able to keep up with it full time, and I'm not full time on this. 

It's ugly basically all over. Sorry! I broke
a lot of my own rules and the debt accumulated. 
I'll work on it a little at a time and gladly accept pull requests. 
See HACKING.md.

## Friends of ProgramRadios

* md380tools (Thanks Travis and friends!)
* m17project.org 
* openrtx.org


