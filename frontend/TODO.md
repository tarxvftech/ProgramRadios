small
=====
disable "write codeplug" button if `current_codeplug` isn't selected and display a warning
make uploading or reading a codeplug select that codeplug (if one isn't already selected)
make USB errors show up on page!
curl   -H "Accept: application/vnd.github.v3+json"   https://api.github.com/repos/openrtx/openrtx/releases |grep browser_download
use isDel for contacts, at least



larger
======
manual cps needs ability to add channel to a zone
manage A and B channel lists for dual banders that can do that
rearrange channels in a zone by dragging (rearranging the list, that is, currently have drag-to-replace)
act more list-like for zones, e.g. ignore deleted entries
act more list-like for contacts, e.g. ignore deleted entries
add a contact editor
get sentry working (it is super slow and seems to be trying to submit the codeplug to their backend xD) (ask for help on community forum or pay for it)
"mark an issue" button
backend for storing codeplugs and similar stuff
real-time visitor count and activity to mqtt?
make errors in general show up on page!
better channel editor like chirp/RT (with zones expressed as tags/badges in a select?)
	and click on a channel to see every option, but each line is really simple and clean by default
can i detect if a radio is in firmware mode or not?

Huge
====
better UI - much better. current sucks!
electron app rather than webapp to support webusb everywhere?
semi-native android app
and custom error thing like sentry does but less sucky
firmware update capability for gen1 and gen2 radios!
	✔	dfu.js capability working on both gens
		include drop down for firmware selection
		include filtering of drop down based on detected radio? is that possible?
		include OpenRTX builds
		let's go! 2021 01 28 01 16
		dfu.js done 2021 01 28 09 14
		notes: radio_tool and my old md2017_fw firmware upgrade get different results on same file. I don't know why! but they both appear to work?
		and --fw-info on radio tool identifies the two parts just fine ...
		radio_tool doesnt print anything about writing to 0x00060000, just the second part
		confirmed, it doesn't seem to flash that area! i erased it in python, flashed with radio_tool and it doesn't get flashed, plus all the fonts appear to be gone
		flashing with my python flashes that area as expected, and it works again
		03:07 <%tarxvf> https://github.com/v0l/radio_tool/blob/master/include/radio_tool/util/flash.hpp#L134
	03:07 <%tarxvf> so when he's got this AlignedContiguousMemoryOp https://github.com/v0l/radio_tool/blob/master/src/tyt_radio.cpp#L53
	03:08 <%tarxvf> and the one for writing
	03:08 <%tarxvf> it just skips that whole section with that break; because it's unmapped
	



try representing color code with a 4x4 grid in some way?


undo tree for editing by trapping field sets and writing an array of values and timestamps and registering that array in a master list for a global undo and a specific field undo

UI: extremely simple list
	Edit Codeplug:
		Start fresh
		From Computer
		From cloud
		To cloud
		Read from Radio (these are greyed out if no usb)
		Write to Radio (these are greyed out if no usb)
	Firmware: (these are greyed out if no usb)
		Flash firmware
	Recovery: (these are greyed out if no usb)
		#Password reset (only overwrite passwords?)
		Full reset (recover from a bad flash)


TODO: can allow for people to select which frontend they want in case of errors
