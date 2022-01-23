#from python:3-alpine 
from alpine as base


RUN apk add git bash ncurses make vim screen \
    uwsgi uwsgi-python3 uwsgi-router_rewrite uwsgi-router_static \
    python3 python3-dev py3-pip \
    npm yarn curl \
    inotify-tools sqlite \
    supervisor
RUN yarn global add @vue/cli @vue/cli-service-global @vue/cli-service @vue/cli-plugin-pwa
RUN pip install wheel
RUN ln -s /usr/bin/python3 /usr/bin/python

ENV USER=docker  GROUP=docker  UID=1000  GID=1000  PYTHONUNBUFFERED=1

RUN addgroup --gid "${GID}" "${GROUP}"  && adduser  --disabled-password  --gecos "" \
    --home "$(pwd)"  --ingroup "${GROUP}"  --no-create-home  --uid "${UID}"  "${USER}"


#from base as requirements
workdir /frontend/
COPY --chown=docker:docker frontend/package.json /frontend/
RUN npm install 
workdir /backend/
COPY --chown=docker:docker backend/requirements.txt /backend/
RUN pip install -r requirements.txt

CMD /backend/start.sh
expose 8100

from base as code
COPY --chown=docker:docker frontend /frontend
COPY --chown=docker:docker backend /backend


from code as prod

workdir /frontend/
RUN npm run build

workdir /backend/
RUN mkdir -p /data/db/; ./manage.py collectstatic --noinput


