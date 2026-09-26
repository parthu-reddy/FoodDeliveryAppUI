# Serve the application with Nginx (pre-built locally)
FROM nginx:alpine
# Access-log times in UTC, like every other service. RandomDocuments/TimezoneCorrectness_2026-09-25.
ENV TZ=UTC

# Copy the build output to replace the default nginx contents
COPY dist /usr/share/nginx/html
# `npm run build` also bundles the Node dev server into dist/ (server.cjs + its sourcemap). nginx
# serves this image, not that server, and anything left in the web root is public: the map
# carried server.ts's full source.
RUN rm -f /usr/share/nginx/html/server.cjs /usr/share/nginx/html/server.cjs.map

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
