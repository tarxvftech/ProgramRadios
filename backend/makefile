fulldev: migrate
	screen -c .dockerscreenrc

migrate:
	source srcme envfile; ./manage.py migrate
	

runserver:
	source srcme envfile; ./manage.py runserver 0.0.0.0:8100
