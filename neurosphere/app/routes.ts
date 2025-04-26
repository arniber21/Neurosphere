import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/landing.tsx'),
  route('/dashboard', 'routes/dashboard.tsx'),
  route('/scans', 'routes/scans.tsx'),
  route('/upload', 'routes/upload.tsx'),
  route('/scans/:id', 'routes/scan-detail.tsx'),
  route('/sign-in', 'routes/sign-in.tsx'),
  route('/sign-up', 'routes/sign-up.tsx'),
] satisfies RouteConfig
