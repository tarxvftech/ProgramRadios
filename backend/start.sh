#!/bin/sh

echo "if running manually because of major changes, check start.sh"
#source /backend/envfile
#pushd /frontend; npm run build; popd
#python /backend/manage.py collectstatic --noinput
#running prod docker container doesn't need any of the above though
python /backend/manage.py migrate #does need this though!
supervisord -c /backend/supervisord.conf
