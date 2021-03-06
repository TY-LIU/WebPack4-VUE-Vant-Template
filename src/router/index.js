/*
 Author: LTY
 Create Time: 2019-10-15 14:25
 Description: 路由拦截配置
*/
'use strict';
import Vue from 'vue'
import VueRouter from 'vue-router'
import NProgress from 'nprogress'
import Auth from '@/util/auth'
import store from '@/store'
import {Message} from 'element-ui'
import 'nprogress/nprogress.css'
import {constantRouterMap} from './staticRoute'
import whiteList from './whiteList'

NProgress.configure({showSpinner: false});
Vue.use(VueRouter);
const createRouter = () => new VueRouter({
    linkActiveClass: 'active',
    mode: 'hash',
    base: './',
    routes: constantRouterMap
});

const router = createRouter();
router.beforeEach((to, from, next) => {
    // 网页title设置
    if (to.meta.title) {
        document.title = to.meta.title
    }
    // 开启进度条
    NProgress.start();
    if (Auth.isLogin() === '200') {
        // 跳转地址为login，并且有企业信息，则自动跳回系统首页
        if (to.path === '/login' && store.getters.merchantInfo) {
            // 进入拥有的第一个页面
            next({path: '/home', replace: true});
            NProgress.done()
        } else if (!store.getters.userInfo) {
            // 判断当前用户是否已拉取完user_info信息
            store.dispatch('GetUserInfo').then(() => next({...to, replace: true})).catch(() => {
                store.dispatch('LogOut').then(() => {
                    next({path: '/login'});
                    NProgress.done()
                }).catch(() => {
                    Message.error('账号验证失败, 请重新登录');
                    store.commit('SET_USER', '');
                    Auth.logout();
                    next({path: '/login'});
                    NProgress.done()
                })
            })
        } else next()
    } else {
        // 如果是免登陆的页面则直接进入，否则跳转到登录页面
        if (whiteList.includes(to.path) || whiteList.includes(to.name) || to.path.includes('error')) {
            next()
        } else {
            next({path: '/login', replace: true});
            // 如果store中有token，同时Cookie中没有登录状态
            if (Auth.isLogin() === '403') Message.error('登录状态非法，请重新登录');
            else if (Auth.isLogin() === '404' && !store.state.user.authorization) Message.error('请登录后再访问');
            else if (store.state.user.authorization) Message.error('登录超时，请重新登录');
            NProgress.done()
        }
    }
});

router.afterEach(() => {
    // 结束Progress
    NProgress.done();
});

export default router
