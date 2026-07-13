# Serve the application with Nginx (pre-built locally)
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
