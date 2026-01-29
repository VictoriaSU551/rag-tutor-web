FROM nginx:alpine

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制前端文件
COPY templates /usr/share/nginx/html
COPY static /usr/share/nginx/html/static

# 确保 nginx 用户可以读取文件
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
