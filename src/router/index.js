import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Index from '../../pages/index/index.vue'
import WordDetail from '../../pages/word-detail/word-detail.vue'
import Review from '../../pages/review/review.vue'
import QuickAdd from '../../pages/quick-add/quick-add.vue'
import Login from '../../pages/login/login.vue'
import My from '../../pages/my/my.vue'
import EditNickname from '../../pages/my/edit-nickname.vue'
import WordbookList from '../../pages/wordbook-list/wordbook-list.vue'
import Stats from '../../pages/stats/stats.vue'
import Mistakes from '../../pages/mistakes/mistakes.vue'
import MasteredWords from '../../pages/mastered-words/mastered-words.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
  },
  {
    path: '/word-detail',
    name: 'WordDetail',
    component: WordDetail
  },
  {
    path: '/review',
    name: 'Review',
    component: Review
  },
  {
    path: '/quick-add',
    name: 'QuickAdd',
    component: QuickAdd
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/my',
    name: 'My',
    component: My
  },
  {
    path: '/edit-nickname',
    name: 'EditNickname',
    component: EditNickname
  },
  {
    path: '/wordbook-list',
    name: 'WordbookList',
    component: WordbookList
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats
  },
  {
    path: '/mistakes',
    name: 'Mistakes',
    component: Mistakes
  },
  {
    path: '/mastered-words',
    name: 'MasteredWords',
    component: MasteredWords
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
