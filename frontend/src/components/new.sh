#!/bin/bash
name=$1
if [[ -z $name ]]; then
	echo "provide a component name"
	exit
fi
cat new.vue |sed s/NewComponent/$1/g > $name.vue
