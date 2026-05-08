# Build stage
FROM node:20 AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY index.html ./
COPY src ./src
COPY public ./public
RUN npm run typecheck && npm run build

# Serve stage
FROM nginx:1.25
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 3000;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://backend:8000/api/;
  }

  location /assets/ {
    # 静态资源按路径直接返回
  }

  location / {
    try_files /index.html =404;
  }
}
EOF
EXPOSE 3000
