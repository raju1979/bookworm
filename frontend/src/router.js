import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './pages/LoginPage.vue';
import SignupPage from './pages/SignupPage.vue';
import ResetPasswordPage from './pages/ResetPasswordPage.vue';
import HomePage from './pages/HomePage.vue';
import MyShelfPage from './pages/MyShelfPage.vue';
import ChatPage from './pages/ChatPage.vue';
import ProfilePage from './pages/ProfilePage.vue';
import UploaderDashboardPage from './pages/UploaderDashboardPage.vue';
import RequesterDashboardPage from './pages/RequesterDashboardPage.vue';
import ChatThreadPage from './pages/ChatThreadPage.vue';
import { authService } from './services/authService';

const routes = [
  {
    path: '/login',
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/signup',
    component: SignupPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    component: ResetPasswordPage,
    meta: { requiresAuth: false },
  },
  {
    path: '/app',
    component: () => import('./AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/app/home',
      },
      {
        path: 'home',
        component: HomePage,
      },
      {
        path: 'myshelf',
        component: MyShelfPage,
      },
      {
        path: 'chat',
        component: ChatPage,
      },
      {
        path: 'profile',
        component: ProfilePage,
      },
      {
        path: 'uploader-dashboard',
        component: UploaderDashboardPage,
      },
      {
        path: 'requester-dashboard',
        component: RequesterDashboardPage,
      },
      {
        path: 'chat/:id',
        component: ChatThreadPage,
      },
    ],
  },
  {
    path: '/',
    redirect: '/app/home',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Auth guard (Vue Router 4+: return a value instead of calling next())
router.beforeEach(async (to) => {
  const user = await authService.getCurrentUser();

  if (to.meta.requiresAuth && !user) {
    return '/login';
  }
  if ((to.path === '/login' || to.path === '/signup') && user) {
    return '/app/home';
  }
  return true;
});

export default router;
