# Theia Mobile Backend - Minimal Docker Image
# Supports: VSX plugins, Java, C#/.NET

FROM node:20-bullseye

# Install system dependencies for Java and .NET
RUN apt-get update && apt-get install -y \
    # Build essentials
    build-essential \
    python3 \
    # Java Development Kit
    openjdk-17-jdk \
    maven \
    gradle \
    # .NET SDK
    wget \
    apt-transport-https \
    # Other utilities
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install .NET SDK
RUN wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y dotnet-sdk-8.0 \
    && rm -rf /var/lib/apt/lists/*

# Set Java environment
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Set .NET environment
ENV DOTNET_ROOT=/usr/share/dotnet
ENV PATH="${DOTNET_ROOT}:${PATH}"

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json lerna.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/core-mobile/package.json ./packages/core-mobile/
COPY packages/filesystem/package.json ./packages/filesystem/
COPY packages/messages/package.json ./packages/messages/
COPY packages/plugin/package.json ./packages/plugin/
COPY packages/plugin-ext/package.json ./packages/plugin-ext/
COPY packages/plugin-ext-vscode/package.json ./packages/plugin-ext-vscode/
COPY packages/vsx-registry/package.json ./packages/vsx-registry/
COPY packages/workspace/package.json ./packages/workspace/
COPY packages/process/package.json ./packages/process/
COPY packages/terminal/package.json ./packages/terminal/

# Install dependencies
RUN npm install

# Copy source code
COPY packages ./packages
COPY configs ./configs
COPY tsconfig.json ./

# Build packages
RUN npm run build

# Expose ports
# 3000 - Main Theia backend
# 3030 - Mobile WebSocket endpoint
EXPOSE 3000 3030

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start command
CMD ["node", "packages/core-mobile/lib/node/server.js"]
