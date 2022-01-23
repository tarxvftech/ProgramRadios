# ProgramRadios.com / DMR.Tools

https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API

1、MD-380 has two versions, new vocoder and old vocoder, so please check version first in the radio, check menu-utilities-radio info-versions and if you find the version is D002 and D003, it should the old vocoder and the latest firmware is MD380-D3.20, while if the version is D013, the firmware should be MD380-D13.20
2、MD-446 has two versions, new vocoder and old vocoder, so please check version first in the radio, check menu-utilities-radio info-versions and if you find the version is D002 and D003, it should the old vocoder and the latest firmware is MD446-D3.20, while if the version is D013, the firmware should be MD446-D13.20
3、MD-390 has three firmware, old vocoder and new vocoder with GPS and new vocoder without GPS, so please check version first in the radio, check menu-utilities-radio info-versions and if you find the version is D002 and D003, it should the old vocoder and the latest firmware is MD380-D3.20, while if the version is D013, and radio has GPS, the firmware should be MD390-S13.20 and if radio doesn’t have GPS, it should be MD380-D13.20
4、MD-380G has two firmware, new vocoder with GPS and new vocoder without GPS, so please check version first in the radio, check menu-utilities-radio info-versions and if the version is D013, and radio has GPS, the firmware should be MD390-S13.20 and if radio doesn’t have GPS, it should be MD380-D13.20

https://www.tyt888.com/?mod=service&id=7

automatic scanlist generation and association based on zone

Channels should be seprate from codeplug entirely until literally writing the radio
Website database and local manually input channels should be king
try not to manually have users inputting channels into the radio memory, too limiting
but allow for advanced users to modify all settings anyway?

Need a robust subscription+tags concept for repeaters and channels
channels should be tagged with a 
	license
		country, commercial
	location
		state, lat,lon, country
	connected networks
	owning organization
Zones should be built from tags somehow


webserial adapter already written using electron:
	https://github.com/MAKIO135/webserial


channel/contact hashes to match stuff read from radio to online versions

## UI Ideas
https://github.com/web-tiki/responsive-grid-of-hexagons
I like https://tailscale.com/

Flow:
```
codeplug sources:
	create a new codeplug from a template
	import a codeplug from a file
	import a codeplug from a link
	read a codeplug from a radio

Codeplug storage:
	localStorage
	my cloud
	local save

output formats:
	rdt
	csv (compatible with which programs?)
	json (compatible with which programs?)

List of codeplugs
	(or a network of codeplugs with diffs applied between them?) (That's a complicated idea, but very powerful, as evidenced by git)
When a codeplug is selected, we load it
We can also somehow add new codeplugs from the various sources
then, we make_editor for it so we can edit it
Then, we have different tools - 
	encryption key generator, 
		higher level encryption management tools and key derivation ideas
	codeplug id generator
		given a bunch of DMR IDs, generate codeplug for each ID
			and save it all as one .zip
			OR
			and program them to each radio in succession
	mass programmer
		given a mapping of DMR IDs to serial numbers, program each with the correct DMR ID based on a template codeplug


```

##TODO
	✔	get USB working again
	1/2✔	clean up old code to make libraries
	get dev.dmr.tools pointing to an ssh tunnel locally so i can dev faster with usb stuff again even with doing this vue stuff
	figure out RDT header and footer values so i can make compatible rdts from reading a radio
	Make a browser/OS/platform support matrix of features vs platform


## Mobile/APK
https://developers.google.com/web/android/trusted-web-activity/quick-start
https://dbushell.com/2020/03/05/bundle-a-pwa-as-an-android-app/
https://stackoverflow.com/questions/50762626/pwa-beforeinstallprompt-not-called

## Windows
Python all-in-one static binary
sentry for error reporting?

## IOS
Any way to get it to work? I doubt it, right?

## Remote installer using a hotspot/linux device
take advantage of all the hotspots and stuff
use it to write to radio remotely so ios people can still use my shit
do this before the windows one, i think

## storage:
https://javascript.info/indexeddb

## UI:
https://vuetifyjs.com/en/introduction/why-vuetify/

## make_editor
I used defineProperty to create a file format proxy with no intermediate state for the codeplugs
that's now FAR too slow with Vue3 (40s!) , and while it wasn't quite as bad with Vue2 (5s), it still wasn't great.
The old way was also limited- arrays, for instance, had some quirks about how they were accessed and modified that weren't great either.
There has to be a way to do what I want, and luckily it turns out Vue2 -> Vue3 changed their system for the exact reasons I want to change mine, so their system is probably a good indicator of the way to go. 
>In Vue 2.x and earlier, when you click one of the "edit" buttons in the list item and input a new piece of a text string, the view won't be changed, because setting item with an index like this.list[index] = newItem couldn't be tracked. You should write Vue.$set(this.list, index, newItem) instead. But in Vue 3.0, it works, too.
> https://dev.to/jinjiang/understanding-reactivity-in-vue-3-0-1jni
Vue3 new system: https://github.com/vuejs/vue-next/blob/master/packages/reactivity/src/reactive.ts
ES6 Proxys
https://stackoverflow.com/questions/41299642/how-to-use-javascript-proxy-for-nested-objects

https://github.com/vertexbz/recursive-proxy
https://github.com/rmehlinger/js-proxy-deep
https://github.com/ElliotNB/observable-slim
and of course the vue3 source above

So now my file format proxy would be NOT deep, actually - I just need to get a path like these guys do, but without the deep object somehow?
that may not work nicely unmodified. I may have to use my existing code to parse out at least down to the fields and then proxy THAT!?

I can create an arbitrarily nested object by trapping the gets. so start there, i suppose!




## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
