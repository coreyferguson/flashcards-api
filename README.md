
# flash-api

## Set up project

```bash
git clone git@github.com:coreyferguson/flash-api.git
cd flash-api
npm install
npm test
```

## Deploy

### First-time pre-deploy manual steps

Copy and paste `./serverless-dev.yml` into a new configuration file for your stage. Replace relevant values.

### Deploy and Redeploy

```bash
npm run deploy
```

### First-time post-deploy manual steps

- API Gateway
    - Create Custom Domain Name
        - HTTP Protocol
        - Domain Name: flash-api-{stage}.overattribution.com
        - TLS 1.2
        - Edge optimized
        - Certificate: *.overattribution.com
    - Add Base Path Mapping
        - Path: /
        - API: {stage}-flash-api
        - Stage: dev
- Route 53
    - Create Record Set
        - Name: flash-api-dev
        - Type: A
        - Alias: Yes
        - Alias target: copy from API Gateway Custom Domain Name above
