# Step 1: Use official Node image
FROM node:18

# Step 2: Set working directory
WORKDIR /usr/src/app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy source code
COPY . .

# Step 5: Expose port and start app
EXPOSE 5000
CMD ["npm", "start"]
