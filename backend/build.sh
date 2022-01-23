#!/bin/bash
if [[ -z $1 ]]; then
	cmd="make"
else
	cmd=$@
fi
while [ 1 ]; do
	echo; echo; echo;
	read dir action file <<< $( inotifywait -r ./ -e modify )
	date
	echo "The file ${file} appeared in directory ${dir} via ${action}";
	sleep .1s;
	echo $cmd
	$cmd
done
