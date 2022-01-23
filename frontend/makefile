dev:
	npm run serve
dev.dmr.tools: 
	ssh -R 2052:localhost:8080 fubuki -v
	#npm run build
	#rsync -ravz --exclude .git --exclude env --delete dist/ fubuki:/var/www/dev.dmr.tools/

test.dmr.tools: 
	npm run build
	rsync -ravz --exclude .git --exclude env --delete dist/ fubuki:/var/www/test.dmr.tools/
dmr.tools: 
	npm run build
	rsync -ravz --exclude .git --exclude env --delete dist/ fubuki:/var/www/dmr.tools/
programradios.com: 
	npm run build
	rsync -ravz --exclude .git --exclude env --delete dist/ fubuki:/var/www/programradios.com/
build:
	npm install
	cp node_modules/augmented-ui/augmented-ui.min.css public/
	npm run build

#all: dev test staging 
