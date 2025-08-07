# Troubleshooting Guide

## Build Cache Issues

If you encounter errors like `ENOENT: no such file or directory` with `.next` build files, this is typically a build cache corruption issue.

### Quick Fix
```bash
# Clear Next.js build cache
rm -rf .next

# Clear node modules cache (optional)
rm -rf node_modules/.cache

# Rebuild the project
npm run build
```

### Alternative Solutions
1. **Clear all caches:**
   ```bash
   rm -rf .next node_modules/.cache
   npm run build
   ```

2. **Full clean install:**
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Force restart development server:**
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

## Common Issues

### Port Already in Use
If you see port conflicts, Next.js will automatically use an available port. You can also specify a specific port:
```bash
npm run dev -- -p 3002
```

### Large CSV File Loading Issues
The trip data CSV is ~46MB. If you experience memory issues:
- Ensure you have adequate system memory
- Consider implementing pagination for very large datasets
- Monitor browser developer tools for memory usage

### Dark Mode Issues
If theme switching doesn't work:
- Check browser developer tools for hydration errors
- Clear browser localStorage: `localStorage.clear()`
- Ensure JavaScript is enabled

## Performance Tips

1. **Large Dataset Handling:**
   - The CSV parsing happens client-side for ~365K records
   - Consider server-side processing for production with larger datasets
   - Implement virtual scrolling for large data tables

2. **Map Performance:**
   - Leaflet maps with many markers can impact performance
   - Consider clustering for stations in dense areas
   - Use marker virtualization for large datasets

3. **Chart Performance:**
   - Recharts performs well with reasonable data sizes
   - Consider data sampling for very large time series
   - Use responsive containers appropriately

## Development Environment

### Recommended System Requirements
- Node.js 18+
- 8GB+ RAM (for large CSV processing)
- Modern browser with ES2020+ support

### File Structure
```
indego-dashboard/
├── data/                    # CSV files (local storage)
├── app/                     # Next.js app directory
├── components/              # React components
├── lib/                     # Utility functions
└── public/                  # Static assets
```

## Deployment Notes

When deploying to Vercel:
1. Ensure the `data/` directory is included in your git repository
2. The CSV file (~46MB) should be within Vercel's file size limits
3. Consider using Vercel's Edge Functions for better performance
4. Monitor build logs for any memory or timeout issues