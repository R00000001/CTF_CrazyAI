# CTF (Web Based, no tools needed, Crazy AI)

<img width="1900" height="914" alt="image" src="https://github.com/user-attachments/assets/dff4d335-c1b3-412a-9288-4adea8758a76" />

## Repo layout:
```
docker-compose.yml
nginx/conf.d/default.conf
server/
  package.json
  server.js
  flags.js
  routes/search.js
  views/
    layout.html
    cabinet.html
    mail.html
    mail_item.html
    mail_item_final.html
    crawler.html
    telemetry.html
    admin.html
    search.html
    final.html
    freeplay.html
    hidden/index.html
    hidden/door.html
  public/
    css/styles.css
    css/hidden.css
    js/app.js
    js/hints.js
    img/company-logo.svg
    img/noise.png
    favicon.ico
```

## How to deploy:

Add this to the ```nginx/conf.d/default.conf```
``` location /.well-known/acme-challenge/ { root /var/www/certbot; } ```
Add a certbot service to docker compose conf file:
```
certbot:
  image: certbot/certbot:latest
  volumes:
    - certbot-www:/var/www/certbot
    - letsencrypt:/etc/letsencrypt
  entrypoint: ""
  command: sh -c "echo ready"
```
Start nginx:
```docker compose up -d --build nginx web~~~
Request certs from the domain:
```docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d example.com -d www.example.com \
  --agree-tos -m you@example.com --no-eff-email
```
Create nginx/conf.d/ssl.conf (because we want to use HTTPS for kid's safety):
```
server {
  listen 443 ssl;
  server_name example.com www.example.com;

  ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy no-referrer always;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://web:3000;
  }
}
```
After all of that reload with ```docker compose up -d --build```

## For personal testing
Just create a dir,copy the repo, run docker compose with http profile: ```docker compose --profile http up --build```

## What is included in this CTF?
+ View source via DevTools
+ robots.txt leak
+ Bssics of networking with DevTools
+ Client-side auth crack (localStorage)
+ Reflected injection

## Security
I tried to limit challanges to what could be exposed on the web, but still you might want to fix some (or most) of the stuff. Still:
+ NO DBs used (that's why there is no SQL Injection, I tried creating one, but didn't like it after Alpha testing)
+ No bloat under the hood, everything is pretty much fake
+ it's super light, so running it on a very old server with Ubuntu 22.04 shouldn't be a problem.

## How to solve it?
Please, try it yourself, so I knew what to fix/remove/change.

