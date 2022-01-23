# Hacking

## General intent
If it makes working with radios easier, I want it.

It's a Django backend. You don't need that at all except for firmware
upgrades at the moment. I'd like the frontend to be the primary source
of interaction to allow for embedding it later, so keeping that coupling
loose is important.  

Offline-first interaction is valuable. The Vue3 frontend allows for basically all the functionality.

Later, open repeater databases might allow for richer features - I'd
like to use something like ipfs or GunDB as a backend for that to allow
for easy synchronization.

## My Priorities
Anyway here's a list of things I want to do most immediately, in order:

* Organize the existing code, fix the bigger existing bugs and features - just enough that it's not absurd for others to contribute
	* Zone entries greater than 16 can't be written to, only read. I know what's wrong here and just need to fix it.
	* Some stuff (like above) desperately needs confirming tests.
	* Two-layer zones (e.g. Top and Bottom) only get the "A Channels" written. Duplicate that to B or support both in the UI.
	* Contacts editing.
* Allow for saving codeplugs to the backend
* Allow for creating and sharing channels with other users
* Integrate the completely automatic FCC Part 90 license support
* Integrate the checkbox-matrix intersection based codeplug channel generator

## Long term dreams:

* Support firmware upgrades for things like Mobilinkd's TNC3.
* Make the WebUSB/WebSerial process super easy to consume and embed so people like Mobilinkd can add it to their own pages.
* Make all the UI for codeplug stuff much more generic - this one is kinda hard
* The UI is 100% unintuitive and needs more work. I'd like a regular and a power-user mode.
* Make a sane and consistent radio API to allow for adding radios more easily.
* Make a (websockets?) shim to allow interaction with remote whitelisted USB and serial devices to be programmed from Firefox, iOS, and Windows.
* Package _that_ up for easy install on a raspberry pi, maybe even pistar.
* Support for way more radios. Maybe lifting Chirp drivers with a WebSerial shim and a python transpiler?
* GunDB-based open repeater database.
* Map position/route codeplug focused editing
* Close OpenRTX integration (integrated flashing/platform testing page)
* Package it up into a mobile app.
* Package it up into a desktop/Windows app.


There's a lot going on in a codeplug, and it's not easy to
understand. Codeplug editing has been known to put a good number of
people off of DMR and other digital modes entirely. Fixing that situation
a little at a time is *possible* for the motivated developer.

ProgramRadios UI is easier to work with and more familiar than Chirp or
any other system.  The interaction is already faster, massively more
capable, and much easier than the OEM CPS or indeed any CPS I've used
so far.

I'm happy you're reading this, and hopeful this project is useful to you.
I've licensed it AGPL because I want your contributions and I want this
project, or at least the ideas behind it, to have some future.

With any luck, OpenRTX will relegate the worst of the codeplug editing
nightmare to the dustbin of history. But even then, we'll need something
to update satellite TLEs with. ;)

Sending a pull request, patch, or otherwise interacting? Add your list
of accomplishments to SUCCESS.md.

I can't imagine the history from the old repo would be valuable to others,
but if so let me know. The earliest commits are from Sep 2019 with the
very first WebUSB proof of concept for the TYT radio. By October it was
reading codeplugs. I pulled this repo and started a fresh history to
avoid accidentally releasing passwords or PII.
