# Deployment Guide

## Prerequisites

1. Supabase account and project
2. Environment variables configured
3. Database schema applied
4. Admin user created

## Deploy to Vercel

### 1. Install Vercel CLI (optional)
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel
```

### 3. Set Environment Variables
In Vercel dashboard:
- Go to Settings > Environment Variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

### 4. Redeploy
```bash
vercel --prod
```

## Deploy to Netlify

### 1. Build Settings
- Build command: `npm run build`
- Publish directory: `dist`

### 2. Environment Variables
In Netlify dashboard:
- Go to Site settings > Environment variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

### 3. Deploy
```bash
netlify deploy --prod
```

## Deploy to AWS Amplify

### 1. Connect Repository
- Connect your Git repository
- Select branch

### 2. Build Settings
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### 3. Environment Variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

## Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Verify admin panel access
- [ ] Check all page routes
- [ ] Test responsive design on mobile
- [ ] Verify image loading
- [ ] Test database queries
- [ ] Check RLS policies
- [ ] Monitor performance

## Custom Domain Setup

### Vercel
1. Go to Settings > Domains
2. Add your custom domain
3. Configure DNS records

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Configure DNS

## Performance Optimization

1. **Enable Caching**
   - Configure CDN caching headers
   - Use Supabase CDN for images

2. **Image Optimization**
   - Use optimized image formats (WebP)
   - Implement lazy loading
   - Use appropriate image sizes

3. **Code Splitting**
   - Already configured with Vite
   - Lazy load routes if needed

4. **Database Optimization**
   - Indexes already created
   - Monitor query performance
   - Use Supabase connection pooling

## Monitoring

1. **Supabase Dashboard**
   - Monitor database usage
   - Check API requests
   - Review logs

2. **Vercel/Netlify Analytics**
   - Track page views
   - Monitor performance
   - Check error rates

3. **Error Tracking**
   - Consider integrating Sentry
   - Monitor console errors
   - Track failed API calls

## Security Checklist

- [ ] Environment variables secured
- [ ] RLS policies tested
- [ ] Admin access restricted
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting considered
- [ ] Input validation implemented

## Backup Strategy

1. **Database Backups**
   - Supabase automatic backups enabled
   - Export data regularly
   - Test restore procedures

2. **Code Backups**
   - Git repository
   - Multiple branches
   - Tagged releases

## Troubleshooting

### Build Fails
- Check Node version (18+)
- Verify all dependencies installed
- Check environment variables

### Database Connection Issues
- Verify Supabase URL and key
- Check RLS policies
- Review network settings

### Images Not Loading
- Verify URL accessibility
- Check CORS settings
- Test image URLs directly

### Admin Panel Not Accessible
- Verify user role in database
- Check RLS policies
- Review authentication flow
