import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('api/index', 'routes/api/index.tsx'),
  route('api/files/:name', 'routes/api/files/delete.tsx'),
  route('api/uploads/presigned-url', 'routes/api/uploads/presigned-url.tsx'),
] satisfies RouteConfig;
