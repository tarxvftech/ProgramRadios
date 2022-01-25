img:
	sudo docker build . -t cheep:base
	sudo docker build . -t cheep:code
	sudo docker build . -t cheep:prod
localdev:
	sudo docker run --rm -it \
		-p 8100:8100 \
		-p 8080:8080 \
		-v ${shell pwd}/deploy/data/:/data/ \
		-v ${shell pwd}/deploy/staticdata/:/staticdata/ \
		-v ${shell pwd}/deploy/env/:/backend/envfile \
		-v ${shell pwd}/backend/:/backend/ \
		-v ${shell pwd}/frontend/:/frontend/ \
		cheep:base /bin/bash 

